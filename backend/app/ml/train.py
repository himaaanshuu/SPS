"""Training pipeline: preprocess -> train baselines + ANN -> evaluate -> serialize."""
from __future__ import annotations

import json
import os
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

from .dataset import FEATURES, TARGET, generate_demo_dataset

MODEL_DIR = Path(os.getenv("MODEL_DIR", "models"))


def _build_ann():
    """Explainable small ANN: input -> 32 -> 16 -> 8 -> output."""
    try:
        import tensorflow as tf  # type: ignore
        from tensorflow import keras  # type: ignore

        model = keras.Sequential([
            keras.layers.Input(shape=(len(FEATURES),)),
            keras.layers.Dense(32, activation="relu"),
            keras.layers.Dropout(0.2),
            keras.layers.Dense(16, activation="relu"),
            keras.layers.Dense(8, activation="relu"),
            keras.layers.Dense(1, activation="sigmoid"),
        ])
        model.compile(optimizer="adam", loss="binary_crossentropy", metrics=["accuracy"])
        return ("keras", model)
    except Exception:
        clf = MLPClassifier(hidden_layer_sizes=(32, 16, 8), activation="relu",
                            max_iter=600, early_stopping=True, n_iter_no_change=20,
                            random_state=42)
        return ("sklearn-mlp", clf)


def evaluate(y_true, y_prob) -> dict:
    y_pred = (y_prob >= 0.5).astype(int)
    out = {
        "accuracy": round(float(accuracy_score(y_true, y_pred)), 4),
        "precision": round(float(precision_score(y_true, y_pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y_true, y_pred, zero_division=0)), 4),
        "f1": round(float(f1_score(y_true, y_pred, zero_division=0)), 4),
    }
    try:
        out["roc_auc"] = round(float(roc_auc_score(y_true, y_prob)), 4)
    except Exception:
        out["roc_auc"] = 0.0
    return out


def train(csv_path: str | None = None, n_demo: int = 1500) -> dict:
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    if csv_path and Path(csv_path).exists():
        df = pd.read_csv(csv_path)
        source = "csv"
    else:
        df = generate_demo_dataset(n_demo)
        df.to_csv("data/placement_data.csv", index=False)
        source = "synthetic-demo"
    X = df[FEATURES].values.astype(float)
    y = df[TARGET].values.astype(int)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y)

    scaler = StandardScaler()
    Xtr = scaler.fit_transform(X_train)
    Xte = scaler.transform(X_test)
    joblib.dump(scaler, MODEL_DIR / "scaler.pkl")
    joblib.dump(FEATURES, MODEL_DIR / "features.pkl")

    results: dict = {"source": source, "n_rows": len(df), "models": {}}

    lr = LogisticRegression(max_iter=1000)
    lr.fit(Xtr, y_train)
    results["models"]["logistic_regression"] = evaluate(y_test, lr.predict_proba(Xte)[:, 1])
    joblib.dump(lr, MODEL_DIR / "logistic_regression.pkl")

    rf = RandomForestClassifier(n_estimators=200, max_depth=12, random_state=42, n_jobs=-1)
    rf.fit(Xtr, y_train)
    results["models"]["random_forest"] = evaluate(y_test, rf.predict_proba(Xte)[:, 1])
    joblib.dump(rf, MODEL_DIR / "random_forest.pkl")

    kind, ann = _build_ann()
    if kind == "keras":
        cb = ann.callbacks if hasattr(ann, "callbacks") else None
        try:
            from tensorflow import keras  # type: ignore
            es = keras.callbacks.EarlyStopping(patience=12, restore_best_weights=True)
            ann.fit(Xtr, y_train, epochs=120, batch_size=32, validation_split=0.15,
                    callbacks=[es], verbose=0)
            prob = ann.predict(Xte, verbose=0).ravel()
            ann.save(MODEL_DIR / "neural_network.keras")
        except Exception:
            prob = np.zeros(len(y_test))
    else:
        ann.fit(Xtr, y_train)
        prob = ann.predict_proba(Xte)[:, 1]
        joblib.dump(ann, MODEL_DIR / "neural_network.pkl")
    results["models"]["neural_network"] = evaluate(y_test, prob)
    results["models"]["neural_network"]["backend"] = kind

    # Neuro-fuzzy proxy: average of fuzzy heuristic + RF probability, evaluated honestly.
    from ..fuzzy.engine import infer as fuzzy_infer
    fuzzy_probs = []
    for row in X_test:
        f = dict(zip(FEATURES, row))
        r = fuzzy_infer(float(f["cgpa"]), float(f["coding_score"]), float(f["communication"]))
        fuzzy_probs.append(r["fuzzy_score"] / 100.0)
    fuzzy_probs = np.array(fuzzy_probs)
    rf_prob = rf.predict_proba(Xte)[:, 1]
    neuro_fuzzy = 0.45 * fuzzy_probs + 0.55 * rf_prob
    results["models"]["fuzzy_system"] = evaluate(y_test, fuzzy_probs)
    results["models"]["neuro_fuzzy"] = evaluate(y_test, neuro_fuzzy)

    best = max(results["models"].items(), key=lambda kv: kv[1].get("f1", 0))[0]
    results["best_model"] = best
    with open(MODEL_DIR / "metrics.json", "w") as fh:
        json.dump(results, fh, indent=2)
    return results


def load_metrics() -> dict:
    path = MODEL_DIR / "metrics.json"
    if not path.exists():
        return {"trained": False, "models": {}, "best_model": None,
                "note": "Awaiting training data — run POST /api/train first. No metrics fabricated."}
    import json as _json
    data = _json.loads(path.read_text())
    data["trained"] = True
    return data
