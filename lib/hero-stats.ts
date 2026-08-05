import path from "path";
import fs from "fs";

export interface HeroStats {
  // County partisan picture
  d2024Pct: number;       // county-wide D% in 2024G presidential
  r2024Pct: number;
  turnout2024: number;    // total ballots cast 2024G
  precinctCount: number;

  // Key district
  hd134DPct: number;      // HD 134 2024G D%

  // Finance
  topName: string;        // name of top local war chest
  topOffice: string;
  topCash: number;        // CoH in dollars
  totalTracked: number;   // sum of all CoH in latest period
  candidatesTracked: number;

  // Meta
  financePeriod: string;  // e.g. "2026-07"
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

export function getHeroStats(): HeroStats {
  const root = process.cwd();

  /* ── Finance ─────────────────────────────────────────────────────────── */
  const financeIndexPath = path.join(root, "data/finance-history/index.json");
  const financeIndex = readJson<{ periods: string[] }>(financeIndexPath);
  const latestPeriod = financeIndex.periods[0]; // already sorted newest-first

  type Candidate = { name: string; office: string; cash?: number | null; level?: string };
  type PeriodFile = { candidates: Candidate[] };
  const periodFile = readJson<PeriodFile>(
    path.join(root, `data/finance-history/${latestPeriod}.json`)
  );
  const candidates = periodFile.candidates;

  const totalTracked = candidates.reduce((s, c) => s + (c.cash ?? 0), 0);
  const countyOnly = candidates.filter(c => c.level === "county");
  const topCounty = [...countyOnly].sort((a, b) => (b.cash ?? 0) - (a.cash ?? 0))[0];

  /* ── Precinct history (2024G) ────────────────────────────────────────── */
  type VoterEntry = { reg?: number; turnout?: number };
  type PrecHist = {
    cycles: {
      [cycle: string]: {
        races: {
          [race: string]: {
            candidates: { name: string; party: string }[];
            votes: { [pct: string]: number[] };
          };
        };
        voter: { [pct: string]: VoterEntry };
      };
    };
    meta: { [cycle: string]: { vtds: number } };
  };
  const precHist = readJson<PrecHist>(
    path.join(root, "public/data/precinct-history.json")
  );
  const c2024 = precHist.cycles["2024G"];

  // Partisan split from presidential race
  const presRace = c2024.races["president"];
  const candidates2024 = presRace.candidates;
  let totalD = 0, totalR = 0;
  for (const pctVotes of Object.values(presRace.votes)) {
    candidates2024.forEach((cand, i) => {
      if (cand.party === "D") totalD += pctVotes[i] ?? 0;
      if (cand.party === "R") totalR += pctVotes[i] ?? 0;
    });
  }
  const dr = totalD + totalR;
  const d2024Pct = dr > 0 ? Math.round((totalD / dr) * 10) / 10 : 0;
  const r2024Pct = dr > 0 ? Math.round((totalR / dr) * 10) / 10 : 0;

  // Turnout
  const turnout2024 = Object.values(c2024.voter).reduce(
    (s, v) => s + (v.turnout ?? 0), 0
  );

  // Precinct count (from meta)
  const precinctCount = precHist.meta["2024G"]?.vtds ?? Object.keys(c2024.voter).length;

  /* ── HD 134 2024G D% ─────────────────────────────────────────────────── */
  type DistrictRaces = {
    hd: {
      [district: string]: {
        [cycle: string]: {
          [race: string]: {
            candidates: { name: string; party: string }[];
            votes: { [pct: string]: number[] };
          };
        };
      };
    };
  };
  const drData = readJson<DistrictRaces>(
    path.join(root, "public/data/district-races.json")
  );
  const hd134races = drData.hd["134"]?.["2024G"] ?? {};
  let hd134D = 0, hd134R = 0;
  for (const race of Object.values(hd134races)) {
    for (const pctVotes of Object.values(race.votes)) {
      race.candidates.forEach((cand, i) => {
        if (cand.party === "D") hd134D += pctVotes[i] ?? 0;
        if (cand.party === "R") hd134R += pctVotes[i] ?? 0;
      });
    }
  }
  const hd134Total = hd134D + hd134R;
  const hd134DPct = hd134Total > 0
    ? Math.round((hd134D / hd134Total) * 10) / 10
    : 61;

  return {
    d2024Pct,
    r2024Pct,
    turnout2024,
    precinctCount,
    hd134DPct,
    topName: topCounty?.name ?? "Rodney Ellis",
    topOffice: topCounty?.office ?? "Commissioner Pct 1",
    topCash: topCounty?.cash ?? 0,
    totalTracked,
    candidatesTracked: candidates.length,
    financePeriod: latestPeriod,
  };
}
