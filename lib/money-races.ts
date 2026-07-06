// Race-centric view of 2026 campaign cash: joins MATCHUPS_2026 (set races
// with both a D and an R side) against finance records supplied by the caller,
// so live FEC/TEC overlays flow through. All imports here are read-only.

import { MATCHUPS_2026, type MatchupSide, type RaceLean } from "@/lib/matchups-2026";
import type { CandidateFinance } from "@/lib/campaign-finance";
import { POLITICIANS } from "@/lib/politicians";
import HISTORY_INDEX from "@/data/finance-history/index.json";

export type RaceGroup = "Statewide" | "Congress" | "Legislature" | "County" | "JP";

export const GROUP_ORDER: RaceGroup[] = ["Statewide", "Congress", "Legislature", "County", "JP"];

export interface DuelSide {
  name: string;
  party: "D" | "R";
  incumbent: boolean;
  /** null = no filing on record for this candidate */
  fin: CandidateFinance | null;
  /** /politicians/<slug> profile when the name matches lib/politicians.ts exactly */
  slug: string | null;
}

export interface MoneyRace {
  key: string;          // MATCHUPS_2026 key, e.g. "HD-134"
  office: string;
  lean?: RaceLean;
  group: RaceGroup;
  d: DuelSide;
  r: DuelSide;
  totalCash: number;    // combined cash on hand across both sides
}

export interface MoneyRacesResult {
  groups: { group: RaceGroup; races: MoneyRace[] }[];
  raceCount: number;      // duels rendered
  totalTracked: number;   // combined cash across all rendered duels
  noFilingCount: number;  // set D-vs-R races omitted: neither side has a filing
  topDuel: MoneyRace | null;
}

function groupOf(key: string): RaceGroup {
  if (key.startsWith("TX-")) return "Statewide";
  if (key.startsWith("US-") || key.startsWith("CD-")) return "Congress";
  if (key.startsWith("SD-") || key.startsWith("HD-")) return "Legislature";
  if (key.startsWith("JP-")) return "JP";
  return "County";
}

const SLUG_BY_NAME = new Map(POLITICIANS.map(p => [p.name, p.slug]));

/** A record counts as a filing when it reports any real number, not a bare stub. */
function hasFiling(fin: CandidateFinance | undefined): fin is CandidateFinance {
  return fin != null && (fin.cash > 0 || fin.raised != null || fin.spent != null);
}

export function buildMoneyRaces(finance: CandidateFinance[]): MoneyRacesResult {
  const finByName = new Map(finance.map(f => [f.name.toLowerCase(), f]));
  const races: MoneyRace[] = [];
  let noFilingCount = 0;

  for (const [key, m] of Object.entries(MATCHUPS_2026)) {
    if (m.status !== "set") continue;
    const dRaw = m.sides.find(s => s.party === "D");
    const rRaw = m.sides.find(s => s.party === "R");
    if (!dRaw || !rRaw) continue;

    const side = (s: MatchupSide): DuelSide => {
      const fin = finByName.get(s.name.toLowerCase());
      return {
        name: s.name,
        party: s.party,
        incumbent: s.incumbent,
        fin: hasFiling(fin) ? fin : null,
        slug: SLUG_BY_NAME.get(s.name) ?? null,
      };
    };

    const d = side(dRaw);
    const r = side(rRaw);
    if (!d.fin && !r.fin) { noFilingCount++; continue; }

    races.push({
      key,
      office: m.office,
      lean: m.lean,
      group: groupOf(key),
      d,
      r,
      totalCash: (d.fin?.cash ?? 0) + (r.fin?.cash ?? 0),
    });
  }

  const groups = GROUP_ORDER
    .map(group => ({
      group,
      races: races.filter(rc => rc.group === group).sort((a, b) => b.totalCash - a.totalCash),
    }))
    .filter(g => g.races.length > 0);

  const totalTracked = races.reduce((s, rc) => s + rc.totalCash, 0);
  const topDuel = races.reduce<MoneyRace | null>(
    (best, rc) => (!best || rc.totalCash > best.totalCash ? rc : best),
    null
  );

  return { groups, raceCount: races.length, totalTracked, noFilingCount, topDuel };
}

/* ── Movers: cash deltas between the two most recent snapshots ────────────── */

export interface Mover {
  name: string;
  office: string;
  party: string;
  prevCash: number;
  currCash: number;
  delta: number;
  fromPeriod: string;
  toPeriod: string;
}

interface SnapshotCandidate {
  name: string;
  office: string;
  party: string;
  cash: number;
}

interface Snapshot {
  period: string;
  capturedAt?: string;
  candidates: SnapshotCandidate[];
}

const HISTORY_PERIODS: string[] = (HISTORY_INDEX as { periods: string[] }).periods ?? [];

/**
 * Top candidates by |Δ cash on hand| between the two most recent finance
 * snapshots. With fewer than two periods on file (the current state of
 * data/finance-history) this resolves to [] and callers render nothing.
 */
export async function loadMovers(limit = 5): Promise<Mover[]> {
  const periods = [...HISTORY_PERIODS].sort();
  if (periods.length < 2) return [];
  const [fromPeriod, toPeriod] = periods.slice(-2);

  const [prev, curr] = await Promise.all([
    import(`../data/finance-history/${fromPeriod}.json`).then(m => (m.default ?? m) as Snapshot),
    import(`../data/finance-history/${toPeriod}.json`).then(m => (m.default ?? m) as Snapshot),
  ]);

  const prevByName = new Map(prev.candidates.map(c => [c.name.toLowerCase(), c]));
  const movers: Mover[] = [];
  for (const c of curr.candidates) {
    const p = prevByName.get(c.name.toLowerCase());
    if (!p || typeof c.cash !== "number" || typeof p.cash !== "number") continue;
    const delta = c.cash - p.cash;
    if (delta === 0) continue;
    movers.push({
      name: c.name,
      office: c.office,
      party: c.party,
      prevCash: p.cash,
      currCash: c.cash,
      delta,
      fromPeriod,
      toPeriod,
    });
  }

  return movers.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, limit);
}
