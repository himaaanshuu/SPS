import { useTheme } from "../theme/ThemeContext";

export default function Settings() {
  const { theme, toggle } = useTheme();
  const base = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:8000";
  return (
    <div className="page">
      <div className="kicker-row rise"><span className="kicker-rule" /><span className="tech-label">settings</span></div>
      <h1 className="display rise rise-1" style={{ fontSize: "clamp(30px,4vw,48px)", margin: "0 0 6px" }}>Settings</h1>
      <div className="grid-2 rise rise-2" style={{ marginTop: 20 }}>
        <section className="panel panel-pad">
          <h2 className="display" style={{ marginTop: 0 }}>Appearance</h2>
          <p style={{ color: "var(--ink-2)", fontSize: 14 }}>Light is a premium education product; dark is an AI research lab. Two distinct systems, not an inverted palette.</p>
          <button className="btn btn-ghost" onClick={toggle}>Switch to {theme === "light" ? "dark lab" : "light product"} mode</button>
          <p className="mono" style={{ fontSize: 12, color: "var(--ink-3)" }}>CURRENT: {theme.toUpperCase()} · SAVED TO LOCALSTORAGE · RESPECTS SYSTEM ON FIRST VISIT</p>
        </section>
        <section className="panel panel-pad">
          <h2 className="display" style={{ marginTop: 0 }}>Backend</h2>
          <p style={{ color: "var(--ink-2)", fontSize: 14 }}>API base URL comes from <span className="mono">VITE_API_BASE_URL</span> — never hardcoded.</p>
          <p className="mono" style={{ fontSize: 12, border: "1px solid var(--line)", padding: 10, borderRadius: 4 }}>{base}</p>
          <button className="btn btn-ghost btn-sm" onClick={() => { localStorage.removeItem("placeintel-last-result"); localStorage.removeItem("placeintel-profile"); location.reload(); }}>Reset local demo state</button>
        </section>
      </div>
    </div>
  );
}
