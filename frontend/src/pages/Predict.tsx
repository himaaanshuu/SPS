import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, AlertTriangle, ArrowRight, RotateCcw } from "lucide-react";
import { api } from "../services/api";
import { store, StatusChip, SignalBar, BulletList } from "../components/ui";
import { DEFAULT_PROFILE, type PredictResult, type StudentProfile } from "../types";
import "./Predict.css";

const STEPS = ["Analyzing academic profile…", "Evaluating technical signals…", "Running fuzzy inference…", "Running neural model…", "Calculating placement probability…", "Preparing recommendations…"];

const SECTIONS: { title: string; hint: string; fields: { key: keyof StudentProfile; label: string; min: number; max: number; help: string; slider?: boolean }[] }[] = [
  { title: "Academic", hint: "Grades and backlog record — the strongest baseline signal.", fields: [
    { key: "cgpa", label: "CGPA", min: 0, max: 10, help: "0–10 scale", slider: true },
    { key: "tenth_pct", label: "10th %", min: 0, max: 100, help: "Board percentage" },
    { key: "twelfth_pct", label: "12th %", min: 0, max: 100, help: "Board percentage" },
    { key: "backlogs", label: "Backlogs", min: 0, max: 15, help: "Active backlogs; most recruiters require 0" },
  ]},
  { title: "Technical", hint: "Coding ability and proof of work.", fields: [
    { key: "coding_score", label: "Coding score", min: 0, max: 100, help: "Judge / coursework average", slider: true },
    { key: "dsa_proficiency", label: "DSA proficiency", min: 0, max: 100, help: "Data structures & algorithms", slider: true },
    { key: "projects", label: "Projects", min: 0, max: 20, help: "Completed, demonstrable projects" },
    { key: "certifications", label: "Certifications", min: 0, max: 20, help: "Technical certifications" },
  ]},
  { title: "Aptitude", hint: "Placement-test readiness.", fields: [
    { key: "quant_aptitude", label: "Quantitative", min: 0, max: 100, help: "Maths / speed", slider: true },
    { key: "logical_reasoning", label: "Logical reasoning", min: 0, max: 100, help: "Patterns / puzzles", slider: true },
    { key: "verbal_ability", label: "Verbal ability", min: 0, max: 100, help: "English / comprehension", slider: true },
  ]},
  { title: "Professional", hint: "How you show up in interviews and teams.", fields: [
    { key: "communication", label: "Communication", min: 0, max: 100, help: "Spoken + written", slider: true },
    { key: "internship_months", label: "Internship months", min: 0, max: 36, help: "Total experience" },
    { key: "interview_readiness", label: "Interview readiness", min: 0, max: 100, help: "Mock interview level", slider: true },
    { key: "extracurricular", label: "Extracurricular", min: 0, max: 100, help: "Clubs, leadership, OSS", slider: true },
  ]},
];

export function validate(p: StudentProfile): Record<string, string> {
  const e: Record<string, string> = {};
  const range = (k: keyof StudentProfile, a: number, b: number, msg: string) => {
    const v = Number(p[k]);
    if (Number.isNaN(v) || v < a || v > b) e[k as string] = msg;
  };
  range("cgpa", 0, 10, "CGPA must be between 0 and 10.");
  range("tenth_pct", 0, 100, "Must be 0–100.");
  range("twelfth_pct", 0, 100, "Must be 0–100.");
  range("backlogs", 0, 15, "Backlogs can't be negative.");
  (["coding_score","dsa_proficiency","quant_aptitude","logical_reasoning","verbal_ability","communication","interview_readiness","extracurricular"] as const)
    .forEach((k) => range(k, 0, 100, "Must be 0–100."));
  range("projects", 0, 20, "Project count looks off (0–20).");
  range("internship_months", 0, 36, "0–36 months.");
  return e;
}

export default function Predict() {
  const nav = useNavigate();
  const [form, setForm] = useState<StudentProfile>(() => store.loadProfile(DEFAULT_PROFILE));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<"idle" | "running" | "done" | "error">("idle");
  const [stepIdx, setStepIdx] = useState(0);
  const [result, setResult] = useState<PredictResult | null>(null);

  const set = (k: keyof StudentProfile, v: number) => setForm((f) => ({ ...f, [k]: v }));

  async function run() {
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) { setPhase("error"); return; }
    setPhase("running"); setStepIdx(0);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    for (let i = 0; i < STEPS.length; i++) {
      setStepIdx(i);
      if (!reduced) await new Promise((r) => setTimeout(r, 420));
    }
    try {
      store.saveProfile(form);
      const r = await api.predict(form);
      setResult(r); store.saveResult(r); setPhase("done");
    } catch {
      setPhase("error");
    }
  }

  return (
    <div className="page">
      <div className="kicker-row rise"><span className="kicker-rule" /><span className="tech-label">placement prediction · 15 signals · neuro-fuzzy</span></div>
      <h1 className="display rise rise-1" style={{ fontSize: "clamp(30px,4vw,48px)", margin: "0 0 6px" }}>Placement Analysis</h1>
      <p className="rise rise-1" style={{ color: "var(--ink-2)", marginTop: 0 }}>Fill each section honestly — the fuzzy engine reads partial truths, not just cutoffs.</p>

      {phase === "running" ? (
        <section className="panel panel-pad rise" style={{ marginTop: 24 }} aria-live="polite">
          <div className="tech-label">inference pipeline</div>
          <div className="steps">
            {STEPS.map((s, i) => (
              <div key={s} className={`step ${i < stepIdx ? "done" : i === stepIdx ? "active" : ""}`}>
                <span className="step-dot" />{s}
              </div>
            ))}
          </div>
          <div className="meter" style={{ marginTop: 18 }}><i style={{ width: `${((stepIdx + 1) / STEPS.length) * 100}%` }} /></div>
        </section>
      ) : result && phase === "done" ? (
        <section className="rise">
          <div className="grid-2" style={{ marginTop: 24 }}>
            <div className="panel panel-pad">
              <div className="tech-label">placement probability</div>
              <div className="metric-xl">{result.placement_probability.toFixed(1)}<span style={{ fontSize: "0.35em" }}>%</span></div>
              <div style={{ margin: "12px 0" }}><StatusChip status={result.placement_status} /></div>
              <div className="tech-label">confidence: {result.confidence} · readiness {result.readiness_score.toFixed(0)}/100 · {result.readiness_band}</div>
              <div className="tech-label" style={{ marginTop: 6 }}>model: {result.model_used}</div>
            </div>
            <div className="panel panel-pad">
              <div className="tech-label">readiness breakdown</div>
              <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
                {Object.entries(result.breakdown).map(([k, v]) => <SignalBar key={k} label={k} value={v} />)}
              </div>
            </div>
          </div>
          <div className="grid-3" style={{ marginTop: 20 }}>
            <div className="panel panel-pad"><h3 className="display" style={{ marginTop: 0, display: "flex", gap: 8, alignItems: "center" }}><CheckCircle2 size={18} /> Why this prediction?</h3><BulletList items={result.strengths} tone="good" /></div>
            <div className="panel panel-pad"><h3 className="display" style={{ marginTop: 0, display: "flex", gap: 8, alignItems: "center" }}><AlertTriangle size={18} /> Potential concerns</h3><BulletList items={result.concerns.length ? result.concerns : ["No major concerns detected."]} tone="warn" /></div>
            <div className="panel panel-pad"><h3 className="display" style={{ marginTop: 0 }}>Recommended actions</h3><BulletList items={result.recommendations.map((r, i) => `${i + 1}. ${r}`)} tone="action" /></div>
          </div>
          <FuzzyExplain result={result} />
          <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
            <button className="btn btn-ghost" onClick={() => { setPhase("idle"); setResult(null); }}><RotateCcw size={15} /> Adjust inputs</button>
            <button className="btn btn-primary" onClick={() => nav("/skill-gap")}>Open skill-gap plan <ArrowRight size={15} /></button>
          </div>
        </section>
      ) : (
        <form className="rise rise-2" style={{ marginTop: 20 }} onSubmit={(e) => { e.preventDefault(); run(); }}>
          {phase === "error" && Object.keys(errors).length > 0 && (
            <div className="panel panel-pad" role="alert" style={{ borderColor: "#e79a9a", marginBottom: 18 }}>
              <strong>Prediction couldn't be completed.</strong>
              <div style={{ color: "var(--ink-2)", fontSize: 14 }}>Check the highlighted inputs and try again.</div>
            </div>
          )}
          {SECTIONS.map((s, si) => (
            <section key={s.title} className="panel panel-pad form-section-block">
              <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
                <span className="mono" style={{ color: "var(--action)", fontWeight: 800 }}>0{si + 1}</span>
                <h3 className="display" style={{ margin: 0 }}>{s.title}</h3>
              </div>
              <p style={{ color: "var(--ink-3)", fontSize: 13, margin: "6px 0 16px" }}>{s.hint}</p>
              <div className="form-grid">
                {s.fields.map((f) => (
                  <div className="field" key={f.key}>
                    <label htmlFor={`f-${f.key}`}>{f.label}</label>
                    {f.slider ? (
                      <input id={`f-${f.key}`} className="slider" type="range" min={f.min} max={f.max} step={f.key === "cgpa" ? 0.1 : 1}
                        value={Number(form[f.key])} onChange={(e) => set(f.key, Number(e.target.value))} aria-describedby={`h-${f.key}`} />
                    ) : null}
                    <input id={`f-${f.key}`} className="input" type="number" min={f.min} max={f.max} step={f.key === "cgpa" ? 0.1 : 1}
                      value={Number(form[f.key])} onChange={(e) => set(f.key, Number(e.target.value))} aria-invalid={!!errors[f.key]} />
                    <small id={`h-${f.key}`}>{errors[f.key] ? <span className="err">{errors[f.key]}</span> : `${f.help} · current ${form[f.key]}`}</small>
                  </div>
                ))}
              </div>
            </section>
          ))}
          <div style={{ display: "flex", gap: 12, marginTop: 22, position: "sticky", bottom: 76 }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: "center", padding: 16 }}>
              Run Placement Analysis <ArrowRight size={16} />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export function FuzzyExplain({ result }: { result: PredictResult }) {
  const m = result.fuzzy_explanation.memberships;
  const bar = (label: string, val: number) => (
    <div key={label} style={{ display: "grid", gridTemplateColumns: "110px 1fr 44px", gap: 10, alignItems: "center", fontSize: 12 }}>
      <span className="mono">{label}</span>
      <div className="meter slim"><i style={{ width: `${val * 100}%` }} /></div>
      <span className="mono" style={{ textAlign: "right" }}>{val.toFixed(2)}</span>
    </div>
  );
  return (
    <section className="panel panel-pad" style={{ marginTop: 20 }}>
      <div className="section-head" style={{ margin: "0 0 12px" }}><h2>Fuzzy inference — why the system thinks so</h2><span className="pill-note mono">FUZZY SCORE {result.fuzzy_explanation.fuzzy_score}</span></div>
      <div className="grid-3">
        <div><div className="tech-label" style={{ marginBottom: 8 }}>CGPA linguistic terms</div><div style={{ display: "grid", gap: 8 }}>{Object.entries(m.cgpa ?? {}).map(([k, v]) => bar(k, v))}</div></div>
        <div><div className="tech-label" style={{ marginBottom: 8 }}>Coding linguistic terms</div><div style={{ display: "grid", gap: 8 }}>{Object.entries(m.coding ?? {}).map(([k, v]) => bar(k, v))}</div></div>
        <div><div className="tech-label" style={{ marginBottom: 8 }}>Communication terms</div><div style={{ display: "grid", gap: 8 }}>{Object.entries(m.communication ?? {}).map(([k, v]) => bar(k, v))}</div></div>
      </div>
      <div className="tech-label" style={{ margin: "18px 0 8px" }}>activated rules</div>
      <div style={{ display: "grid", gap: 8 }}>
        {result.fuzzy_explanation.activated_rules.map((r) => (
          <div key={r.rule_id} className="rule-chip mono">
            <span style={{ color: "var(--action)", fontWeight: 800 }}>{r.rule_id}</span>
            <span>IF {Object.entries(r.antecedent).map(([k, v]) => `${k.toUpperCase()}=${v}`).join(" ∧ ")} → {r.consequent}</span>
            <span>μ={r.firing_strength.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
