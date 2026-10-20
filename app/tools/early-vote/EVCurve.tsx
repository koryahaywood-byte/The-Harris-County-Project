"use client";

import { useState } from "react";

type Point = { day: number; date: string; v26: number | null; v22: number };

const W = 640, H = 260, PAD = { l: 52, r: 74, t: 14, b: 30 };
const C26 = "#0B6A4A", C22 = "#9AA19C";

/** Cumulative ballots by early-voting day, this year against the 2022 midterm. */
export default function EVCurve({ points }: { points: Point[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const days = points.length;
  const max = Math.max(...points.map(p => Math.max(p.v22, p.v26 ?? 0))) * 1.08;
  const step = max > 600000 ? 200000 : max > 300000 ? 100000 : 50000;
  const ticks = Array.from({ length: Math.floor(max / step) + 1 }, (_, i) => i * step);
  const x = (d: number) => PAD.l + ((d - 1) / (days - 1)) * (W - PAD.l - PAD.r);
  const y = (v: number) => H - PAD.b - (v / max) * (H - PAD.t - PAD.b);
  const path = (vals: (number | null)[]) => vals.map((v, i) => (v == null ? "" : `${i === 0 || vals[i - 1] == null ? "M" : "L"}${x(i + 1).toFixed(1)},${y(v).toFixed(1)}`)).join("");
  const last26 = [...points].reverse().find(p => p.v26 != null);
  const k = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : `${Math.round(n / 1000)}K`);
  const h = hover != null ? points[hover] : null;

  return (
    <div className="relative">
      <div className="flex gap-4 text-[12.5px] mb-2" style={{ color: "var(--ink-2)" }}>
        <span className="inline-flex items-center gap-1.5"><span className="w-4 h-[2px]" style={{ background: C26 }} aria-hidden />2026</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-4 h-[2px]" style={{ background: C22 }} aria-hidden />2022 midterm</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img"
        aria-label={`Cumulative early ballots by day. ${last26 ? `2026 day ${last26.day}: ${last26.v26?.toLocaleString()}.` : ""} 2022 final early total: ${points[days - 1].v22.toLocaleString()}.`}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const px = ((e.clientX - r.left) / r.width) * W;
          const d = Math.round(((px - PAD.l) / (W - PAD.l - PAD.r)) * (days - 1));
          setHover(Math.min(days - 1, Math.max(0, d)));
        }}>
        {ticks.map(t => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="#E4E6E0" strokeWidth={1} />
            <text x={PAD.l - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="#7C837E" className="num">{t === 0 ? "0" : k(t)}</text>
          </g>
        ))}
        {points.map(p => (
          <text key={p.day} x={x(p.day)} y={H - 10} textAnchor="middle" fontSize={11} fill="#7C837E" className="num">{p.day}</text>
        ))}
        <path d={path(points.map(p => p.v22))} fill="none" stroke={C22} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        <path d={path(points.map(p => p.v26))} fill="none" stroke={C26} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {points.map(p => p.v26 != null && (
          <circle key={p.day} cx={x(p.day)} cy={y(p.v26)} r={4.5} fill={C26} stroke="#fff" strokeWidth={2} />
        ))}
        {/* End labels: text in ink, identity from the line beside it */}
        <text x={W - PAD.r + 8} y={y(points[days - 1].v22) + 4} fontSize={11.5} fill="#5B635E" className="num">2022: {k(points[days - 1].v22)}</text>
        {last26 && (
          <text x={x(last26.day) + 9} y={y(last26.v26!) - 8} fontSize={12} fontWeight={700} fill="#121714" className="num">{last26.v26!.toLocaleString()}</text>
        )}
        {h && (
          <g pointerEvents="none">
            <line x1={x(h.day)} x2={x(h.day)} y1={PAD.t} y2={H - PAD.b} stroke="#BFC2BA" strokeWidth={1} />
            <circle cx={x(h.day)} cy={y(h.v22)} r={4} fill={C22} stroke="#fff" strokeWidth={2} />
          </g>
        )}
        <rect x={PAD.l} y={PAD.t} width={W - PAD.l - PAD.r} height={H - PAD.t - PAD.b} fill="transparent" />
      </svg>
      <p className="text-[11.5px] -mt-1 text-center" style={{ color: "#7C837E" }}>Day of early voting</p>
      {h && (
        <div className="absolute top-8 rounded-md px-3 py-2 text-[12.5px] num pointer-events-none"
          style={{ left: `${Math.min(70, (x(h.day) / W) * 100)}%`, background: "#fff", boxShadow: "0 0 0 1px var(--rule), 0 6px 18px rgba(18,23,20,0.12)", color: "var(--ink)" }}>
          <p className="label mb-1" style={{ color: "#6B726D", fontSize: 10 }}>Day {h.day} · {h.date}</p>
          <p><span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: C26 }} />2026: <b>{h.v26 != null ? h.v26.toLocaleString() : "not yet"}</b></p>
          <p><span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: C22 }} />2022: <b>{h.v22.toLocaleString()}</b></p>
        </div>
      )}
    </div>
  );
}
