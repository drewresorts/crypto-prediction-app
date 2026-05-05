from __future__ import annotations

import argparse
from datetime import datetime, timedelta, timezone
from pathlib import Path

import numpy as np
import pandas as pd

from ..data.exchange_client import BinanceClient
from ..features.feature_builder import FeatureConfig, build_features_from_candles, label_future_return
from .predictor import ModelPredictor


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
    client = BinanceClient(market=market)
    try:
        end = datetime.now(tz=timezone.utc)
        start = end - timedelta(days=days)
        kl = await client.fetch_klines(symbol, interval, start_time_ms=int(start.timestamp() * 1000), end_time_ms=int(end.timestamp() * 1000), limit=1000)
        return _to_df(kl)
    finally:
        await client.aclose()


def run_backtest(df: pd.DataFrame, predictor: ModelPredictor, cfg: FeatureConfig, interval: str) -> dict:
    if not interval.endswith("m"):
        raise ValueError("v1 backtest supports minute intervals like 1m, 5m, 15m")
    interval_min = int(interval[:-1])
    horizon_candles = max(1, int(cfg.horizon_minutes / interval_min))

    feat_df = build_features_from_candles(df, cfg)
    labeled = label_future_return(feat_df, horizon_candles=horizon_candles)

    # Build model inputs
    feature_cols = predictor.feature_cols
    bt = labeled.dropna(subset=feature_cols + ["future_return"]).copy()

    # Predict up-prob
    X = bt[feature_cols].astype(float).to_numpy()
    proba = predictor.model.predict_proba(X)
    prob_up = proba[:, 2]
    prob_down = proba[:, 0]

    # Simple strategy: long if prob_up > 0.55, short if prob_down > 0.55 else flat
    position = np.where(prob_up > 0.55, 1, np.where(prob_down > 0.55, -1, 0))
    realized = position * bt["future_return"].to_numpy()

    return {
        "n": int(len(bt)),
        "hit_rate": float((np.sign(realized) == np.sign(bt["future_return"].to_numpy())).mean()) if len(bt) else 0.0,
        "avg_return": float(np.mean(realized)) if len(bt) else 0.0,
        "cum_return": float(np.sum(realized)) if len(bt) else 0.0,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--symbol", required=True)
    parser.add_argument("--interval", default="1m")
    parser.add_argument("--days", type=int, default=7)
    parser.add_argument("--market", choices=["spot", "perp"], default="spot")
    parser.add_argument("--horizon-minutes", type=int, default=15)
    parser.add_argument("--artifact", required=True, help="Path to a .joblib model artifact")
    args = parser.parse_args()

    import asyncio

    df = asyncio.run(fetch_history(args.symbol, args.interval, args.days, args.market))
    predictor = ModelPredictor(Path(args.artifact))
    cfg = FeatureConfig(horizon_minutes=args.horizon_minutes)
    res = run_backtest(df, predictor, cfg, interval=args.interval)
    print(res)


if __name__ == "__main__":
    main()

