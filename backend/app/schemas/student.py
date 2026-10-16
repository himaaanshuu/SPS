"""Pydantic schemas for the placement prediction API."""
from __future__ import annotations

from typing import Literal, Optional
from pydantic import BaseModel, Field


class StudentProfile(BaseModel):
    cgpa: float = Field(..., ge=0.0, le=10.0, description="CGPA on a 10-point scale")
    tenth_pct: float = Field(..., ge=0.0, le=100.0)
    twelfth_pct: float = Field(..., ge=0.0, le=100.0)
    backlogs: int = Field(..., ge=0, le=15)
    coding_score: float = Field(..., ge=0.0, le=100.0)
    dsa_proficiency: float = Field(..., ge=0.0, le=100.0)
    projects: int = Field(..., ge=0, le=20)
    certifications: int = Field(..., ge=0, le=20)
    quant_aptitude: float = Field(..., ge=0.0, le=100.0)
    logical_reasoning: float = Field(..., ge=0.0, le=100.0)
    verbal_ability: float = Field(..., ge=0.0, le=100.0)
    communication: float = Field(..., ge=0.0, le=100.0)
    internship_months: int = Field(..., ge=0, le=36)
    interview_readiness: float = Field(..., ge=0.0, le=100.0)
    extracurricular: float = Field(..., ge=0.0, le=100.0)
    department: Optional[str] = Field(default="CSE")
    semester: Optional[int] = Field(default=6, ge=1, le=8)


class PredictResponse(BaseModel):
    placement_probability: float
    placement_status: Literal["LIKELY TO BE PLACED", "BORDERLINE", "NEEDS WORK"]
    confidence: Literal["High", "Medium", "Low"]
    readiness_score: float
    readiness_band: str
    breakdown: dict
    strengths: list[str]
    concerns: list[str]
    recommendations: list[str]
    fuzzy_explanation: dict
    model_used: str


class FuzzyEvaluateResponse(BaseModel):
    memberships: dict
    activated_rules: list[dict]
    fuzzy_score: float


class ModelMetricsResponse(BaseModel):
    trained: bool
    models: dict
    best_model: Optional[str] = None
    note: Optional[str] = None
