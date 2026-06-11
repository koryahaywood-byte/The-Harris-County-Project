"use client";

// The Terrain Report — the AI/statistical signals feed.
// Reads public/data/terrain-report.json (built by scripts/detect-anomalies.mjs
// after every pipeline run). Every signal shows its sources and confidence
// inline and is framed as a signal to chase, never a conclusion.
// Full feed on the homepage; filtered by type on tool pages.

import { useEffect, useState } from "react";
import Link from "next/link";
import FieldNotes from "@/components/FieldNotes";

const NAVY = "#1a3a5c";
const MUTED = "#9ca3af";

export interface Signal {
  id: string;
  type: "turnout" | "money" | "legislation";
  severity: "high" | "significant" | "notable";
  headline: string;
  body: string;
  sources: string[];
  confidence: "high" | "medium" | "low";
  confidenceNote: string;
  links: { label: string; href: string }[];
  entities?: Record<string, string[]>;
}

interface Thread { id: string; title: string; signalIds: string[]; entities: Record<string, string[]>; note: string }
interface Report { generatedAt: string; framing: string; signals: Signal[]; threads?: Thread[] }

let cache: Promise<Report> | null = null;
function loadReport(): Promise<Report> {
  if (!cache) cache = fetch("/data/terrain-report.json").then(r => r.json());
  return cache;
}

const SEV: Record<string, { color: string; label: string }> = {
  high:        { color: "#dc2626", label: "High" },
  significant: { color: "#d97706", label: "Significant" },
  notable:     { color: "#2563a8", label: "Notable" },
};
const TYPE_LABEL: Record<string, string> = { turnout: "Turnout", money: "Money", legislation: "Legislation" };
const CONF: Record<string, string> = { high: "#15803d", medium: "#b45309", low: "#b91c1c" };

function SignalCard({ s }: { s: Signal }) {
  const [open, setOpen] = useState(false);
  const sev = SEV[s.severity];
  return (
    <div className="hcp-card topo-light p-4 md:p-5">
      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
        <span className="w-1.5 h-1.5 rounded-full alive-pulse" style={{ background: sev.color }} />
        <span className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: sev.color }}>{sev.label} · {TYPE_LABEL[s.type]}</span>
        <button onClick={() => setOpen(o => !o)}
          className="ml-auto text-[9px] font-bold uppercase tracking-[0.14em] px-2 py-0.5 rounded-full"
          style={{ background: `${CONF[s.confidence]}14`, color: CONF[s.confidence] }}>
          {s.confidence} confidence {open ? "▴" : "▾"}
        </button>
      </div>
      <p className="font-bold text-[15px] leading-snug mb-1.5" style={{ color: NAVY, fontFamily: "var(--font-playfair,serif)" }}>
        {s.headline}
      </p>
      <p className="text-xs leading-relaxed" style={{ color: "#374151" }}>{s.body}</p>
      {open && (
        <div className="mt-2.5 rounded-xl px-3 py-2.5" style={{ background: "#1a3a5c08" }}>
          <p className="text-[10px] leading-relaxed" style={{ color: "#374151" }}>
            <strong>Sources:</strong> {s.sources.join(" · ")}
          </p>
          <p className="text-[10px] leading-relaxed mt-1" style={{ color: "#6b7280" }}>{s.confidenceNote}</p>
        </div>
      )}
      <div className="flex items-center gap-3 mt-2.5">
        {s.links.map(l => (
          <Link key={l.href} href={l.href} className="text-[11px] font-bold underline" style={{ color: "#2563a8" }}>
            {l.label} →
          </Link>
        ))}
      </div>
      <FieldNotes target={`signal:${s.id}`} />
    </div>
  );
}

export default function TerrainReport({ types, limit, compact = false }: {
  types?: Signal["type"][];   // filter for tool pages
  limit?: number;
  compact?: boolean;
}) {
  const [report, setReport] = useState<Report | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => { loadReport().then(setReport).catch(() => setErr(true)); }, []);

  if (err || (report && !report.signals.length)) return null;
  if (!report) return <div className="skeleton h-32 rounded-[1.35rem]" />;

  const signals = report.signals
    .filter(s => !types || types.includes(s.type))
    .slice(0, limit ?? report.signals.length);
  if (!signals.length) return null;

  return (
    <section>
      <div className="flex items-baseline justify-between mb-4 flex-wrap gap-1">
        <div className="flex items-center gap-2.5">
          {/* contour mark */}
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
            <circle cx="11" cy="11" r="3" stroke={NAVY} strokeWidth="1.3" />
            <circle cx="11" cy="11" r="6.5" stroke={NAVY} strokeWidth="1" opacity="0.55" />
            <circle cx="11" cy="11" r="10" stroke={NAVY} strokeWidth="0.8" opacity="0.3" />
          </svg>
          <h2 className="text-xl font-bold" style={{ color: NAVY, fontFamily: "var(--font-playfair,serif)" }}>
            The Terrain Report
          </h2>
        </div>
        <p className="text-[10px]" style={{ color: MUTED }}>
          Signals, not conclusions · scanned {new Date(report.generatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </p>
      </div>
      {!compact && (
        <p className="text-xs leading-relaxed mb-4 max-w-2xl" style={{ color: "#6b7280" }}>
          Automated statistical screens across every data pipe — turnout shifts, money movement,
          legislative motion. Each signal shows exactly what it&apos;s built on and how much to trust it.
          The judgment is yours.
        </p>
      )}
      <div className="grid md:grid-cols-2 gap-3.5">
        {signals.map(s => <SignalCard key={s.id} s={s} />)}
      </div>
      {!compact && (report.threads?.length ?? 0) > 0 && (
        <div className="mt-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: MUTED }}>Story Threads · auto-clustered</p>
          <div className="space-y-2.5">
            {report.threads!.map(th => (
              <div key={th.id} className="hcp-card topo-light p-4">
                <p className="text-sm font-bold" style={{ color: NAVY, fontFamily: "var(--font-playfair,serif)" }}>{th.title}</p>
                <p className="text-[11px] mt-1" style={{ color: "#374151" }}>
                  {Object.entries(th.entities).map(([k, v]) => `${k}: ${v.slice(0, 5).join(", ")}`).join(" · ")}
                </p>
                <p className="text-[10px] mt-1" style={{ color: MUTED }}>{th.note}</p>
                <FieldNotes target={`thread:${th.id}`} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
