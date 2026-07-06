// Path-to-win narrative math for the Districts briefing.
// Inputs: /api/districts/win-number (registration-adjusted turnout model),
// March 2026 primary ballots filtered in-district via lib/precinct-crosswalk.json,
// and public/data/district-races.json (county canvass) for the last contested margin.

export interface RaceEntry {
  label: string;
  candidates: { name: string; party: string }[];
  votes: Record<string, number[]>;
}

// districtNum -> cycle ("2024G") -> raceSlug -> RaceEntry
export type DistrictRaceTable = Record<string, Record<string, Record<string, RaceEntry>>>;

export interface DistrictRacesFile {
  hd?: DistrictRaceTable;
  sd?: DistrictRaceTable;
  cd?: DistrictRaceTable;
  jp?: DistrictRaceTable;
  pct?: DistrictRaceTable;
}

export interface LastContested {
  year: number;        // e.g. 2024
  winnerParty: "D" | "R";
  marginPts: number;   // e.g. 6.2
  winnerPct: number;   // share of all votes cast, e.g. 52.9
  loserPct: number;    // e.g. 46.7
  totalVotes: number;
}

/** Walk cycles newest-first and return the most recent general where both a D and an R
 *  drew votes. Slug variants can duplicate a race; the variant with the most total votes wins. */
export function findLastContestedGeneral(
  file: DistrictRacesFile,
  level: "hd" | "sd" | "cd",
  district: string
): LastContested | null {
  const table = file[level]?.[district];
  if (!table) return null;
  const cycles = Object.keys(table)
    .filter(k => /^\d{4}G$/.test(k))
    .sort((a, b) => parseInt(b) - parseInt(a));
  for (const cycle of cycles) {
    let best: { dVotes: number; rVotes: number; total: number } | null = null;
    for (const race of Object.values(table[cycle])) {
      let d = -1, r = -1;
      race.candidates.forEach((c, i) => {
        if (c.party === "D") d = i;
        if (c.party === "R") r = i;
      });
      if (d < 0 || r < 0) continue; // missing a major party: not contested
      let dVotes = 0, rVotes = 0, total = 0;
      for (const arr of Object.values(race.votes)) {
        dVotes += arr[d] ?? 0;
        rVotes += arr[r] ?? 0;
        total += arr.reduce((a, b) => a + b, 0);
      }
      if (dVotes > 0 && rVotes > 0 && (!best || total > best.total)) {
        best = { dVotes, rVotes, total };
      }
    }
    if (best) {
      const dPct = Math.round((best.dVotes / best.total) * 1000) / 10;
      const rPct = Math.round((best.rVotes / best.total) * 1000) / 10;
      const winnerParty: "D" | "R" = dPct >= rPct ? "D" : "R";
      return {
        year: parseInt(cycle),
        winnerParty,
        marginPts: Math.round(Math.abs(dPct - rPct) * 10) / 10,
        winnerPct: Math.max(dPct, rPct),
        loserPct: Math.min(dPct, rPct),
        totalVotes: best.total,
      };
    }
  }
  return null;
}

const roundTo100 = (n: number) => Math.round(n / 100) * 100;

export interface PathToWinInputs {
  dKey: string;                    // "HD-138"
  level: "hd" | "sd" | "cd";
  targetDVotes: number | null;     // win number from /api/districts/win-number
  demPrimary2026: number | null;   // in-district March 2026 D primary ballots
  lastContested: LastContested | null;
  seatParty: "D" | "R" | null;     // who holds the seat now
}

/** Each sentence renders only when every number in it is real. A missing input drops
 *  the sentence entirely rather than approximating. */
export function buildPathToWinSentences(i: PathToWinInputs): string[] {
  const out: string[] = [];
  const win = i.targetDVotes && i.targetDVotes > 0 ? i.targetDVotes : null;

  if (win) {
    const verb = i.seatParty === "R" ? "Flipping" : i.seatParty === "D" ? "Holding" : "Winning";
    out.push(`${verb} ${i.dKey} takes roughly ${roundTo100(win).toLocaleString()} votes at projected 2026 turnout.`);
  }

  if (win && i.demPrimary2026 && i.demPrimary2026 > 0) {
    const dem = i.demPrimary2026;
    const gap = win - dem;
    if (gap > 0) {
      const g = roundTo100(gap) > 0 ? roundTo100(gap) : gap;
      out.push(
        `The 2026 Democratic primary turned out ${dem.toLocaleString()} in-district: a ${g.toLocaleString()}-vote gap between the primary base and the win number.`
      );
    } else {
      out.push(
        `The 2026 Democratic primary turned out ${dem.toLocaleString()} in-district, already ${Math.abs(gap).toLocaleString()} votes past the win number on primary ballots alone.`
      );
    }
  }

  if (i.lastContested) {
    const m = i.lastContested;
    // 2024 congressional results predate the 2025 enacted plan (PLANC2333).
    const lines = i.level === "cd" && m.year <= 2024 ? " under pre-2026 lines" : "";
    const pcts = `${m.winnerPct.toFixed(1)}–${m.loserPct.toFixed(1)}`;
    if (m.marginPts === 0) {
      out.push(`In ${m.year} the seat was a dead heat (${pcts})${lines}.`);
    } else {
      out.push(`In ${m.year} the seat went ${m.winnerParty} by ${m.marginPts.toFixed(1)} points (${pcts})${lines}.`);
    }
  }

  return out;
}
