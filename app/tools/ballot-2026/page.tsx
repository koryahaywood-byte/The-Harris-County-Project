"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MATCHUPS_2026, type RaceLean } from "@/lib/matchups-2026";
import { FINANCE_DATA_MERGED, fmt, type CandidateFinance } from "@/lib/campaign-finance";

type RaceGroup = "statewide" | "top" | "congress" | "statelegis" | "countywide" | "local";

// Visual lane: safe D → toss-up → safe R, 0–100
const LEAN_LANE: Record<RaceLean, number> = {
  "safe-d": 10, "likely-d": 25, "lean-d": 38,
  "toss-up": 50,
  "lean-r": 62, "likely-r": 75, "safe-r": 90,
  "uncontested-d": 5, "uncontested-r": 95,
};
const LEAN_LABEL: Record<RaceLean, string> = {
  "safe-d": "Safe D", "likely-d": "Likely D", "lean-d": "Lean D",
  "toss-up": "Toss-up",
  "lean-r": "Lean R", "likely-r": "Likely R", "safe-r": "Safe R",
  "uncontested-d": "Uncontested D", "uncontested-r": "Uncontested R",
};

type DistrictRaces = {
  hd: Record<string, Record<string, Record<string, RaceData>>>;
  sd: Record<string, Record<string, Record<string, RaceData>>>;
  cd: Record<string, Record<string, Record<string, RaceData>>>;
  jp: Record<string, Record<string, Record<string, RaceData>>>;
  pct: Record<string, Record<string, Record<string, RaceData>>>;
  county: Record<string, Record<string, RaceData>>;
};
type RaceData = {
  label: string;
  candidates: { name: string; party: string }[];
  votes: Record<string, number[]>;
};

interface LastResult { dPct: number; rPct: number; dVotes: number; rVotes: number; cycle: string }

function sumRace(race: RaceData): LastResult | null {
  const dIdx = race.candidates.findIndex(c => c.party === "D");
  const rIdx = race.candidates.findIndex(c => c.party === "R");
  if (dIdx < 0 || rIdx < 0) return null;
  let d = 0, r = 0;
  for (const v of Object.values(race.votes)) { d += v[dIdx] ?? 0; r += v[rIdx] ?? 0; }
  const total = d + r;
  if (!total) return null;
  return { dVotes: d, rVotes: r, dPct: Math.round(d / total * 100), rPct: Math.round(r / total * 100), cycle: "" };
}

function buildResultsMap(dr: DistrictRaces): Record<string, LastResult> {
  const out: Record<string, LastResult> = {};

  // State house
  for (const [hd, cycles] of Object.entries(dr.hd ?? {})) {
    for (const cy of ["2024G", "2022G", "2020G", "2018G"]) {
      const c = cycles[cy]; if (!c) continue;
      const r = sumRace(Object.values(c)[0]!); if (!r) continue;
      out[`HD-${hd}`] = { ...r, cycle: cy }; break;
    }
  }
  // State senate
  for (const [sd, cycles] of Object.entries(dr.sd ?? {})) {
    for (const cy of ["2024G", "2022G", "2020G", "2018G"]) {
      const c = cycles[cy]; if (!c) continue;
      const r = sumRace(Object.values(c)[0]!); if (!r) continue;
      out[`SD-${sd}`] = { ...r, cycle: cy }; break;
    }
  }
  // Congress
  for (const [cd, cycles] of Object.entries(dr.cd ?? {})) {
    for (const cy of ["2024G", "2022G", "2020G", "2018G"]) {
      const c = cycles[cy]; if (!c) continue;
      const r = sumRace(Object.values(c)[0]!); if (!r) continue;
      out[`CD-${cd}`] = { ...r, cycle: cy }; break;
    }
  }
  // JP
  for (const [jp, cycles] of Object.entries(dr.jp ?? {})) {
    for (const cy of ["2024G", "2022G", "2020G"]) {
      const c = cycles[cy]; if (!c) continue;
      for (const [slug, race] of Object.entries(c)) {
        const r = sumRace(race); if (!r) continue;
        const isConstable = slug.includes("constable");
        const key = isConstable ? `HC-Constable-${jp}` : `JP-${jp}`;
        if (!out[key]) out[key] = { ...r, cycle: cy };
      }
    }
  }
  // Commissioner
  for (const [pct, cycles] of Object.entries(dr.pct ?? {})) {
    for (const cy of ["2024G", "2022G", "2020G"]) {
      const c = cycles[cy]; if (!c) continue;
      const r = sumRace(Object.values(c)[0]!); if (!r) continue;
      out[`PCT-${pct}`] = { ...r, cycle: cy }; break;
    }
  }
  // County-wide
  const countyMap: Record<string, string> = {
    governor: "TX-Governor", u_s_senate: "US-Senate",
    harris_da: "HC-DA", harris_sheriff: "HC-Sheriff",
    harris_co_attorney: "HC-County-Attorney", harris_tax_a_c: "HC-Tax-Assessor",
    president: "TX-President",
  };
  for (const [slug, cycles] of Object.entries(dr.county ?? {})) {
    const key = countyMap[slug]; if (!key) continue;
    for (const cy of ["2024G", "2022G", "2020G", "2018G"]) {
      const race = cycles[cy]; if (!race) continue;
      const r = sumRace(race); if (!r) continue;
      out[key] = { ...r, cycle: cy }; break;
    }
  }
  return out;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function toDistrictLink(key: string): string {
  if (key === "US-Senate" || key.startsWith("TX-")) return "/tools/districts?type=countywide";
  if (key === "HC-Countywide") return "/tools/districts?type=countywide";
  if (key.startsWith("CD-")) return `/tools/districts?type=cd&district=${key.replace("CD-", "")}`;
  if (key.startsWith("SD-")) return `/tools/districts?type=sd&district=${key.replace("SD-", "")}`;
  if (key.startsWith("HD-")) return `/tools/districts?type=hd&district=${key.replace("HD-", "")}`;
  if (key.startsWith("PCT-")) return `/tools/districts?type=pct&district=${key.replace("PCT-", "")}`;
  if (key.startsWith("HC-JP") || key.startsWith("JP-")) return `/tools/districts?type=jp&district=${key.replace(/.*?(\d+).*/, "$1")}`;
  return "/tools/districts";
}

function toGroup(key: string): { group: RaceGroup; groupLabel: string } {
  if (key.startsWith("TX-")) return { group: "statewide", groupLabel: "Statewide Texas" };
  if (key === "US-Senate" || key === "HC-Countywide") return { group: "top", groupLabel: "Top of Ticket" };
  if (key.startsWith("CD-")) return { group: "congress", groupLabel: "U.S. Congress" };
  if (key.startsWith("SD-") || key.startsWith("HD-")) return { group: "statelegis", groupLabel: "State Legislature" };
  if (key.startsWith("PCT-") || key.startsWith("HC-")) return { group: "countywide", groupLabel: "Harris County" };
  return { group: "local", groupLabel: "JP & Local" };
}

const GROUP_ORDER: RaceGroup[] = ["top", "statewide", "congress", "statelegis", "countywide", "local"];

function financeFor(name: string | null): CandidateFinance | null {
  if (!name) return null;
  return FINANCE_DATA_MERGED.find(f => f.name.toLowerCase() === name.toLowerCase()) ?? null;
}

// ── Sub-components ────────────────────────────────────────────────────────────
function CandidateCol({ side, align }: { side: { name: string; party: "D"|"R"; note?: string } | null; align: "left"|"right" }) {
  if (!side) {
    return (
      <div className={`flex-1 px-4 py-3 ${align === "right" ? "text-right" : ""}`}
        style={{ background: "#fafafa" }}>
        <span className="text-xs text-gray-400 italic">Nominee TBD</span>
      </div>
    );
  }
  const fin = financeFor(side.name);
  const isD = side.party === "D";
  const accent = isD ? "#1d4ed8" : "#b91c1c";
  const bg = isD ? "#eff6ff" : "#fef2f2";

  return (
    <div className={`flex-1 px-4 py-3.5 ${align === "right" ? "text-right" : ""}`}
      style={{ background: bg }}>
      <div className={`flex items-center gap-1.5 mb-1 ${align === "right" ? "justify-end" : ""}`}>
        {align === "left" && (
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded text-white leading-none" style={{ background: accent }}>D</span>
        )}
        <span className="font-bold text-[14px] leading-tight" style={{ color: "#111827" }}>{side.name}</span>
        {align === "right" && (
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded text-white leading-none" style={{ background: accent }}>R</span>
        )}
      </div>
      <div className={`flex items-center gap-2 text-[11px] ${align === "right" ? "justify-end" : ""}`}>
        {side.note && <span style={{ color: "#6b7280" }}>{side.note}</span>}
        {fin && fin.cash > 0 && (
          <span className="font-semibold" style={{ color: accent }}>
            {fmt(fin.cash)} <span style={{ color: "#9ca3af", fontWeight: 400 }}>CoH</span>
          </span>
        )}
      </div>
    </div>
  );
}

function LeanMeter({ lean }: { lean: RaceLean | undefined }) {
  if (!lean) return null;
  const pos = LEAN_LANE[lean] ?? 50;
  const label = LEAN_LABEL[lean] ?? "";
  const isDem = pos < 50;
  const isRep = pos > 50;
  const color = isDem ? "#2563eb" : isRep ? "#dc2626" : "#7c3aed";
  return (
    <div className="px-3 pt-1 pb-2">
      {/* Track */}
      <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: "linear-gradient(90deg,#dbeafe,#e0d9f7,#fee2e2)" }}>
        <div className="absolute top-0 bottom-0 w-0.5 rounded-full" style={{ left: `${pos}%`, background: color, transform: "translateX(-50%)", boxShadow: `0 0 4px ${color}` }} />
      </div>
      <p className="text-[9px] font-bold text-center mt-0.5" style={{ color }}>{label}</p>
    </div>
  );
}

function ResultBar({ result, cycle }: { result: LastResult | undefined; cycle?: string }) {
  if (!result) return null;
  const yearLabel = result.cycle.replace("G", "").replace("P", " pri");
  return (
    <div className="px-4 py-2 border-t" style={{ borderColor: "#f3f4f6", background: "#f9fafb" }}>
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-bold w-16" style={{ color: "#2563eb" }}>
          D {result.dPct}%
        </span>
        <div className="flex-1 h-2 rounded-full overflow-hidden flex" style={{ background: "#e5e7eb" }}>
          <div className="h-full" style={{ width: `${result.dPct}%`, background: "#2563eb" }} />
          <div className="h-full" style={{ width: `${result.rPct}%`, background: "#dc2626" }} />
        </div>
        <span className="text-[9px] font-bold w-16 text-right" style={{ color: "#dc2626" }}>
          {result.rPct}% R
        </span>
        <span className="text-[9px] ml-1 shrink-0" style={{ color: "#9ca3af" }}>
          {result.dVotes.toLocaleString()} – {result.rVotes.toLocaleString()} · {yearLabel}
        </span>
      </div>
    </div>
  );
}

function MoneyBar({ dName, rName }: { dName: string | null; rName: string | null }) {
  const d = financeFor(dName)?.cash ?? 0;
  const r = financeFor(rName)?.cash ?? 0;
  if (!d && !r) return null;
  const total = d + r;
  const dPct = total ? Math.round(d / total * 100) : 50;
  return (
    <div className="px-4 py-2 border-t" style={{ borderColor: "#f3f4f6" }}>
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-bold w-16" style={{ color: "#2563eb" }}>{d ? fmt(d) : "—"}</span>
        <div className="flex-1 h-1.5 rounded-full overflow-hidden flex" style={{ background: "#e5e7eb" }}>
          <div className="h-full" style={{ width: `${dPct}%`, background: "#93c5fd" }} />
          <div className="h-full" style={{ width: `${100 - dPct}%`, background: "#fca5a5" }} />
        </div>
        <span className="text-[9px] font-bold w-16 text-right" style={{ color: "#dc2626" }}>{r ? fmt(r) : "—"}</span>
        <span className="text-[9px] ml-1 shrink-0" style={{ color: "#9ca3af" }}>money</span>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Ballot2026() {
  const [districtRaces, setDistrictRaces] = useState<DistrictRaces | null>(null);
  const [filterGroup, setFilterGroup] = useState<RaceGroup | "all">("all");
  const [onlyCompetitive, setOnlyCompetitive] = useState(false);
  const [onlyContested, setOnlyContested] = useState(false);

  useEffect(() => {
    fetch("/data/district-races.json").then(r => r.json()).then(setDistrictRaces).catch(() => {});
  }, []);

  const resultsMap = useMemo(() => districtRaces ? buildResultsMap(districtRaces) : {}, [districtRaces]);

  const rows = useMemo(() => Object.entries(MATCHUPS_2026).map(([key, m]) => {
    const { group, groupLabel } = toGroup(key);
    const dSide = m.sides.find(s => s.party === "D") ?? null;
    const rSide = m.sides.find(s => s.party === "R") ?? null;
    return { key, group, groupLabel, office: m.office, status: m.status, lean: m.lean, dSide, rSide, districtLink: toDistrictLink(key), detail: m.detail ?? null };
  }), []);

  const COMPETITIVE_LEANS: RaceLean[] = ["toss-up", "lean-d", "lean-r"];

  const grouped = useMemo(() => {
    let visible = rows;
    if (filterGroup !== "all") visible = visible.filter(r => r.group === filterGroup);
    if (onlyContested) visible = visible.filter(r => r.dSide && r.rSide);
    if (onlyCompetitive) visible = visible.filter(r => r.lean && COMPETITIVE_LEANS.includes(r.lean));
    const out: Record<RaceGroup, typeof rows> = { statewide: [], top: [], congress: [], statelegis: [], countywide: [], local: [] };
    for (const r of visible) out[r.group].push(r);
    return out;
  }, [rows, filterGroup, onlyContested, onlyCompetitive]);

  const stats = useMemo(() => {
    const contested = rows.filter(r => r.dSide && r.rSide).length;
    const tossups = rows.filter(r => r.lean && COMPETITIVE_LEANS.includes(r.lean)).length;
    let dMoney = 0, rMoney = 0;
    for (const r of rows) {
      if (r.dSide) dMoney += financeFor(r.dSide.name)?.cash ?? 0;
      if (r.rSide) rMoney += financeFor(r.rSide.name)?.cash ?? 0;
    }
    const moneyTotal = dMoney + rMoney;
    return { contested, tossups, dMoney, rMoney, dMoneyPct: moneyTotal ? Math.round(dMoney / moneyTotal * 100) : 50 };
  }, [rows]);

  return (
    <div style={{ background: "#f5f3ef", minHeight: "100vh", fontFamily: "var(--font-outfit,sans-serif)" }}>

      {/* Hero */}
      <section className="relative overflow-hidden topo-dark"
        style={{ background: "linear-gradient(135deg,#1a3a5c 0%,#0f2540 60%,#162e4a 100%)", paddingTop: "3.5rem", paddingBottom: "3rem" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 70% 60% at 80% 40%,rgba(37,99,168,0.18) 0%,transparent 70%)" }} />
        <div className="relative max-w-5xl mx-auto px-5">
          <p className="text-sky-300 text-xs font-bold uppercase tracking-[0.22em] mb-3">November 2026</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-1" style={{ fontFamily: "var(--font-playfair,serif)" }}>
            The 2026 Ballot
          </h1>
          <p className="text-white/50 text-sm mb-6">
            {stats.contested} contested races · {stats.tossups} toss-ups · Harris County, Texas
          </p>

          {/* Money summary */}
          {(stats.dMoney > 0 || stats.rMoney > 0) && (
            <div className="rounded-xl px-4 py-3 max-w-lg" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40 mb-2">Cash on hand — all tracked candidates</p>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold w-20" style={{ color: "#93c5fd" }}>{fmt(stats.dMoney)}</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden flex" style={{ background: "rgba(255,255,255,0.1)" }}>
                  <div className="h-full" style={{ width: `${stats.dMoneyPct}%`, background: "#3b82f6" }} />
                  <div className="h-full" style={{ width: `${100 - stats.dMoneyPct}%`, background: "#ef4444" }} />
                </div>
                <span className="text-sm font-bold w-20 text-right" style={{ color: "#fca5a5" }}>{fmt(stats.rMoney)}</span>
              </div>
              <div className="flex justify-between mt-0.5">
                <span className="text-[9px] font-bold" style={{ color: "#93c5fd" }}>D {stats.dMoneyPct}%</span>
                <span className="text-[9px] font-bold" style={{ color: "#fca5a5" }}>R {100 - stats.dMoneyPct}%</span>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-5 py-6">

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6 items-center">
          {([
            ["all", "All Races"],
            ["top", "Top of Ticket"],
            ["statewide", "Statewide TX"],
            ["congress", "Congress"],
            ["statelegis", "Legislature"],
            ["countywide", "County"],
            ["local", "JP & Local"],
          ] as [RaceGroup | "all", string][]).map(([g, label]) => (
            <button key={g} onClick={() => setFilterGroup(g)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
              style={filterGroup === g
                ? { background: "#1a3a5c", color: "#fff", borderColor: "#1a3a5c" }
                : { background: "#fff", color: "#374151", borderColor: "#e5e7eb" }}>
              {label}
            </button>
          ))}
          <div className="ml-auto flex gap-2">
            <button onClick={() => setOnlyCompetitive(c => !c)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
              style={onlyCompetitive ? { background: "#7c3aed", color: "#fff", borderColor: "#7c3aed" } : { background: "#fff", color: "#374151", borderColor: "#e5e7eb" }}>
              Competitive only
            </button>
            <button onClick={() => setOnlyContested(c => !c)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
              style={onlyContested ? { background: "#059669", color: "#fff", borderColor: "#059669" } : { background: "#fff", color: "#374151", borderColor: "#e5e7eb" }}>
              Full matchups
            </button>
          </div>
        </div>

        {GROUP_ORDER.map(grp => {
          const section = grouped[grp];
          if (!section.length) return null;
          return (
            <div key={grp} className="mb-10">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.22em] mb-4" style={{ color: "#9ca3af" }}>
                {section[0].groupLabel}
              </h2>
              <div className="space-y-3">
                {section.map(r => {
                  const result = resultsMap[r.key];
                  const dFin = financeFor(r.dSide?.name ?? null);
                  const rFin = financeFor(r.rSide?.name ?? null);
                  const hasMoneyBar = (dFin?.cash ?? 0) > 0 && (rFin?.cash ?? 0) > 0;
                  return (
                    <div key={r.key} className="rounded-[1.35rem] bg-white/70 ring-1 ring-black/8 p-[4px]">
                      <div className="rounded-[1rem] bg-white overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">

                        {/* Office header */}
                        <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: "#f3f4f6" }}>
                          <span className="text-[11px] font-bold" style={{ color: "#1a3a5c" }}>{r.office}</span>
                          <div className="flex items-center gap-2">
                            {r.status === "runoff-pending" && (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#dbeafe", color: "#1d4ed8" }}>Runoff pending</span>
                            )}
                            <Link href={r.districtLink} className="text-[9px] font-semibold hover:underline" style={{ color: "#9ca3af" }}>
                              See district →
                            </Link>
                          </div>
                        </div>

                        {/* Candidates row */}
                        <div className="flex items-stretch">
                          <CandidateCol side={r.dSide as { name: string; party: "D"|"R"; note?: string } | null} align="left" />
                          {/* Center competitiveness */}
                          <div className="w-28 shrink-0 border-l border-r flex flex-col justify-center" style={{ borderColor: "#f3f4f6" }}>
                            <LeanMeter lean={r.lean} />
                          </div>
                          <CandidateCol side={r.rSide as { name: string; party: "D"|"R"; note?: string } | null} align="right" />
                        </div>

                        {/* Last election result bar */}
                        <ResultBar result={result} />

                        {/* Money bar — only when both sides have data */}
                        {hasMoneyBar && <MoneyBar dName={r.dSide?.name ?? null} rName={r.rSide?.name ?? null} />}

                        {/* Context */}
                        {r.detail && (
                          <div className="px-4 py-2 border-t text-[10px] leading-relaxed" style={{ borderColor: "#f3f4f6", color: "#6b7280", background: "#fafafa" }}>
                            {r.detail}
                          </div>
                        )}

                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Related tools */}
        <div className="mt-8 pt-6 border-t border-black/8">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: "#9ca3af" }}>Go deeper</p>
          <div className="flex flex-wrap gap-2">
            {[
              { href: "/tools/where-is-the-dough", label: "Full campaign finance →" },
              { href: "/tools/districts",           label: "District-by-district breakdown →" },
              { href: "/tools/heat-check",          label: "Precinct vote history →" },
            ].map(l => (
              <Link key={l.href} href={l.href}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-colors hover:bg-[#1a3a5c] hover:text-white hover:border-[#1a3a5c]"
                style={{ color: "#374151", borderColor: "#e5e7eb", background: "#fff" }}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <p className="text-[10px] mt-6 leading-relaxed" style={{ color: "#b0b8c4" }}>
          Last election bars show Harris County totals from TED (Texas Legislative Council). Money is cash on hand from most recent FEC/TEC filing. Competitiveness ratings reflect Harris County presidential lean adjusted for district composition — not statewide outcomes.
        </p>
      </div>
    </div>
  );
}
