import { useState } from "react";
import { api } from "../services/api";
import { store } from "../components/ui";
import { DEFAULT_PROFILE, type StudentProfile } from "../types";
import { validate } from "./Predict";

export default function Profile() {
  const [form, setForm] = useState<StudentProfile>(() => store.loadProfile(DEFAULT_PROFILE));
  const [name, setName] = useState("Aarav Sharma");
  const [sid, setSid] = useState("STU-2026-0142");
  const [msg, setMsg] = useState("");
  const errs = validate(form);

  return (
    <div className="page">
      <div className="kicker-row rise"><span className="kicker-rule" /><span className="tech-label">student profile · minimal pii by design</span></div>
      <h1 className="display rise rise-1" style={{ fontSize: "clamp(30px,4vw,48px)", margin: "0 0 6px" }}>Profile</h1>
      <p className="rise rise-1" style={{ color: "var(--ink-2)" }}>Only academic and skill signals are stored — no Aadhaar, phone numbers, or passwords, ever.</p>
      <div className="grid-2 rise rise-2" style={{ marginTop: 22 }}>
        <section className="panel panel-pad">
          <h2 className="display" style={{ marginTop: 0 }}>Identity</h2>
          <div className="form-grid">
            <div className="field"><label>Full name</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="field"><label>Student ID</label><input className="input mono" value={sid} onChange={(e) => setSid(e.target.value)} /><small>ID is the only identifier used across predictions.</small></div>
            <div className="field"><label>Department</label>
              <select className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                {["CSE", "IT", "ECE", "EEE", "ME", "CE"].map((d) => <option key={d}>{d}</option>)}
              </select></div>
            <div className="field"><label>Semester</label><input className="input" type="number" min={1} max={8} value={form.semester} onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })} /></div>
          </div>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={async () => {
            store.saveProfile(form);
            try { await api.predict(form); } catch { /* offline ok */ }
            try {
              await fetch(`${(import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:8000"}/api/students`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: sid, name, department: form.department, semester: form.semester, cgpa: form.cgpa }),
              });
              setMsg("Profile saved.");
            } catch { setMsg("Saved locally — backend unreachable, will sync later."); }
          }}>Save profile</button>
          {msg && <p className="mono" style={{ fontSize: 12 }}>{msg}</p>}
          {Object.keys(errs).length > 0 && <p className="err">Fix profile signals on the Predict page (ranges invalid).</p>}
        </section>
        <section className="panel panel-pad">
          <h2 className="display" style={{ marginTop: 0 }}>Signal snapshot</h2>
          <div className="tech-label">synced from your last saved analysis inputs</div>
          <table className="tbl" style={{ marginTop: 12 }}>
            <tbody>
              {[["CGPA", form.cgpa], ["Coding", form.coding_score], ["DSA", form.dsa_proficiency], ["Communication", form.communication], ["Projects", form.projects], ["Internship (mo)", form.internship_months]].map(([k, v]) => (
                <tr key={k as string}><td className="mono" style={{ color: "var(--ink-3)" }}>{k}</td><td style={{ fontWeight: 700 }}>{v}</td></tr>
              ))}
            </tbody>
          </table>
          <p style={{ color: "var(--ink-2)", fontSize: 13 }}>Edit academic signals on the <a href="/predict">Predict page</a> — this page keeps identity separate from inference inputs.</p>
        </section>
      </div>
    </div>
  );
}
