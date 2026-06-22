// Maps a precinct-crosswalk entry to every elected official representing that
// location, JP level up through Congress. Pulls from POLITICIANS (profiles)
// and FINANCE_DATA names (JPs/constables/congress without profiles yet).

import { POLITICIANS, type Politician } from "./politicians";

export interface RepEntry {
  name: string;
  office: string;
  district: string;
  party: "D" | "R" | "NP";
  level: "Congress" | "Texas Legislature" | "Harris County" | "Justice Court" | "City of Houston";
  slug?: string;        // present when a /politicians/[slug] profile exists
  url?: string;         // external official website (used when no internal slug)
  note?: string;
}

// Current U.S. House officeholders for Harris-area districts (June 2026).
// District lines shown are the 2025 enacted plan (PLANC2333); members were
// elected under prior lines — flagged in the UI note.
const CONGRESS: Record<string, { name: string; party: "D" | "R"; url?: string; note?: string }> = {
  "2":  { name: "Dan Crenshaw",      party: "R", url: "https://crenshaw.house.gov", note: "Lost March 2026 primary to Steve Toth; term ends Jan 2027" },
  "7":  { name: "Lizzie Fletcher",   party: "D", url: "https://fletcher.house.gov" },
  "8":  { name: "Morgan Luttrell",   party: "R", url: "https://luttrell.house.gov", note: "Not seeking reelection — open seat 2026; term ends Jan 2027" },
  "9":  { name: "Al Green",          party: "D", url: "https://algreen.house.gov", note: "Retiring — lost CD-18 runoff; term ends Jan 2027" },
  "18": { name: "Christian Menefee", party: "D", note: "Sworn in after Sylvester Turner's death; won May 2026 Democratic runoff over Al Green 69–31%; seeking first full term" },
  "22": { name: "Troy Nehls",        party: "R", url: "https://nehls.house.gov", note: "Not seeking reelection — open seat 2026; term ends Jan 2027" },
  "29": { name: "Sylvia Garcia",     party: "D", url: "https://sylviagarcia.house.gov" },
  "36": { name: "Brian Babin",       party: "R", url: "https://babin.house.gov" },
  "38": { name: "Wesley Hunt",       party: "R", url: "https://wesleyhunt.house.gov", note: "Leaving — ran for Senate; term ends Jan 2027" },
};

const US_SENATORS: RepEntry[] = [
  { name: "John Cornyn", office: "U.S. Senator", district: "Texas", party: "R", level: "Congress", url: "https://www.cornyn.senate.gov", note: "Lost runoff — term ends Jan 2027" },
  { name: "Ted Cruz",    office: "U.S. Senator", district: "Texas", party: "R", level: "Congress", url: "https://www.cruz.senate.gov" },
];

// Justice Court bench per JP precinct (two places each) + constable.
const JP_BENCH: Record<string, { jps: { name: string; place: number; party: "D" | "R" }[]; constable: { name: string; party: "D" | "R" } }> = {
  "1": { jps: [{ name: "Eric William Carter", place: 1, party: "D" }, { name: "Steve Duble", place: 2, party: "D" }],        constable: { name: "Alan Rosen", party: "D" } },
  "2": { jps: [{ name: "Jo Ann Delgado", place: 1, party: "D" },     { name: "Dolores Lozano", place: 2, party: "D" }],      constable: { name: "Jerry Garcia", party: "D" } },
  "3": { jps: [{ name: "Joe Stephens", place: 1, party: "D" },       { name: "Lucia Bates", place: 2, party: "D" }],         constable: { name: "Sherman Eagleton", party: "D" } },
  "4": { jps: [{ name: "Lincoln Goodwin", place: 1, party: "D" },    { name: "Laryssa Korduba", place: 2, party: "D" }],     constable: { name: "Mark Herman", party: "R" } },
  "5": { jps: [{ name: "James Lombardino", place: 1, party: "R" },   { name: "Bob Wolfe", place: 2, party: "R" }],           constable: { name: "Terry Allbritton", party: "R" } },
  "6": { jps: [{ name: "Victor Treviño III", place: 1, party: "D" }, { name: "Angela D. Rodriguez", place: 2, party: "D" }], constable: { name: "Silvia Trevino", party: "D" } },
  "7": { jps: [{ name: "Wanda E. Adams", place: 1, party: "D" },     { name: "Sharon M. Burney", place: 2, party: "D" }],    constable: { name: "James Phillips", party: "D" } },
  "8": { jps: [{ name: "Holly Williamson", place: 1, party: "R" },   { name: "Louie Ditta", place: 2, party: "R" }],         constable: { name: "Phil Sandlin", party: "R" } },
};

function fromPol(p: Politician, level: RepEntry["level"]): RepEntry {
  return { name: p.name, office: p.office, district: p.district, party: p.party, level, slug: p.slug, ...(p.note ? { note: p.note } : {}) };
}

export interface CrosswalkEntry {
  cd?: string; sd?: string; hd?: string; jp?: string; council?: string; pct?: string;
}

export function findRepresentatives(cw: CrosswalkEntry): RepEntry[] {
  const reps: RepEntry[] = [];

  // ── Congress ──
  reps.push(...US_SENATORS);
  if (cw.cd && CONGRESS[cw.cd]) {
    const m = CONGRESS[cw.cd];
    reps.push({ name: m.name, office: "U.S. Representative", district: `CD-${cw.cd}`, party: m.party, level: "Congress", url: m.url, note: m.note });
  }

  // ── Texas Legislature ──
  // termStart > 2026 = 2026 nominee not yet in office; exclude from current-rep lookup
  const isCurrent = (p: { termStart?: number }) => !p.termStart || p.termStart <= 2026;
  if (cw.sd) {
    const p = POLITICIANS.find(x => x.district === `SD-${cw.sd}` && isCurrent(x));
    if (p) reps.push(fromPol(p, "Texas Legislature"));
  }
  if (cw.hd) {
    const p = POLITICIANS.find(x => x.district === `HD-${cw.hd}` && isCurrent(x));
    if (p) reps.push(fromPol(p, "Texas Legislature"));
  }

  // ── Harris County ──
  const judge = POLITICIANS.find(x => x.office === "Harris County Judge");
  if (judge) reps.push(fromPol(judge, "Harris County"));
  if (cw.pct) {
    const p = POLITICIANS.find(x => x.chamber === "County" && x.district === `Precinct ${cw.pct}`);
    if (p) reps.push(fromPol(p, "Harris County"));
  }

  // ── Justice Court (JP + Constable) ──
  if (cw.jp && JP_BENCH[cw.jp]) {
    const bench = JP_BENCH[cw.jp];
    for (const j of bench.jps) {
      reps.push({ name: j.name, office: `Justice of the Peace, Place ${j.place}`, district: `JP Precinct ${cw.jp}`, party: j.party, level: "Justice Court" });
    }
    reps.push({ name: bench.constable.name, office: "Constable", district: `Precinct ${cw.jp}`, party: bench.constable.party, level: "Justice Court" });
  }

  // ── City of Houston (only when inside a council district) ──
  if (cw.council) {
    const mayor = POLITICIANS.find(x => x.roles?.includes("mayor"));
    if (mayor) reps.push(fromPol(mayor, "City of Houston"));
    const controller = POLITICIANS.find(x => x.office.toLowerCase().includes("controller"));
    if (controller) reps.push(fromPol(controller, "City of Houston"));
    const cm = POLITICIANS.find(x => x.chamber === "City" && x.district === `District ${cw.council}`);
    if (cm) reps.push(fromPol(cm, "City of Houston"));
    for (const p of POLITICIANS.filter(x => x.chamber === "City" && x.district.startsWith("At-Large"))) {
      reps.push(fromPol(p, "City of Houston"));
    }
  }

  return reps;
}

export const LEVEL_ORDER: RepEntry["level"][] = ["Congress", "Texas Legislature", "Harris County", "Justice Court", "City of Houston"];
