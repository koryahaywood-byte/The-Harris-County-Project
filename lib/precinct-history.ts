// Client-side helpers for the historical precinct layer (the moat).
// Data: public/data/precinct-history.json — four cycles of precinct-level
// returns (2020/2022/2024 general + 2026 primary), voter registration,
// turnout, Spanish-surname voter registration (SSVR), and 2020 Census VAP
// demographics, all keyed to current Harris County precinct numbers.

export interface HistCandidate { name: string; party: string; surnameOrigin: string | null }
export interface HistRace { label: string; candidates: HistCandidate[]; votes: Record<string, number[]> }
export interface HistVoter { reg: number; turnout: number; ssvr: number; ssto: number }
export interface HistCycle {
  label: string;
  races?: Record<string, HistRace>;
  voter?: Record<string, HistVoter>;
  primary?: Record<string, { dem: number; rep: number }>;
}
export interface PrecinctHistory {
  builtAt: string;
  source: string;
  cycles: Record<string, HistCycle>;
  demographics: Record<string, { vap: number; anglo: number; black: number; hisp: number; asian: number }>;
  meta: Record<string, { vtds: number; joinedToCurrent: number }>;
}

let cache: Promise<PrecinctHistory> | null = null;
export function loadHistory(): Promise<PrecinctHistory> {
  if (!cache) cache = fetch("/data/precinct-history.json").then(r => r.json());
  return cache;
}

// Top-of-ticket race per general cycle
export const TOP_RACE: Record<string, string> = { "2020G": "president", "2022G": "governor", "2024G": "president" };
export const GENERAL_CYCLES = ["2020G", "2022G", "2024G"];

function dRIndices(race: HistRace): { d: number; r: number } {
  return { d: race.candidates.findIndex(c => c.party === "D"), r: race.candidates.findIndex(c => c.party === "R") };
}

export interface CycleAggregate {
  cycle: string;
  label: string;
  year: number;
  dShare: number;        // D ÷ (D+R), top-of-ticket
  dVotes: number;
  rVotes: number;
  turnoutRate: number;   // ballots ÷ registered
  ssvrShare: number;     // Spanish-surname registration ÷ registration
}

// Aggregate the general cycles over a set of precincts (or all when null).
export function aggregateGenerals(h: PrecinctHistory, precincts: Set<string> | null): CycleAggregate[] {
  return GENERAL_CYCLES.map(key => {
    const cyc = h.cycles[key];
    const race = cyc.races![TOP_RACE[key]];
    const { d, r } = dRIndices(race);
    let dv = 0, rv = 0, reg = 0, to = 0, ssvr = 0;
    for (const [prec, votes] of Object.entries(race.votes)) {
      if (precincts && !precincts.has(prec)) continue;
      dv += votes[d] ?? 0; rv += votes[r] ?? 0;
      const v = cyc.voter![prec];
      if (v) { reg += v.reg; to += v.turnout; ssvr += v.ssvr; }
    }
    return {
      cycle: key, label: cyc.label, year: parseInt(key), dShare: dv + rv ? dv / (dv + rv) : 0,
      dVotes: dv, rVotes: rv,
      turnoutRate: reg ? to / reg : 0, ssvrShare: reg ? ssvr / reg : 0,
    };
  });
}

export function primaryAggregate(h: PrecinctHistory, precincts: Set<string> | null) {
  const p = h.cycles["2026P"]?.primary ?? {};
  let dem = 0, rep = 0;
  for (const [prec, v] of Object.entries(p)) {
    if (precincts && !precincts.has(prec)) continue;
    dem += v.dem; rep += v.rep;
  }
  return { dem, rep, dShare: dem + rep ? dem / (dem + rep) : 0 };
}

// Least-squares linear trend → slope per cycle-year + projection
export function linearTrend(points: { x: number; y: number }[]): { slope: number; intercept: number; predict: (x: number) => number } {
  const n = points.length;
  const sx = points.reduce((s, p) => s + p.x, 0), sy = points.reduce((s, p) => s + p.y, 0);
  const sxx = points.reduce((s, p) => s + p.x * p.x, 0), sxy = points.reduce((s, p) => s + p.x * p.y, 0);
  const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx || 1);
  const intercept = (sy - slope * sx) / n;
  return { slope, intercept, predict: (x: number) => slope * x + intercept };
}

// Per-precinct point for the combined view: demographics × turnout × performance
export interface CombinedPoint {
  prec: string;
  hispShare: number;   // Hispanic VAP share (2020 Census)
  blackShare: number;
  dShare24: number;    // 2024 president D ÷ (D+R)
  turnout24: number;   // 2024 turnout ÷ registration
  ssvr24: number;
  trendSlope: number;  // D-share change per cycle across 2020→2024 (per 2 years)
}

export function combinedPoints(h: PrecinctHistory, precincts: Set<string> | null): CombinedPoint[] {
  const out: CombinedPoint[] = [];
  const r24 = h.cycles["2024G"].races!["president"];
  const i24 = dRIndices(r24);
  const perCycle = GENERAL_CYCLES.map(key => {
    const race = h.cycles[key].races![TOP_RACE[key]];
    return { key, race, idx: dRIndices(race) };
  });

  for (const [prec, votes] of Object.entries(r24.votes)) {
    if (precincts && !precincts.has(prec)) continue;
    const demo = h.demographics[prec];
    const v24 = h.cycles["2024G"].voter![prec];
    if (!demo || !demo.vap || !v24?.reg) continue;
    const d = votes[i24.d] ?? 0, r = votes[i24.r] ?? 0;
    if (d + r < 25) continue; // skip tiny precincts — share is noise

    const series = perCycle.map(({ key, race, idx }) => {
      const vv = race.votes[prec];
      if (!vv) return null;
      const dd = vv[idx.d] ?? 0, rr = vv[idx.r] ?? 0;
      return dd + rr >= 25 ? { x: parseInt(key), y: dd / (dd + rr) } : null;
    }).filter((p): p is { x: number; y: number } => p !== null);

    out.push({
      prec,
      hispShare: demo.hisp / demo.vap,
      blackShare: demo.black / demo.vap,
      dShare24: d / (d + r),
      turnout24: Math.min(1, v24.turnout / v24.reg),
      ssvr24: v24.ssvr / v24.reg,
      trendSlope: series.length >= 2 ? linearTrend(series).slope * 2 : 0, // per 2-year cycle
    });
  }
  return out;
}

// Surname-origin performance: same-ballot differential between the
// Spanish-origin-surname candidate and their European-surname running mate
// (2024: Cruz R vs Trump R), bucketed by precinct SSVR share. The pairing
// holds party constant, isolating the surname/candidate variable as far as
// a two-way race allows.
export interface SurnameBucket {
  label: string;
  precincts: number;
  cruzShare: number;     // Cruz ÷ (Cruz+Allred)
  trumpShare: number;    // Trump ÷ (Trump+Harris)
  differential: number;  // cruzShare − trumpShare (pp)
  allredShare: number;
  harrisShare: number;
}

export function surnameAnalysis(h: PrecinctHistory, precincts: Set<string> | null): SurnameBucket[] {
  const pres = h.cycles["2024G"].races!["president"];
  const sen = h.cycles["2024G"].races!["senate"];
  const pi = dRIndices(pres), si = dRIndices(sen);
  const buckets = [
    { label: "Under 10% SSVR", min: 0, max: 0.10 },
    { label: "10–25% SSVR", min: 0.10, max: 0.25 },
    { label: "25–45% SSVR", min: 0.25, max: 0.45 },
    { label: "45%+ SSVR", min: 0.45, max: 1.01 },
  ].map(b => ({ ...b, n: 0, cruz: 0, allred: 0, trump: 0, harris: 0 }));

  for (const [prec, sv] of Object.entries(sen.votes)) {
    if (precincts && !precincts.has(prec)) continue;
    const pv = pres.votes[prec];
    const voter = h.cycles["2024G"].voter![prec];
    if (!pv || !voter?.reg) continue;
    const cruz = sv[si.r] ?? 0, allred = sv[si.d] ?? 0;
    const trump = pv[pi.r] ?? 0, harris = pv[pi.d] ?? 0;
    if (cruz + allred < 25 || trump + harris < 25) continue;
    const ssvr = voter.ssvr / voter.reg;
    const b = buckets.find(b => ssvr >= b.min && ssvr < b.max);
    if (!b) continue;
    b.n++; b.cruz += cruz; b.allred += allred; b.trump += trump; b.harris += harris;
  }

  return buckets.filter(b => b.n >= 3).map(b => ({
    label: b.label,
    precincts: b.n,
    cruzShare: b.cruz / (b.cruz + b.allred),
    trumpShare: b.trump / (b.trump + b.harris),
    differential: b.cruz / (b.cruz + b.allred) - b.trump / (b.trump + b.harris),
    allredShare: b.allred / (b.cruz + b.allred),
    harrisShare: b.harris / (b.trump + b.harris),
  }));
}

// Resolve a Districts-tool selection to the precinct set it covers.
export function precinctSetFor(
  crosswalk: Record<string, Record<string, string | undefined>>,
  field: string | null,
  value: string | null
): Set<string> | null {
  if (!field || !value) return null;
  const s = new Set<string>();
  for (const [prec, entry] of Object.entries(crosswalk)) {
    if (entry[field] === value) s.add(prec);
  }
  return s;
}
