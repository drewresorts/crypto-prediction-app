from __future__ import annotations

import asyncio
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import pandas as pd

from ..data.exchange_client import BinanceClient
from ..features.feature_builder import FeatureConfig, build_features_from_candles
from ..models.predictor import ModelPredictor, PredictionResult


@dataclass
class LiveState:
    symbol: str
    interval: str
    market: str
    cfg: FeatureConfig
    latest_features: Optional[dict[str, float]] = None
    latest_prediction: Optional[PredictionResult] = None
    updated_at: Optional[datetime] = None


class RealtimePredictionService:
    def __init__(self, symbol: str, interval: str = "1m", market: str = "spot", horizon_minutes: int = 15) -> None:
        self.state = LiveState(
            symbol=symbol.upper(),
            interval=interval,
            market=market,
            cfg=FeatureConfig(horizon_minutes=horizon_minutes),
        )
        self._task: Optional[asyncio.Task] = None

    def start(self) -> None:
        if self._task and not self._task.done():
            return
        self._task = asyncio.create_task(self._run_loop())

    async def stop(self) -> None:
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass

    async def _run_loop(self) -> None:
        artifact_path = os.getenv("MODEL_ARTIFACT_PATH")
        if not artifact_path:
            # Service can run, but will not produce predictions.
            predictor = None
        else:
            predictor = ModelPredictor(Path(artifact_path))

        client = BinanceClient(market="perp" if self.state.market == "perp" else "spot")
        try:
            while True:
                # Pull last N candles as a simple real-time baseline (can be replaced with WS candle aggregation).
                klines = await client.fetch_klines(self.state.symbol, self.state.interval, limit=200)
                df = pd.DataFrame(
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
                feat_df = build_features_from_candles(df, self.state.cfg)
                last = feat_df.iloc[-1].to_dict()
                features = {
                    "ret_1": float(last.get("ret_1")) if last.get("ret_1") is not None else float("nan"),
                    "ret_5": float(last.get("ret_5")) if last.get("ret_5") is not None else float("nan"),
                    "ret_15": float(last.get("ret_15")) if last.get("ret_15") is not None else float("nan"),
                    "vol_5": float(last.get("vol_5")) if last.get("vol_5") is not None else float("nan"),
                    "vol_15": float(last.get("vol_15")) if last.get("vol_15") is not None else float("nan"),
                    "vol_z_5": float(last.get("vol_z_5")) if last.get("vol_z_5") is not None else float("nan"),
                    "orderbook_imbalance": float(last.get("orderbook_imbalance")) if last.get("orderbook_imbalance") is not None else float("nan"),
                }
                self.state.latest_features = features
                self.state.updated_at = datetime.now(tz=timezone.utc)

                if predictor:
                    try:
                        self.state.latest_prediction = predictor.predict_proba_one(features)
                    except Exception:
                        self.state.latest_prediction = None

                await asyncio.sleep(10.0)
        finally:
            await client.aclose()

