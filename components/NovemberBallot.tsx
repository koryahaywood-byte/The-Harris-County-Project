"use client";

// Personalized November 3, 2026 general-election ballot for /my-officials.
// Selects the user's district races out of MATCHUPS_2026 (CD/SD/HD, plus the
// user's JP place-2 race and commissioner precinct when they're up), then the
// statewide and countywide races every Harris County voter decides.
// Money resolves through FINANCE_DATA_MERGED via getFinanceByName at render.

import Link from "next/link";
import { MATCHUPS_2026, type Matchup, type MatchupSide } from "@/lib/matchups-2026";
import { getFinanceByName, fmt } from "@/lib/campaign-finance";

export interface BallotDistricts {
  cd?: string;
  sd?: string;
  hd?: string;
  jp?: string;
  pct?: string;
  council?: string;
}

// Shared lean badge palette. /my-officials imports this so the ballot rows and
// the official-card ballot links stay in sync.
export const LEAN_2026_META: Record<string, { label: string; color: string }> = {
  "safe-d":        { label: "Safe D",    color: "#1d4ed8" },
  "likely-d":      { label: "Likely D",  color: "#2563a8" },
  "lean-d":        { label: "Lean D",    color: "#3b82f6" },
  "toss-up":       { label: "Toss-up",   color: "#7c3aed" },
  "lean-r":        { label: "Lean R",    color: "#dc2626" },
  "likely-r":      { label: "Likely R",  color: "#dc2626" },
  "safe-r":        { label: "Safe R",    color: "#b91c1c" },
  "uncontested-d": { label: "Unopposed", color: "#1d4ed8" },
  "uncontested-r": { label: "Unopposed", color: "#b91c1c" },
};

const MARQUEE_KEYS = ["TX-Governor", "US-Senate", "HC-Countywide"];

export interface BallotRace {
  key: string;
  matchup: Matchup;
  group: "marquee" | "district" | "countywide";
}

// Countywide judicial races (district courts, county courts at law, probate)
// are on every ballot too but would triple the list; they get a counted
// pointer to /tools/ballot-2026 instead of rows.
const JUDICIAL_RACE_COUNT = Object.keys(MATCHUPS_2026).filter(k =>
  /^(Probate|CCL|DC)-/.test(k)
).length;

export function selectBallotRaces(districts: BallotDistricts): BallotRace[] {
  const races: BallotRace[] = [];
  const seen = new Set<string>();
  const push = (key: string, group: BallotRace["group"]) => {
    const matchup = MATCHUPS_2026[key];
    if (matchup && !seen.has(key)) {
      seen.add(key);
      races.push({ key, matchup, group });
    }
  };
  // Marquee: Governor, Senate, County Judge.
  for (const k of MARQUEE_KEYS) push(k, "marquee");
  // The user's district races. Only keys that exist are on the 2026 ballot.
  if (districts.cd) push(`CD-${districts.cd}`, "district");
  if (districts.sd) push(`SD-${districts.sd}`, "district");
  if (districts.hd) push(`HD-${districts.hd}`, "district");
  if (districts.jp) {
    for (const k of Object.keys(MATCHUPS_2026)) {
      if (k.startsWith(`JP-${districts.jp}-`)) push(k, "district");
    }
  }
  if (districts.pct) push(`PCT-${districts.pct}`, "district");
  // Countywide and statewide row offices everyone votes on: TX-/US-/HC- keys
  // with no district or precinct number. Marquee keys are already claimed.
  for (const k of Object.keys(MATCHUPS_2026)) {
    if (/^(TX|US|HC)-/.test(k) && !/\d/.test(k)) push(k, "countywide");
  }
  return races;
}

// "JP-2-PL2" → "JP 2", "PCT-4" → "PCT 4", "CD-18" stays "CD-18".
function districtChipLabel(key: string): string {
  const jp = key.match(/^JP-(\d+)-/);
  if (jp) return `JP ${jp[1]}`;
  const pct = key.match(/^PCT-(\d+)$/);
  if (pct) return `PCT ${pct[1]}`;
  return key;
}

function SideName({ side, party, status }: { side: MatchupSide | null; party: "D" | "R"; status: Matchup["status"] }) {
  if (!side) {
    return (
      <span className="text-[10px]" style={{ color: "#9ca3af" }}>
        {status === "set"
          ? `No ${party === "D" ? "Democrat" : "Republican"} filed`
          : `${party} nominee TBD`}
      </span>
    );
  }
  const accent = party === "D" ? "#2563a8" : "#dc2626";
  return (
    <span className="inline-flex items-center gap-1.5 min-w-0">
      <span className="text-[9px] font-black px-1 py-0.5 rounded text-white leading-none shrink-0" style={{ background: accent }}>
        {party}
      </span>
      <span className="text-[12px] font-semibold truncate" style={{ color: "#111827" }}>{side.name}</span>
      {side.incumbent && (
        <span className="text-[8px] font-bold px-1 py-0.5 rounded uppercase leading-none shrink-0"
          style={{ background: "#f3f4f6", color: "#6b7280" }}>
          Inc
        </span>
      )}
    </span>
  );
}

function RaceRow({ matchup }: { matchup: Matchup }) {
  const d = matchup.sides.find(s => s.party === "D") ?? null;
  const r = matchup.sides.find(s => s.party === "R") ?? null;
  const dFin = d ? getFinanceByName(d.name) : null;
  const rFin = r ? getFinanceByName(r.name) : null;
  const dCash = dFin && dFin.cash > 0 ? dFin.cash : 0;
  const rCash = rFin && rFin.cash > 0 ? rFin.cash : 0;
  const cashTotal = dCash + rCash;
  const dPct = cashTotal ? Math.round((dCash / cashTotal) * 100) : 0;
  const asOf = (dCash ? dFin?.asOf : null) ?? (rCash ? rFin?.asOf : null);
  const lean = matchup.lean ? LEAN_2026_META[matchup.lean] : null;

  return (
    <div className="px-4 py-3 border-t" style={{ borderColor: "#f3f4f6" }}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-wide min-w-0 truncate" style={{ color: "#1a3a5c" }}>
          {matchup.office}
        </p>
        {lean && (
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0"
            style={{ background: `${lean.color}14`, color: lean.color }}>
            {lean.label}
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5">
        <SideName side={d} party="D" status={matchup.status} />
        {d && r && <span className="text-[9px] font-bold shrink-0" style={{ color: "#d1d5db" }}>vs</span>}
        <SideName side={r} party="R" status={matchup.status} />
      </div>
      {/* Cash duel. Omitted entirely when neither side has a filing on record */}
      {cashTotal > 0 && (
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[9px] font-bold w-14 shrink-0 tnum" style={{ color: "#2563eb" }}>
            {dCash ? fmt(dCash) : "–"}
          </span>
          <div className="flex-1 h-1.5 rounded-full overflow-hidden flex" style={{ background: "#e5e7eb" }}>
            <div className="h-full" style={{ width: `${dPct}%`, background: "#93c5fd" }} />
            <div className="h-full" style={{ width: `${100 - dPct}%`, background: "#fca5a5" }} />
          </div>
          <span className="text-[9px] font-bold w-14 shrink-0 text-right tnum" style={{ color: "#dc2626" }}>
            {rCash ? fmt(rCash) : "–"}
          </span>
          <span className="text-[9px] shrink-0" style={{ color: "#9ca3af" }}>
            cash{asOf ? ` · ${asOf}` : ""}
          </span>
        </div>
      )}
    </div>
  );
}

function GroupHeader({ label }: { label: string }) {
  return (
    <p className="px-4 pt-3.5 pb-1 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "#9ca3af" }}>
      {label}
    </p>
  );
}

export default function NovemberBallot({ districts }: { districts: BallotDistricts }) {
  const races = selectBallotRaces(districts);
  if (races.length === 0) return null;

  const marquee = races.filter(x => x.group === "marquee");
  const districtRaces = races.filter(x => x.group === "district");
  const countywide = races.filter(x => x.group === "countywide");
  const districtLabel = districtRaces.map(x => districtChipLabel(x.key)).join(" · ");

  return (
    <section className="mb-8">
      <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
        <h2 className="text-lg font-bold" style={{ color: "#1a3a5c", fontFamily: "var(--font-playfair,serif)" }}>
          Your ballot on November 3, 2026
        </h2>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
          style={{ background: "rgba(37,99,168,0.08)", color: "#2563a8" }}>
          {races.length} races
        </span>
      </div>
      <div className="hcp-card overflow-hidden">
        <GroupHeader label="Top of the ticket" />
        {marquee.map(x => <RaceRow key={x.key} matchup={x.matchup} />)}
        {districtRaces.length > 0 && (
          <>
            <GroupHeader label={`Your districts: ${districtLabel}`} />
            {districtRaces.map(x => <RaceRow key={x.key} matchup={x.matchup} />)}
          </>
        )}
        {countywide.length > 0 && (
          <>
            <GroupHeader label="On every Harris County ballot" />
            {countywide.map(x => <RaceRow key={x.key} matchup={x.matchup} />)}
          </>
        )}
        {JUDICIAL_RACE_COUNT > 0 && (
          <div className="px-4 py-3 border-t" style={{ borderColor: "#f3f4f6", background: "#f9fafb" }}>
            <p className="text-[10px] leading-relaxed" style={{ color: "#6b7280" }}>
              Your countywide ballot also carries {JUDICIAL_RACE_COUNT} judicial races: district courts,
              county courts at law, and probate courts.{" "}
              <Link href="/tools/ballot-2026" className="font-bold hover:underline" style={{ color: "#2563a8" }}>
                Check every judicial matchup →
              </Link>
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
