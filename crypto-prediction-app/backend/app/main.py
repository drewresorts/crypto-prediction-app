import os
from pathlib import Path
from typing import Any

from fastapi import APIRouter, FastAPI, HTTPException
from pydantic import BaseModel, Field

from .data.database import init_db
from .models.predictor import ModelPredictor
from .models.trainer import FeatureConfig, fetch_history, save_artifact, train_from_df
from .services.realtime import RealtimePredictionService


class PredictRequest(BaseModel):
    features: dict[str, float] = Field(default_factory=dict)

def _get_model_path(app: FastAPI) -> str | None:
    env_path = os.getenv("MODEL_ARTIFACT_PATH")
    return (env_path if env_path else None) or getattr(app.state, "model_artifact_path", None)


def create_app() -> FastAPI:
    app = FastAPI(
        title="Crypto Prediction API",
        description="Backend for real-time crypto prediction and analytics.",
        version="0.1.0",
    )

    router = APIRouter()

    @app.on_event("startup")
    async def _startup() -> None:
        init_db()
        symbol = os.getenv("LIVE_SYMBOL", "BTCUSDT")
        interval = os.getenv("LIVE_INTERVAL", "1m")
        market = os.getenv("LIVE_MARKET", "spot")
        horizon = int(os.getenv("LIVE_HORIZON_MINUTES", "15"))

        if not os.getenv("MODEL_ARTIFACT_PATH"):
            try:
                df = await fetch_history(symbol, interval, days=7, market=market)
                artifact = train_from_df(df, symbol, interval, FeatureConfig(horizon_minutes=horizon))
                path = save_artifact(artifact)
                app.state.model_artifact_path = str(path)
            except Exception:
                app.state.model_artifact_path = None

        app.state.realtime = RealtimePredictionService(symbol=symbol, interval=interval, market=market, horizon_minutes=horizon)
        app.state.realtime.start()

    @app.on_event("shutdown")
    async def _shutdown() -> None:
        rt = getattr(app.state, "realtime", None)
        if rt:
            await rt.stop()

    @router.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    @router.get("/model")
    async def model_info() -> dict[str, Any]:
        path = _get_model_path(app)
        if not path:
            return {"loaded": False}
        p = ModelPredictor(Path(path))
        return {"loaded": True, "meta": p.meta, "feature_cols": p.feature_cols}

    @router.post("/predict")
    async def predict(req: PredictRequest) -> dict[str, Any]:
        path = _get_model_path(app)
        if not path:
            raise HTTPException(status_code=400, detail="MODEL_ARTIFACT_PATH not set and startup training failed")
        predictor = ModelPredictor(Path(path))
        try:
            pred = predictor.predict_proba_one(req.features)
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
        return {
            "prob_down": pred.prob_down,
            "prob_flat": pred.prob_flat,
            "prob_up": pred.prob_up,
            "model_name": pred.model_name,
            "model_version": pred.model_version,
        }

    @router.get("/live")
    async def live() -> dict[str, Any]:
        rt = getattr(app.state, "realtime", None)
        if not rt:
            return {"running": False}
        pred = rt.state.latest_prediction
        return {
            "running": True,
            "symbol": rt.state.symbol,
            "interval": rt.state.interval,
            "market": rt.state.market,
            "updated_at": rt.state.updated_at.isoformat() if rt.state.updated_at else None,
            "latest_features": rt.state.latest_features,
            "latest_prediction": (
                {
                    "prob_down": pred.prob_down,
                    "prob_flat": pred.prob_flat,
                    "prob_up": pred.prob_up,
                    "model_name": pred.model_name,
                    "model_version": pred.model_version,
                }
                if pred
                else None
            ),
        }

    app.include_router(router)
    app.include_router(router, prefix="/api")

    return app


app = create_app()

