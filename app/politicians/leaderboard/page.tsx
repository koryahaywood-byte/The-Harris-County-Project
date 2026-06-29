"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { POLITICIANS } from "@/lib/politicians";
import { computeStats, STAT_LABELS } from "@/lib/politician-stats";
import { getFinanceByName } from "@/lib/campaign-finance";

type SortKey = "ovr" | "warChest" | "lawmaker" | "influence" | "access" | "tenure";

const STAT_META: { key: SortKey; label: string; color: string; abbr: string }[] = [
  { key: "ovr",       label: "OVR",       color: "#f59e0b", abbr: "OVR" },
  { key: "warChest",  label: "War Chest", color: "#10b981", abbr: "WAR" },
  { key: "lawmaker",  label: "Lawmaker",  color: "#3b82f6", abbr: "LAW" },
  { key: "influence", label: "Influence", color: "#8b5cf6", abbr: "INF" },
  { key: "access",    label: "Access",    color: "#ec4899", abbr: "ACC" },
  { key: "tenure",    label: "Tenure",    color: "#f97316", abbr: "TEN" },
];

const CHAMBERS = ["All", "Senate", "House", "County", "City", "HISD"] as const;
type Chamber = typeof CHAMBERS[number];

function StatBar({ value, color }: { value: number; color: string }) {
  const tier = value >= 85 ? "elite" : value >= 70 ? "great" : value >= 55 ? "avg" : "low";
  return (
    <div className="flex items-center gap-1.5 w-full">
      <div className="flex-1 h-1.5 rounded-full bg-black/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span
        className={`text-[10px] font-bold w-5 text-right tabular-nums ${
          tier === "elite" ? "text-amber-500" :
          tier === "great" ? "text-emerald-600" :
          tier === "avg"   ? "text-[var(--accent)]" : "text-[var(--muted)]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function OvrBadge({ ovr }: { ovr: number }) {
  const tier =
    ovr >= 90 ? { label: "Elite",  bg: "bg-amber-400",    text: "text-amber-900" } :
    ovr >= 80 ? { label: "Great",  bg: "bg-emerald-400",  text: "text-emerald-900" } :
    ovr >= 70 ? { label: "Good",   bg: "bg-blue-400",     text: "text-blue-900" } :
    ovr >= 60 ? { label: "Fair",   bg: "bg-violet-300",   text: "text-violet-900" } :
               { label: "Bench",  bg: "bg-gray-300",     text: "text-gray-700" };
  return (
    <span className={`inline-block text-[9px] font-bold uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-full ${tier.bg} ${tier.text}`}>
      {tier.label}
    </span>
  );
}

export default function LeaderboardPage() {
  const [sortBy, setSortBy]       = useState<SortKey>("ovr");
  const [chamber, setChamber]     = useState<Chamber>("All");
  const [party, setParty]         = useState<"All" | "D" | "R">("All");
  const [search, setSearch]       = useState("");

  const rows = useMemo(() => {
    return POLITICIANS
      .filter(p => {
        if (p.termStart && p.termStart > 2026) return false; // exclude 2026 nominees
        if (chamber !== "All" && p.chamber !== chamber) return false;
        if (party !== "All" && p.party !== party) return false;
        if (search && !p.name.toLowerCase().includes(search.toLowerCase()) &&
            !p.office.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .map(p => ({ pol: p, stats: computeStats(p, getFinanceByName(p.name), 0, 0) }))
      .sort((a, b) => b.stats[sortBy] - a.stats[sortBy]);
  }, [sortBy, chamber, party, search]);

  const leader = rows[0];

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>

      {/* Hero */}
      <div className="bg-[var(--accent)] text-white px-6 py-16 md:py-20 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_80%_50%,rgba(37,99,168,0.4),transparent)]" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <Link href="/politicians" className="text-sky-300/70 text-[11px] font-bold uppercase tracking-[0.2em] hover:text-sky-300 transition-colors">
              ← Officials
            </Link>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-2" style={{ fontFamily: "var(--font-playfair), serif" }}>
            OVR Leaderboard
          </h1>
          <p className="text-white/65 text-sm max-w-lg">
            {rows.length} elected officials serving Harris County residents. Ranked by composite score. Sort by any attribute.
          </p>

          {/* Top 3 podium */}
          {rows.length >= 3 && (
            <div className="mt-8 flex items-end gap-3 max-w-md">
              {[rows[1], rows[0], rows[2]].map((r, i) => {
                const pos = i === 0 ? 2 : i === 1 ? 1 : 3;
                const heights = ["h-16", "h-24", "h-12"];
                const isFirst = pos === 1;
                return (
                  <Link
                    key={r.pol.slug}
                    href={`/politicians/${r.pol.slug}`}
                    className={`flex-1 rounded-t-xl flex flex-col items-center justify-end pb-2 cursor-pointer transition-opacity hover:opacity-80 ${heights[i]}`}
                    style={{ background: isFirst ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.08)", border: isFirst ? "1px solid rgba(245,158,11,0.4)" : "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <span className="text-[18px] font-black" style={{ fontFamily: "var(--font-playfair), serif", color: isFirst ? "#f59e0b" : "rgba(255,255,255,0.5)" }}>
                      {pos}
                    </span>
                    <span className="text-[9px] font-bold text-white/70 text-center px-1 leading-tight">{r.pol.name.split(" ").pop()}</span>
                    <span className="text-[11px] font-black text-white mt-0.5">{r.stats[sortBy]}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* Sort + Filter controls */}
        <div className="mb-8 space-y-4">

          {/* Sort by attribute */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] mb-2">Sort by</p>
            <div className="flex flex-wrap gap-2">
              {STAT_META.map(s => (
                <button
                  key={s.key}
                  onClick={() => setSortBy(s.key)}
                  className={`px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-[0.12em] transition-all duration-200 cursor-pointer ${
                    sortBy === s.key
                      ? "text-white shadow-md"
                      : "bg-white text-[var(--muted)] ring-1 ring-black/8 hover:ring-[var(--accent-light)]"
                  }`}
                  style={sortBy === s.key ? { background: s.color } : {}}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap gap-2 items-center">
            {/* Search */}
            <input
              type="text"
              placeholder="Search officials..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="px-4 py-2 rounded-full text-sm ring-1 ring-black/10 bg-white focus:outline-none focus:ring-[var(--accent-light)] w-52"
            />

            {/* Chamber filter */}
            {CHAMBERS.map(c => (
              <button
                key={c}
                onClick={() => setChamber(c)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.12em] transition-all duration-200 cursor-pointer ${
                  chamber === c
                    ? "bg-[var(--accent)] text-white"
                    : "bg-white text-[var(--muted)] ring-1 ring-black/8 hover:ring-[var(--accent)]"
                }`}
              >
                {c}
              </button>
            ))}

            {/* Party filter */}
            {(["All", "D", "R"] as const).map(p => (
              <button
                key={p}
                onClick={() => setParty(p)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.12em] transition-all duration-200 cursor-pointer ${
                  party === p
                    ? p === "D" ? "bg-blue-600 text-white" : p === "R" ? "bg-red-600 text-white" : "bg-[var(--accent)] text-white"
                    : "bg-white text-[var(--muted)] ring-1 ring-black/8 hover:ring-[var(--accent)]"
                }`}
              >
                {p === "All" ? "All Parties" : p === "D" ? "Democrat" : "Republican"}
              </button>
            ))}

            <span className="text-[11px] text-[var(--muted)] ml-2">{rows.length} officials</span>
          </div>
        </div>

        {/* Leaderboard table */}
        <div className="rounded-[1.75rem] bg-white/60 ring-1 ring-black/8 p-[5px] overflow-hidden">
          <div className="rounded-[1.35rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] overflow-hidden">

            {/* Table header */}
            <div className="grid items-center px-5 py-3 border-b border-[var(--border)] text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]"
              style={{ gridTemplateColumns: "2.5rem 2.5rem 1fr 6rem 5.5rem 5.5rem 5.5rem 5.5rem 5.5rem" }}>
              <span>#</span>
              <span></span>
              <span>Name</span>
              <span className="text-right">OVR</span>
              {STAT_META.slice(1).map(s => (
                <span key={s.key} className="text-center" style={{ color: sortBy === s.key ? s.color : undefined }}>{s.abbr}</span>
              ))}
            </div>

            {/* Rows */}
            {rows.map((r, idx) => {
              const { pol, stats } = r;
              const partyColor = pol.party === "D" ? "#1d4ed8" : pol.party === "R" ? "#dc2626" : "#6b7280";
              const isTop = idx === 0;
              return (
                <Link
                  key={pol.slug}
                  href={`/politicians/${pol.slug}`}
                  className={`grid items-center px-5 py-3.5 border-b border-[var(--border)] last:border-0 cursor-pointer transition-all duration-200 hover:bg-[var(--accent)]/4 group ${isTop ? "bg-amber-50/60" : ""}`}
                  style={{ gridTemplateColumns: "2.5rem 2.5rem 1fr 6rem 5.5rem 5.5rem 5.5rem 5.5rem 5.5rem" }}
                >
                  {/* Rank */}
                  <span className={`text-sm font-black tabular-nums ${
                    idx === 0 ? "text-amber-500" :
                    idx === 1 ? "text-slate-400" :
                    idx === 2 ? "text-orange-400" : "text-[var(--muted)]"
                  }`}>
                    {idx === 0 ? "1" : idx === 1 ? "2" : idx === 2 ? "3" : idx + 1}
                  </span>

                  {/* Photo */}
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0" style={{ outline: `2px solid ${partyColor}`, outlineOffset: "1px" }}>
                    {pol.photo ? (
                      <img src={pol.photo} alt={pol.name} className="w-full h-full object-cover object-top" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white" style={{ background: partyColor }}>
                        {pol.name[0]}
                      </div>
                    )}
                  </div>

                  {/* Name + office */}
                  <div className="min-w-0 pr-4">
                    <p className="font-bold text-sm text-[var(--accent)] truncate group-hover:text-[var(--accent-light)] transition-colors"
                      style={{ fontFamily: "var(--font-playfair), serif" }}>
                      {pol.name}
                    </p>
                    <p className="text-[10px] text-[var(--muted)] truncate">{pol.office} · {pol.district}</p>
                    <div className="mt-0.5">
                      <OvrBadge ovr={stats.ovr} />
                    </div>
                  </div>

                  {/* OVR: big */}
                  <div className="text-right">
                    <span className={`text-2xl font-black tabular-nums leading-none ${
                      stats.ovr >= 85 ? "text-amber-500" :
                      stats.ovr >= 70 ? "text-emerald-600" : "text-[var(--accent)]"
                    }`} style={{ fontFamily: "var(--font-playfair), serif" }}>
                      {stats.ovr}
                    </span>
                  </div>

                  {/* Individual stat bars */}
                  {(["warChest", "lawmaker", "influence", "access", "tenure"] as const).map(k => {
                    const meta = STAT_META.find(m => m.key === k)!;
                    return (
                      <div key={k} className="px-1">
                        <StatBar value={stats[k]} color={meta.color} />
                      </div>
                    );
                  })}
                </Link>
              );
            })}
          </div>
        </div>

        {rows.length === 0 && (
          <p className="text-center text-[var(--muted)] py-16 text-sm">No officials match your filters.</p>
        )}

        {/* Legend */}
        <div className="mt-8 flex flex-wrap gap-4">
          {STAT_META.slice(1).map(s => (
            <div key={s.key} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
              <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-[0.1em]">{s.label}</span>
            </div>
          ))}
          <span className="text-[10px] text-[var(--muted)] ml-2">· Finance data loads live on individual profiles</span>
        </div>
      </div>
    </div>
  );
}
