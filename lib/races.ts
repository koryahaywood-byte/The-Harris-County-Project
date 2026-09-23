// Server-side race model. Joins every data source that describes a November
// 2026 race into one object so the front page, the race board, race pages and
// My Ballot all tell the same story:
//   ratings + sides  ← lib/matchups-2026.ts (single source of truth)
//   money            ← lib/campaign-finance.ts (static + pipeline merge)
//   stakes           ← lib/race-stakes.ts
//   photos/profiles  ← lib/politicians.ts
//   last result      ← public/data/district-races.json (county canvass)
// Read-only: nothing here writes data.

import fs from "fs";
import path from "path";
import { MATCHUPS_2026, type Matchup, type MatchupSide, type RaceLean } from "@/lib/matchups-2026";
import { getFinanceByName, type CandidateFinance } from "@/lib/campaign-finance";
import { STAKES } from "@/lib/race-stakes";
import { POLITICIANS } from "@/lib/politicians";
import { CANDIDATE_PHOTOS } from "@/lib/candidate-photos";
import { RATING, raceSlug } from "@/lib/ratings";

export type GroupId = "top" | "statewide" | "congress" | "legislature" | "county" | "courts" | "jp";

export const GROUPS: { id: GroupId; label: string; blurb: string }[] = [
  { id: "top",         label: "Top of the ticket", blurb: "U.S. Senate and Harris County Judge" },
  { id: "statewide",   label: "Statewide",         blurb: "Governor through Railroad Commission" },
  { id: "congress",    label: "Congress",          blurb: "U.S. House seats touching Harris County" },
  { id: "legislature", label: "Texas Legislature", blurb: "State Senate and State House" },
  { id: "county",      label: "Harris County",     blurb: "Commissioners and countywide offices" },
  { id: "courts",      label: "Courts",            blurb: "District, county and probate benches" },
  { id: "jp",          label: "Justice of the Peace", blurb: "Neighborhood courts" },
];

export interface Candidate {
  name: string;
  party: "D" | "R";
  incumbent: boolean;
  note?: string;
  woman: boolean;
  photo?: string;
  slug?: string;          // /politicians/<slug>
  finance: CandidateFinance | null;
}

export interface LastResult {
  year: number;
  dPct: number;           // two-party share
  rPct: number;
  dVotes: number;
  rVotes: number;
  proxy: boolean;         // true = countywide judicial average, not this exact race
  label: string;          // what the number measures
}

export interface Race {
  key: string;
  slug: string;
  office: string;
  tag: string;            // compact district label: "HD 134", "CD 7", "Statewide"
  group: GroupId;
  lean?: RaceLean;
  status: Matchup["status"];
  d: Candidate | null;
  r: Candidate | null;
  holder: "D" | "R" | null;   // party of the incumbent on the ballot, if any
  open: boolean;              // no incumbent on the ballot
  stakes?: string;
  detail?: string;
  last: LastResult | null;
  cashTotal: number;
  districtHref: string | null;
}

/* ── Classification ─────────────────────────────────────────────────────── */

export function groupOf(key: string): GroupId {
  if (key === "US-Senate" || key === "HC-Countywide") return "top";
  if (key.startsWith("TX-")) return "statewide";
  if (key.startsWith("CD-")) return "congress";
  if (key.startsWith("SD-") || key.startsWith("HD-")) return "legislature";
  if (key.startsWith("CCL-") || key.startsWith("DC-") || key.startsWith("Probate-")) return "courts";
  if (key.startsWith("JP-")) return "jp";
  return "county";
}

export function tagOf(key: string): string {
  const n = key.replace(/^[A-Za-z]+-/, "");
  if (key === "US-Senate" || key.startsWith("TX-")) return "Statewide";
  if (key === "HC-Countywide" || key.startsWith("HC-")) return "Countywide";
  if (key.startsWith("CD-")) return `CD ${n}`;
  if (key.startsWith("SD-")) return `SD ${n}`;
  if (key.startsWith("HD-")) return `HD ${n}`;
  if (key.startsWith("PCT-")) return `Pct ${n}`;
  if (key.startsWith("CCL-")) return `CCL ${n}`;
  if (key.startsWith("DC-")) return `${n} Dist.`;
  if (key.startsWith("Probate-")) return `Probate ${n}`;
  if (key.startsWith("JP-")) {
    const [, pct, pl] = key.match(/^JP-(\d+)-PL(\d+)$/) ?? [];
    return pct ? `JP ${pct}, Pl. ${pl}` : key;
  }
  return key;
}

function districtHrefOf(key: string): string | null {
  const n = key.replace(/^[A-Za-z]+-/, "");
  if (key.startsWith("CD-")) return `/tools/districts?type=cd&district=${n}`;
  if (key.startsWith("SD-")) return `/tools/districts?type=sd&district=${n}`;
  if (key.startsWith("HD-")) return `/tools/districts?type=hd&district=${n}`;
  if (key.startsWith("PCT-")) return `/tools/districts?type=pct&district=${n}`;
  if (key.startsWith("JP-")) return `/tools/districts?type=jp&district=${key.replace(/^JP-(\d+).*/, "$1")}`;
  return "/tools/districts?type=countywide";
}

/* ── Last general-election result (county canvass) ──────────────────────── */

type RaceData = { label: string; candidates: { name: string; party: string }[]; votes: Record<string, number[]> };
type Table = Record<string, Record<string, Record<string, RaceData>>>;
interface DistrictRaces { hd?: Table; sd?: Table; cd?: Table; jp?: Table; pct?: Table; county?: Record<string, Record<string, RaceData>> }

let DR_CACHE: DistrictRaces | null = null;
function districtRaces(): DistrictRaces {
  if (!DR_CACHE) {
    try {
      DR_CACHE = JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/district-races.json"), "utf8"));
    } catch {
      DR_CACHE = {};
    }
  }
  return DR_CACHE!;
}

function sum(race: RaceData): { d: number; r: number } | null {
  const di = race.candidates.findIndex(c => c.party === "D");
  const ri = race.candidates.findIndex(c => c.party === "R");
  if (di < 0 || ri < 0) return null;
  let d = 0, r = 0;
  for (const v of Object.values(race.votes)) { d += v[di] ?? 0; r += v[ri] ?? 0; }
  return d + r > 0 ? { d, r } : null;
}

function toResult(s: { d: number; r: number }, cycle: string, label: string, proxy = false): LastResult {
  const t = s.d + s.r;
  const dPct = Math.round((s.d / t) * 1000) / 10;
  return { year: parseInt(cycle), dPct, rPct: Math.round((100 - dPct) * 10) / 10, dVotes: s.d, rVotes: s.r, proxy, label };
}

const CYCLES = ["2024G", "2022G", "2020G", "2018G"];

function fromTable(t: Table | undefined, n: string, label: string, pick?: (slug: string) => boolean): LastResult | null {
  const cycles = t?.[n];
  if (!cycles) return null;
  for (const cy of CYCLES) {
    const c = cycles[cy];
    if (!c) continue;
    for (const [slug, race] of Object.entries(c)) {
      if (pick && !pick(slug)) continue;
      const s = sum(race);
      if (s) return toResult(s, cy, label);
    }
  }
  return null;
}

let JUDICIAL: LastResult | null | undefined;
function judicialBaseline(): LastResult | null {
  if (JUDICIAL !== undefined) return JUDICIAL;
  const county = districtRaces().county ?? {};
  let d = 0, r = 0;
  for (const slug of Object.keys(county)) {
    if (!(slug === "sup_ct_pl2" || slug === "harris_crim_ct_at_law_16" || /_district_judge$/.test(slug))) continue;
    const race = county[slug]?.["2024G"];
    const s = race && sum(race);
    if (s) { d += s.d; r += s.r; }
  }
  JUDICIAL = d + r > 0 ? toResult({ d, r }, "2024G", "County judicial average", true) : null;
  return JUDICIAL;
}

const COUNTY_SLUG: Record<string, string> = {
  "US-Senate": "u_s_senate",
  "TX-Governor": "governor",
  "HC-DA": "harris_da",
  "HC-Sheriff": "harris_sheriff",
  "HC-County-Attorney": "harris_co_attorney",
  "TX-RailroadCommission": "rr_comm_1",
};

function lastResultFor(key: string): LastResult | null {
  const dr = districtRaces();
  const n = key.replace(/^[A-Za-z]+-/, "");
  if (key.startsWith("HD-")) return fromTable(dr.hd, n, `HD ${n}`);
  if (key.startsWith("SD-")) return fromTable(dr.sd, n, `SD ${n}`);
  if (key.startsWith("CD-")) return fromTable(dr.cd, n, `CD ${n}, old lines`);
  if (key.startsWith("PCT-")) return fromTable(dr.pct, n, `Precinct ${n}`);
  if (key.startsWith("JP-")) {
    const pct = key.replace(/^JP-(\d+).*/, "$1");
    return fromTable(dr.jp, pct, `JP Precinct ${pct}`, slug => !slug.includes("constable"));
  }
  if (key.startsWith("CCL-") || key.startsWith("DC-") || key.startsWith("Probate-")) return judicialBaseline();
  const slug = COUNTY_SLUG[key];
  if (slug) {
    const cycles = dr.county?.[slug];
    for (const cy of CYCLES) {
      const race = cycles?.[cy];
      const s = race && sum(race);
      if (s) return toResult(s, cy, "Harris County vote");
    }
  }
  if (key === "HC-Countywide" || key.startsWith("HC-") || key.startsWith("TX-")) {
    // No same-office result on file: fall back to the county's top-of-ticket 2024 vote.
    const pres = dr.county?.["president"]?.["2024G"];
    const s = pres && sum(pres);
    if (s) return toResult(s, "2024G", "County presidential vote", true);
  }
  return null;
}

/* ── Candidates ─────────────────────────────────────────────────────────── */

const POL_BY_NAME = new Map(POLITICIANS.map(p => [p.name.toLowerCase(), p]));

function candidate(s: MatchupSide | undefined): Candidate | null {
  if (!s) return null;
  const pol = POL_BY_NAME.get(s.name.toLowerCase());
  const fin = getFinanceByName(s.name);
  return {
    name: s.name,
    party: s.party,
    incumbent: s.incumbent,
    note: s.note,
    woman: s.gender === "F",
    photo: pol?.photo ?? CANDIDATE_PHOTOS[s.name],
    slug: pol?.slug,
    finance: fin && (fin.cash > 0 || fin.raised != null) ? fin : null,
  };
}

/* ── Public API ─────────────────────────────────────────────────────────── */

function build(key: string, m: Matchup): Race {
  const d = candidate(m.sides.find(s => s.party === "D"));
  const r = candidate(m.sides.find(s => s.party === "R"));
  const holder = d?.incumbent ? "D" : r?.incumbent ? "R" : null;
  return {
    key,
    slug: raceSlug(key),
    office: m.office,
    tag: tagOf(key),
    group: groupOf(key),
    lean: m.lean,
    status: m.status,
    d, r,
    holder,
    open: !holder,
    stakes: STAKES[key],
    detail: m.detail,
    last: lastResultFor(key),
    cashTotal: (d?.finance?.cash ?? 0) + (r?.finance?.cash ?? 0),
    districtHref: districtHrefOf(key),
  };
}

let ALL: Race[] | null = null;
export function getAllRaces(): Race[] {
  if (!ALL) ALL = Object.entries(MATCHUPS_2026).map(([k, m]) => build(k, m));
  return ALL;
}

export function getRaceBySlug(slug: string): Race | null {
  return getAllRaces().find(r => r.slug === slug.toLowerCase()) ?? null;
}

export const ratingOrder = (r: Race) => (r.lean ? RATING[r.lean].order : 4.5);
const GROUP_INDEX = Object.fromEntries(GROUPS.map((g, i) => [g.id, i]));
export const groupIndex = (g: GroupId) => GROUP_INDEX[g] ?? 99;

/** Competitive first (toss-up outward), then by money in the race. */
export function byCompetitiveness(a: Race, b: Race): number {
  const da = Math.abs(ratingOrder(a) - 4), db = Math.abs(ratingOrder(b) - 4);
  if (da !== db) return da - db;
  if (groupIndex(a.group) !== groupIndex(b.group)) return groupIndex(a.group) - groupIndex(b.group);
  return b.cashTotal - a.cashTotal;
}

export interface Tally { dSafe: number; dLean: number; toss: number; rLean: number; rSafe: number; total: number }

export function tally(races: Race[]): Tally {
  const t: Tally = { dSafe: 0, dLean: 0, toss: 0, rLean: 0, rSafe: 0, total: races.length };
  for (const r of races) {
    switch (r.lean) {
      case "uncontested-d": case "safe-d": case "likely-d": t.dSafe++; break;
      case "lean-d": t.dLean++; break;
      case "toss-up": t.toss++; break;
      case "lean-r": t.rLean++; break;
      default: t.rSafe++;
    }
  }
  return t;
}

/** Races whose outcome is in real doubt: toss-ups and leans. */
export function competitiveRaces(): Race[] {
  return getAllRaces().filter(r => r.lean && RATING[r.lean].competitive).sort(byCompetitiveness);
}

/** Lightweight shape for client components (no detail text, no finance blobs). */
export interface RaceLite {
  key: string; slug: string; office: string; tag: string; group: GroupId; lean?: RaceLean;
  d: { name: string; incumbent: boolean; cash: number; photo?: string; woman: boolean } | null;
  r: { name: string; incumbent: boolean; cash: number; photo?: string; woman: boolean } | null;
  open: boolean; holder: "D" | "R" | null;
  last: { dPct: number; rPct: number; year: number; proxy: boolean } | null;
  stakes?: string;
}

export function toLite(r: Race): RaceLite {
  const side = (c: Candidate | null) => c && { name: c.name, incumbent: c.incumbent, cash: c.finance?.cash ?? 0, photo: c.photo, woman: c.woman };
  return {
    key: r.key, slug: r.slug, office: r.office, tag: r.tag, group: r.group, lean: r.lean,
    d: side(r.d), r: side(r.r), open: r.open, holder: r.holder,
    last: r.last && { dPct: r.last.dPct, rPct: r.last.rPct, year: r.last.year, proxy: r.last.proxy },
    stakes: r.stakes,
  };
}
