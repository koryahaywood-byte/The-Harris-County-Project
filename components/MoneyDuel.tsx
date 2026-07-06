"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fmt } from "@/lib/campaign-finance";
import type { MoneyRace, DuelSide, Mover } from "@/lib/money-races";
import type { RaceLean } from "@/lib/matchups-2026";
import { loadMovers } from "@/lib/money-races";

const D_COLOR = "#2563a8";
const R_COLOR = "#dc2626";

const LEAN_STYLE: Partial<Record<RaceLean, { label: string; bg: string; color: string }>> = {
  "safe-d":   { label: "Safe D",   bg: "#dbeafe", color: "#1d4ed8" },
  "likely-d": { label: "Likely D", bg: "#dbeafe", color: "#1d4ed8" },
  "lean-d":   { label: "Lean D",   bg: "#eff6ff", color: "#2563a8" },
  "toss-up":  { label: "Toss-up",  bg: "#fef3c7", color: "#b45309" },
  "lean-r":   { label: "Lean R",   bg: "#fef2f2", color: "#b91c1c" },
  "likely-r": { label: "Likely R", bg: "#fee2e2", color: "#b91c1c" },
  "safe-r":   { label: "Safe R",   bg: "#fee2e2", color: "#b91c1c" },
};

function SideName({ side, align }: { side: DuelSide; align: "left" | "right" }) {
  const color = side.party === "D" ? D_COLOR : R_COLOR;
  const justify = align === "left" ? "justify-start" : "justify-end";
  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${justify}`}>
      {side.slug ? (
        <Link href={`/politicians/${side.slug}`} className="text-xs font-bold hover:underline underline-offset-2" style={{ color }}>
          {side.name}
        </Link>
      ) : (
        <span className="text-xs font-bold" style={{ color }}>{side.name}</span>
      )}
      {side.incumbent && (
        <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Inc</span>
      )}
      {side.fin?.filingUrl && (
        <a href={side.fin.filingUrl} target="_blank" rel="noopener noreferrer"
          className="text-[9px] font-semibold hover:underline" style={{ color: "#9ca3af" }}
          aria-label={`${side.name} filing`}>
          filing ↗
        </a>
      )}
    </div>
  );
}

/** Burn rate line: only when the filing reports both raised and spent. */
function Burn({ side, align }: { side: DuelSide; align: "left" | "right" }) {
  const fin = side.fin;
  if (!fin || fin.raised == null || fin.spent == null || fin.raised <= 0) return <span />;
  const pct = Math.round((fin.spent / fin.raised) * 100);
  return (
    <span className={`text-[9px] ${align === "right" ? "text-right" : ""}`} style={{ color: "#9ca3af" }}>
      spent <strong style={{ color: "#6b7280" }}>{pct}%</strong> of raised · {fin.asOf}
    </span>
  );
}

function CashLabel({ side }: { side: DuelSide }) {
  const color = side.party === "D" ? D_COLOR : R_COLOR;
  if (!side.fin) {
    return <span className="text-[10px] font-semibold" style={{ color: "#9ca3af" }}>no filing on record</span>;
  }
  if (!(side.fin.cash > 0)) {
    return <span className="text-[10px] font-semibold" style={{ color: "#9ca3af" }}>cash pending · {side.fin.asOf}</span>;
  }
  return (
    <span className="tnum text-sm font-bold" style={{ color, fontFamily: "var(--font-playfair), serif" }}>
      {fmt(side.fin.cash)}
    </span>
  );
}

export default function MoneyDuel({ race }: { race: MoneyRace }) {
  const dCash = race.d.fin?.cash ?? 0;
  const rCash = race.r.fin?.cash ?? 0;
  const total = dCash + rCash;
  // Floor tiny slivers at 2% so both sides stay visible
  const dPct = total > 0 ? Math.min(Math.max((dCash / total) * 100, 2), 98) : 50;
  const lean = race.lean ? LEAN_STYLE[race.lean] : undefined;

  return (
    <div className="rounded-2xl bg-white ring-1 ring-black/8 px-5 py-4">
      <div className="flex items-baseline justify-between gap-3 mb-2.5">
        <p className="text-[11px] font-bold truncate" style={{ color: "#374151" }}>{race.office}</p>
        <div className="flex items-center gap-2 flex-shrink-0">
          {lean && (
            <span className="text-[9px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded-full"
              style={{ background: lean.bg, color: lean.color }}>
              {lean.label}
            </span>
          )}
          {race.totalCash > 0 && (
            <span className="tnum text-[10px] font-bold" style={{ color: "#6b7280" }}>{fmt(race.totalCash)} combined</span>
          )}
        </div>
      </div>

      <div className="flex items-start justify-between gap-3 mb-1.5">
        <SideName side={race.d} align="left" />
        <SideName side={race.r} align="right" />
      </div>

      <div className="h-3 rounded-full overflow-hidden flex" style={{ background: "#e5e7eb" }}>
        <div className="h-full transition-all duration-700" style={{ width: `${dPct}%`, background: D_COLOR }} />
        <div className="h-full flex-1 transition-all duration-700" style={{ background: R_COLOR }} />
      </div>

      <div className="flex items-baseline justify-between gap-3 mt-1">
        <CashLabel side={race.d} />
        <CashLabel side={race.r} />
      </div>

      <div className="flex items-baseline justify-between gap-3 mt-0.5">
        <Burn side={race.d} align="left" />
        <Burn side={race.r} align="right" />
      </div>
    </div>
  );
}

/* ── Movers strip ──────────────────────────────────────────────────────────
   Cash deltas between the two most recent finance-history snapshots.
   Renders nothing until at least two periods exist on file. */
export function MoversStrip() {
  const [movers, setMovers] = useState<Mover[]>([]);

  useEffect(() => {
    let alive = true;
    loadMovers(5)
      .then(m => { if (alive) setMovers(m); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  if (movers.length === 0) return null;

  return (
    <div className="rounded-2xl bg-white ring-1 ring-black/8 px-5 py-4 mb-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: "#9ca3af" }}>
        Biggest cash moves: {movers[0].fromPeriod} to {movers[0].toPeriod}
      </p>
      <div className="flex flex-wrap gap-3">
        {movers.map(m => {
          const up = m.delta > 0;
          return (
            <div key={m.name} className="rounded-xl px-3.5 py-2.5 ring-1 ring-black/5" style={{ background: "#fafafa" }}>
              <div className="flex items-center gap-1.5">
                <span aria-hidden className="text-[11px] font-bold" style={{ color: up ? "#059669" : "#dc2626" }}>
                  {up ? "▲" : "▼"}
                </span>
                <span className="tnum text-sm font-bold" style={{ color: up ? "#059669" : "#dc2626" }}>
                  {up ? "+" : "-"}{fmt(Math.abs(m.delta))}
                </span>
              </div>
              <p className="text-[11px] font-semibold mt-0.5" style={{ color: "#374151" }}>{m.name}</p>
              <p className="tnum text-[9px]" style={{ color: "#9ca3af" }}>{fmt(m.prevCash)} → {fmt(m.currCash)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
