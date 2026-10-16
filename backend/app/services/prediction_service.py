"""Prediction orchestration: ML + fuzzy + readiness + recommendations."""
from __future__ import annotations

import json
import sqlite3

from ..fuzzy.engine import infer as fuzzy_infer
from ..ml.predict import predict_proba, is_trained
from ..database.db import get_conn


def readiness_breakdown(p: dict) -> dict:
    academic = round((p["cgpa"] / 10 * 0.5 + (p["tenth_pct"] + p["twelfth_pct"]) / 200 * 0.4 + max(0, 1 - p["backlogs"] / 4) * 0.1) * 100, 1)
    technical = round((p["coding_score"] * 0.4 + p["dsa_proficiency"] * 0.3 + min(p["projects"], 6) / 6 * 100 * 0.2 + min(p["certifications"], 4) / 4 * 100 * 0.1), 1)
    aptitude = round((p["quant_aptitude"] + p["logical_reasoning"] + p["verbal_ability"]) / 3, 1)
    communication = round((p["communication"] * 0.6 + p["interview_readiness"] * 0.3 + p["extracurricular"] * 0.1), 1)
    experience = round(min(100, p["internship_months"] / 6 * 70 + min(p["projects"], 5) / 5 * 30), 1)
    return {"academic": academic, "technical": technical, "aptitude": aptitude,
            "communication": communication, "experience": experience}


def build_recommendations(p: dict, breakdown: dict) -> tuple[list[str], list[str], list[str]]:
    strengths, concerns, recs = [], [], []
    if p["cgpa"] >= 8.0: strengths.append("Strong academic performance (CGPA {:.1f})".format(p["cgpa"]))
    if (p["coding_score"] + p["dsa_proficiency"]) / 2 >= 70: strengths.append("Solid coding foundation")
    if p["internship_months"] >= 3: strengths.append(f"Valuable internship exposure ({p['internship_months']} months)")
    if p["projects"] >= 3: strengths.append(f"Good project portfolio ({p['projects']} projects)")
    if (p["quant_aptitude"] + p["logical_reasoning"]) / 2 >= 70: strengths.append("Good aptitude scores")
    if not strengths: strengths.append("Consistent profile with room to grow in all axes")

    def concern(cond: bool, label: str, action: str):
        if cond:
            concerns.append(label)
            recs.append(action)

    concern(p["dsa_proficiency"] < 70, f"DSA needs improvement ({p['dsa_proficiency']:.0f}/100)",
            "Practice DSA 45 min/day — focus on arrays, trees, DP patterns")
    concern(p["communication"] < 70, f"Communication slightly below target ({p['communication']:.0f}/100)",
            "Do 2 mock interviews per week and record yourself explaining projects")
    concern(p["projects"] < 3, f"Only {p['projects']} project(s) — target is 3+",
            "Ship 2 advanced full-stack projects with deployment links")
    concern(p["internship_months"] < 2, "Limited internship experience",
            "Apply to 10 internships this month; contribute to open source meanwhile")
    concern((p["quant_aptitude"] + p["logical_reasoning"]) / 2 < 65, "Aptitude below placement cutoff",
            "Take a weekly timed aptitude test (quant + logical)")
    concern(p["backlogs"] > 0, f"{p['backlogs']} active backlog(s) must be cleared",
            "Clear backlogs first — many recruiters filter on zero backlogs")
    if len(recs) < 2:
        recs += ["Build a resume-ready portfolio site", "Solve 3 coding problems per week on a judge"]
    return strengths[:4], concerns[:4], recs[:5]


def run_prediction(payload: dict, model: str = "neuro_fuzzy", student_id: str = "demo-student") -> dict:
    prob, model_used = predict_proba(payload, model)
    pct = round(prob * 100, 1)
    fuzzy = fuzzy_infer(float(payload["cgpa"]), float(payload["coding_score"]), float(payload["communication"]))
    breakdown = readiness_breakdown(payload)
    mean_breakdown = sum(breakdown.values()) / len(breakdown)
    readiness = round(0.6 * mean_breakdown + 0.4 * pct, 1)
    readiness = float(max(0, min(100, readiness)))
    if pct >= 70: status = "LIKELY TO BE PLACED"
    elif pct >= 45: status = "BORDERLINE"
    else: status = "NEEDS WORK"
    margin = abs(prob - 0.5)
    confidence = "High" if margin > 0.25 else ("Medium" if margin > 0.12 else "Low")
    strengths, concerns, recs = build_recommendations(payload, breakdown)
    band = "Excellent" if readiness >= 80 else ("Good" if readiness >= 65 else ("Developing" if readiness >= 45 else "At risk"))
    result = {
        "placement_probability": pct, "placement_status": status, "confidence": confidence,
        "readiness_score": readiness, "readiness_band": band, "breakdown": breakdown,
        "strengths": strengths, "concerns": concerns, "recommendations": recs,
        "fuzzy_explanation": fuzzy, "model_used": model_used + (" [demo-heuristic]" if not is_trained() else ""),
    }
    try:
        with get_conn() as conn:
            conn.execute(
                "INSERT INTO predictions (student_id, department, semester, cgpa, probability, readiness, status, payload) VALUES (?,?,?,?,?,?,?,?)",
                (student_id, payload.get("department"), payload.get("semester"), payload.get("cgpa"),
                 pct, readiness, status, json.dumps(payload)),
            )
    except Exception:
        pass
    return result
