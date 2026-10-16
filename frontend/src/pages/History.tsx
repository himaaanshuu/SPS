import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { api } from "../services/api";
import { Empty, StatusChip } from "../components/ui";

export default function History() {
  const nav = useNavigate();
  const [rows, setRows] = useState<Array<Record<string, unknown>> | null>(null);
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    api.history().then((d) => setRows(d.predictions)).catch(() => { setOffline(true); setRows([]); });
  }, []);

  return (
    <div className="page">
      <div className="kicker-row rise"><span className="kicker-rule" /><span className="tech-label">prediction history</span></div>
      <h1 className="display rise rise-1" style={{ fontSize: "clamp(30px,4vw,48px)", margin: "0 0 6px" }}>History</h1>
      {rows === null ? <div className="skel" style={{ height: 200, marginTop: 20 }} /> :
        rows.length === 0 ? (
          <div style={{ marginTop: 20 }}>
            <Empty title={offline ? "History lives in the backend." : "No predictions yet."}
              body={offline ? "Connect the FastAPI server to persist and review past analyses. Your latest result is still on this device." : "Run your first placement analysis to start building a trajectory."}
              action={<button className="btn btn-primary" onClick={() => nav("/predict")}>Run placement analysis <ArrowRight size={15} /></button>} />
          </div>
        ) : (
          <section className="panel panel-pad rise rise-2" style={{ marginTop: 20 }}>
            <div style={{ overflowX: "auto" }}>
              <table className="tbl">
                <thead><tr><th>When</th><th>Student</th><th>CGPA</th><th>Probability</th><th>Readiness</th><th>Status</th></tr></thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <td className="mono" style={{ fontSize: 12 }}>{String(r.created_at ?? "—")}</td>
                      <td className="mono">{String(r.student_id ?? "—")}</td>
                      <td className="mono">{String(r.cgpa ?? "—")}</td>
                      <td style={{ fontWeight: 700 }}>{Number(r.probability).toFixed(1)}%</td>
                      <td className="mono">{Number(r.readiness).toFixed(0)}/100</td>
                      <td><StatusChip status={String(r.status) as "LIKELY TO BE PLACED"} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
    </div>
  );
}
