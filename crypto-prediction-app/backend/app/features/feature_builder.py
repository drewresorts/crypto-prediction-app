from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd


@dataclass(frozen=True)
class FeatureConfig:
    horizon_minutes: int = 15
    vol_windows: tuple[int, ...] = (5, 15)
    return_lags: tuple[int, ...] = (1, 5, 15)
    volume_window: int = 5


def build_features_from_candles(df: pd.DataFrame, cfg: FeatureConfig) -> pd.DataFrame:
    out = df.copy()
    out = out.sort_values("open_time").reset_index(drop=True)

    close = out["close"].astype(float)
    volume = out["volume"].astype(float)

    for lag in cfg.return_lags:
        out[f"ret_{lag}"] = close.pct_change(lag)

    logret = np.log(close).diff()
    for w in cfg.vol_windows:
        out[f"vol_{w}"] = logret.rolling(w).std()

    vol_mean = volume.rolling(cfg.volume_window).mean()
    vol_std = volume.rolling(cfg.volume_window).std()
    out[f"vol_z_{cfg.volume_window}"] = (volume - vol_mean) / vol_std.replace(0.0, np.nan)

    # Optional real-time feature (filled by realtime service)
    if "orderbook_imbalance" not in out.columns:
        out["orderbook_imbalance"] = np.nan

    return out


def label_future_return(df: pd.DataFrame, horizon_candles: int) -> pd.DataFrame:
    out = df.copy()
    out = out.sort_values("open_time").reset_index(drop=True)
    close = out["close"].astype(float)
    out["future_close"] = close.shift(-horizon_candles)
    out["future_return"] = (out["future_close"] / close) - 1.0
    out["direction"] = np.where(out["future_return"] > 0, 1, np.where(out["future_return"] < 0, -1, 0))
    return out

