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
import { useUrlState, readUrlParams } from "@/lib/useUrlState";
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
interface SeriesPoint { year: number; dPct: number } // two-party D share, one decimal
interface HdHistory { last: LastResult; series: SeriesPoint[] }

// Two-party D share of a race, one decimal; null when either major party is absent.
function twoPartyD(race: RaceData): number | null {
  const dIdx = race.candidates.findIndex(c => c.party === "D");
  const rIdx = race.candidates.findIndex(c => c.party === "R");
  if (dIdx < 0 || rIdx < 0) return null;
  let d = 0, r = 0;
  for (const v of Object.values(race.votes)) { d += v[dIdx] ?? 0; r += v[rIdx] ?? 0; }
  const total = d + r;
  if (!total) return null;
  return Math.round((d / total) * 1000) / 10;
}
// Every contested general on file for each HD, oldest→newest, plus the most
// recent one broken out as the card's result bar.
function buildHdHistory(dr: DistrictRaces): Record<string, HdHistory> {
  const out: Record<string, HdHistory> = {};
  for (const [hd, cycles] of Object.entries(dr.hd ?? {})) {
    const series: SeriesPoint[] = [];
    for (const cy of Object.keys(cycles).filter(c => c.endsWith("G")).sort()) {
      const race = Object.values(cycles[cy])[0]; if (!race) continue;
      const dPct = twoPartyD(race); if (dPct == null) continue;
      series.push({ year: Number(cy.slice(0, 4)), dPct });
    }
    if (!series.length) continue;
    const newest = series[series.length - 1];
    const dRound = Math.round(newest.dPct);
    out[`HD-${hd}`] = { series, last: { dPct: dRound, rPct: 100 - dRound, cycle: String(newest.year) } };
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
const financeOf = (name: string): { cash: number; asOf?: string } => {
  const f = FINANCE_DATA_MERGED.find(c => c.name === name);
  return { cash: f?.cash ?? 0, asOf: f?.asOf };
};

// Full-chamber split, 89th Legislature: 88 R, 62 D (Texas Legislative Reference
// Library party list for the 89th; Ballotpedia still shows 88-62 as of Apr 2026).
const CHAMBER_R = 88;
const CHAMBER_D = 62;
const MAJORITY = 76;
const NET_FLIPS_FOR_CONTROL = MAJORITY - CHAMBER_D; // 14

type Sort = "rating" | "margin" | "cash" | "district";
const SORT_KEYS: Sort[] = ["rating", "margin", "cash", "district"];
const URL_DEFAULTS = { sort: "rating", bg: "0" };

export default function TxHouse2026() {
  const [history, setHistory] = useState<Record<string, HdHistory>>({});
  const [sort, setSort] = useState<Sort>("rating");
  const [bgOnly, setBgOnly] = useState(false);

  useEffect(() => {
    fetch("/data/district-races.json")
      .then(r => r.json())
      .then((dr: DistrictRaces) => setHistory(buildHdHistory(dr)))
      .catch(() => {});
  }, []);

  // Restore ?sort= / ?bg=1 from a shared link, then mirror changes back out.
  useEffect(() => {
    const p = readUrlParams(["sort", "bg"]);
    if (p.sort && (SORT_KEYS as string[]).includes(p.sort)) setSort(p.sort as Sort);
    if (p.bg === "1") setBgOnly(true);
  }, []);
  useUrlState({ sort, bg: bgOnly ? "1" : "0" }, URL_DEFAULTS);

  const seats = useMemo(() => {
    const list = Object.entries(MATCHUPS_2026)
      .filter(([k, m]) => k.startsWith("HD-") && m.lean)
      .map(([key, m]) => {
        const lean = m.lean!;
        const num = key.replace("HD-", "");
        const d = m.sides.find(s => s.party === "D");
        const r = m.sides.find(s => s.party === "R");
        const df = d ? financeOf(d.name) : undefined;
        const rf = r ? financeOf(r.name) : undefined;
        const h = history[key];
        return {
          key, num: Number(num), lean, matchup: m, locale: localeOf(m),
          d, r,
          dCash: df?.cash ?? 0, dAsOf: df?.asOf,
          rCash: rf?.cash ?? 0, rAsOf: rf?.asOf,
          result: h?.last,
          series: h?.series ?? [],
          battleground: BATTLEGROUND.includes(lean),
        };
      });
    return list;
  }, [history]);

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
    if (bgOnly) list = list.filter(s => s.battleground);
    const dMargin = (s: Seat) => (s.result ? s.result.dPct - s.result.rPct : -Infinity);
    const cashGap = (s: Seat) => Math.abs(s.dCash - s.rCash);
    list = [...list].sort((a, b) => {
      if (sort === "district") return a.num - b.num;
      if (sort === "margin") return dMargin(b) - dMargin(a) || a.num - b.num;
      if (sort === "cash") return cashGap(b) - cashGap(a) || a.num - b.num;
      return (LEAN_RANK[a.lean] - LEAN_RANK[b.lean]) || (a.num - b.num);
    });
    return list;
  }, [seats, sort, bgOnly]);

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
          already settled by partisan lean. The remaining <b>{tally.battleground}</b> swing seats decide
          how much weight the county throws behind a 76-seat majority.
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
          <p className="text-[11.5px] mt-3 pt-3 border-t" style={{ borderColor: "#f1f5f9", color: "#475569" }}>
            Chamber today: <b style={{ color: "#dc2626" }}>R {CHAMBER_R}</b> – <b style={{ color: "#2563eb" }}>D {CHAMBER_D}</b>.
            Flipping a net <b>{NET_FLIPS_FOR_CONTROL}</b> seats changes control of the 150-seat House.
            Harris County alone holds <b style={{ color: "#7c3aed" }}>{tally.battleground}</b> of the battlegrounds.
          </p>
        </div>

        {/* Controls: sort lane + battleground toggle, mirrored into ?sort= / ?bg=1 */}
        <div className="flex flex-wrap items-center gap-2 mt-6 mb-4">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] mr-1" style={{ color: "#9ca3af" }}>Sort</span>
          <Pill active={sort === "rating"} onClick={() => setSort("rating")}>Closest rating first</Pill>
          <Pill active={sort === "margin"} onClick={() => setSort("margin")}>Best last D margin</Pill>
          <Pill active={sort === "cash"} onClick={() => setSort("cash")}>Biggest cash gap</Pill>
          <Pill active={sort === "district"} onClick={() => setSort("district")}>District #</Pill>
          <span className="w-px h-5 mx-1" style={{ background: "#e2e8f0" }} />
          <Pill active={bgOnly} onClick={() => setBgOnly(v => !v)}>
            Battlegrounds only{bgOnly ? ` (${tally.battleground})` : ""}
          </Pill>
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

        {/* Methodology */}
        <div className="mt-6 px-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1.5" style={{ color: "#9ca3af" }}>
            Where the numbers come from
          </p>
          <p className="text-[11.5px] leading-relaxed max-w-2xl" style={{ color: "#6b7280" }}>
            Ratings are editorial calls set by hand in our 2026 matchup file, not the output of a model.
            Result bars and trend lines come from Harris County precinct returns, using each seat&apos;s most
            recent contested two-party general election with the cycle labeled on the bar. Cash on hand comes
            from campaign finance reports we track, current as of the filing date shown when you hover a figure.
          </p>
        </div>

        <RelatedTools current="/tools/tx-house" />
      </div>
    </main>
  );
}

// ── Sparkline: two-party D share per contested general, oldest→newest ─────────
function Sparkline({ series }: { series: SeriesPoint[] }) {
  const W = 60, H = 18, PAD = 2.5;
  const vals = series.map(p => p.dPct);
  let lo = Math.min(...vals), hi = Math.max(...vals);
  const pad = Math.max((10 - (hi - lo)) / 2, 1.5); // keep flat runs from filling the frame
  lo -= pad; hi += pad;
  const x = (i: number) => PAD + (i / (series.length - 1)) * (W - 2 * PAD);
  const y = (v: number) => PAD + (1 - (v - lo) / (hi - lo)) * (H - 2 * PAD);
  const pts = series.map((p, i) => `${x(i).toFixed(1)},${y(p.dPct).toFixed(1)}`).join(" ");
  const first = series[0], last = series[series.length - 1];
  const title = `Two-party D share. ${series.map(p => `${p.year}: ${p.dPct}%`).join(" · ")}`;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="shrink-0" role="img" aria-label={title}>
      <title>{title}</title>
      {lo < 50 && hi > 50 && (
        <line x1={PAD} x2={W - PAD} y1={y(50)} y2={y(50)} stroke="#e2e8f0" strokeWidth={1} strokeDasharray="2 2" />
      )}
      <polyline points={pts} fill="none" stroke="#2563eb" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(0)} cy={y(first.dPct)} r={1.7} fill="#93c5fd" />
      <circle cx={x(series.length - 1)} cy={y(last.dPct)} r={2} fill="#2563eb" />
    </svg>
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
  dAsOf?: string; rAsOf?: string;
  result?: LastResult;
  series: SeriesPoint[];
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
        <CandidateLine side={seat.d} cash={seat.dCash} asOf={seat.dAsOf} accent="#2563eb" letter="D" />
        <CandidateLine side={seat.r} cash={seat.rCash} asOf={seat.rAsOf} accent="#dc2626" letter="R" />
      </div>

      {/* Last contested general result */}
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

      {/* D-share trend across every contested general on file */}
      {seat.series.length >= 2 && (
        <div className="flex items-center gap-2 mt-2.5">
          <Sparkline series={seat.series} />
          <span className="text-[9.5px] font-semibold" style={{ color: "#94a3b8" }}>
            D share {seat.series[0].year}→{seat.series[seat.series.length - 1].year}:{" "}
            <b style={{ color: trendDelta(seat.series) >= 0 ? "#2563eb" : "#dc2626" }}>
              {trendDelta(seat.series) >= 0 ? "+" : ""}{trendDelta(seat.series).toFixed(1)} pts
            </b>
          </span>
        </div>
      )}
    </div>
  );
}

const trendDelta = (s: SeriesPoint[]): number =>
  Math.round((s[s.length - 1].dPct - s[0].dPct) * 10) / 10;

function CandidateLine({ side, cash, asOf, accent, letter }:
  { side: Matchup["sides"][number] | undefined; cash: number; asOf?: string; accent: string; letter: "D" | "R" }) {
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
          title={asOf ? `Cash on hand, filed ${asOf}` : undefined}
          className="text-[10.5px] font-bold hover:opacity-70 shrink-0" style={{ color: accent }}>
          {fmt(cash)}
        </Link>
      ) : (
        <span className="text-[10px] shrink-0" style={{ color: "#cbd5e1" }}>—</span>
      )}
    </div>
  );
}
