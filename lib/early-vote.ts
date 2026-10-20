import raw from "@/public/data/early-vote-2026.json";

/**
 * Early vote for the November 3, 2026 general, built daily from the county's
 * rosters by scripts/build-early-vote.mjs. Party is read from primary history
 * (Texas has no party registration): D/R = the party of the voter's most recent
 * March primary in 2022, 2024 or 2026; N = no primary in those years.
 * Turnout rates compare like with like: early voters who voted in the March 2026
 * primary (D26/R26) over everyone who voted in it (universe, poolD/poolR).
 */
export type Mix = { all: number; inPerson: number; mail: number; D: number; R: number; N: number; D26?: number; R26?: number };
/** A district's early voters plus its March 2026 primary voters (poolD/poolR), for turnout rates. */
export type DistrictMix = Mix & { poolD: number; poolR: number };

export type EarlyVote = {
  updated: string;
  through: string;
  day: number;
  evDays: number;
  lastDay: string;
  source: string;
  totals: Mix;
  byMethod: { inPerson: Mix; mail: Mix };
  matchRate: number;
  universe: { D: number; R: number };
  sameCycle: { D: number; R: number; N: number };
  lean: { earlyVote: number; county2024: number };
  registered2024: number;
  byDay: (Mix & { day: number; date: string; cumulative: number | null })[];
  mailBeforeEV: Mix;
  compare2022: {
    label: string;
    atSameDay: number;
    curve: { day: number; cumulative: number }[];
    sameCycle: { D: number; R: number; N: number; total: number };
    lean: number | null;
    totalEarly: number;
    electionDay: number;
    total: number;
  };
  districts: Record<string, DistrictMix>;
  /** precinct → [all, D, R, N, inPerson, mail, registered2024, poolD, poolR, D26, R26] */
  precincts: Record<string, [number, number, number, number, number, number, number, number, number, number, number]>;
};

export const EV = raw as unknown as EarlyVote;

export const share = (m: Pick<Mix, "all">, n: number) => (m.all ? n / m.all : 0);
/** D-primary minus R-primary voters, as points of everyone who has voted. */
export const edge = (m: Mix) => (m.all ? ((m.D - m.R) / m.all) * 100 : 0);
/** Points by which the Democratic pool's turnout leads the Republican pool's (negative: Republicans lead). */
export const rateGap = (m: DistrictMix) => (m.poolD && m.poolR ? ((m.D26 ?? 0) / m.poolD - (m.R26 ?? 0) / m.poolR) * 100 : 0);
/** "D +5.3" turnout gap, in points */
export const gapLabel = (pts: number) => (Math.abs(pts) < 0.05 ? "Even" : `${pts > 0 ? "D" : "R"} +${Math.abs(pts).toFixed(1)}`);
export const rates = (m: Mix, poolD: number, poolR: number) => ({ D: poolD ? (m.D26 ?? 0) / poolD : 0, R: poolR ? (m.R26 ?? 0) / poolR : 0 });
export const edgeLabel = (pts: number) => (Math.abs(pts) < 0.5 ? "Even" : `${pts > 0 ? "D" : "R"}+${Math.round(Math.abs(pts))}`);
export const pctText = (x: number, digits = 1) => `${(x * 100).toFixed(digits)}%`;

/** "Monday, Oct. 19" */
export function dayName(iso: string) {
  const d = new Date(iso + "T12:00:00Z");
  const wd = d.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
  const md = d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  return `${wd}, ${md.replace(/^(\w{3})/, (m) => (m === "May" ? m : m + "."))}`;
}

/** The early-vote district for a race key ("HD-134", "JP-2-PL2" → "JP-2"); null for countywide races. */
export function evDistrictFor(raceKey: string): string | null {
  const m = /^(HD|SD|CD|PCT|JP)-(\d+)/.exec(raceKey);
  return m ? `${m[1]}-${m[2]}` : null;
}

/** Districts that only clip Harris County carry too few ballots to rank. */
export const MIN_DISTRICT_BALLOTS = 300;

export const DISTRICT_KINDS = [
  { prefix: "HD", label: "State House", name: (n: string) => `HD ${n}` },
  { prefix: "CD", label: "Congress", name: (n: string) => `CD ${n}` },
  { prefix: "SD", label: "State Senate", name: (n: string) => `SD ${n}` },
  { prefix: "PCT", label: "Commissioner", name: (n: string) => `Precinct ${n}` },
  { prefix: "COUNCIL", label: "City Council", name: (n: string) => `District ${n}` },
  { prefix: "JP", label: "Justice of the Peace", name: (n: string) => `JP ${n}` },
] as const;
