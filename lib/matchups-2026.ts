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

export interface Matchup {
  office: string;
  sides: MatchupSide[];   // usually [D, R]
  status: "set" | "runoff-pending" | "partial";
  detail?: string;
}

export const MATCHUPS_2026: Record<string, Matchup> = {
  "US-Senate": {
    office: "U.S. Senate",
    status: "set",
    sides: [
      { name: "Jasmine Crockett", party: "D", incumbent: false, note: "Won March primary" },
      { name: "Ken Paxton",       party: "R", incumbent: false, note: "Won May runoff over John Cornyn" },
    ],
    detail: "Paxton beat Cornyn in the May runoff (93,872–52,041 in Harris County). Crockett led the Democratic primary with no runoff. Nominee status reflects Harris County results; statewide certification governs.",
  },
  "HC-Countywide": {
    office: "Harris County Judge",
    status: "set",
    sides: [
      { name: "Letitia Plummer",  party: "D", incumbent: false, note: "Won May runoff over Annise Parker" },
      { name: "Orlando Sanchez",  party: "R", incumbent: false, note: "Won May runoff over Warren Howell" },
    ],
    detail: "Open seat — Lina Hidalgo did not seek reelection. Plummer beat Parker 57,893–55,395 in the Democratic runoff; Sanchez beat Howell 85,304–49,367 in the Republican runoff.",
  },
  "CD-18": {
    office: "U.S. Representative, District 18",
    status: "set",
    sides: [
      { name: "Christian Menefee",       party: "D", incumbent: true, note: "Won May runoff over Al Green" },
      { name: "Ronald Dwayne Whitfield", party: "R", incumbent: false, note: "Won March primary" },
    ],
    detail: "Menefee beat Al Green 26,546–10,771 in the Democratic runoff. Heavily Democratic seat.",
  },
  "CD-2": {
    office: "U.S. Representative, District 2",
    status: "set",
    sides: [
      { name: "Shaun Finnie",  party: "D", incumbent: false, note: "D nominee" },
      { name: "Dan Crenshaw",  party: "R", incumbent: true },
    ],
  },
  "CD-7": {
    office: "U.S. Representative, District 7",
    status: "set",
    sides: [
      { name: "Lizzie Fletcher", party: "D", incumbent: true },
      { name: "Alexander Hale",  party: "R", incumbent: false, note: "Won May runoff" },
    ],
  },
  "CD-8": {
    office: "U.S. Representative, District 8",
    status: "partial",
    sides: [
      { name: "Laura Jones",     party: "D", incumbent: false, note: "Won March primary" },
      { name: "Morgan Luttrell", party: "R", incumbent: true, note: "Presumed nominee — no Harris-side R primary on ballot" },
    ],
  },
  "CD-9": {
    office: "U.S. Representative, District 9",
    status: "set",
    sides: [
      { name: "Leticia Gutierrez", party: "D", incumbent: false, note: "Won March primary" },
      { name: "Alex Mealer",       party: "R", incumbent: false, note: "Won May runoff over Briscoe Cain" },
    ],
    detail: "Open-seat race: incumbent Al Green ran in CD-18 instead (and lost that runoff).",
  },
  "CD-22": {
    office: "U.S. Representative, District 22",
    status: "partial",
    sides: [
      { name: "Marquette Greene-Scott", party: "D", incumbent: false, note: "Won March primary" },
      { name: "Troy Nehls",             party: "R", incumbent: true, note: "Presumed nominee — primary outside Harris data" },
    ],
  },
  "CD-29": {
    office: "U.S. Representative, District 29",
    status: "partial",
    sides: [
      { name: "Sylvia Garcia", party: "D", incumbent: true, note: "Won March primary" },
    ],
  },
  "CD-36": {
    office: "U.S. Representative, District 36",
    status: "partial",
    sides: [
      { name: "Rhonda Hart",  party: "D", incumbent: false, note: "Won March primary" },
      { name: "Brian Babin",  party: "R", incumbent: true, note: "Presumed nominee — primary outside Harris data" },
    ],
  },
  "CD-38": {
    office: "U.S. Representative, District 38",
    status: "set",
    sides: [
      { name: "Melissa McDonough", party: "D", incumbent: false, note: "Won March primary" },
      { name: "Jon Bonck",         party: "R", incumbent: false, note: "Won May runoff" },
    ],
    detail: "Open seat — incumbent Wesley Hunt ran for U.S. Senate and lost the Republican primary.",
  },
  "SD-11": {
    office: "State Senator, District 11",
    status: "partial",
    sides: [
      { name: "Shannon Dicely", party: "D", incumbent: false, note: "Won March primary" },
    ],
    detail: "Incumbent Mayes Middleton won the Republican nomination for Attorney General; Republican nominee for this seat not in Harris primary data.",
  },
  "HD-126": {
    office: "State Representative, District 126",
    status: "set",
    sides: [
      { name: "Stefanie Bord", party: "D", incumbent: false, note: "Won March primary" },
      { name: "Stan Stanart",  party: "R", incumbent: false, note: "Won May runoff" },
    ],
  },
  "HD-131": {
    office: "State Representative, District 131",
    status: "partial",
    sides: [
      { name: "Staci Childs", party: "D", incumbent: false, note: "Won May runoff over Lawrence Allen Jr." },
    ],
  },
  "HD-139": {
    office: "State Representative, District 139",
    status: "partial",
    sides: [
      { name: "Charlene Ward Johnson", party: "D", incumbent: true, note: "Won March primary" },
    ],
  },
  "HD-142": {
    office: "State Representative, District 142",
    status: "partial",
    sides: [
      { name: "Harold Dutton Jr.", party: "D", incumbent: true, note: "Won March primary outright" },
    ],
  },
  "HD-144": {
    office: "State Representative, District 144",
    status: "partial",
    sides: [
      { name: "Mary Ann Perez", party: "D", incumbent: true, note: "Won March primary" },
    ],
  },
  "HD-149": {
    office: "State Representative, District 149",
    status: "partial",
    sides: [
      { name: "Darlene Breaux", party: "D", incumbent: false, note: "Won May runoff over incumbent Hubert Vo" },
    ],
    detail: "Incumbent Hubert Vo lost the Democratic runoff 1,623–1,053. He holds the seat until January 2027.",
  },
  "HD-150": {
    office: "State Representative, District 150",
    status: "partial",
    sides: [
      { name: "A'Yonna Kellum", party: "D", incumbent: false, note: "Won March primary" },
    ],
  },
  "JP-2": {
    office: "Justice of the Peace, Precinct 2",
    status: "partial",
    sides: [
      { name: "Dolores Lozano", party: "D", incumbent: true, note: "Won March primary (Place 2)" },
    ],
  },
  "JP-5": {
    office: "Justice of the Peace, Precinct 5",
    status: "set",
    sides: [
      { name: "Lisa Jefferson", party: "D", incumbent: false, note: "Won March primary (Place 2)" },
      { name: "Mark Fury",      party: "R", incumbent: false, note: "Won March primary over incumbent Bob Wolfe (Place 2)" },
    ],
  },
  "JP-7": {
    office: "Justice of the Peace, Precinct 7",
    status: "partial",
    sides: [
      { name: "Melanie Miles", party: "D", incumbent: false, note: "Won May runoff over incumbent Sharon Burney (Place 2)" },
    ],
  },

  // Commissioner Precincts — all incumbents, no 2026 challengers on file yet
  "PCT-1": {
    office: "Commissioner Precinct 1",
    status: "partial",
    sides: [
      { name: "Rodney Ellis", party: "D", incumbent: true, note: "Incumbent — next election 2026" },
    ],
    detail: "Rodney Ellis has held PCT 1 since 2016. No Republican challenger filed as of June 2026.",
  },
  "PCT-2": {
    office: "Commissioner Precinct 2",
    status: "partial",
    sides: [
      { name: "Adrian Garcia", party: "D", incumbent: true, note: "Incumbent — next election 2026" },
    ],
    detail: "Adrian Garcia has held PCT 2 since 2016. No Republican challenger filed as of June 2026.",
  },
  "PCT-3": {
    office: "Commissioner Precinct 3",
    status: "partial",
    sides: [
      { name: "Tom Ramsey", party: "R", incumbent: true, note: "Incumbent — next election 2026" },
    ],
    detail: "Tom Ramsey has held PCT 3 since 2021. No Democratic challenger on file as of June 2026.",
  },
  "PCT-4": {
    office: "Commissioner Precinct 4",
    status: "partial",
    sides: [
      { name: "Lesley Briones", party: "D", incumbent: true, note: "Incumbent — next election 2026" },
    ],
    detail: "Lesley Briones has held PCT 4 since 2023. No Republican challenger filed as of June 2026.",
  },
};

export function getMatchup(districtKey: string): Matchup | null {
  return MATCHUPS_2026[districtKey] ?? null;
}
