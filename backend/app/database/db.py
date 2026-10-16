"""SQLite persistence (swappable for Postgres/Mongo later)."""
from __future__ import annotations

import os
import sqlite3
from pathlib import Path

DB_PATH = os.getenv("DATABASE_URL", "sqlite:///./placement.db").replace("sqlite:///", "")


def get_conn() -> sqlite3.Connection:
    Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with get_conn() as conn:
        conn.execute(
            """CREATE TABLE IF NOT EXISTS predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id TEXT, department TEXT, semester INTEGER,
                cgpa REAL, probability REAL, readiness REAL, status TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                payload TEXT
            )"""
        )
        conn.execute(
            """CREATE TABLE IF NOT EXISTS students (
                id TEXT PRIMARY KEY, name TEXT, department TEXT,
                semester INTEGER, cgpa REAL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )"""
        )
