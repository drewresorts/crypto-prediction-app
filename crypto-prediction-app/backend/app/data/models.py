from datetime import datetime

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True)
    symbol = Column(String(32), unique=True, nullable=False, index=True)
    kind = Column(String(16), nullable=False, default="spot")  # spot, perp, future, option
    base_asset = Column(String(32), nullable=False)
    quote_asset = Column(String(32), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    candles = relationship("Candle", back_populates="asset")


class Candle(Base):
    __tablename__ = "candles"
    __table_args__ = (
        UniqueConstraint("asset_id", "interval", "open_time", name="uq_candle_asset_interval_open_time"),
    )

    id = Column(Integer, primary_key=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False, index=True)
    interval = Column(String(16), nullable=False, index=True)  # e.g., 1m, 5m, 1h
    open_time = Column(DateTime, nullable=False, index=True)
    close_time = Column(DateTime, nullable=False)

    open = Column(Float, nullable=False)
    high = Column(Float, nullable=False)
    low = Column(Float, nullable=False)
    close = Column(Float, nullable=False)
    volume = Column(Float, nullable=False)
    quote_volume = Column(Float, nullable=True)
    number_of_trades = Column(Integer, nullable=True)

    asset = relationship("Asset", back_populates="candles")


class FeatureRow(Base):
    __tablename__ = "features"
    __table_args__ = (
        UniqueConstraint("asset_id", "interval", "open_time", "horizon_minutes", name="uq_features_asset_interval_open_time_horizon"),
    )

    id = Column(Integer, primary_key=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False, index=True)
    interval = Column(String(16), nullable=False, index=True)
    open_time = Column(DateTime, nullable=False, index=True)
    horizon_minutes = Column(Integer, nullable=False)

    return_1 = Column(Float, nullable=True)
    return_5 = Column(Float, nullable=True)
    return_15 = Column(Float, nullable=True)
    volatility_5 = Column(Float, nullable=True)
    volatility_15 = Column(Float, nullable=True)
    volume_zscore_5 = Column(Float, nullable=True)
    orderbook_imbalance = Column(Float, nullable=True)

    extra = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class LabelRow(Base):
    __tablename__ = "labels"
    __table_args__ = (
        UniqueConstraint("asset_id", "interval", "open_time", "horizon_minutes", name="uq_labels_asset_interval_open_time_horizon"),
    )

    id = Column(Integer, primary_key=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False, index=True)
    interval = Column(String(16), nullable=False, index=True)
    open_time = Column(DateTime, nullable=False, index=True)
    horizon_minutes = Column(Integer, nullable=False)

    future_return = Column(Float, nullable=False)
    direction = Column(Integer, nullable=False)  # -1, 0, +1

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False, index=True)
    interval = Column(String(16), nullable=False, index=True)
    open_time = Column(DateTime, nullable=False, index=True)
    horizon_minutes = Column(Integer, nullable=False)

    prob_down = Column(Float, nullable=False)
    prob_flat = Column(Float, nullable=False)
    prob_up = Column(Float, nullable=False)

    model_name = Column(String(128), nullable=False)
    model_version = Column(String(64), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)


class JobRun(Base):
    __tablename__ = "job_runs"

    id = Column(Integer, primary_key=True)
    job_type = Column(String(64), nullable=False)
    params = Column(JSON, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    finished_at = Column(DateTime, nullable=True)
    status = Column(String(32), nullable=False, default="running")
    error_message = Column(String(1024), nullable=True)

