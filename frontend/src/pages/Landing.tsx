import { useNavigate } from "react-router-dom";
import { ArrowRight, Hexagon, BrainCircuit, GitBranch, ShieldCheck } from "lucide-react";
import { ThemeSwitch } from "../components/Layout";
import { useCountUp } from "../components/ui";
import "./Landing.css";

function HeroConsole() {
  const prob = useCountUp(84.7, 1400);
  const ready = useCountUp(82, 1400);
  const signals = [
    { k: "ACADEMIC", v: 88 }, { k: "TECHNICAL", v: 76 }, { k: "APTITUDE", v: 84 },
    { k: "COMM", v: 71 }, { k: "EXPERIENCE", v: 79 },
  ];
  return (
    <div className="console rise rise-2" aria-label="Live prediction preview">
      <div className="console-top">
        <span className="tech-label">neuro-fuzzy inference · live</span>
        <span className="chip chip-ok"><span className="dot" />HIGH CONFIDENCE</span>
      </div>
      <div className="console-grid">
        <div>
          <div className="tech-label">placement probability</div>
          <div className="metric-xl">{prob.toFixed(1)}<span style={{ fontSize: "0.4em" }}>%</span></div>
          <div className="tech-label" style={{ color: "var(--action)", marginTop: 6 }}>▲ +3.2 pts this term</div>
        </div>
        <div className="console-readiness">
          <div className="tech-label">readiness index</div>
          <div className="metric-lg">{ready.toFixed(0)} <span style={{ fontSize: 15, color: "var(--ink-3)" }}>/ 100</span></div>
          <div className="meter"><i style={{ width: "82%" }} /></div>
          <div className="tech-label" style={{ marginTop: 12 }}>feature signals</div>
          {signals.map((s) => (
            <div key={s.k} className="sig-row">
              <span className="mono">{s.k}</span>
              <div className="meter slim"><i style={{ width: `${s.v}%` }} /></div>
              <span className="mono">{s.v}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="console-foot mono">
        <span>R1 CGPA=HIGH ∧ CODING=STRONG → VERY HIGH · μ=0.81</span>
        <span className="blink">●</span>
      </div>
    </div>
  );
}

export default function Landing() {
  const nav = useNavigate();
  return (
    <div className="page page-hero landing">
      <header className="landing-top rise">
        <span className="brandmark"><Hexagon size={20} /> PLACE<em>INTEL</em></span>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <ThemeSwitch />
          <button className="btn btn-ghost btn-sm" onClick={() => nav("/dashboard")}>Open app</button>
        </div>
      </header>

      <div className="kicker-row rise"><span className="kicker-rule" /><span className="tech-label">soft computing · b.tech project · neuro-fuzzy system</span></div>
      <h1 className="hero-title rise rise-1">Know Your<br />Placement<br />Readiness.</h1>
      <div className="hero-split">
        <div>
          <p className="hero-sub rise rise-2">
            An intelligent placement prediction system powered by soft computing,
            machine learning, and student performance analytics.
          </p>
          <div className="cta-row rise rise-3">
            <button className="btn btn-primary" onClick={() => nav("/predict")}>Check My Readiness <ArrowRight size={16} /></button>
            <button className="btn btn-ghost" onClick={() => nav("/model")}>Explore Model</button>
          </div>
          <div className="proof-row mono rise rise-3">
            <span>5 MODELS COMPARED</span><span>·</span><span>12 FUZZY RULES</span><span>·</span><span>15 SIGNALS</span>
          </div>
        </div>
        <HeroConsole />
      </div>

      <div className="strip rise rise-3">
        {[
          { icon: BrainCircuit, t: "Neuro-fuzzy core", d: "Neural prediction fused with interpretable fuzzy rules — accuracy you can audit." },
          { icon: GitBranch, t: "Skill-gap engine", d: "Current vs target levels per skill with concrete, sequenced actions." },
          { icon: ShieldCheck, t: "Honest metrics", d: "No fabricated accuracy. Untrained models say so; demo data is labeled synthetic." },
        ].map(({ icon: Icon, t, d }) => (
          <div key={t} className="strip-card">
            <Icon size={20} />
            <h3 className="display">{t}</h3>
            <p>{d}</p>
          </div>
        ))}
      </div>

      <footer className="landing-foot mono">
        <span>STUDENT PLACEMENT PREDICTION SYSTEM USING NEURO-FUZZY SOFT COMPUTING</span>
        <span>DEPT. OF COMPUTER SCIENCE · 2026</span>
      </footer>
    </div>
  );
}
