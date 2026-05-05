from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Optional

import joblib
import numpy as np


@dataclass(frozen=True)
class PredictionResult:
    prob_down: float
    prob_flat: float
    prob_up: float
    model_name: str
    model_version: Optional[str]


class ModelPredictor:
    def __init__(self, artifact_path: Path) -> None:
        self.artifact_path = artifact_path
        self.artifact: dict[str, Any] = joblib.load(artifact_path)
        self.model = self.artifact["model"]
        self.feature_cols: list[str] = list(self.artifact["feature_cols"])
        self.meta: dict[str, Any] = dict(self.artifact.get("meta", {}))

    def predict_proba_one(self, features: dict[str, float]) -> PredictionResult:
        x = np.array([[float(features.get(c, np.nan)) for c in self.feature_cols]], dtype=float)
        if np.isnan(x).any():
            # In v1, require all features present.
            missing = [c for c, v in zip(self.feature_cols, x[0]) if np.isnan(v)]
            raise ValueError(f"missing_features={missing}")

        proba = self.model.predict_proba(x)[0]  # classes: 0 down, 1 flat, 2 up
        return PredictionResult(
            prob_down=float(proba[0]),
            prob_flat=float(proba[1]),
            prob_up=float(proba[2]),
            model_name=self.model.__class__.__name__,
            model_version=self.meta.get("trained_at"),
        )

