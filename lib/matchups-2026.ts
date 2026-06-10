// Known November 2026 general-election matchups, keyed by district key
// ("CD-18", "SD-15", "HD-148", "JP-4", "COH-District C", "HC-Countywide").
// Only matchups confirmed by primary results / filings already in the project's
// data are listed — everything else falls back to "challenger awaiting filings".
// Money for each name resolves through FINANCE_DATA_MERGED at render time.

export interface MatchupSide {
  name: string;
  party: "D" | "R";
  incumbent: boolean;
  note?: string; // e.g. "runoff winner pending"
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
      { name: "James Talarico", party: "D", incumbent: false, note: "Won March primary" },
      { name: "John Cornyn",    party: "R", incumbent: true,  note: "R runoff vs Paxton pending" },
    ],
    detail: "Republican nomination heads to a May runoff between John Cornyn and Ken Paxton.",
  },
  "HC-Countywide": {
    office: "Harris County Judge",
    status: "runoff-pending",
    sides: [
      { name: "Lina Hidalgo",  party: "D", incumbent: true,  note: "D runoff vs Annise Parker pending" },
      { name: "Warren Howell", party: "R", incumbent: false, note: "R nominee" },
    ],
    detail: "Democratic primary went to a runoff; the winner faces Warren Howell in November.",
  },
  "CD-18": {
    office: "U.S. Representative, District 18",
    status: "runoff-pending",
    sides: [
      { name: "Christian Menefee", party: "D", incumbent: true, note: "D runoff vs Al Green pending" },
    ],
    detail: "Democratic runoff: Christian Menefee vs Al Green. Heavily Democratic seat — runoff winner is the strong favorite.",
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
    status: "partial",
    sides: [
      { name: "Lizzie Fletcher", party: "D", incumbent: true },
    ],
  },
  "CD-29": {
    office: "U.S. Representative, District 29",
    status: "partial",
    sides: [
      { name: "Sylvia Garcia", party: "D", incumbent: true },
    ],
  },
};

export function getMatchup(districtKey: string): Matchup | null {
  return MATCHUPS_2026[districtKey] ?? null;
}
