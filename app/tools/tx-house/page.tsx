"use client";

// Texas House 2026 — Harris County board.
// A focused, scannable face-off view of Harris County's 24 state-house seats:
// rating, candidates, last general result, and the cash duel — all from data
// the project already carries (matchups-2026, district-races.json, campaign-finance).
// Inspired by allied dashboards (texdem.org, hcprimarydashboard.com,
// victorylabconsulting.com/TXHD); rebuilt native so it lives on-brand and links
// straight into the rest of the toolbox.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MATCHUPS_2026, type RaceLean, type Matchup } from "@/lib/matchups-2026";
import { FINANCE_DATA_MERGED, fmt } from "@/lib/campaign-finance";
import RelatedTools from "@/components/RelatedTools";

const LEAN_LABEL: Record<RaceLean, string> = {
  "safe-d": "Safe D", "likely-d": "Likely D", "lean-d": "Lean D",
  "toss-up": "Toss-up",
  "lean-r": "Lean R", "likely-r": "Likely R", "safe-r": "Safe R",
  "uncontested-d": "Uncontested D", "uncontested-r": "Uncontested R",
};
// Visual lane: safe D (left) → toss-up (center) → safe R (right)
const LEAN_LANE: Record<RaceLean, number> = {
  "uncontested-d": 4, "safe-d": 12, "likely-d": 26, "lean-d": 40,
  "toss-up": 50,
  "lean-r": 60, "likely-r": 74, "safe-r": 88, "uncontested-r": 96,
};
// Competitiveness ordering: most contested first.
const LEAN_RANK: Record<RaceLean, number> = {
  "toss-up": 0, "lean-r": 1, "lean-d": 1, "likely-r": 2, "likely-d": 2,
  "safe-r": 3, "safe-d": 3, "uncontested-r": 4, "uncontested-d": 4,
};
const BATTLEGROUND: RaceLean[] = ["toss-up", "lean-d", "lean-r"];

function leanColor(lean: RaceLean): string {
  if (lean.endsWith("-d")) return "#2563eb";
  if (lean.endsWith("-r")) return "#dc2626";
  return "#7c3aed";
}
function leanSide(lean: RaceLean): "D" | "R" | "T" {
  if (lean.endsWith("-d")) return "D";
  if (lean.endsWith("-r")) return "R";
  return "T";
}

// ── Precinct results → district D%/R% (same encoding ballot-2026 uses) ────────
type RaceData = { label: string; candidates: { name: string; party: string }[]; votes: Record<string, number[]> };
type DistrictRaces = { hd?: Record<string, Record<string, Record<string, RaceData>>> };
interface LastResult { dPct: number; rPct: number; cycle: string }

function sumRace(race: RaceData): { dPct: number; rPct: number } | null {
  const dIdx = race.candidates.findIndex(c => c.party === "D");
  const rIdx = race.candidates.findIndex(c => c.party === "R");
  if (dIdx < 0 || rIdx < 0) return null;
  let d = 0, r = 0;
  for (const v of Object.values(race.votes)) { d += v[dIdx] ?? 0; r += v[rIdx] ?? 0; }
  const total = d + r;
  if (!total) return null;
  return { dPct: Math.round((d / total) * 100), rPct: Math.round((r / total) * 100) };
}
function buildHdResults(dr: DistrictRaces): Record<string, LastResult> {
  const out: Record<string, LastResult> = {};
  for (const [hd, cycles] of Object.entries(dr.hd ?? {})) {
    for (const cy of ["2024G", "2022G", "2020G", "2018G", "2016G"]) {
      const c = cycles[cy]; if (!c) continue;
      const race = Object.values(c)[0]; if (!race) continue;
      const r = sumRace(race); if (!r) continue;
      out[`HD-${hd}`] = { ...r, cycle: cy.replace("G", "") }; break;
    }
  }
  return out;
}

// Details carry several parentheticals — a party letter "(R)", vote ranges,
// bio asides — alongside the geography. Pick the one that reads as a place.
const localeOf = (m: Matchup): string => {
  if (!m.detail) return "";
  for (const raw of [...m.detail.matchAll(/\(([^)]+)\)/g)].map(x => x[1])) {
    const s = raw.replace(/^HD-\d+,\s*/, "").trim();
    if (/^[DR]$/.test(s)) continue;                 // party tag
    if (/%/.test(s) || /\d+\s*[–-]\s*\d+/.test(s)) continue;  // percentages, vote ranges
    if (/^(lost|won|former|previously|ran|seeking)/i.test(s)) continue; // bio aside
    return s;
  }
  return "";
};
const cashOf = (name: string): number => {
  const f = FINANCE_DATA_MERGED.find(c => c.name === name);
  return f?.cash ?? 0;
};

type Sort = "competitive" | "district";
type Filter = "all" | "battleground";

export default function TxHouse2026() {
  const [results, setResults] = useState<Record<string, LastResult>>({});
  const [sort, setSort] = useState<Sort>("competitive");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    fetch("/data/district-races.json")
      .then(r => r.json())
      .then((dr: DistrictRaces) => setResults(buildHdResults(dr)))
      .catch(() => {});
  }, []);

  const seats = useMemo(() => {
    const list = Object.entries(MATCHUPS_2026)
      .filter(([k, m]) => k.startsWith("HD-") && m.lean)
      .map(([key, m]) => {
        const lean = m.lean!;
        const num = key.replace("HD-", "");
        const d = m.sides.find(s => s.party === "D");
        const r = m.sides.find(s => s.party === "R");
        return {
          key, num: Number(num), lean, matchup: m, locale: localeOf(m),
          d, r,
          dCash: d ? cashOf(d.name) : 0,
          rCash: r ? cashOf(r.name) : 0,
          result: results[key],
          battleground: BATTLEGROUND.includes(lean),
        };
      });
    return list;
  }, [results]);

  const tally = useMemo(() => {
    const t = { d: 0, t: 0, r: 0, battleground: 0 };
    for (const s of seats) {
      const side = leanSide(s.lean);
      if (side === "D") t.d++; else if (side === "R") t.r++; else t.t++;
      if (s.battleground) t.battleground++;
    }
    return t;
  }, [seats]);

  const shown = useMemo(() => {
    let list = seats;
    if (filter === "battleground") list = list.filter(s => s.battleground);
    list = [...list].sort((a, b) =>
      sort === "district"
        ? a.num - b.num
        : (LEAN_RANK[a.lean] - LEAN_RANK[b.lean]) || (a.num - b.num)
    );
    return list;
  }, [seats, sort, filter]);

  const decided = seats.length - tally.battleground;

  return (
    <main className="min-h-screen" style={{ background: "#f2f5f9" }}>
      <div className="max-w-5xl mx-auto px-5 sm:px-6 py-10">
        {/* Header */}
        <Link href="/tools/ballot-2026" className="text-[11px] font-semibold hover:opacity-70" style={{ color: "#1a3a5c" }}>
          ← Back to the 2026 ballot
        </Link>
        <h1 className="font-black mt-3 leading-tight" style={{ color: "#1a3a5c", fontSize: "clamp(26px,5vw,40px)" }}>
          Texas House 2026
        </h1>
        <p className="text-[13px] sm:text-[15px] mt-1.5 max-w-2xl" style={{ color: "#475569" }}>
          Harris County anchors <b>{seats.length} of the 150</b> Texas House districts. {decided} are
          already settled by partisan lean — <b>{tally.battleground}</b> swing seats will decide how much
          weight the county throws behind a 76-seat majority.
        </p>

        {/* Seat tally bar */}
        <div className="hcp-card mt-6 p-5">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: "#94a3b8" }}>
            Harris County&apos;s {seats.length} seats, by current rating
          </p>
          <div className="flex h-9 rounded-md overflow-hidden text-white text-[12px] font-bold shadow-sm">
            {tally.d > 0 && (
              <div className="flex items-center justify-center" style={{ width: `${(tally.d / seats.length) * 100}%`, background: "#2563eb" }}>
                {tally.d} D
              </div>
            )}
            {tally.t > 0 && (
              <div className="flex items-center justify-center" style={{ width: `${(tally.t / seats.length) * 100}%`, background: "#7c3aed" }}>
                {tally.t}
              </div>
            )}
            {tally.r > 0 && (
              <div className="flex items-center justify-center" style={{ width: `${(tally.r / seats.length) * 100}%`, background: "#dc2626" }}>
                {tally.r} R
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 mt-3 text-[11px]" style={{ color: "#64748b" }}>
            <span><b style={{ color: "#2563eb" }}>{tally.d}</b> lean Democratic</span>
            <span><b style={{ color: "#dc2626" }}>{tally.r}</b> lean Republican</span>
            <span><b style={{ color: "#7c3aed" }}>{tally.battleground}</b> within reach either way</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2 mt-6 mb-4">
          <Pill active={sort === "competitive"} onClick={() => setSort("competitive")}>Closest first</Pill>
          <Pill active={sort === "district"} onClick={() => setSort("district")}>By district #</Pill>
          <span className="w-px h-5 mx-1" style={{ background: "#e2e8f0" }} />
          <Pill active={filter === "all"} onClick={() => setFilter("all")}>All {seats.length}</Pill>
          <Pill active={filter === "battleground"} onClick={() => setFilter("battleground")}>Battlegrounds only</Pill>
        </div>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 gap-3">
          {shown.map(s => <SeatCard key={s.key} seat={s} />)}
        </div>

        {/* Allied tools */}
        <div className="hcp-card mt-8 p-5">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: "#94a3b8" }}>Allied dashboards</p>
          <p className="text-[12px] mb-3" style={{ color: "#64748b" }}>
            Deeper statewide and precinct-level cuts, built by people in the work:
          </p>
          <div className="flex flex-wrap gap-2">
            <AllyLink href="https://victorylabconsulting.com/TXHD/" label="Victory Lab · all 150 TX House seats" />
            <AllyLink href="https://hcprimarydashboard.com/" label="HC Primary · live early-vote demographics" />
            <AllyLink href="https://texdem.org/precinct-dashboard-pro/" label="TexDem · precinct dashboard" />
          </div>
        </div>

        <RelatedTools current="/tools/tx-house" />
      </div>
    </main>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className="text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-colors"
      style={active
        ? { background: "#1a3a5c", color: "#fff", borderColor: "#1a3a5c" }
        : { background: "#fff", color: "#475569", borderColor: "#e2e8f0" }}>
      {children}
    </button>
  );
}

function AllyLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-colors hover:bg-[#1a3a5c] hover:text-white hover:border-[#1a3a5c]"
      style={{ color: "#374151", borderColor: "#e5e7eb", background: "#fff" }}>
      {label} ↗
    </a>
  );
}

interface Seat {
  key: string; num: number; lean: RaceLean; matchup: Matchup; locale: string;
  d?: Matchup["sides"][number];
  r?: Matchup["sides"][number];
  dCash: number; rCash: number;
  result?: LastResult;
  battleground: boolean;
}

function SeatCard({ seat }: { seat: Seat }) {
  const { lean, result } = seat;
  const lanePos = LEAN_LANE[lean];
  const lc = leanColor(lean);

  return (
    <div className="hcp-card p-4">
      {/* Top row: district + rating */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <div className="font-black text-[17px] leading-none" style={{ color: "#1a3a5c" }}>HD {seat.num}</div>
          {seat.locale && <div className="text-[10.5px] mt-1 truncate" style={{ color: "#94a3b8" }}>{seat.locale}</div>}
        </div>
        <span className="text-[10px] font-bold px-2 py-1 rounded shrink-0"
          style={{ background: lean.includes("-d") ? "#dbeafe" : lean.includes("-r") ? "#fee2e2" : "#f3e8ff", color: lc }}>
          {LEAN_LABEL[lean]}
        </span>
      </div>

      {/* Lean lane */}
      <div className="relative h-1.5 rounded-full overflow-hidden mb-3" style={{ background: "linear-gradient(90deg,#dbeafe,#e0d9f7,#fee2e2)" }}>
        <div className="absolute top-0 bottom-0 w-0.5 rounded-full" style={{ left: `${lanePos}%`, background: lc, transform: "translateX(-50%)", boxShadow: `0 0 4px ${lc}` }} />
      </div>

      {/* Candidates */}
      <div className="space-y-1.5 mb-3">
        <CandidateLine side={seat.d} cash={seat.dCash} accent="#2563eb" letter="D" />
        <CandidateLine side={seat.r} cash={seat.rCash} accent="#dc2626" letter="R" />
      </div>

      {/* Last general result */}
      {result ? (
        <div>
          <div className="flex items-center justify-between text-[9px] font-bold mb-1">
            <span style={{ color: "#2563eb" }}>D {result.dPct}%</span>
            <span className="font-semibold" style={{ color: "#94a3b8" }}>{result.cycle} state-house result</span>
            <span style={{ color: "#dc2626" }}>{result.rPct}% R</span>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden">
            <div className="h-full" style={{ width: `${result.dPct}%`, background: "#2563eb" }} />
            <div className="h-full" style={{ width: `${result.rPct}%`, background: "#dc2626" }} />
          </div>
        </div>
      ) : (
        <div className="text-[9px]" style={{ color: "#cbd5e1" }}>No prior two-party result on file</div>
      )}
    </div>
  );
}

function CandidateLine({ side, cash, accent, letter }:
  { side: Matchup["sides"][number] | undefined; cash: number; accent: string; letter: "D" | "R" }) {
  if (!side) {
    return (
      <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "#cbd5e1" }}>
        <span className="text-[9px] font-black px-1.5 py-0.5 rounded text-white leading-none" style={{ background: "#cbd5e1" }}>{letter}</span>
        <span className="italic">no candidate filed</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <span className="text-[9px] font-black px-1.5 py-0.5 rounded text-white leading-none shrink-0" style={{ background: accent }}>{letter}</span>
      <span className="text-[12.5px] font-semibold truncate" style={{ color: "#111827" }}>{side.name}</span>
      {side.incumbent && (
        <span className="text-[8px] font-bold px-1 py-0.5 rounded leading-none shrink-0" style={{ background: "#f5c542", color: "#2c3340" }}>INC</span>
      )}
      <span className="flex-1" />
      {cash > 0 ? (
        <Link href={`/tools/where-is-the-dough?tab=leaderboard&q=${encodeURIComponent(side.name)}`}
          className="text-[10.5px] font-bold hover:opacity-70 shrink-0" style={{ color: accent }}>
          {fmt(cash)}
        </Link>
      ) : (
        <span className="text-[10px] shrink-0" style={{ color: "#cbd5e1" }}>—</span>
      )}
    </div>
  );
}
