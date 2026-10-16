"""Synthetic, clearly-labeled demo dataset generator."""
from __future__ import annotations

import numpy as np
import pandas as pd

FEATURES = [
    "cgpa", "tenth_pct", "twelfth_pct", "backlogs", "coding_score",
    "dsa_proficiency", "projects", "certifications", "quant_aptitude",
    "logical_reasoning", "verbal_ability", "communication",
    "internship_months", "interview_readiness", "extracurricular",
]

TARGET = "placed"


def generate_demo_dataset(n: int = 1500, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    cgpa = np.clip(rng.normal(7.4, 1.1, n), 4.5, 10.0)
    tenth = np.clip(rng.normal(78, 9, n), 40, 100)
    twelfth = np.clip(rng.normal(76, 10, n), 40, 100)
    backlogs = rng.poisson(0.6, n).clip(0, 6)
    coding = np.clip(rng.normal(62, 17, n), 5, 100)
    dsa = np.clip(coding * 0.85 + rng.normal(5, 12, n), 5, 100)
    projects = (rng.poisson(2.2, n)).clip(0, 8)
    certs = rng.poisson(1.4, n).clip(0, 6)
    quant = np.clip(rng.normal(64, 15, n), 5, 100)
    logical = np.clip(rng.normal(63, 15, n), 5, 100)
    verbal = np.clip(rng.normal(65, 14, n), 5, 100)
    comm = np.clip(verbal * 0.6 + rng.normal(22, 10, n), 5, 100)
    intern = rng.poisson(2.0, n).clip(0, 12)
    interview = np.clip(comm * 0.55 + coding * 0.25 + rng.normal(8, 10, n), 5, 100)
    extra = np.clip(rng.normal(55, 18, n), 0, 100)

    logit = (
        0.55 * (cgpa - 7.0)
        + 0.035 * (coding - 60)
        + 0.025 * (dsa - 60)
        + 0.02 * (quant - 60)
        + 0.02 * (logical - 60)
        + 0.022 * (comm - 60)
        + 0.22 * (projects - 2)
        + 0.12 * intern
        - 0.55 * backlogs
        + rng.normal(0, 0.9, n)
    )
    prob = 1 / (1 + np.exp(-logit))
    placed = (prob > 0.5).astype(int)
    return pd.DataFrame({
        "cgpa": cgpa.round(2), "tenth_pct": tenth.round(1), "twelfth_pct": twelfth.round(1),
        "backlogs": backlogs, "coding_score": coding.round(1), "dsa_proficiency": dsa.round(1),
        "projects": projects, "certifications": certs, "quant_aptitude": quant.round(1),
        "logical_reasoning": logical.round(1), "verbal_ability": verbal.round(1),
        "communication": comm.round(1), "internship_months": intern,
        "interview_readiness": interview.round(1), "extracurricular": extra.round(1),
        "placed": placed,
    })
