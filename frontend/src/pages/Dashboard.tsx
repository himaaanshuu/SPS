import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { ArrowRight, Bell } from "lucide-react";
import { api } from "../services/api";
import { store, useCountUp, StatusChip, SignalBar, Empty } from "../components/ui";
import type { PredictResult } from "../types";

export default function Dashboard() {
  const nav = useNavigate();
  const [result] = useState<PredictResult | null>(() => store.loadResult<PredictResult>());
  const [health, setHealth] = useState<{ trained: boolean } | null>(null);
  const prob = useCountUp(result?.placement_probability ?? 0);
  const ready = useCountUp(result?.readiness_score ?? 0);

  useEffect(() => { api.health().then(setHealth).catch(() => setHealth({ trained: false })); }, []);

  const radar = result ? [
    { s: "Academic", v: result.breakdown.academic },
    { s: "Technical", v: result.breakdown.technical },
    { s: "Aptitude", v: result.breakdown.aptitude },
    { s: "Comms", v: result.breakdown.communication },
    { s: "Experience", v: result.breakdown.experience },
  ] : [];
  const trend = [62, 66, 64, 71, 76, 79, result?.placement_probability ?? 82].map((v, i) => ({ t: `T${i + 1}`, v }));

  return (
    <div className="page">
      <div className="kicker-row rise"><span className="kicker-rule" /><span className="tech-label">student dashboard · semester 6 · cse</span></div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 className="display rise rise-1" style={{ fontSize: "clamp(30px,4vw,46px)", margin: 0 }}>
            Aarav Sharma
          </h1>
          <p className="rise rise-1" style={{ color: "var(--ink-2)", margin: "8px 0 0" }}>
            {result ? "Your placement readiness is trending upward." : "No prediction yet — run your first analysis below."}
          </p>
        </div>
        <div className="status-line rise rise-2">
          <button className="btn btn-ghost btn-sm" aria-label="Notifications"><Bell size={15} /> 2</button>
          {health && <span className="pill-note mono">{health.trained ? "● MODEL: TRAINED" : "○ MODEL: DEMO MODE"}</span>}
        </div>
      </div>

      {!result ? (
        <div style={{ marginTop: 28 }}>
          <Empty title="No prediction yet." body="Run your first placement analysis to see your readiness profile."
            action={<button className="btn btn-primary" onClick={() => nav("/predict")}>Run placement analysis <ArrowRight size={15} /></button>} />
        </div>
      ) : (
        <>
          <div className="grid-2" style={{ marginTop: 26 }}>
            <section className="panel panel-pad rise rise-1">
              <div className="tech-label">placement probability</div>
              <div className="metric-xl">{prob.toFixed(1)}<span style={{ fontSize: "0.35em" }}>%</span></div>
              <div style={{ marginTop: 12 }}><StatusChip status={result.placement_status} /></div>
              <p style={{ color: "var(--ink-2)", fontSize: 14, lineHeight: 1.6 }}>
                Two skills are currently limiting your predicted placement probability.{" "}
                <button onClick={() => nav("/skill-gap")} style={{ background: "none", border: "none", color: "var(--action)", fontWeight: 700, cursor: "pointer", padding: 0 }}>See skill gaps →</button>
              </p>
              <div className="tech-label" style={{ marginTop: 8 }}>model: {result.model_used}</div>
            </section>
            <section className="panel panel-pad rise rise-2">
              <div className="tech-label">readiness index</div>
              <div className="metric-lg">{ready.toFixed(0)} <span style={{ fontSize: 15, color: "var(--ink-3)" }}>/ 100 · {result.readiness_band}</span></div>
              <div style={{ display: "grid", gap: 14, marginTop: 18 }}>
                {Object.entries(result.breakdown).map(([k, v]) => <SignalBar key={k} label={k[0].toUpperCase() + k.slice(1)} value={v} />)}
              </div>
            </section>
          </div>

          <div className="grid-2" style={{ marginTop: 20 }}>
            <section className="panel panel-pad rise rise-2">
              <div className="section-head" style={{ margin: "0 0 8px" }}><h2>Skill radar</h2><span className="tech-label">5 axes</span></div>
              <div style={{ height: 280 }}>
                <ResponsiveContainer>
                  <RadarChart data={radar}>
                    <PolarGrid stroke="var(--line-strong)" />
                    <PolarAngleAxis dataKey="s" tick={{ fill: "var(--ink-2)", fontSize: 11 }} />
                    <Radar dataKey="v" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.25} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </section>
            <section className="panel panel-pad rise rise-3">
              <div className="section-head" style={{ margin: "0 0 8px" }}><h2>Probability trajectory</h2><span className="tech-label">7 terms</span></div>
              <div style={{ height: 280 }}>
                <ResponsiveContainer>
                  <LineChart data={trend}>
                    <CartesianGrid stroke="var(--line)" />
                    <XAxis dataKey="t" tick={{ fill: "var(--ink-3)", fontSize: 11 }} />
                    <YAxis domain={[40, 100]} tick={{ fill: "var(--ink-3)", fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--line-strong)" }} />
                    <Line type="monotone" dataKey="v" stroke="var(--chart-1)" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => nav("/predict")}>Re-run analysis <ArrowRight size={15} /></button>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
