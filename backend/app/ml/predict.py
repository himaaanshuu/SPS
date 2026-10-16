"""Inference helpers: load artifacts once, predict fast."""
from __future__ import annotations

import functools
from pathlib import Path
import os

import joblib
import numpy as np

from .dataset import FEATURES

MODEL_DIR = Path(os.getenv("MODEL_DIR", "models"))


@functools.lru_cache(maxsize=1)
def _artifacts():
    scaler = joblib.load(MODEL_DIR / "scaler.pkl")
    models = {}
    for name in ("logistic_regression", "random_forest", "neural_network"):
        for ext in (".pkl",):
            p = MODEL_DIR / f"{name}{ext}"
            if p.exists():
                try:
                    models[name] = joblib.load(p)
                except Exception:
                    pass
    keras_model = None
    kp = MODEL_DIR / "neural_network.keras"
    if kp.exists():
        try:
            from tensorflow import keras  # type: ignore
            keras_model = keras.models.load_model(kp)
        except Exception:
            keras_model = None
    return scaler, models, keras_model


def is_trained() -> bool:
    return (MODEL_DIR / "scaler.pkl").exists() and (MODEL_DIR / "metrics.json").exists()


def vectorize(payload: dict) -> np.ndarray:
    return np.array([[float(payload[f]) for f in FEATURES]], dtype=float)


def predict_proba(payload: dict, model: str = "neuro_fuzzy") -> tuple[float, str]:
    """Return (probability, model_used). Falls back gracefully when untrained."""
    if not is_trained():
        # Transparent heuristic fallback — clearly labeled, never presented as trained.
        f = payload
        score = (
            0.22 * (f["cgpa"] / 10 * 100) + 0.20 * f["coding_score"]
            + 0.14 * f["dsa_proficiency"] + 0.12 * f["quant_aptitude"] * 0.5
            + 0.12 * f["logical_reasoning"] * 0.5 + 0.12 * f["communication"]
            + 2.2 * f["projects"] + 1.5 * f["internship_months"]
            - 6.0 * f["backlogs"]
        )
        score = float(np.clip(score, 2, 97))
        return score / 100.0, "heuristic-fallback (untrained)"
    scaler, models, keras_model = _artifacts()
    x = scaler.transform(vectorize(payload))
    if model == "neural_network" and keras_model is not None:
        p = float(keras_model.predict(x, verbose=0).ravel()[0])
        return p, "neural_network (keras)"
    if model in models:
        m = models[model]
        p = float(m.predict_proba(x)[0, 1])
        return p, model
    # neuro-fuzzy: blend RF + fuzzy score
    from ..fuzzy.engine import infer as fuzzy_infer
    rf_p = float(models["random_forest"].predict_proba(x)[0, 1]) if "random_forest" in models else 0.5
    fz = fuzzy_infer(float(payload["cgpa"]), float(payload["coding_score"]), float(payload["communication"]))
    fz_p = fz["fuzzy_score"] / 100.0
    return float(0.55 * rf_p + 0.45 * fz_p), "neuro_fuzzy"
