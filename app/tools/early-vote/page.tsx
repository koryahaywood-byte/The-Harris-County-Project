"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";

const EarlyVoteMap = dynamic(() => import("./EarlyVoteMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center rounded-2xl animate-pulse"
      style={{ height: 500, background: "#f0f4f8", border: "1px solid rgba(26,58,92,0.08)" }}>
      <p className="text-xs" style={{ color: "#9ca3af" }}>Loading map...</p>
    </div>
  ),
});

/* ── Types ────────────────────────────────────────────────────────────────── */
interface Race {
  id: string;
  label: string;
  category: string;
  candidates: { name: string; party: "D" | "R" | "NP" }[];
}

interface PrecintEVData {
  precinctId: string;
  totalVoted: number;
  demUniverse: number;     // registered voters with Dem primary history
  repUniverse: number;
  totalRegistered: number;
  demTurnoutPct: number;   // % of Dem universe who have voted early
  repTurnoutPct: number;
}

/* ── Demo races ───────────────────────────────────────────────────────────── */
const RACES: Race[] = [
  // Marquee statewide
  { id: "us-sen", label: "U.S. Senate", category: "Federal",
    candidates: [{ name: "James Talarico", party: "D" }, { name: "Ken Paxton", party: "R" }] },
  // Marquee county
  { id: "county-judge", label: "Harris County Judge", category: "County",
    candidates: [{ name: "Letitia Plummer", party: "D" }, { name: "Orlando Sanchez", party: "R" }] },
  // Congressional
  { id: "cd-07", label: "U.S. Rep CD-07", category: "Federal",
    candidates: [{ name: "Lizzie Fletcher", party: "D" }, { name: "Alexander Hale", party: "R" }] },
  { id: "cd-18", label: "U.S. Rep CD-18", category: "Federal",
    candidates: [{ name: "Christian Menefee", party: "D" }, { name: "Ronald D. Whitfield", party: "R" }] },
  // State Senate
  { id: "sd-15", label: "State Senator SD-15", category: "State",
    candidates: [{ name: "Molly Cook", party: "D" }] },
  // State House — contested
  { id: "hd-126", label: "State Rep HD-126", category: "State",
    candidates: [{ name: "Stefanie Bord", party: "D" }, { name: "Stan Stanart", party: "R" }] },
  { id: "hd-134", label: "State Rep HD-134", category: "State",
    candidates: [{ name: "Ann Johnson", party: "D" }] },
  { id: "hd-138", label: "State Rep HD-138", category: "State",
    candidates: [{ name: "Lacey Hull", party: "R" }] },
  { id: "hd-148", label: "State Rep HD-148", category: "State",
    candidates: [{ name: "Penny Morales Shaw", party: "D" }] },
  // County commissioners
  { id: "pct-1", label: "Commissioner PCT 1", category: "County",
    candidates: [{ name: "Rodney Ellis", party: "D" }] },
  { id: "pct-2", label: "Commissioner PCT 2", category: "County",
    candidates: [{ name: "Adrian Garcia", party: "D" }, { name: "Richard Vega", party: "R" }] },
  // JP contested
  { id: "jp-5", label: "Justice of the Peace PCT 5 PL 2", category: "County",
    candidates: [{ name: "Lisa Jefferson", party: "D" }, { name: "Mark Fury", party: "R" }] },
];

const CATEGORIES = ["All", "Federal", "State", "County", "City"];

/* ── Generate demo precinct EV data ──────────────────────────────────────── */
function genPrecinctEV(precinctId: string, daysPassed: number): PrecintEVData {
  const seed = precinctId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rnd = (min: number, max: number) => min + ((seed * 17 + min * 13) % (max - min));
  const totalReg = rnd(800, 4200);
  const demUni = Math.round(totalReg * (0.35 + (rnd(0, 40) / 100)));
  const repUni = Math.round(totalReg * (0.20 + (rnd(0, 25) / 100)));
  const evRate = Math.min(0.85, 0.02 * daysPassed + (rnd(0, 20) / 100));
  const demTurnout = Math.min(95, Math.round(evRate * (0.8 + rnd(0, 30) / 100) * 100));
  const repTurnout = Math.min(95, Math.round(evRate * (0.6 + rnd(0, 40) / 100) * 100));
  return {
    precinctId,
    totalRegistered: totalReg,
    demUniverse: demUni,
    repUniverse: repUni,
    totalVoted: Math.round((demUni * demTurnout / 100) + (repUni * repTurnout / 100)),
    demTurnoutPct: demTurnout,
    repTurnoutPct: repTurnout,
  };
}

/* ── Gauge component ─────────────────────────────────────────────────────── */
function TurnoutGauge({ label, pct, color, universe, voted }:
  { label: string; pct: number; color: string; universe: number; voted: number }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-[11px] font-semibold" style={{ color }}>{label}</span>
        <span className="text-[13px] font-bold" style={{ color }}>{pct}%</span>
      </div>
      <div className="rounded-full overflow-hidden" style={{ height: 8, background: "#f3f4f6" }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }} />
      </div>
      <p className="text-[10px] mt-1" style={{ color: "#9ca3af" }}>
        {voted.toLocaleString()} of {universe.toLocaleString()} universe voted
      </p>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────────────────────── */
export default function EarlyVotePage() {
  const [selectedRace, setSelectedRace] = useState<string>("county-judge");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [daysPassed, setDaysPassed] = useState(6); // simulate day 6 of early voting

  const race = RACES.find(r => r.id === selectedRace) ?? RACES[0];

  const filteredRaces = useMemo(() =>
    RACES.filter(r => selectedCategory === "All" || r.category === selectedCategory),
    [selectedCategory]
  );

  // Aggregate county-wide stats
  const totalDemVoted   = Math.round(2_100_000 * 0.38 * (daysPassed * 0.015 + 0.04));
  const totalDemUniverse = Math.round(2_100_000 * 0.38);
  const totalRepVoted   = Math.round(2_100_000 * 0.28 * (daysPassed * 0.011 + 0.03));
  const totalRepUniverse = Math.round(2_100_000 * 0.28);
  const demOverallPct   = Math.round((totalDemVoted / totalDemUniverse) * 100);
  const repOverallPct   = Math.round((totalRepVoted / totalRepUniverse) * 100);

  return (
    <div style={{ background: "#f5f3ef", minHeight: "100vh", fontFamily: "var(--font-outfit,sans-serif)" }}>

      {/* Hero */}
      <section className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#1a3a5c 0%,#0f2540 60%,#162e4a 100%)", paddingTop: "4rem", paddingBottom: "4rem" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 70% 60% at 80% 40%,rgba(37,99,168,0.18) 0%,transparent 70%)" }} />
        <div className="relative max-w-6xl mx-auto px-5">
          <p className="text-sky-300 text-xs font-bold uppercase tracking-[0.22em] mb-3">Elections · Early Vote</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-playfair,serif)" }}>
            Early Vote Tracker
          </h1>
          <p className="text-white/50 text-sm max-w-lg">
            Track who is voting early across Harris County precincts, cross-referenced against Democratic and Republican primary history — to gauge which side is turning out.
          </p>
          {/* Live demo banner */}
          <div className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold"
            style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.35)", color: "#fcd34d" }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#fcd34d" }} />
            Demo mode — no active election. Data is illustrative.
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-5 py-10">
        <div className="flex flex-col xl:flex-row gap-6">

          {/* Left: map + controls */}
          <div className="flex-1 min-w-0">

            {/* EV day simulator */}
            <div className="mb-5 rounded-[1.35rem] bg-white/70 ring-1 ring-black/8 p-[4px]">
              <div className="rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: "#6b7280" }}>
                  Simulate Early Vote Day
                </p>
                <div className="flex items-center gap-4">
                  <input
                    type="range" min={1} max={12} value={daysPassed}
                    onChange={e => setDaysPassed(Number(e.target.value))}
                    className="flex-1 accent-[#1a3a5c]"
                  />
                  <span className="text-sm font-bold w-20 text-right" style={{ color: "#1a3a5c" }}>
                    Day {daysPassed} of 12
                  </span>
                </div>
                <p className="text-[10px] mt-1" style={{ color: "#9ca3af" }}>
                  Harris County early voting runs 12 days before Election Day
                </p>
              </div>
            </div>

            {/* Race selector */}
            <div className="mb-4">
              <div className="flex flex-wrap gap-2 mb-3">
                {CATEGORIES.map(cat => (
                  <button key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className="rounded-full px-3 py-1 text-xs font-semibold transition-all duration-150"
                    style={{
                      background: selectedCategory === cat ? "#1a3a5c" : "#fff",
                      color:      selectedCategory === cat ? "#fff" : "#374151",
                      border:     `1.5px solid ${selectedCategory === cat ? "#1a3a5c" : "#e5e7eb"}`,
                    }}
                  >{cat}</button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {filteredRaces.map(r => (
                  <button key={r.id}
                    onClick={() => setSelectedRace(r.id)}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150"
                    style={{
                      background: selectedRace === r.id ? "#1a3a5c" : "#fff",
                      color:      selectedRace === r.id ? "#fff" : "#374151",
                      border:     `1.5px solid ${selectedRace === r.id ? "#1a3a5c" : "#e5e7eb"}`,
                    }}
                  >{r.label}</button>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mb-3 text-[11px]" style={{ color: "#6b7280" }}>
              <span className="font-semibold uppercase tracking-wider text-[10px]">Dem Universe Turnout:</span>
              {[
                { color: "#1e40af", label: "High (60%+)" },
                { color: "#60a5fa", label: "Mid (30–60%)" },
                { color: "#dbeafe", label: "Low (under 30%)" },
                { color: "#f3f4f6", label: "No data" },
              ].map(l => (
                <span key={l.label} className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-sm border border-black/10" style={{ background: l.color }} />
                  {l.label}
                </span>
              ))}
            </div>

            {/* Map */}
            <div className="rounded-[1.35rem] bg-white/70 ring-1 ring-black/8 p-[4px]">
              <div className="rounded-[1rem] overflow-hidden bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
                <EarlyVoteMap daysPassed={daysPassed} selectedRaceId={selectedRace} />
              </div>
            </div>

            {/* Data source note */}
            <div className="mt-4 rounded-xl px-4 py-3 text-[10px] leading-relaxed" style={{ background: "rgba(26,58,92,0.05)", color: "#6b7280" }}>
              <strong style={{ color: "#1a3a5c" }}>Live data hookup:</strong> During active elections, Harris County Clerk publishes daily early vote participation files at harrisvotes.com. The voter file (TEAM system, TX Sec. of State) provides party primary history. Precinct-level cross-reference powers the Dem vs. Rep universe gauge. This tool is built and ready to connect when an election is underway.
            </div>
          </div>

          {/* Right: race stats */}
          <div className="w-full xl:w-[340px] shrink-0 space-y-4">

            {/* Race header */}
            <div className="rounded-[1.35rem] bg-white/70 ring-1 ring-black/8 p-[4px]">
              <div className="rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1" style={{ color: "#2563a8" }}>
                  {race.category}
                </p>
                <h2 className="text-lg font-bold mb-3" style={{ fontFamily: "var(--font-playfair,serif)", color: "#1a3a5c" }}>
                  {race.label}
                </h2>
                {race.candidates.map(c => (
                  <div key={c.name} className="flex items-center gap-2 mb-1.5">
                    <span className="inline-block w-2 h-2 rounded-full"
                      style={{ background: c.party === "D" ? "#2563a8" : c.party === "R" ? "#dc2626" : "#9ca3af" }} />
                    <span className="text-sm font-medium" style={{ color: "#1a3a5c" }}>{c.name}</span>
                    <span className="text-[10px] rounded px-1.5 py-0.5 font-bold ml-auto"
                      style={{
                        background: c.party === "D" ? "#dbeafe" : c.party === "R" ? "#fee2e2" : "#f3f4f6",
                        color:      c.party === "D" ? "#1d4ed8" : c.party === "R" ? "#dc2626" : "#6b7280",
                      }}>
                      {c.party === "D" ? "Dem" : c.party === "R" ? "Rep" : "NP"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* County-wide turnout */}
            <div className="rounded-[1.35rem] bg-white/70 ring-1 ring-black/8 p-[4px]">
              <div className="rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-4" style={{ color: "#6b7280" }}>
                  County-Wide Turnout — Day {daysPassed}
                </p>
                <TurnoutGauge
                  label="Dem Primary Universe"
                  pct={demOverallPct}
                  color="#2563a8"
                  universe={totalDemUniverse}
                  voted={totalDemVoted}
                />
                <TurnoutGauge
                  label="Rep Primary Universe"
                  pct={repOverallPct}
                  color="#dc2626"
                  universe={totalRepUniverse}
                  voted={totalRepVoted}
                />
                <div className="mt-3 pt-3" style={{ borderTop: "1px solid #f3f4f6" }}>
                  <p className="text-[10px]" style={{ color: "#9ca3af" }}>
                    Total early ballots cast (est.): <strong style={{ color: "#1a3a5c" }}>{(totalDemVoted + totalRepVoted).toLocaleString()}</strong>
                  </p>
                  {demOverallPct > repOverallPct ? (
                    <p className="text-[11px] font-semibold mt-1" style={{ color: "#2563a8" }}>
                      Dem universe turning out at a higher rate — favorable indicator
                    </p>
                  ) : (
                    <p className="text-[11px] font-semibold mt-1" style={{ color: "#dc2626" }}>
                      Rep universe turning out at a higher rate — watch closely
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* What to watch */}
            <div className="rounded-[1.35rem] bg-white/70 ring-1 ring-black/8 p-[4px]">
              <div className="rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: "#6b7280" }}>
                  What This Measures
                </p>
                <ul className="space-y-2 text-[11px] leading-relaxed" style={{ color: "#374151" }}>
                  {[
                    "Dem Primary Universe: voters who cast a Democratic ballot in any of the last 4 primaries",
                    "Rep Primary Universe: voters who cast a Republican ballot in any of the last 4 primaries",
                    "Turnout %: how many from each universe have already voted early",
                    "Higher Dem turnout % = more Dem-leaning ballots already cast = favorable for Dem candidates",
                    "Gaps widen or close as election day approaches — watch daily trend",
                  ].map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="shrink-0 w-1 h-1 rounded-full mt-1.5" style={{ background: "#9ca3af" }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Coming features */}
            <div className="rounded-[1.35rem] bg-white/70 ring-1 ring-black/8 p-[4px]">
              <div className="rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: "#6b7280" }}>
                  When an Election is Live
                </p>
                <ul className="space-y-1.5 text-[11px]" style={{ color: "#374151" }}>
                  {[
                    "Daily EV file auto-ingested from harrisvotes.com",
                    "Real precinct-level turnout by universe",
                    "Daily delta — who jumped overnight",
                    "Trend line: is the Dem universe accelerating or stalling?",
                    "Split by race (each contest on the ballot)",
                  ].map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="shrink-0 text-[10px] font-bold" style={{ color: "#2563a8" }}>→</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
