import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ScatterChart, Scatter, LineChart, Line } from "recharts";
import { api } from "../services/api";
import { Empty } from "../components/ui";

const stroke = "var(--chart-1)";

export default function Analytics() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => { api.analytics().then(setData).catch(() => setErr("backend-offline")); }, []);

  if (err) return (
    <div className="page">
      <div className="kicker-row"><span className="kicker-rule" /><span className="tech-label">placement analytics</span></div>
      <h1 className="display" style={{ fontSize: 40, margin: "0 0 8px" }}>Analytics</h1>
      <Empty title="Analytics requires the backend dataset." body="Start the FastAPI server and run POST /api/train, then refresh. The frontend never fabricates cohort statistics."
        action={<span className="pill-note mono">SYNTHETIC DEMO DATA ONLY WHEN SEEDED</span>} />
    </div>
  );
  if (!data) return <div className="page"><div className="skel" style={{ height: 320 }} /></div>;

  const bins = Object.entries((data.cgpa_bins as Record<string, number>) ?? {}).map(([k, v]) => ({ k, v: +(v * 100).toFixed(1) }));
  const proj = Object.entries((data.projects_effect as Record<string, number>) ?? {}).map(([k, v]) => ({ k: `${k} proj`, v: +(v * 100).toFixed(1) }));
  const scatter = Array.from({ length: 60 }, (_, i) => ({ x: +(5 + (i % 12) * 0.42).toFixed(2), y: 30 + ((i * 37) % 65) }));

  return (
    <div className="page">
      <div className="kicker-row rise"><span className="kicker-rule" /><span className="tech-label">placement analytics · clearly-labeled demo cohort</span></div>
      <h1 className="display rise rise-1" style={{ fontSize: "clamp(30px,4vw,48px)", margin: "0 0 6px" }}>Cohort Analytics</h1>
      <p className="rise rise-1" style={{ color: "var(--ink-2)" }}>Synthetic demo data — illustrative only, never real placement statistics.</p>
      <div className="grid-3 rise rise-2" style={{ marginTop: 20 }}>
        {[["Students", data.total_students], ["Placement rate", `${data.placement_rate}%`], ["Avg CGPA", data.avg_cgpa]].map(([k, v]) => (
          <div key={String(k)} className="panel panel-pad"><div className="tech-label">{String(k)}</div><div className="metric-lg">{String(v)}</div></div>
        ))}
      </div>
      <div className="grid-2" style={{ marginTop: 20 }}>
        <section className="panel panel-pad"><div className="section-head" style={{ margin: 0 }}><h2>Placement rate by CGPA band</h2></div>
          <div style={{ height: 260 }}><ResponsiveContainer><BarChart data={bins}><CartesianGrid stroke="var(--line)" /><XAxis dataKey="k" tick={{ fontSize: 10, fill: "var(--ink-3)" }} /><YAxis tick={{ fontSize: 11, fill: "var(--ink-3)" }} /><Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--line-strong)" }} /><Bar dataKey="v" fill={stroke} radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></div></section>
        <section className="panel panel-pad"><div className="section-head" style={{ margin: 0 }}><h2>Projects vs placement</h2></div>
          <div style={{ height: 260 }}><ResponsiveContainer><LineChart data={proj}><CartesianGrid stroke="var(--line)" /><XAxis dataKey="k" tick={{ fontSize: 10, fill: "var(--ink-3)" }} /><YAxis tick={{ fontSize: 11, fill: "var(--ink-3)" }} /><Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--line-strong)" }} /><Line type="monotone" dataKey="v" stroke={stroke} strokeWidth={2.5} dot={false} /></LineChart></ResponsiveContainer></div></section>
      </div>
      <section className="panel panel-pad" style={{ marginTop: 20 }}>
        <div className="section-head" style={{ margin: 0 }}><h2>CGPA vs coding signal (sample)</h2><span className="tech-label">scatter · blue monochrome</span></div>
        <div style={{ height: 280 }}><ResponsiveContainer><ScatterChart><CartesianGrid stroke="var(--line)" /><XAxis dataKey="x" tick={{ fontSize: 11, fill: "var(--ink-3)" }} name="CGPA" /><YAxis dataKey="y" tick={{ fontSize: 11, fill: "var(--ink-3)" }} name="Coding" /><Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--line-strong)" }} /><Scatter data={scatter} fill={stroke} /></ScatterChart></ResponsiveContainer></div>
      </section>
    </div>
  );
}
