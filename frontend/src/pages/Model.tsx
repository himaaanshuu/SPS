import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { api } from "../services/api";
import { store } from "../components/ui";
import { FuzzyExplain } from "./Predict";
import type { PredictResult } from "../types";

type Metrics = { trained: boolean; models: Record<string, Record<string, number | string>>; best_model?: string; note?: string };

const ORDER = ["logistic_regression", "random_forest", "neural_network", "fuzzy_system", "neuro_fuzzy"];
const LABELS: Record<string, string> = {
  logistic_regression: "Logistic Regression", random_forest: "Random Forest",
  neural_network: "Neural Network", fuzzy_system: "Fuzzy System", neuro_fuzzy: "Neuro-Fuzzy",
};

export default function Model() {
  const [m, setM] = useState<Metrics | null>(null);
  const [training, setTraining] = useState(false);
  const last = store.loadResult<PredictResult>();

  const load = () => api.metrics().then(setM).catch(() => setM({ trained: false, models: {}, note: "Backend unreachable — metrics unavailable, nothing fabricated." }));
  useEffect(() => { load(); }, []);

  const chartData = ORDER.filter((k) => m?.models[k]).map((k) => ({ name: LABELS[k], f1: Number(m!.models[k].f1 ?? 0), acc: Number(m!.models[k].accuracy ?? 0) }));

  return (
    <div className="page">
      <div className="kicker-row rise"><span className="kicker-rule" /><span className="tech-label">model intelligence · soft computing core</span></div>
      <h1 className="display rise rise-1" style={{ fontSize: "clamp(30px,4vw,48px)", margin: "0 0 6px" }}>Model Intelligence</h1>
      <p className="rise rise-1" style={{ color: "var(--ink-2)" }}>Honest metrics only — untrained models report as awaiting training, never with invented numbers.</p>

      <section className="panel panel-pad rise rise-2" style={{ marginTop: 20 }}>
        <div className="section-head" style={{ margin: "0 0 12px" }}>
          <h2>Model comparison</h2>
          <button className="btn btn-primary btn-sm" disabled={training} onClick={async () => {
            setTraining(true);
            try { await api.train(); await load(); } catch { /* offline */ } finally { setTraining(false); }
          }}>{training ? "Training…" : "Train all models"}</button>
        </div>
        {!m ? <div className="skel" style={{ height: 120 }} /> : !m.trained || chartData.length === 0 ? (
          <div className="empty">
            <div className="tech-label">awaiting training data</div>
            <p>Train from the demo dataset (synthetic, labeled) or connect your institutional CSV, then compare.</p>
            {m.note && <span className="pill-note mono">{m.note}</span>}
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table className="tbl">
                <thead><tr><th>Model</th><th>Accuracy</th><th>Precision</th><th>Recall</th><th>F1</th><th>ROC-AUC</th></tr></thead>
                <tbody>
                  {ORDER.filter((k) => m.models[k]).map((k) => (
                    <tr key={k} className={m.best_model === k ? "hl" : ""}>
                      <td>{LABELS[k]}{m.best_model === k ? " ★ best" : ""}</td>
                      <td className="mono">{Number(m.models[k].accuracy).toFixed(3)}</td>
                      <td className="mono">{Number(m.models[k].precision).toFixed(3)}</td>
                      <td className="mono">{Number(m.models[k].recall).toFixed(3)}</td>
                      <td className="mono">{Number(m.models[k].f1).toFixed(3)}</td>
                      <td className="mono">{Number(m.models[k].roc_auc ?? 0).toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ height: 260, marginTop: 18 }}>
              <ResponsiveContainer>
                <BarChart data={chartData}>
                  <CartesianGrid stroke="var(--line)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--ink-2)" }} interval={0} angle={-12} height={60} />
                  <YAxis domain={[0, 1]} tick={{ fontSize: 11, fill: "var(--ink-3)" }} />
                  <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--line-strong)" }} />
                  <Bar dataKey="f1" fill="var(--chart-1)" radius={[3, 3, 0, 0]} name="F1" />
                  <Bar dataKey="acc" fill="var(--chart-4)" radius={[3, 3, 0, 0]} name="Accuracy" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </section>

      <section className="panel panel-pad rise rise-3" style={{ marginTop: 20 }}>
        <div className="section-head" style={{ margin: "0 0 12px" }}><h2>Neural network — 15 → 32 → 16 → 8 → 1</h2><span className="tech-label">relu · adam · early stopping · bce</span></div>
        <NNViz />
      </section>

      {last ? <div style={{ marginTop: 20 }}><FuzzyExplain result={last} /></div> : (
        <section className="panel panel-pad" style={{ marginTop: 20 }}>
          <div className="tech-label">fuzzy rule viewer</div>
          <p style={{ color: "var(--ink-2)" }}>Run a prediction to see live membership values and fired rules here.</p>
          <div className="rule-chip mono"><span>IF CGPA=HIGH ∧ CODING=STRONG ∧ COMMUNICATION=GOOD → VERY HIGH</span></div>
        </section>
      )}
    </div>
  );
}

function NNViz() {
  const layers = [
    { name: "INPUT", n: 15, note: "CGPA · coding · aptitude · comms…" },
    { name: "HIDDEN 1", n: 32, note: "ReLU" },
    { name: "HIDDEN 2", n: 16, note: "ReLU" },
    { name: "HIDDEN 3", n: 8, note: "ReLU" },
    { name: "OUTPUT", n: 1, note: "sigmoid → P(placed)" },
  ];
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "stretch", overflowX: "auto", padding: "8px 0" }}>
      {layers.map((l, i) => (
        <div key={l.name} style={{ flex: 1, minWidth: 130 }}>
          <div className="tech-label" style={{ marginBottom: 8 }}>{l.name} · {l.n}</div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", border: "1px solid var(--line)", borderRadius: 4, padding: 10, background: "var(--surface-2)", minHeight: 120 }}>
            {Array.from({ length: Math.min(l.n, 16) }).map((_, j) => (
              <span key={j} className="nn-node" style={{ animationDelay: `${(i * 0.15 + j * 0.06).toFixed(2)}s` }} />
            ))}
            {l.n > 16 && <span className="mono" style={{ fontSize: 10 }}>+{l.n - 16} more</span>}
          </div>
          <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", marginTop: 6 }}>{l.note}</div>
          {i < layers.length - 1 && null}
        </div>
      ))}
      <style>{`.nn-node{width:11px;height:11px;border-radius:50%;background:var(--action);opacity:.75;animation:blink 2.4s infinite}@media (prefers-reduced-motion:reduce){.nn-node{animation:none}}`}</style>
    </div>
  );
}
