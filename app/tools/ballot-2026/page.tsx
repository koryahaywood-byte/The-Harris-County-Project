"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MATCHUPS_2026, type RaceLean } from "@/lib/matchups-2026";
import { FINANCE_DATA_MERGED, fmt, type CandidateFinance } from "@/lib/campaign-finance";
import FieldNotes from "@/components/FieldNotes";

type RaceGroup = "statewide" | "top" | "congress" | "statelegis" | "countywide" | "local";

const LEAN_META: Record<RaceLean, { label: string; color: string; bg: string }> = {
  "safe-d":        { label: "Safe D",        color: "#1d4ed8", bg: "#dbeafe" },
  "likely-d":      { label: "Likely D",      color: "#2563eb", bg: "#eff6ff" },
  "lean-d":        { label: "Lean D",        color: "#3b82f6", bg: "#f0f9ff" },
  "toss-up":       { label: "Toss-up",       color: "#7c3aed", bg: "#f5f3ff" },
  "lean-r":        { label: "Lean R",        color: "#ef4444", bg: "#fff5f5" },
  "likely-r":      { label: "Likely R",      color: "#dc2626", bg: "#fef2f2" },
  "safe-r":        { label: "Safe R",        color: "#b91c1c", bg: "#fee2e2" },
  "uncontested-d": { label: "Uncontested D", color: "#059669", bg: "#ecfdf5" },
  "uncontested-r": { label: "Uncontested R", color: "#6b7280", bg: "#f3f4f6" },
};

interface RaceRow {
  key: string;
  office: string;
  group: RaceGroup;
  groupLabel: string;
  status: "set" | "partial" | "runoff-pending";
  lean?: RaceLean;
  dSide: { name: string; note?: string } | null;
  rSide: { name: string; note?: string } | null;
  detail?: string;
  districtLink?: string;
}

function toDistrictLink(key: string): string {
  if (key.startsWith("TX-")) return "/tools/districts?type=countywide";
  if (key === "US-Senate") return "/tools/districts?type=countywide";
  if (key === "HC-Countywide") return "/tools/districts?type=countywide";
  if (key.startsWith("CD-")) return `/tools/districts?type=cd&district=${key.replace("CD-", "")}`;
  if (key.startsWith("SD-")) return `/tools/districts?type=sd&district=${key.replace("SD-", "")}`;
  if (key.startsWith("HD-")) return `/tools/districts?type=hd&district=${key.replace("HD-", "")}`;
  if (key.startsWith("PCT-")) return `/tools/districts?type=pct&district=${key.replace("PCT-", "")}`;
  if (key.startsWith("JP-")) return `/tools/districts?type=jp&district=${key.replace("JP-", "").split("-")[0]}`;
  return "/tools/districts";
}

function toGroup(key: string): { group: RaceGroup; groupLabel: string } {
  if (key.startsWith("TX-")) return { group: "statewide", groupLabel: "Statewide (Texas)" };
  if (key === "US-Senate" || key === "HC-Countywide") return { group: "top", groupLabel: "Top of Ticket" };
  if (key.startsWith("CD-")) return { group: "congress", groupLabel: "Congress" };
  if (key.startsWith("SD-") || key.startsWith("HD-")) return { group: "statelegis", groupLabel: "State Legislature" };
  if (key.startsWith("PCT-") || ["HC-Sheriff","HC-DA","HC-County-Attorney","HC-District-Clerk","HC-County-Clerk","HC-Tax-Assessor"].includes(key))
    return { group: "countywide", groupLabel: "County Offices" };
  return { group: "local", groupLabel: "Local / JP / Constable" };
}

const GROUP_ORDER: RaceGroup[] = ["statewide", "top", "congress", "statelegis", "countywide", "local"];

function financeFor(name: string | null): CandidateFinance | null {
  if (!name) return null;
  const lower = name.toLowerCase();
  return FINANCE_DATA_MERGED.find(f => f.name.toLowerCase() === lower) ?? null;
}

function MoneyCell({ name }: { name: string | null }) {
  const fin = financeFor(name);
  if (!fin || fin.cash === 0) {
    return <span className="text-gray-400 text-xs italic">no data</span>;
  }
  return (
    <span className="text-xs font-semibold text-gray-800">
      {fmt(fin.cash)}
      <span className="ml-1 font-normal text-gray-400 text-[10px]">CoH</span>
    </span>
  );
}

function MoneyEdgeBadge({ dName, rName }: { dName: string | null; rName: string | null }) {
  const dCash = financeFor(dName)?.cash ?? 0;
  const rCash = financeFor(rName)?.cash ?? 0;
  if (!dCash && !rCash) return null;
  if (!dCash || !rCash) return null; // need both to show edge
  const edge = dCash - rCash;
  const absPct = Math.round(Math.abs(edge) / Math.max(dCash, rCash) * 100);
  if (absPct < 5) return <span className="text-[9px] text-gray-400 italic">Money even</span>;
  const isDLeading = edge > 0;
  return (
    <span
      className="text-[9px] font-bold px-1.5 py-0.5 rounded"
      style={isDLeading
        ? { background: "#dbeafe", color: "#1d4ed8" }
        : { background: "#fee2e2", color: "#b91c1c" }}
    >
      {isDLeading ? "D+" : "R+"}{fmt(Math.abs(edge)).replace("$", "")} money edge
    </span>
  );
}

const STATUS_LABEL: Record<string, string> = {
  set: "Full matchup",
  partial: "Partial",
  "runoff-pending": "Runoff pending",
};
const STATUS_COLOR: Record<string, string> = {
  set: "#15803d",
  partial: "#b45309",
  "runoff-pending": "#1d4ed8",
};

export default function Ballot2026() {
  const [filterGroup, setFilterGroup] = useState<RaceGroup | "all">("all");
  const [onlyContested, setOnlyContested] = useState(false);
  const [onlyCompetitive, setOnlyCompetitive] = useState(false);

  const rows: RaceRow[] = useMemo(() => {
    return Object.entries(MATCHUPS_2026).map(([key, m]) => {
      const { group, groupLabel } = toGroup(key);
      const dSide = m.sides.find(s => s.party === "D") ?? null;
      const rSide = m.sides.find(s => s.party === "R") ?? null;
      return {
        key,
        office: m.office,
        group,
        groupLabel,
        status: m.status,
        lean: m.lean,
        dSide: dSide ? { name: dSide.name, note: dSide.note } : null,
        rSide: rSide ? { name: rSide.name, note: rSide.note } : null,
        detail: m.detail,
        districtLink: toDistrictLink(key),
      };
    });
  }, []);

  const COMPETITIVE_LEANS: RaceLean[] = ["toss-up", "lean-d", "lean-r"];

  const grouped = useMemo(() => {
    let visible = rows;
    if (filterGroup !== "all") visible = visible.filter(r => r.group === filterGroup);
    if (onlyContested) visible = visible.filter(r => r.dSide && r.rSide);
    if (onlyCompetitive) visible = visible.filter(r => r.lean && COMPETITIVE_LEANS.includes(r.lean));
    const out: Record<RaceGroup, RaceRow[]> = { statewide: [], top: [], congress: [], statelegis: [], countywide: [], local: [] };
    for (const r of visible) out[r.group].push(r);
    return out;
  }, [rows, filterGroup, onlyContested]);

  const totalContested = rows.filter(r => r.dSide && r.rSide).length;
  const totalPartial    = rows.filter(r => !(r.dSide && r.rSide)).length;

  const moneyTotals = useMemo(() => {
    let dTotal = 0, rTotal = 0, dCount = 0, rCount = 0;
    for (const r of rows) {
      if (r.dSide) { const f = financeFor(r.dSide.name); if (f?.cash) { dTotal += f.cash; dCount++; } }
      if (r.rSide) { const f = financeFor(r.rSide.name); if (f?.cash) { rTotal += f.cash; rCount++; } }
    }
    return { dTotal, rTotal, dCount, rCount };
  }, [rows]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">2026 General Election Ballot</h1>
        <p className="text-sm text-gray-500 mt-1">
          Every race on a Harris County voter&rsquo;s November 2026 ballot — statewide Texas through local.{" "}
          <span className="text-green-700 font-medium">{totalContested} full matchups</span>
          {" · "}
          <span className="text-amber-700 font-medium">{totalPartial} awaiting confirmation</span>
        </p>
      </div>

      {/* Money summary bar */}
      {(moneyTotals.dTotal > 0 || moneyTotals.rTotal > 0) && (() => {
        const total = moneyTotals.dTotal + moneyTotals.rTotal;
        const dPct = total ? Math.round(moneyTotals.dTotal / total * 100) : 50;
        return (
          <div className="mb-5 rounded-xl border border-gray-200 bg-white px-4 py-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Cash on Hand — All Tracked Races</span>
              <span className="text-[10px] text-gray-400">{moneyTotals.dCount + moneyTotals.rCount} candidates with data</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-700 w-20 text-right">{fmt(moneyTotals.dTotal)}</span>
              <div className="flex-1 rounded-full overflow-hidden h-2.5 bg-gray-100">
                <div className="h-full rounded-full" style={{ width: `${dPct}%`, background: "linear-gradient(90deg, #1d4ed8, #3b82f6)" }} />
              </div>
              <span className="text-xs font-bold text-red-700 w-20">{fmt(moneyTotals.rTotal)}</span>
            </div>
            <div className="flex justify-between mt-0.5 px-0.5">
              <span className="text-[9px] text-blue-600 font-bold">D {dPct}%</span>
              <span className="text-[9px] text-red-600 font-bold">R {100 - dPct}%</span>
            </div>
          </div>
        );
      })()}


      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6 items-center">
        {([
          ["all", "All Races"],
          ["statewide", "Statewide TX"],
          ["top", "Top of Ticket"],
          ["congress", "Congress"],
          ["statelegis", "Legislature"],
          ["countywide", "County Offices"],
          ["local", "Local / JP"],
        ] as [RaceGroup | "all", string][]).map(([g, label]) => (
          <button
            key={g}
            onClick={() => setFilterGroup(g)}
            className="px-3 py-1.5 rounded-full text-sm font-medium border transition-all"
            style={filterGroup === g
              ? { background: "#1e3a5f", color: "#fff", borderColor: "#1e3a5f" }
              : { background: "#f9fafb", color: "#374151", borderColor: "#d1d5db" }}
          >
            {label}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setOnlyCompetitive(c => !c)}
            className="px-3 py-1.5 rounded-full text-sm font-medium border transition-all"
            style={onlyCompetitive
              ? { background: "#7c3aed", color: "#fff", borderColor: "#7c3aed" }
              : { background: "#f9fafb", color: "#374151", borderColor: "#d1d5db" }}
          >
            Competitive only
          </button>
          <button
            onClick={() => setOnlyContested(c => !c)}
            className="px-3 py-1.5 rounded-full text-sm font-medium border transition-all"
            style={onlyContested
              ? { background: "#15803d", color: "#fff", borderColor: "#15803d" }
              : { background: "#f9fafb", color: "#374151", borderColor: "#d1d5db" }}
          >
            Full matchups only
          </button>
        </div>
      </div>

      {GROUP_ORDER.map(grp => {
        const section = grouped[grp];
        if (!section.length) return null;
        return (
          <div key={grp} className="mb-8">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 pb-1 border-b border-gray-200">
              {section[0].groupLabel}
            </h2>
            <div className="space-y-2">
              {section.map(r => {
                const bothKnown = r.dSide && r.rSide;
                return (
                  <div
                    key={r.key}
                    className="rounded-xl border bg-white overflow-hidden"
                    style={{ borderColor: bothKnown ? "#e5e7eb" : "#f3f4f6" }}
                  >
                    <div className="flex items-start gap-0">
                      {/* D side */}
                      <div
                        className="flex-1 px-4 py-3 border-r"
                        style={{ borderColor: "#e5e7eb", background: r.dSide ? "#f0f9ff" : "#fafafa" }}
                      >
                        {r.dSide ? (
                          <>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white" style={{ background: "#1d4ed8" }}>D</span>
                              <span className="font-semibold text-sm text-gray-900">{r.dSide.name}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              {r.dSide.note && <span>{r.dSide.note}</span>}
                              <MoneyCell name={r.dSide.name} />
                            </div>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 italic">D nominee TBD</span>
                        )}
                      </div>

                      {/* Center — office name + lean + status */}
                      <div className="w-52 shrink-0 px-3 py-3 text-center flex flex-col items-center justify-center bg-white">
                        <div className="text-[11px] font-semibold text-gray-700 leading-tight text-center">{r.office}</div>
                        {r.lean && (() => {
                          const lm = LEAN_META[r.lean];
                          return (
                            <div className="mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold"
                              style={{ background: lm.bg, color: lm.color }}>
                              {lm.label}
                            </div>
                          );
                        })()}
                        <div className="mt-1">
                          <span
                            className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                            style={{ background: STATUS_COLOR[r.status] + "18", color: STATUS_COLOR[r.status] }}
                          >
                            {STATUS_LABEL[r.status]}
                          </span>
                        </div>
                        <div className="mt-1">
                          <MoneyEdgeBadge dName={r.dSide?.name ?? null} rName={r.rSide?.name ?? null} />
                        </div>
                        <Link
                          href={r.districtLink ?? "/tools/districts"}
                          className="mt-1.5 text-[9px] text-blue-500 hover:underline"
                        >
                          View district →
                        </Link>
                      </div>

                      {/* R side */}
                      <div
                        className="flex-1 px-4 py-3 border-l"
                        style={{ borderColor: "#e5e7eb", background: r.rSide ? "#fff5f5" : "#fafafa" }}
                      >
                        {r.rSide ? (
                          <>
                            <div className="flex items-center gap-1.5 mb-0.5 justify-end">
                              <span className="font-semibold text-sm text-gray-900">{r.rSide.name}</span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white" style={{ background: "#b91c1c" }}>R</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500 justify-end">
                              <MoneyCell name={r.rSide.name} />
                              {r.rSide.note && <span>{r.rSide.note}</span>}
                            </div>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 italic">R nominee TBD</span>
                        )}
                      </div>
                    </div>

                    {r.detail && (
                      <div className="px-4 py-2 text-[11px] text-gray-500 bg-gray-50 border-t border-gray-100">
                        {r.detail}
                      </div>
                    )}
                    <div className="px-4 pb-2 bg-gray-50 border-t border-gray-100">
                      <FieldNotes target={`race:${r.key}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <p className="text-xs text-gray-400 mt-6 text-center">
        Cash on hand figures from most recent filings. "No data" = not yet in finance pipeline.{" "}
        Races showing "D nominee TBD" or "R nominee TBD" still need primary/runoff confirmation.
      </p>
    </div>
  );
}
