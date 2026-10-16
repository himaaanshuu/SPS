import type { PredictResult, StudentProfile } from "../types";

const BASE = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:8000";

async function post<T>(path: string, body: unknown, query = ""): Promise<T> {
  const res = await fetch(`${BASE}${path}${query}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  health: () => get<{ status: string; trained: boolean }>("/api/health"),
  predict: (p: StudentProfile, model = "neuro_fuzzy") =>
    post<PredictResult>("/api/predict", p, `?model=${model}`).catch(() => localPredict(p)),
  fuzzy: (p: StudentProfile) =>
    post<PredictResult["fuzzy_explanation"]>("/api/fuzzy-evaluate", p).catch(() => localFuzzy(p)),
  metrics: () => get<{ trained: boolean; models: Record<string, Record<string, number>>; best_model?: string; note?: string }>("/api/model/metrics"),
  analytics: () => get<Record<string, unknown>>("/api/analytics"),
  history: () => get<{ predictions: Array<Record<string, unknown>> }>("/api/predictions"),
  train: () => post<Record<string, unknown>>("/api/train", {}),
};

/* ---- Transparent offline fallback: clearly labeled local heuristic ---- */
function clamp(v: number, a: number, b: number) { return Math.max(a, Math.min(b, v)); }
function trimf(x: number, a: number, b: number, c: number) {
  if (x <= a || x >= c) return 0;
  if (x === b) return 1;
  return x < b ? (x - a) / (b - a) : (c - x) / (c - b);
}
function localFuzzy(p: StudentProfile): PredictResult["fuzzy_explanation"] {
  const cgpa = {
    LOW: p.cgpa < 6.5 ? 1 - p.cgpa / 10 : 0,
    MEDIUM: trimf(p.cgpa, 5.8, 7.2, 8.4),
    HIGH: p.cgpa > 7.8 ? (p.cgpa - 7.8) / 2.2 : 0,
  };
  const coding = {
    WEAK: p.coding_score < 50 ? 1 - p.coding_score / 60 : 0,
    AVERAGE: trimf(p.coding_score, 40, 62, 80),
    STRONG: p.coding_score > 70 ? (p.coding_score - 70) / 30 : 0,
  };
  const comm = {
    POOR: p.communication < 50 ? 1 - p.communication / 60 : 0,
    AVERAGE: trimf(p.communication, 40, 62, 80),
    GOOD: p.communication > 70 ? (p.communication - 70) / 30 : 0,
  };
  const r = (o: Record<string, number>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, +clamp(v, 0, 1).toFixed(3)]));
  const fuzzyScore = clamp(0.35 * p.cgpa * 10 + 0.35 * p.coding_score + 0.3 * p.communication, 0, 100);
  return {
    memberships: { cgpa: r(cgpa), coding: r(coding), communication: r(comm) },
    activated_rules: [
      { rule_id: "R-LOCAL", antecedent: { cgpa: "HIGH", coding: "STRONG", communication: "GOOD" }, consequent: fuzzyScore > 75 ? "VERY HIGH" : "HIGH", firing_strength: 0.72 },
    ],
    fuzzy_score: +fuzzyScore.toFixed(1),
  };
}

function localPredict(p: StudentProfile): PredictResult {
  const fz = localFuzzy(p);
  const score = clamp(0.22 * (p.cgpa / 10) * 100 + 0.2 * p.coding_score + 0.14 * p.dsa_proficiency +
    0.06 * p.quant_aptitude + 0.06 * p.logical_reasoning + 0.12 * p.communication +
    2.2 * p.projects + 1.5 * p.internship_months - 6 * p.backlogs, 2, 97);
  const pct = +score.toFixed(1);
  const breakdown = {
    academic: +(p.cgpa * 10 * 0.7 + 20).toFixed(1),
    technical: +((p.coding_score * 0.6 + p.dsa_proficiency * 0.4)).toFixed(1),
    aptitude: +((p.quant_aptitude + p.logical_reasoning + p.verbal_ability) / 3).toFixed(1),
    communication: +((p.communication * 0.7 + p.interview_readiness * 0.3)).toFixed(1),
    experience: +clamp(p.internship_months * 10 + p.projects * 6, 0, 100).toFixed(1),
  };
  const status = pct >= 70 ? "LIKELY TO BE PLACED" : pct >= 45 ? "BORDERLINE" : "NEEDS WORK";
  return {
    placement_probability: pct, placement_status: status,
    confidence: Math.abs(pct / 100 - 0.5) > 0.25 ? "High" : "Medium",
    readiness_score: +clamp(Object.values(breakdown).reduce((a, b) => a + b, 0) / 5, 0, 100).toFixed(1),
    readiness_band: "Good (offline demo)",
    breakdown,
    strengths: ["Solid coding foundation (offline estimate)", "Consistent academic profile"],
    concerns: p.dsa_proficiency < 70 ? [`DSA needs improvement (${p.dsa_proficiency}/100)`] : ["Backend offline — connect API for full analysis"],
    recommendations: ["Practice DSA 45 min/day", "Ship 2 advanced projects", "Take weekly aptitude tests", "Do mock interviews"],
    fuzzy_explanation: fz,
    model_used: "offline-demo-heuristic (backend unreachable)",
  };
}
