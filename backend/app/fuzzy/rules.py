"""Fuzzy rule base for placement readiness.

Each rule maps linguistic terms to a placement consequent.
Rules carry a weight so the engine can rank activated rules for display.
"""
from __future__ import annotations

RULES: list[dict] = [
    {"id": "R1", "if": {"cgpa": "HIGH", "coding": "STRONG", "communication": "GOOD"}, "then": "VERY HIGH", "weight": 1.0},
    {"id": "R2", "if": {"cgpa": "HIGH", "coding": "STRONG", "communication": "AVERAGE"}, "then": "HIGH", "weight": 0.9},
    {"id": "R3", "if": {"cgpa": "HIGH", "coding": "AVERAGE", "communication": "GOOD"}, "then": "HIGH", "weight": 0.85},
    {"id": "R4", "if": {"cgpa": "MEDIUM", "coding": "STRONG", "communication": "GOOD"}, "then": "HIGH", "weight": 0.85},
    {"id": "R5", "if": {"cgpa": "MEDIUM", "coding": "AVERAGE", "communication": "AVERAGE"}, "then": "MEDIUM", "weight": 0.8},
    {"id": "R6", "if": {"cgpa": "MEDIUM", "coding": "STRONG", "communication": "AVERAGE"}, "then": "HIGH", "weight": 0.8},
    {"id": "R7", "if": {"cgpa": "HIGH", "coding": "AVERAGE", "communication": "AVERAGE"}, "then": "MEDIUM", "weight": 0.75},
    {"id": "R8", "if": {"cgpa": "LOW", "coding": "STRONG", "communication": "GOOD"}, "then": "MEDIUM", "weight": 0.7},
    {"id": "R9", "if": {"cgpa": "MEDIUM", "coding": "AVERAGE", "communication": "POOR"}, "then": "LOW", "weight": 0.7},
    {"id": "R10", "if": {"cgpa": "LOW", "coding": "AVERAGE", "communication": "AVERAGE"}, "then": "LOW", "weight": 0.65},
    {"id": "R11", "if": {"cgpa": "LOW", "coding": "WEAK", "communication": "POOR"}, "then": "VERY LOW", "weight": 1.0},
    {"id": "R12", "if": {"cgpa": "MEDIUM", "coding": "WEAK", "communication": "AVERAGE"}, "then": "LOW", "weight": 0.6},
]
