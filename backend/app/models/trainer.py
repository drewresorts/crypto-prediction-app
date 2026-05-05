from __future__ import annotations

import argparse
import os
from dataclasses import asdict
from datetime import datetime, timedelta, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report

from ..data.exchange_client import BinanceClient
from ..features.feature_builder import FeatureConfig, build_features_from_candles, label_future_return


ARTIFACT_DIR = Path(os.getenv("MODEL_DIR", Path(__file__).resolve().parents[2] / "model_artifacts"))


def _to_df(klines) -> pd.DataFrame:
    return pd.DataFrame(
        [
            {
                "open_time": k.open_time,
                "close_time": k.close_time,
                "open": k.open,
                "high": k.high,
                "low": k.low,
                "close": k.close,
                "volume": k.volume,
            }
            for k in klines
        ]
    )


async def fetch_history(symbol: str, interval: str, days: int, market: str) -> pd.DataFrame:
    client = BinanceClient(market=market)  # spot or perp
    try:
        end = datetime.now(tz=timezone.utc)
        start = end - timedelta(days=days)
        # Binance limit 1000; for simplicity, grab last 1000 candles if interval small.
        kl = await client.fetch_klines(symbol, interval, start_time_ms=int(start.timestamp() * 1000), end_time_ms=int(end.timestamp() * 1000), limit=1000)
        return _to_df(kl)
    finally:
        await client.aclose()


def train_from_df(df: pd.DataFrame, symbol: str, interval: str, cfg: FeatureConfig) -> dict:
    # Estimate horizon candles from interval minutes (supports Xm only for v1)
    if not interval.endswith("m"):
        raise ValueError("v1 trainer supports minute intervals like 1m, 5m, 15m")
    interval_min = int(interval[:-1])
    horizon_candles = max(1, int(cfg.horizon_minutes / interval_min))

    feats = build_features_from_candles(df, cfg)
    labeled = label_future_return(feats, horizon_candles=horizon_candles)

    feature_cols = [c for c in labeled.columns if c.startswith("ret_") or c.startswith("vol_") or c.startswith("vol_z_") or c == "orderbook_imbalance"]
    train_df = labeled.dropna(subset=feature_cols + ["direction"]).copy()

    # Map -1,0,1 -> 0,1,2 for sklearn multiclass
    y = train_df["direction"].map({-1: 0, 0: 1, 1: 2}).astype(int).to_numpy()
    X = train_df[feature_cols].astype(float).to_numpy()

    n = len(train_df)
    split = int(n * 0.8)
    X_train, X_test = X[:split], X[split:]
    y_train, y_test = y[:split], y[split:]

    model = LogisticRegression(max_iter=500, multi_class="multinomial")
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test) if len(y_test) else np.array([], dtype=int)
    report = classification_report(y_test, y_pred, output_dict=True, zero_division=0) if len(y_test) else {}

    return {
        "model": model,
        "feature_cols": feature_cols,
        "meta": {
            "symbol": symbol.upper(),
            "interval": interval,
            "market": "binance",
            "horizon_minutes": cfg.horizon_minutes,
            "trained_at": datetime.now(tz=timezone.utc).isoformat(),
            "feature_config": asdict(cfg),
            "report": report,
        },
    }


def save_artifact(artifact: dict) -> Path:
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    meta = artifact["meta"]
    fname = f'{meta["symbol"]}_{meta["interval"]}_h{meta["horizon_minutes"]}_{datetime.now(tz=timezone.utc).strftime("%Y%m%d%H%M%S")}.joblib'
    path = ARTIFACT_DIR / fname
    joblib.dump(artifact, path)
    return path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--symbol", required=True, help="e.g. BTCUSDT")
    parser.add_argument("--interval", default="1m")
    parser.add_argument("--horizon-minutes", type=int, default=15)
    parser.add_argument("--days", type=int, default=7)
    parser.add_argument("--market", choices=["spot", "perp"], default="spot")
    args = parser.parse_args()

    import asyncio

    cfg = FeatureConfig(horizon_minutes=args.horizon_minutes)
    df = asyncio.run(fetch_history(args.symbol, args.interval, args.days, args.market))
    artifact = train_from_df(df, args.symbol, args.interval, cfg)
    path = save_artifact(artifact)
    print(f"saved_model={path}")


if __name__ == "__main__":
    main()

