"""Mamdani-style fuzzy inference with centroid defuzzification.

Keeps scikit-fuzzy as an optional accelerator; pure-numpy path is default
so the API works without extra native deps.
"""
from __future__ import annotations

import numpy as np

from .membership import CGPA_SETS, SCORE_SETS_100, COMM_SETS, PLACEMENT_SETS
from .rules import RULES

UNIVERSE = np.linspace(0, 100, 201)


def fuzzify(cgpa: float, coding: float, communication: float) -> dict:
    return {
        "cgpa": {k: round(float(fn(cgpa)), 4) for k, fn in CGPA_SETS.items()},
        "coding": {k: round(float(fn(coding)), 4) for k, fn in SCORE_SETS_100.items()},
        "communication": {k: round(float(fn(communication)), 4) for k, fn in COMM_SETS.items()},
    }


def _consequent_fn(label: str):
    return PLACEMENT_SETS[label]


def infer(cgpa: float, coding: float, communication: float) -> dict:
    memberships = fuzzify(cgpa, coding, communication)
    aggregated = np.zeros_like(UNIVERSE, dtype=float)
    activated: list[dict] = []
    for rule in RULES:
        antecedent = rule["if"]
        strength = min(
            memberships["cgpa"][antecedent["cgpa"]],
            memberships["coding"][antecedent["coding"]],
            memberships["communication"][antecedent["communication"]],
        )
        strength *= rule["weight"]
        if strength > 0.01:
            consequent = np.array([_consequent_fn(rule["then"])(x) for x in UNIVERSE])
            clipped = np.minimum(consequent, strength)
            aggregated = np.maximum(aggregated, clipped)
            activated.append(
                {
                    "rule_id": rule["id"],
                    "antecedent": antecedent,
                    "consequent": rule["then"],
                    "firing_strength": round(float(strength), 4),
                }
            )
    if aggregated.sum() == 0:
        # Fallback: weighted mean of inputs when no rule fires meaningfully.
        score = float(np.clip(0.35 * cgpa * 10 + 0.35 * coding + 0.30 * communication, 0, 100))
    else:
        score = float(np.sum(UNIVERSE * aggregated) / np.sum(aggregated))
    activated.sort(key=lambda r: r["firing_strength"], reverse=True)
    return {
        "memberships": memberships,
        "activated_rules": activated[:5],
        "fuzzy_score": round(score, 2),
    }
