"""FastAPI application: health, prediction, fuzzy, models, analytics, students."""
from __future__ import annotations

import json
import sqlite3
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .schemas.student import StudentProfile, PredictResponse, FuzzyEvaluateResponse, ModelMetricsResponse
from .services.prediction_service import run_prediction
from .fuzzy.engine import infer as fuzzy_infer
from .ml.train import train as train_models, load_metrics
from .ml.predict import is_trained
from .database.db import init_db, get_conn

app = FastAPI(title="Student Placement Prediction API",
              description="Neuro-fuzzy soft computing placement intelligence",
              version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)


@app.on_event("startup")
def _startup():
    init_db()
    # Seed demo dataset file if missing (labeled synthetic).
    if not Path("data/placement_data.csv").exists():
        from .ml.dataset import generate_demo_dataset
        Path("data").mkdir(exist_ok=True)
        generate_demo_dataset().to_csv("data/placement_data.csv", index=False)


@app.get("/api/health")
def health():
    return {"status": "ok", "trained": is_trained(), "service": "placement-api"}


@app.post("/api/predict", response_model=PredictResponse)
def predict(profile: StudentProfile, model: str = Query(default="neuro_fuzzy")):
    try:
        return run_prediction(profile.model_dump(), model=model)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction couldn't be completed: {exc}")


@app.post("/api/fuzzy-evaluate", response_model=FuzzyEvaluateResponse)
def fuzzy_evaluate(profile: StudentProfile):
    return fuzzy_infer(float(profile.cgpa), float(profile.coding_score), float(profile.communication))


@app.post("/api/model/predict")
def model_predict(profile: StudentProfile, model: str = Query(default="neuro_fuzzy")):
    from .ml.predict import predict_proba
    p, used = predict_proba(profile.model_dump(), model)
    return {"probability": round(p * 100, 2), "model_used": used, "trained": is_trained()}


@app.get("/api/model/metrics", response_model=ModelMetricsResponse)
def metrics():
    return load_metrics()


@app.post("/api/train")
def train(csv_path: str | None = None):
    try:
        return train_models(csv_path)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/analytics")
def analytics():
    path = Path("data/placement_data.csv")
    if not path.exists():
        raise HTTPException(status_code=404, detail="No dataset yet — run POST /api/train first.")
    import pandas as pd
    df = pd.read_csv(path)
    placed = int((df["placed"] == 1).sum())
    return {
        "total_students": len(df),
        "placement_rate": round(placed / len(df) * 100, 1),
        "avg_cgpa": round(float(df["cgpa"].mean()), 2),
        "avg_coding": round(float(df["coding_score"].mean()), 1),
        "synthetic": True,
        "cgpa_bins": df.groupby(pd.cut(df["cgpa"], bins=[0, 6, 7, 8, 9, 10]).astype(str))["placed"].mean().round(3).to_dict(),
        "internship_effect": df.groupby((df["internship_months"] > 0).astype(str))["placed"].mean().round(3).to_dict(),
        "projects_effect": df.groupby("projects")["placed"].mean().round(3).to_dict(),
        "probability_hint": "Run predictions per student for individual distributions.",
    }


@app.get("/api/predictions")
def predictions(limit: int = 50):
    try:
        with get_conn() as conn:
            rows = conn.execute(
                "SELECT id, student_id, department, semester, cgpa, probability, readiness, status, created_at FROM predictions ORDER BY id DESC LIMIT ?",
                (limit,)).fetchall()
        return {"predictions": [dict(r) for r in rows]}
    except sqlite3.Error as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/students")
def list_students():
    with get_conn() as conn:
        rows = conn.execute("SELECT * FROM students ORDER BY created_at DESC LIMIT 100").fetchall()
    return {"students": [dict(r) for r in rows]}


@app.post("/api/students")
def create_student(payload: dict):
    if not payload.get("id") or not payload.get("name"):
        raise HTTPException(status_code=422, detail="Student requires 'id' and 'name'.")
    with get_conn() as conn:
        conn.execute("INSERT OR REPLACE INTO students (id, name, department, semester, cgpa) VALUES (?,?,?,?,?)",
                     (payload["id"], payload["name"], payload.get("department", "CSE"),
                      payload.get("semester", 6), payload.get("cgpa", 0)))
    return {"ok": True, "id": payload["id"]}


@app.get("/api/students/{student_id}")
def get_student(student_id: str):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM students WHERE id=?", (student_id,)).fetchone()
        preds = conn.execute("SELECT probability, readiness, status, created_at FROM predictions WHERE student_id=? ORDER BY id DESC LIMIT 20",
                             (student_id,)).fetchall()
    if not row:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"student": dict(row), "history": [dict(r) for r in preds]}
