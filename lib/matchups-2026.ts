// Known November 2026 general-election matchups, keyed by district key
// ("CD-18", "SD-15", "HD-148", "JP-4", "COH-District C", "HC-Countywide").
// Source: Harris County March 2026 primary + May 2026 runoff results already
// embedded in Heat Check (public/heat-check.html). Statewide races note that
// Harris-only totals can't certify a statewide nominee.
// Money for each name resolves through FINANCE_DATA_MERGED at render time.

export interface MatchupSide {
  name: string;
  party: "D" | "R";
  incumbent: boolean;
  note?: string;
}

export type RaceLean =
  | "safe-d" | "likely-d" | "lean-d"
  | "toss-up"
  | "lean-r" | "likely-r" | "safe-r"
  | "uncontested-d" | "uncontested-r";

export interface Matchup {
  office: string;
  sides: MatchupSide[];   // usually [D, R]
  status: "set" | "runoff-pending" | "partial";
  lean?: RaceLean;        // competitiveness rating for Harris County
  detail?: string;
}

export const MATCHUPS_2026: Record<string, Matchup> = {
  // ── Statewide Texas races ──────────────────────────────────────────────────
  "TX-Governor": {
    office: "Texas Governor",
    status: "set",
    lean: "safe-r",
    sides: [
      { name: "Gina Hinojosa", party: "D", incumbent: false, note: "Former State Rep HD-49 (Austin); won D primary" },
      { name: "Greg Abbott",   party: "R", incumbent: true,  note: "Seeking 3rd term" },
    ],
    detail: "Statewide race. Abbott has dominated Texas since 2014. Hinojosa is a former state representative from Austin who won the Democratic nomination.",
  },
  "TX-LtGov": {
    office: "Lt. Governor of Texas",
    status: "partial",
    lean: "safe-r",
    sides: [
      { name: "Dan Patrick", party: "R", incumbent: true, note: "Seeking 3rd term" },
    ],
    detail: "Dan Patrick is the Republican incumbent. Democratic nominee pending.",
  },
  "TX-AG": {
    office: "Texas Attorney General",
    status: "partial",
    lean: "safe-r",
    sides: [
      { name: "Mayes Middleton", party: "R", incumbent: false, note: "Won R primary; former State Senator SD-11" },
    ],
    detail: "Open seat — Paxton vacated to run for U.S. Senate. Middleton (former SD-11 senator) won the Republican nomination. Democratic nominee pending.",
  },
  "TX-Comptroller": {
    office: "Texas Comptroller",
    status: "partial",
    lean: "safe-r",
    sides: [
      { name: "Glenn Hegar", party: "R", incumbent: true, note: "Seeking 3rd term" },
    ],
    detail: "Glenn Hegar is the Republican incumbent. Democratic nominee pending.",
  },
  // ── Top of Ticket ──────────────────────────────────────────────────────────
  "US-Senate": {
    office: "U.S. Senate",
    status: "set",
    lean: "lean-d",
    sides: [
      { name: "Jasmine Crockett", party: "D", incumbent: false, note: "Won March primary" },
      { name: "Ken Paxton",       party: "R", incumbent: false, note: "Won May runoff over John Cornyn" },
    ],
    detail: "Paxton beat Cornyn in the May runoff (93,872–52,041 in Harris County). Crockett led the Democratic primary with no runoff. Nominee status reflects Harris County results; statewide certification governs.",
  },
  "HC-Countywide": {
    office: "Harris County Judge",
    status: "set",
    lean: "lean-d",
    sides: [
      { name: "Letitia Plummer",  party: "D", incumbent: false, note: "Won May runoff over Annise Parker" },
      { name: "Orlando Sanchez",  party: "R", incumbent: false, note: "Won May runoff over Warren Howell" },
    ],
    detail: "Open seat — Lina Hidalgo did not seek reelection. Plummer beat Parker 57,893–55,395 in the Democratic runoff; Sanchez beat Howell 85,304–49,367 in the Republican runoff.",
  },
  "CD-18": {
    office: "U.S. Representative, District 18",
    status: "set",
    lean: "safe-d",
    sides: [
      { name: "Christian Menefee",       party: "D", incumbent: true, note: "Won May runoff over Al Green" },
      { name: "Ronald Dwayne Whitfield", party: "R", incumbent: false, note: "Won March primary" },
    ],
    detail: "Menefee beat Al Green 26,546–10,771 in the Democratic runoff. Heavily Democratic seat.",
  },
  "CD-2": {
    office: "U.S. Representative, District 2",
    status: "set",
    lean: "safe-r",
    sides: [
      { name: "Shaun Finnie",  party: "D", incumbent: false, note: "D nominee" },
      { name: "Dan Crenshaw",  party: "R", incumbent: true },
    ],
  },
  "CD-7": {
    office: "U.S. Representative, District 7",
    status: "set",
    lean: "toss-up",
    sides: [
      { name: "Lizzie Fletcher", party: "D", incumbent: true },
      { name: "Alexander Hale",  party: "R", incumbent: false, note: "Won May runoff" },
    ],
  },
  "CD-8": {
    office: "U.S. Representative, District 8",
    status: "partial",
    lean: "safe-r",
    sides: [
      { name: "Laura Jones",     party: "D", incumbent: false, note: "Won March primary" },
      { name: "Morgan Luttrell", party: "R", incumbent: true, note: "Presumed nominee — no Harris-side R primary on ballot" },
    ],
  },
  "CD-9": {
    office: "U.S. Representative, District 9",
    status: "set",
    lean: "toss-up",
    sides: [
      { name: "Leticia Gutierrez", party: "D", incumbent: false, note: "Won March primary" },
      { name: "Alex Mealer",       party: "R", incumbent: false, note: "Won May runoff over Briscoe Cain" },
    ],
    detail: "Open-seat race: incumbent Al Green ran in CD-18 instead (and lost that runoff). Mealer ran a close County Judge race in 2022.",
  },
  "CD-22": {
    office: "U.S. Representative, District 22",
    status: "partial",
    lean: "safe-r",
    sides: [
      { name: "Marquette Greene-Scott", party: "D", incumbent: false, note: "Won March primary" },
      { name: "Troy Nehls",             party: "R", incumbent: true, note: "Presumed nominee — primary outside Harris data" },
    ],
  },
  "CD-29": {
    office: "U.S. Representative, District 29",
    status: "partial",
    lean: "safe-d",
    sides: [
      { name: "Sylvia Garcia", party: "D", incumbent: true, note: "Won March primary" },
    ],
  },
  "CD-36": {
    office: "U.S. Representative, District 36",
    status: "partial",
    lean: "safe-r",
    sides: [
      { name: "Rhonda Hart",  party: "D", incumbent: false, note: "Won March primary" },
      { name: "Brian Babin",  party: "R", incumbent: true, note: "Presumed nominee — primary outside Harris data" },
    ],
  },
  "CD-38": {
    office: "U.S. Representative, District 38",
    status: "set",
    lean: "lean-r",
    sides: [
      { name: "Melissa McDonough", party: "D", incumbent: false, note: "Won March primary" },
      { name: "Jon Bonck",         party: "R", incumbent: false, note: "Won May runoff" },
    ],
    detail: "Open seat — incumbent Wesley Hunt ran for U.S. Senate and lost the Republican primary.",
  },
  "SD-11": {
    office: "State Senator, District 11",
    status: "partial",
    lean: "likely-r",
    sides: [
      { name: "Shannon Dicely", party: "D", incumbent: false, note: "Won March primary" },
    ],
    detail: "Incumbent Mayes Middleton won the Republican nomination for Attorney General; Republican nominee for this seat not in Harris primary data.",
  },
  "SD-15": {
    office: "State Senator, District 15",
    status: "partial",
    lean: "safe-d",
    sides: [
      { name: "Molly Cook", party: "D", incumbent: true, note: "Won 2024 special election; seeking first full term" },
    ],
    detail: "Molly Cook won the 2024 special election to replace John Whitmire (who became Houston Mayor). SD-15 seat is on the 2026 ballot; Cook must win a full 4-year term. Heights, Montrose, Galleria corridor — heavily Democratic.",
  },
  "HD-126": {
    office: "State Representative, District 126",
    status: "set",
    lean: "lean-r",
    sides: [
      { name: "Stefanie Bord", party: "D", incumbent: false, note: "Won March primary" },
      { name: "Stan Stanart",  party: "R", incumbent: false, note: "Won May runoff" },
    ],
  },
  "HD-131": {
    office: "State Representative, District 131",
    status: "partial",
    lean: "safe-d",
    sides: [
      { name: "Staci Childs", party: "D", incumbent: false, note: "Won May runoff over Lawrence Allen Jr." },
    ],
  },
  "HD-139": {
    office: "State Representative, District 139",
    status: "partial",
    lean: "safe-d",
    sides: [
      { name: "Charlene Ward Johnson", party: "D", incumbent: true, note: "Won March primary" },
    ],
  },
  "HD-142": {
    office: "State Representative, District 142",
    status: "partial",
    lean: "safe-d",
    sides: [
      { name: "Harold Dutton Jr.", party: "D", incumbent: true, note: "Won March primary outright" },
    ],
  },
  "HD-144": {
    office: "State Representative, District 144",
    status: "partial",
    lean: "lean-d",
    sides: [
      { name: "Mary Ann Perez", party: "D", incumbent: true, note: "Won March primary" },
    ],
  },
  "HD-149": {
    office: "State Representative, District 149",
    status: "partial",
    lean: "lean-d",
    sides: [
      { name: "Darlene Breaux", party: "D", incumbent: false, note: "Won May runoff over incumbent Hubert Vo" },
    ],
    detail: "Incumbent Hubert Vo lost the Democratic runoff 1,623–1,053. He holds the seat until January 2027.",
  },
  "HD-150": {
    office: "State Representative, District 150",
    status: "partial",
    lean: "safe-r",
    sides: [
      { name: "A'Yonna Kellum", party: "D", incumbent: false, note: "Won March primary" },
    ],
  },
  "JP-2": {
    office: "Justice of the Peace, Precinct 2",
    status: "partial",
    lean: "lean-d",
    sides: [
      { name: "Dolores Lozano", party: "D", incumbent: true, note: "Won March primary (Place 2)" },
    ],
  },
  "JP-5": {
    office: "Justice of the Peace, Precinct 5",
    status: "set",
    lean: "lean-r",
    sides: [
      { name: "Lisa Jefferson", party: "D", incumbent: false, note: "Won March primary (Place 2)" },
      { name: "Mark Fury",      party: "R", incumbent: false, note: "Won March primary over incumbent Bob Wolfe (Place 2)" },
    ],
  },
  "JP-7": {
    office: "Justice of the Peace, Precinct 7",
    status: "partial",
    lean: "likely-d",
    sides: [
      { name: "Melanie Miles", party: "D", incumbent: false, note: "Won May runoff over incumbent Sharon Burney (Place 2)" },
    ],
  },

  // Commissioner Precincts
  "PCT-1": {
    office: "Commissioner Precinct 1",
    status: "partial",
    lean: "uncontested-d",
    sides: [
      { name: "Rodney Ellis", party: "D", incumbent: true, note: "Incumbent — no R challenger filed" },
    ],
    detail: "Rodney Ellis has held PCT 1 since 2016. No Republican challenger filed by the June 2026 deadline.",
  },
  "PCT-2": {
    office: "Commissioner Precinct 2",
    status: "set",
    lean: "likely-d",
    sides: [
      { name: "Adrian Garcia",  party: "D", incumbent: true,  note: "Incumbent" },
      { name: "Richard Vega",   party: "R", incumbent: false, note: "R general candidate" },
    ],
    detail: "Contested general election. Garcia has held PCT 2 since 2016.",
  },
  "PCT-3": {
    office: "Commissioner Precinct 3",
    status: "partial",
    lean: "uncontested-r",
    sides: [
      { name: "Tom Ramsey", party: "R", incumbent: true, note: "Incumbent — no D challenger filed" },
    ],
    detail: "Tom Ramsey has held PCT 3 since 2021. No Democratic challenger filed by the June 2026 deadline.",
  },
  "PCT-4": {
    office: "Commissioner Precinct 4",
    status: "partial",
    lean: "uncontested-d",
    sides: [
      { name: "Lesley Briones", party: "D", incumbent: true, note: "Incumbent — no R challenger filed" },
    ],
    detail: "Lesley Briones has held PCT 4 since 2023. No Republican challenger filed by the June 2026 deadline.",
  },

  // Countywide offices — law enforcement & admin
  "HC-Sheriff": {
    office: "Harris County Sheriff",
    status: "partial",
    lean: "safe-d",
    sides: [
      { name: "Ed Gonzalez", party: "D", incumbent: true, note: "Incumbent — won March primary" },
    ],
    detail: "Ed Gonzalez has held the Sheriff's office since 2017. No Republican general opponent confirmed as of June 2026.",
  },
  "HC-DA": {
    office: "District Attorney",
    status: "partial",
    lean: "safe-d",
    sides: [
      { name: "Sean Teare", party: "D", incumbent: true, note: "Incumbent — won March primary" },
    ],
    detail: "Sean Teare has served as DA since 2022. No Republican general opponent confirmed as of June 2026.",
  },
  "HC-County-Attorney": {
    office: "County Attorney",
    status: "partial",
    lean: "likely-d",
    sides: [
      { name: "Abbie Kamin", party: "D", incumbent: false, note: "D nominee — open seat" },
    ],
    detail: "Open seat race for County Attorney. Abbie Kamin won the Democratic primary.",
  },
  "HC-District-Clerk": {
    office: "District Clerk",
    status: "partial",
    lean: "safe-d",
    sides: [
      { name: "Marilyn Burgess", party: "D", incumbent: true, note: "Incumbent" },
    ],
  },
  "HC-County-Clerk": {
    office: "County Clerk",
    status: "partial",
    lean: "safe-d",
    sides: [
      { name: "Teneshia Hudspeth", party: "D", incumbent: true, note: "Incumbent" },
    ],
  },
  "HC-Tax-Assessor": {
    office: "Tax Assessor-Collector",
    status: "partial",
    lean: "safe-d",
    sides: [
      { name: "Annette Ramirez", party: "D", incumbent: true, note: "Incumbent" },
    ],
  },

  // Constables — all 8 precincts
  "CONSTABLE-1": {
    office: "Constable Precinct 1",
    status: "partial",
    lean: "safe-d",
    sides: [{ name: "Alan Rosen",       party: "D", incumbent: true, note: "Incumbent" }],
    detail: "Files campaign finance at ethics.harrisvotes.com, not TEC.",
  },
  "CONSTABLE-2": {
    office: "Constable Precinct 2",
    status: "partial",
    lean: "safe-d",
    sides: [{ name: "Jerry Garcia",     party: "D", incumbent: true, note: "Incumbent" }],
    detail: "Files campaign finance at ethics.harrisvotes.com, not TEC.",
  },
  "CONSTABLE-3": {
    office: "Constable Precinct 3",
    status: "partial",
    lean: "safe-d",
    sides: [{ name: "Sherman Eagleton", party: "D", incumbent: true, note: "Incumbent" }],
    detail: "Files campaign finance at ethics.harrisvotes.com, not TEC.",
  },
  "CONSTABLE-4": {
    office: "Constable Precinct 4",
    status: "partial",
    lean: "safe-r",
    sides: [{ name: "Mark Herman",      party: "R", incumbent: true, note: "Incumbent" }],
    detail: "Files campaign finance at ethics.harrisvotes.com, not TEC.",
  },
  "CONSTABLE-5": {
    office: "Constable Precinct 5",
    status: "partial",
    lean: "safe-r",
    sides: [{ name: "Terry Allbritton", party: "R", incumbent: true, note: "Incumbent" }],
    detail: "Files campaign finance at ethics.harrisvotes.com, not TEC.",
  },
  "CONSTABLE-6": {
    office: "Constable Precinct 6",
    status: "partial",
    lean: "safe-d",
    sides: [{ name: "Silvia Trevino",   party: "D", incumbent: true, note: "Incumbent" }],
    detail: "Files campaign finance at ethics.harrisvotes.com, not TEC.",
  },
  "CONSTABLE-7": {
    office: "Constable Precinct 7",
    status: "partial",
    lean: "safe-d",
    sides: [{ name: "James Phillips",   party: "D", incumbent: true, note: "Incumbent" }],
    detail: "Files campaign finance at ethics.harrisvotes.com, not TEC.",
  },
  "CONSTABLE-8": {
    office: "Constable Precinct 8",
    status: "partial",
    lean: "safe-r",
    sides: [{ name: "Phil Sandlin",     party: "R", incumbent: true, note: "Incumbent" }],
    detail: "Files campaign finance at ethics.harrisvotes.com, not TEC.",
  },

  // JP races with full matchups (others are partial — D only, R nominee TBD)
  "JP-5-PL2": {
    office: "Justice of the Peace PCT 5 PL 2",
    status: "set",
    lean: "toss-up",
    sides: [
      { name: "Lisa Jefferson", party: "D", incumbent: false, note: "Won March primary" },
      { name: "Mark Fury",      party: "R", incumbent: false, note: "Won March primary over incumbent Bob Wolfe" },
    ],
    detail: "Open competitive race — incumbent Bob Wolfe (R) lost his primary to Mark Fury.",
  },
  "JP-7-PL2": {
    office: "Justice of the Peace PCT 7 PL 2",
    status: "partial",
    lean: "likely-d",
    sides: [
      { name: "Melanie Miles", party: "D", incumbent: false, note: "Won May runoff over incumbent Sharon Burney" },
    ],
    detail: "Melanie Miles beat incumbent Sharon Burney in the Democratic runoff. R nominee TBD.",
  },
};

export function getMatchup(districtKey: string): Matchup | null {
  return MATCHUPS_2026[districtKey] ?? null;
}
