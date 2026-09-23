// The desk log: a dated record of what moved in the 2026 races. Powers the
// "Latest from the desk" column on the front page and the change history on
// each race page. APPEND-ONLY, newest first. Every entry restates a fact that
// is already recorded (with its source) in lib/matchups-2026.ts or
// lib/campaign-finance.ts; the log never introduces new claims.
//
// kind:
//   rating  – a rating changed (from → to)
//   money   – a filing changed the money picture
//   news    – a reported development (poll, scandal, appointment)
//   fix     – a correction to our own data

import type { RaceLean } from "@/lib/matchups-2026";

export interface DeskEntry {
  date: string;            // YYYY-MM-DD
  race: string;            // MATCHUPS_2026 key
  kind: "rating" | "money" | "news" | "fix";
  headline: string;
  from?: RaceLean;
  to?: RaceLean;
  source?: string;         // outlet, as cited in the race detail
}

export const DESK_LOG: DeskEntry[] = [
  {
    date: "2026-08-10", race: "TX-Governor", kind: "rating", from: "safe-r", to: "lean-r",
    headline: "Three late-July polls all had Abbott within 3 points of Hinojosa, his tightest statewide position yet.",
    source: "TPOR; Fox News/Beacon; Texas A&M Bush School",
  },
  {
    date: "2026-08-10", race: "US-Senate", kind: "news",
    headline: "The Tribune reported Talarico voted from his parents' address for two years after buying his own home.",
    source: "Texas Tribune, Aug. 5",
  },
  {
    date: "2026-08-10", race: "TX-Comptroller", kind: "news",
    headline: "Huffines was sworn in as acting comptroller Aug. 1 and now runs as the sitting officeholder.",
    source: "Texas Tribune",
  },
  {
    date: "2026-08-10", race: "TX-LtGov", kind: "news",
    headline: "Two polls fielded the same week disagree: one has Goodwin up 2, the other has Patrick up 7.",
    source: "Texas A&M Bush School; Texas Southern University",
  },
  {
    date: "2026-08-07", race: "TX-AG", kind: "rating", from: "safe-r", to: "lean-r",
    headline: "A July poll found Middleton and Johnson nearly tied, 39 to 38, with 18 percent undecided.",
    source: "Texas Public Opinion Research",
  },
  {
    date: "2026-08-07", race: "HC-District-Clerk", kind: "fix",
    headline: "Corrected: Darrell Jordan Jr. won the Democratic runoff, 77,122 to 32,116. He is the nominee.",
    source: "Harris County canvass",
  },
  {
    date: "2026-07-27", race: "HC-Countywide", kind: "money",
    headline: "Sanchez outraised Plummer in the last period and holds $132,680 to her $70,161.",
    source: "Filings published July 22",
  },
  {
    date: "2026-07-27", race: "PCT-4", kind: "money",
    headline: "Briones reports $4.1 million on hand to Radack's $482,649.",
    source: "Filings published July 22",
  },
  {
    date: "2026-07-27", race: "US-Senate", kind: "money",
    headline: "Talarico outraised Paxton $31.6 million to $9.3 million in the quarter.",
    source: "Texas Tribune, July 20",
  },
];

export function entriesFor(raceKey: string): DeskEntry[] {
  return DESK_LOG.filter(e => e.race === raceKey);
}
