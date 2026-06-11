// Build the historical precinct data layer (the moat).
// Sources — all public, all official:
//   Texas Legislative Council TED API (ted.capitol.texas.gov) — VTD-level
//   general-election returns + voter data (registration, turnout, and
//   SPANISH-SURNAME voter registration/turnout, the official SSVR metric):
//     2020 General (election 377): President (1), U.S. Senate (2), Voter (1428)
//     2022 General (election 497): Governor (37), Voter (1428)
//     2024 General (election 510): President (1), U.S. Senate (2), Voter (1428)
//   TLC VTD census population (2020 Census redistricting file): VTDs_24PG_Pop
//   2026 primary ballots: public/data/precinct-turnout-2026.json (in repo)
//
// Output: public/data/precinct-history.json keyed by CURRENT precinct number.
// Harris renumbered precincts for 2022 — 2020-cycle rows that don't match a
// current precinct key are kept out of per-precinct trends (join rate logged,
// stored in meta) but included in countywide totals.
//
// Run: node scripts/build-precinct-history.mjs

import { writeFileSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const HARRIS_FIPS = "201";

async function fetchCsv(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

function parseCsv(text) {
  const lines = text.trim().split("\n");
  const header = lines[0].split(",").map(h => h.trim());
  return lines.slice(1).map(l => {
    // simple CSV — TED quotes only the CNTYVTD field
    const cells = l.split(",").map(c => c.replace(/^"|"$/g, "").trim());
    return Object.fromEntries(header.map((h, i) => [h, cells[i]]));
  });
}

// Header pattern: <Name><PartyLetter>_<yy>G_<office>, e.g. HarrisD_24G_President
function candidateColumns(header) {
  return header.filter(h => /_(\d\d)G_/.test(h)).map(col => {
    const stem = col.split("_")[0];
    const party = stem.slice(-1);
    return { col, name: stem.slice(0, -1), party };
  });
}

// Surname origin classification for statewide candidates in these races.
// Basis: U.S. Census Bureau 2010 surname tabulation predominant origin.
// This is a descriptive label on the CANDIDATE's surname — not a claim about
// the candidate, and never applied to voters.
const SURNAME_ORIGIN = {
  Biden: "European (Irish/English)", Trump: "European (German)",
  Hegar: "European (German)", Cornyn: "European (Irish)",
  ORourke: "European (Irish)", "O'Rourke": "European (Irish)", Abbott: "European (English)",
  Harris: "European (English)", Allred: "European (English)",
  Cruz: "Spanish-origin", Oliver: "European (English)", Stein: "European (German/Jewish)",
  Jorgensen: "European (Danish)", Hogan: "European (Irish)", West: "European (English)",
};

const CYCLES = [
  { key: "2020G", label: "2020 General", election: 377, races: [{ office: 1, slug: "president", label: "President" }, { office: 2, slug: "senate", label: "U.S. Senate" }] },
  { key: "2022G", label: "2022 General", election: 497, races: [{ office: 37, slug: "governor", label: "Governor" }] },
  { key: "2024G", label: "2024 General", election: 510, races: [{ office: 1, slug: "president", label: "President" }, { office: 2, slug: "senate", label: "U.S. Senate" }] },
];

// Current precinct keys from the crosswalk
const crosswalk = JSON.parse(readFileSync(join(ROOT, "lib/precinct-crosswalk.json"), "utf8")).precincts;
const CURRENT = new Set(Object.keys(crosswalk));

const out = { builtAt: new Date().toISOString(), source: "Texas Legislative Council TED API + 2020 Census VTD population + Harris County Clerk 2026 primary", cycles: {}, demographics: {}, meta: {} };

for (const cycle of CYCLES) {
  const cyc = { label: cycle.label, races: {}, voter: {} };

  for (const race of cycle.races) {
    const url = `https://ted.capitol.texas.gov/api/Offices/${cycle.election}/${race.office}/vtd`;
    console.log(`fetch ${cycle.key} ${race.slug} …`);
    const rows = parseCsv(await fetchCsv(url)).filter(r => r.CNTYVTD.startsWith(HARRIS_FIPS));
    const header = Object.keys(rows[0]);
    const cands = candidateColumns(header);
    const votes = {};
    for (const r of rows) {
      const prec = r.CNTYVTD.slice(3); // strip county FIPS
      votes[prec] = cands.map(c => parseInt(r[c.col], 10) || 0);
    }
    cyc.races[race.slug] = {
      label: race.label,
      candidates: cands.map(c => ({ name: c.name, party: c.party, surnameOrigin: SURNAME_ORIGIN[c.name] ?? null })),
      votes,
    };
    console.log(`  ${rows.length} Harris VTDs, ${cands.length} candidates: ${cands.map(c => c.name + "-" + c.party).join(", ")}`);
  }

  // Voter data: registration, turnout, Spanish-surname registration/turnout
  console.log(`fetch ${cycle.key} voter data …`);
  const vrows = parseCsv(await fetchCsv(`https://ted.capitol.texas.gov/api/Offices/${cycle.election}/1428/vtd`))
    .filter(r => r.CNTYVTD.startsWith(HARRIS_FIPS));
  for (const r of vrows) {
    const prec = r.CNTYVTD.slice(3);
    cyc.voter[prec] = {
      reg: parseInt(r.Voter_Registration, 10) || 0,
      turnout: parseInt(r.Turnout, 10) || 0,
      ssvr: parseInt(r.Spanish_Surname_Voter_Registration, 10) || 0,
      ssto: Math.round((parseFloat(r.Spanish_Surname_Turnout) || 0) * (parseInt(r.Spanish_Surname_Voter_Registration, 10) || 0)),
    };
  }

  const joined = Object.keys(cyc.voter).filter(p => CURRENT.has(p)).length;
  out.meta[cycle.key] = { vtds: Object.keys(cyc.voter).length, joinedToCurrent: joined };
  console.log(`  ${Object.keys(cyc.voter).length} VTDs, ${joined} join current precinct keys`);
  out.cycles[cycle.key] = cyc;
}

// 2026 primary (already in repo) as the fourth cycle — participation, not a
// general result; the UI charts it as its own series.
const t26 = JSON.parse(readFileSync(join(ROOT, "public/data/precinct-turnout-2026.json"), "utf8"));
const p26 = {};
for (const [prec, v] of Object.entries(t26.precincts)) {
  p26[prec] = { dem: v.dem ?? v.d ?? 0, rep: v.rep ?? v.r ?? 0 };
}
out.cycles["2026P"] = { label: "2026 Primary", primary: p26 };
console.log(`2026P: ${Object.keys(p26).length} precincts from repo`);

// Census demographics per VTD (current 24PG geography)
console.log("fetch VTD census population …");
const popUrl = "https://data.capitol.texas.gov/dataset/4d8298d0-d176-4c19-b174-42837027b73e/resource/bf9b54a8-090c-41d0-8f00-e263fc1789c5/download/vtds_24pg_pop.zip";
// The zip is a single text file; Node can't unzip natively — fetch and inflate
// via the raw deflate stream of the lone entry.
import { inflateRawSync } from "zlib";
const buf = Buffer.from(await (await fetch(popUrl, { signal: AbortSignal.timeout(120_000) })).arrayBuffer());
// minimal zip parse: find local file header, extract deflated data
const nameLen = buf.readUInt16LE(26), extraLen = buf.readUInt16LE(28);
const compSize = buf.readUInt32LE(18);
const dataStart = 30 + nameLen + extraLen;
const method = buf.readUInt16LE(8);
const raw = method === 0 ? buf.slice(dataStart, dataStart + compSize) : inflateRawSync(buf.slice(dataStart, dataStart + compSize));
const popRows = parseCsv(raw.toString("utf8")).filter(r => r.County === "HARRIS");
for (const r of popRows) {
  out.demographics[r.VTD] = {
    vap: parseInt(r.vap, 10) || 0,
    anglo: parseInt(r.anglovap, 10) || 0,
    black: parseInt(r.blackvap, 10) || 0,
    hisp: parseInt(r.hispvap, 10) || 0,
    asian: parseInt(r.asianvap, 10) || 0,
  };
}
console.log(`demographics: ${popRows.length} Harris VTDs (2020 Census VAP)`);

const dest = join(ROOT, "public/data/precinct-history.json");
writeFileSync(dest, JSON.stringify(out));
console.log(`wrote ${dest} (${(JSON.stringify(out).length / 1024).toFixed(0)} KB)`);
