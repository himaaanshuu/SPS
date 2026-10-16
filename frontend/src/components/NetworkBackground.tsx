import { useEffect, useRef } from "react";
import { useTheme } from "../theme/ThemeContext";

/** "Placement Intelligence Network" — subtle canvas of nodes, links, ticks, pulses.
 *  Respects prefers-reduced-motion; pauses offscreen; cursor-reactive drift. */
export default function NetworkBackground() {
  const ref = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let w = 0, h = 0;
    const mouse = { x: -9999, y: -9999 };
    interface N { x: number; y: number; vx: number; vy: number; r: number; pulse: number; label?: string }
    let nodes: N[] = [];

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      const count = Math.min(90, Math.floor((w * h) / 22000));
      nodes = Array.from({ length: count }, (_, i) => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.22,
        r: 1 + Math.random() * 1.8, pulse: Math.random() * Math.PI * 2,
        label: i % 9 === 0 ? String(Math.floor(40 + Math.random() * 59)) : undefined,
      }));
    };
    resize();
    window.addEventListener("resize", resize);
    const onMove = (e: PointerEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    window.addEventListener("pointermove", onMove);

    const dark = () => document.documentElement.dataset.theme === "dark";
    let t = 0;
    const frame = () => {
      t += 0.008;
      ctx.clearRect(0, 0, w, h);
      const isDark = dark();
      // faint grid
      ctx.strokeStyle = isDark ? "rgba(90,140,255,0.055)" : "rgba(29,78,216,0.06)";
      ctx.lineWidth = 1;
      const step = 56;
      ctx.beginPath();
      for (let x = (t * 8) % step; x < w; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
      for (let y = 0; y < h; y += step) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
      ctx.stroke();

      // links
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < 150) {
            ctx.strokeStyle = isDark ? `rgba(90,200,250,${0.10 * (1 - d / 150)})` : `rgba(29,78,216,${0.10 * (1 - d / 150)})`;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      // nodes
      for (const n of nodes) {
        if (!reduced) {
          n.x += n.vx; n.y += n.vy;
          const dx = n.x - mouse.x, dy = n.y - mouse.y;
          const d = Math.hypot(dx, dy);
          if (d < 140 && d > 1) { n.x += (dx / d) * 0.5; n.y += (dy / d) * 0.5; }
          if (n.x < 0 || n.x > w) n.vx *= -1;
          if (n.y < 0 || n.y > h) n.vy *= -1;
          n.pulse += 0.02;
        }
        const glow = 0.35 + 0.3 * Math.sin(n.pulse);
        ctx.fillStyle = isDark ? `rgba(90,200,250,${0.28 + glow * 0.3})` : `rgba(29,78,216,${0.22 + glow * 0.25})`;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
        if (n.label) {
          ctx.fillStyle = isDark ? "rgba(150,190,255,0.35)" : "rgba(29,78,216,0.30)";
          ctx.font = "9px ui-monospace, monospace";
          ctx.fillText(n.label, n.x + 7, n.y - 6);
        }
      }
      if (!reduced) raf = requestAnimationFrame(frame);
    };
    frame();
    void theme;
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); window.removeEventListener("pointermove", onMove); };
  }, [theme]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.9 }}
    />
  );
}
