import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { api } from "../services/api";
import { Empty } from "../components/ui";

export default function Admin() {
  const [a, setA] = useState<Record<string, unknown> | null>(null);
  const [m, setM] = useState<{ trained: boolean; models: Record<string, Record<string, number>>; best_model?: string } | null>(null);
  const [dept, setDept] = useState("All");
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    api.analytics().then(setA).catch(() => setA(null));
    api.metrics().then(setM).catch(() => setM(null));
    api.history().then((d) => setRows(d.predictions)).catch(() => setRows([]));
  }, []);

  if (!a) return (
    <div className="page">
      <div className="kicker-row"><span className="kicker-rule" /><span className="tech-label">admin · cohort oversight</span></div>
      <h1 className="display" style={{ fontSize: 40 }}>Admin Dashboard</h1>
      <Empty title="Cohort data requires the backend." body="Start FastAPI and seed/train the demo dataset to unlock admin oversight. Filters below will apply once data loads." />
    </div>
  );

  const filtered = rows.filter((r) => dept === "All" || String(r.department) === dept);
  const atRisk = filtered.filter((r) => Number(r.probability) < 45);

  return (
    <div className="page">
      <div className="kicker-row rise"><span className="kicker-rule" /><span className="tech-label">admin · cohort oversight · synthetic demo cohort</span></div>
      <h1 className="display rise rise-1" style={{ fontSize: "clamp(30px,4vw,48px)", margin: "0 0 6px" }}>Admin Dashboard</h1>
      <div className="status-line rise rise-2" style={{ marginTop: 12 }}>
        <label className="tech-label">department</label>
        <select className="input" style={{ width: 160 }} value={dept} onChange={(e) => setDept(e.target.value)}>
          {["All", "CSE", "IT", "ECE", "EEE", "ME", "CE"].map((d) => <option key={d}>{d}</option>)}
        </select>
        <span className="pill-note mono">BEST MODEL: {m?.best_model ?? "AWAITING TRAINING"}</span>
      </div>
      <div className="grid-3 rise rise-2" style={{ marginTop: 20 }}>
        {[["Total students", a.total_students], ["Predicted placement rate", `${a.placement_rate}%`], ["At-risk (p<45%)", atRisk.length || "—"]].map(([k, v]) => (
          <div key={String(k)} className="panel panel-pad"><div className="tech-label">{String(k)}</div><div className="metric-lg">{String(v)}</div></div>
        ))}
      </div>
      <div className="grid-2" style={{ marginTop: 20 }}>
        <section className="panel panel-pad">
          <div className="section-head" style={{ margin: 0 }}><h2>Prediction distribution</h2><span className="tech-label">{filtered.length} records</span></div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={[0, 1, 2, 3, 4].map((b) => ({ k: `${b * 20}-${b * 20 + 20}%`, v: filtered.filter((r) => Number(r.probability) >= b * 20 && Number(r.probability) < (b + 1) * 20 + 1).length }))}>
                <CartesianGrid stroke="var(--line)" /><XAxis dataKey="k" tick={{ fontSize: 10, fill: "var(--ink-3)" }} /><YAxis tick={{ fontSize: 11, fill: "var(--ink-3)" }} />
                <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--line-strong)" }} />
                <Bar dataKey="v" fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="panel panel-pad">
          <div className="section-head" style={{ margin: 0 }}><h2>High-risk students</h2><span className="tech-label">needs outreach</span></div>
          {atRisk.length === 0 ? <p style={{ color: "var(--ink-2)" }}>No at-risk records in this filter — or history is empty because the backend just started.</p> : (
            <table className="tbl"><thead><tr><th>Student</th><th>CGPA</th><th>Prob</th></tr></thead>
              <tbody>{atRisk.slice(0, 8).map((r, i) => (
                <tr key={i}><td className="mono">{String(r.student_id)}</td><td className="mono">{String(r.cgpa)}</td><td style={{ fontWeight: 700 }}>{Number(r.probability).toFixed(1)}%</td></tr>
              ))}</tbody></table>
          )}
        </section>
      </div>
    </div>
  );
}
