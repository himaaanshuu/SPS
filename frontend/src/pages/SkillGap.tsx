import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { store, Empty, BulletList } from "../components/ui";
import { DEFAULT_PROFILE, type PredictResult } from "../types";

const TARGETS: { key: string; label: string; target: number; get: (p: typeof DEFAULT_PROFILE) => number; plan: string }[] = [
  { key: "dsa", label: "DSA", target: 80, get: (p) => p.dsa_proficiency, plan: "45 min/day patterns: arrays → trees → DP. 3 timed problems weekly." },
  { key: "coding", label: "Coding", target: 80, get: (p) => p.coding_score, plan: "Ship one feature per week; keep a judge streak of 3 solves/week." },
  { key: "comm", label: "Communication", target: 80, get: (p) => p.communication, plan: "2 mock interviews/week, recorded. Explain one project aloud daily." },
  { key: "apt", label: "Aptitude", target: 80, get: (p) => Math.round((p.quant_aptitude + p.logical_reasoning) / 2), plan: "Weekly timed test: 20 quant + 20 logical in 45 minutes." },
  { key: "interview", label: "Interview readiness", target: 80, get: (p) => p.interview_readiness, plan: "STAR stories for 2 projects + 1 internship; resume deep-dive drills." },
];

export default function SkillGap() {
  const nav = useNavigate();
  const profile = store.loadProfile(DEFAULT_PROFILE);
  const result = store.loadResult<PredictResult>();
  if (!result) return (
    <div className="page">
      <div className="kicker-row"><span className="kicker-rule" /><span className="tech-label">skill gap analysis</span></div>
      <h1 className="display" style={{ fontSize: 40 }}>Skill Gaps</h1>
      <Empty title="No prediction yet." body="Run your first placement analysis to compute current vs target skill levels."
        action={<button className="btn btn-primary" onClick={() => nav("/predict")}>Run analysis <ArrowRight size={15} /></button>} />
    </div>
  );
  const gaps = TARGETS.map((t) => {
    const cur = t.get(profile);
    return { ...t, cur, gap: Math.max(0, t.target - cur), strong: cur >= t.target };
  });
  const limiting = gaps.filter((g) => !g.strong).sort((a, b) => b.gap - a.gap).slice(0, 2);

  return (
    <div className="page">
      <div className="kicker-row rise"><span className="kicker-rule" /><span className="tech-label">skill gap · current vs target</span></div>
      <h1 className="display rise rise-1" style={{ fontSize: "clamp(30px,4vw,48px)", margin: "0 0 6px" }}>Skill Gaps</h1>
      <p className="rise rise-1" style={{ color: "var(--ink-2)" }}>
        {limiting.length ? `${limiting.map((l) => l.label).join(" and ")} ${limiting.length > 1 ? "are" : "is"} currently limiting your predicted probability.` : "All tracked skills meet target. Push coding depth for top-tier roles."}
      </p>
      <section className="panel panel-pad rise rise-2" style={{ marginTop: 20 }}>
        <div style={{ display: "grid", gap: 18 }}>
          {gaps.map((g) => (
            <div key={g.key}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
                <strong>{g.label}</strong>
                <span className="mono" style={{ color: "var(--ink-2)" }}>
                  CURRENT {g.cur} · TARGET {g.target} · {g.strong ? <span style={{ color: "var(--action)", fontWeight: 800 }}>STRONG ✓</span> : `GAP ${g.gap}`}
                </span>
              </div>
              <div style={{ position: "relative" }}>
                <div className="meter"><i style={{ width: `${(g.cur / 100) * 100}%` }} /></div>
                <div title={`Target ${g.target}`} style={{ position: "absolute", top: -4, bottom: -4, left: `${g.target}%`, width: 2, background: "var(--ink)" }} />
              </div>
              <div style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 6 }}>{g.plan}</div>
            </div>
          ))}
        </div>
      </section>
      <section className="panel panel-pad rise rise-3" style={{ marginTop: 20 }}>
        <h2 className="display" style={{ marginTop: 0 }}>Sequenced 4-week plan</h2>
        <BulletList tone="action" items={[
          "Week 1 — close the biggest gap: DSA patterns daily + 1 mock interview.",
          "Week 2 — ship project milestone with a live deployment link.",
          "Week 3 — two timed aptitude tests; review every error in a log.",
          "Week 4 — re-run placement analysis and compare trajectory.",
        ]} />
        <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => nav("/predict")}>Re-run analysis <ArrowRight size={15} /></button>
      </section>
    </div>
  );
}
