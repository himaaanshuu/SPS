"""Triangular/trapezoidal membership helpers (pure numpy, no TF dependency)."""
from __future__ import annotations


def trimf(x: float, a: float, b: float, c: float) -> float:
    if x <= a or x >= c:
        return 0.0
    if x == b:
        return 1.0
    if x < b:
        return (x - a) / (b - a) if b != a else 0.0
    return (c - x) / (c - b) if c != b else 0.0


def trapmf(x: float, a: float, b: float, c: float, d: float) -> float:
    if x <= a or x >= d:
        return 0.0
    if b <= x <= c:
        return 1.0
    if x < b:
        return (x - a) / (b - a) if b != a else 0.0
    return (d - x) / (d - c) if d != c else 0.0


CGPA_SETS = {
    "LOW": lambda x: trapmf(x, 0.0, 0.0, 5.5, 6.5),
    "MEDIUM": lambda x: trimf(x, 5.8, 7.2, 8.4),
    "HIGH": lambda x: trapmf(x, 7.8, 8.6, 10.0, 10.0),
}

SCORE_SETS_100 = {
    "WEAK": lambda x: trapmf(x, 0, 0, 35, 50),
    "AVERAGE": lambda x: trimf(x, 40, 62, 80),
    "STRONG": lambda x: trapmf(x, 70, 82, 100, 100),
}

COMM_SETS = {
    "POOR": lambda x: trapmf(x, 0, 0, 35, 50),
    "AVERAGE": lambda x: trimf(x, 40, 62, 80),
    "GOOD": lambda x: trapmf(x, 70, 82, 100, 100),
}

PLACEMENT_SETS = {
    "VERY LOW": lambda x: trapmf(x, 0, 0, 12, 25),
    "LOW": lambda x: trimf(x, 15, 32, 48),
    "MEDIUM": lambda x: trimf(x, 40, 55, 70),
    "HIGH": lambda x: trimf(x, 62, 76, 90),
    "VERY HIGH": lambda x: trapmf(x, 82, 92, 100, 100),
}
