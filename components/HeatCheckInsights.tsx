"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import crosswalkRaw from "@/lib/precinct-crosswalk.json";

/* Insight rail for Heat Check: four ranked lists computed from the precinct
   sweep API (D share by cycle + 2024 registration) and precinct-history.json
   (raw presidential vote totals). Renders nothing until real data arrives;
   any list whose inputs are missing is omitted entirely. */

// ── Types ─────────────────────────────────────────────────────────────────────
interface InsightRace { label: string; candidates: { name: string; party: string }[]; votes: Record<string, number[]> }
export interface InsightHistory { cycles: Record<string, { label: string; races?: Record<string, InsightRace> }> }

interface SweepRow {
  precinct: string;
  avgDPct: number;
  dPct2020: number | null;
  dPct2024: number | null;
  reg2024: number | null;
}

interface RowItem { prec: string; primary: string; primaryColor: string; sub: string }

// ── Constants ─────────────────────────────────────────────────────────────────
const CROSSWALK = (crosswalkRaw as { precincts: Record<string, { hd?: string }> }).precincts;
const REG_FLOOR = 500;   // shift lists skip micro-precincts: tiny denominators produce meaningless deltas
const VOTE_FLOOR = 200;  // turnout list needs a real 2020 base to measure a drop against

function hdFor(prec: string): string | undefined {
  return (CROSSWALK[prec] ?? CROSSWALK[prec.replace(/^0+/, "") || "0"] ?? CROSSWALK[prec.padStart(4, "0")])?.hd;
}

/* Largest threshold that still has at least one qualifying precinct, so
   headlines stay factual ("12 shifted 10+ points") instead of hardcoded. */
function pickThreshold(count: (t: number) => number, thresholds: number[]): { t: number; n: number } | null {
  for (const t of thresholds) {
    const n = count(t);
    if (n > 0) return { t, n };
  }
  return null;
}

// ── Card ──────────────────────────────────────────────────────────────────────
function InsightCard({ kicker, headline, rows }: { kicker: string; headline: string; rows: RowItem[] }) {
  if (!rows.length) return null;
  return (
    <div className="rounded-2xl bg-white ring-1 ring-black/8 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "#9ca3af" }}>{kicker}</p>
      <p className="text-[13px] font-bold mt-0.5 mb-1.5 leading-snug" style={{ color: "#111827" }}>{headline}</p>
      <ul>
        {rows.map(r => {
          const hd = hdFor(r.prec);
          return (
            <li key={r.prec} className="flex items-center justify-between gap-2 py-1.5"
              style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
              <div className="flex items-baseline gap-2 min-w-0">
                <Link href={`/tools/precinct-lookup?p=${r.prec}`}
                  className="text-[12px] font-bold tabular-nums hover:underline"
                  style={{ color: "#1a3a5c" }}>
                  {r.prec}
                </Link>
                {hd && (
                  <Link href={`/tools/districts?type=hd&district=${hd}`}
                    className="text-[9px] font-semibold whitespace-nowrap hover:opacity-75"
                    style={{ color: "#7aaee8" }}>
                    HD {hd} →
                  </Link>
                )}
              </div>
              <div className="text-right shrink-0">
                <span className="block text-[12px] font-bold tabular-nums" style={{ color: r.primaryColor }}>{r.primary}</span>
                <span className="text-[9px] tabular-nums" style={{ color: "#9ca3af" }}>{r.sub}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function HeatCheckInsights({ history }: { history: InsightHistory | null }) {
  const [sweep, setSweep] = useState<SweepRow[] | null>(null);

  useEffect(() => {
    fetch("/api/districts/precinct-sweep")
      .then(r => { if (!r.ok) throw new Error(`precinct-sweep → ${r.status}`); return r.json(); })
      .then((j: { precincts?: SweepRow[] }) => setSweep(Array.isArray(j?.precincts) ? j.precincts : []))
      .catch(err => { console.error("[HeatCheckInsights] sweep failed:", err); setSweep([]); });
  }, []);

  // Presidential D-share shift per precinct, 2020 → 2024 (two-party pts)
  const shifts = useMemo(() => {
    if (!sweep) return [];
    return sweep
      .filter(r => r.dPct2020 != null && r.dPct2024 != null && (r.reg2024 ?? 0) >= REG_FLOOR)
      .map(r => ({ prec: r.precinct, delta: (r.dPct2024 as number) - (r.dPct2020 as number), reg: r.reg2024 as number }));
  }, [sweep]);

  const blueTop = useMemo(() =>
    [...shifts].filter(s => s.delta > 0).sort((a, b) => b.delta - a.delta).slice(0, 5), [shifts]);
  const redTop = useMemo(() =>
    [...shifts].filter(s => s.delta < 0).sort((a, b) => a.delta - b.delta).slice(0, 5), [shifts]);

  // Raw presidential vote totals per precinct, 2020G vs 2024G
  const turnout = useMemo(() => {
    const r20 = history?.cycles["2020G"]?.races?.["president"];
    const r24 = history?.cycles["2024G"]?.races?.["president"];
    if (!r20 || !r24) return null;
    const sum = (a: number[]) => a.reduce((s, x) => s + (x || 0), 0);
    let county20 = 0, county24 = 0;
    for (const arr of Object.values(r20.votes)) county20 += sum(arr);
    for (const arr of Object.values(r24.votes)) county24 += sum(arr);
    const rows: { prec: string; t20: number; t24: number; drop: number }[] = [];
    for (const [prec, arr] of Object.entries(r20.votes)) {
      const t20 = sum(arr);
      if (t20 < VOTE_FLOOR) continue;
      const a24 = r24.votes[prec];
      if (!a24) continue;
      const t24 = sum(a24);
      if (t24 >= t20) continue;
      rows.push({ prec, t20, t24, drop: (t20 - t24) / t20 });
    }
    rows.sort((a, b) => b.drop - a.drop);
    if (!rows.length || !county20) return null;
    return { rows, county20, county24 };
  }, [history]);

  // Precincts averaging 45 to 50 percent D across the 2020/2022/2024 generals
  const flip = useMemo(() => {
    if (!sweep) return [];
    return sweep
      .filter(r => r.avgDPct >= 45 && r.avgDPct <= 50 && (r.reg2024 ?? 0) > 0)
      .sort((a, b) => (b.reg2024 ?? 0) - (a.reg2024 ?? 0));
  }, [sweep]);

  if (sweep === null) return null; // still loading; render nothing rather than skeletons

  const bluePick = pickThreshold(t => shifts.filter(s => s.delta >= t).length, [10, 8, 5, 3]);
  const redPick = pickThreshold(t => shifts.filter(s => s.delta <= -t).length, [10, 8, 5, 3]);
  const dropPick = turnout
    ? pickThreshold(t => turnout.rows.filter(r => r.drop >= t / 100).length, [50, 40, 30, 25, 20, 15, 10])
    : null;

  const countyDelta = turnout ? ((turnout.county24 - turnout.county20) / turnout.county20) * 100 : null;

  const header =
    redPick && bluePick
      ? `${redPick.n} precincts shifted ${redPick.t}+ points red since 2020. ${bluePick.n} shifted ${bluePick.t}+ blue.`
      : turnout && countyDelta != null
        ? `Presidential votes countywide moved ${countyDelta <= 0 ? "down" : "up"} ${Math.abs(countyDelta).toFixed(1)}% from 2020 to 2024.`
        : null;

  if (!header) return null;

  const cards: { kicker: string; headline: string; rows: RowItem[] }[] = [];

  if (blueTop.length && bluePick) {
    cards.push({
      kicker: "Shifting blue",
      headline: `${bluePick.n} precinct${bluePick.n === 1 ? "" : "s"} shifted ${bluePick.t}+ points blue`,
      rows: blueTop.map(s => ({
        prec: s.prec,
        primary: `+${s.delta.toFixed(1)} pts`,
        primaryColor: "#2563a8",
        sub: `${s.reg.toLocaleString()} reg`,
      })),
    });
  }

  if (redTop.length && redPick) {
    cards.push({
      kicker: "Shifting red",
      headline: `${redPick.n} precinct${redPick.n === 1 ? "" : "s"} shifted ${redPick.t}+ points red`,
      rows: redTop.map(s => ({
        prec: s.prec,
        primary: `${s.delta.toFixed(1)} pts`,
        primaryColor: "#dc2626",
        sub: `${s.reg.toLocaleString()} reg`,
      })),
    });
  }

  if (turnout && dropPick) {
    cards.push({
      kicker: "Turnout collapse",
      headline: `Presidential votes fell ${dropPick.t}%+ in ${dropPick.n} precinct${dropPick.n === 1 ? "" : "s"}`,
      rows: turnout.rows.slice(0, 5).map(r => ({
        prec: r.prec,
        primary: `-${(r.drop * 100).toFixed(1)}%`,
        primaryColor: "#b45309",
        sub: `${r.t20.toLocaleString()} → ${r.t24.toLocaleString()} votes`,
      })),
    });
  }

  if (flip.length) {
    cards.push({
      kicker: "Flippable band",
      headline: `${flip.length} precincts average 45 to 50% D. Biggest first.`,
      rows: flip.slice(0, 5).map(r => ({
        prec: r.precinct,
        primary: `${r.avgDPct.toFixed(1)}% D avg`,
        primaryColor: "#7c3aed",
        sub: `${(r.reg2024 ?? 0).toLocaleString()} reg`,
      })),
    });
  }

  if (!cards.length) return null;

  return (
    <section className="px-5 py-5 border-t border-black/8">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "#6b7280" }}>
        Precinct movement · 2020 to 2024
      </p>
      <h2 className="mt-1" style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.15rem", lineHeight: 1.3, color: "#111827" }}>
        {header}
      </h2>
      <p className="text-[10px] mt-1" style={{ color: "#6b7280" }}>
        {turnout && countyDelta != null
          ? `Presidential votes countywide: ${turnout.county20.toLocaleString()} in 2020 to ${turnout.county24.toLocaleString()} in 2024 (${countyDelta <= 0 ? "down" : "up"} ${Math.abs(countyDelta).toFixed(1)}%). `
          : ""}
        Shift and flippable lists skip precincts under {REG_FLOOR} registered voters.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mt-4">
        {cards.map(c => <InsightCard key={c.kicker} {...c} />)}
      </div>

      <p className="text-[9px] mt-4" style={{ color: "#9ca3af" }}>
        Shifts and registration: precinct sweep data (presidential two-party D share, 2020 and 2024 generals · 2024 voter roll).
        Vote totals: TLC TED API via precinct history, all presidential candidates counted.
        Precinct numbers open the full multi-cycle lookup.
      </p>
    </section>
  );
}
