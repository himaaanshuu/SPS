import { useEffect, useRef, useState } from "react";
import { CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";

export function useCountUp(target: number, duration = 1100) {
  const [val, setVal] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { setVal(target); return; }
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / duration);
      setVal(target * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return val;
}

export function StatusChip({ status }: { status: string }) {
  const cls = status === "LIKELY TO BE PLACED" ? "chip-ok" : status === "BORDERLINE" ? "chip-warn" : "chip-bad";
  return <span className={`chip ${cls}`}><span className="dot" />{status}</span>;
}

export function SignalBar({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
        <span style={{ fontWeight: 650 }}>{label}</span>
        <span className="mono" style={{ color: "var(--ink-2)" }}>{value.toFixed(0)} / 100{hint ? ` · ${hint}` : ""}</span>
      </div>
      <div className="meter"><i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>
    </div>
  );
}

export function Empty({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="empty rise">
      <div className="tech-label" style={{ marginBottom: 8 }}>— EMPTY STATE —</div>
      <h3 className="display" style={{ margin: "0 0 8px" }}>{title}</h3>
      <p style={{ margin: "0 0 16px" }}>{body}</p>
      {action}
    </div>
  );
}

export function BulletList({ items, tone }: { items: string[]; tone: "good" | "warn" | "action" }) {
  const Icon = tone === "good" ? CheckCircle2 : tone === "warn" ? AlertTriangle : ArrowRight;
  return (
    <ul className="rule-list">
      {items.map((t, i) => (
        <li key={i}><Icon size={16} />{t}</li>
      ))}
    </ul>
  );
}

const KEY = "placeintel-last-result";
const PKEY = "placeintel-profile";
export const store = {
  saveResult(r: unknown) { localStorage.setItem(KEY, JSON.stringify(r)); },
  loadResult<T>(): T | null { try { const v = localStorage.getItem(KEY); return v ? (JSON.parse(v) as T) : null; } catch { return null; } },
  saveProfile(p: unknown) { localStorage.setItem(PKEY, JSON.stringify(p)); },
  loadProfile<T>(fallback: T): T { try { const v = localStorage.getItem(PKEY); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; } },
};
