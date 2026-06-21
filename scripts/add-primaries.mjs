// Fetch all primary cycles (2012P–2024P) + 2012G + 2014G from TED and append
// them to public/data/precinct-history.json.
//
// Run: node scripts/add-primaries.mjs
// Safe to re-run: skips cycles already present.

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const HARRIS = "201";

async function fetchCsv(url) {
  console.log(`  fetch ${url}`);
  const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
  return res.text();
}

function parseCsv(text) {
  const lines = text.trim().split("\n");
  const header = lines[0].split(",").map(h => h.trim());
  return lines.slice(1).map(l => {
    const cells = l.split(",").map(c => c.replace(/^"|"$/g, "").trim());
    return Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ""]));
  });
}

// Returns { precinct: { dem, rep } } by summing all D/R candidate columns.
async function fetchPrimary(dElection, rElection, office) {
  const pattern = /^[A-Za-z' ]+(?:D|R)_\d\d[PR]_/;
  const result = {};

  for (const [election, party] of [[dElection, "D"], [rElection, "R"]]) {
    const rows = parseCsv(await fetchCsv(
      `https://ted.capitol.texas.gov/api/Offices/${election}/${office}/vtd`
    )).filter(r => r.CNTYVTD.startsWith(HARRIS));

    if (rows.length === 0) { console.warn(`  WARNING: no Harris rows for election ${election}`); continue; }

    const header = Object.keys(rows[0]);
    const candCols = header.filter(h => pattern.test(h));

    for (const row of rows) {
      const prec = row.CNTYVTD.slice(3);
      const total = candCols.reduce((s, c) => s + (parseInt(row[c]) || 0), 0);
      if (!result[prec]) result[prec] = { dem: 0, rep: 0 };
      if (party === "D") result[prec].dem += total;
      else result[prec].rep += total;
    }
    console.log(`    ${rows.length} Harris VTDs (election ${election} party ${party})`);
  }
  return result;
}

// Candidate column pattern for general elections: e.g. TrumpR_24G_President
const CAND_PATTERN = /^[A-Za-z\s'.-]+[DRL]_\d\d[G]_/;

function candidateColumns(header) {
  return header.filter(h => CAND_PATTERN.test(h)).map(col => {
    const stem = col.split("_")[0];
    const party = stem.slice(-1);
    const name = stem.slice(0, -1);
    return { col, name, party };
  });
}

const SURNAME_ORIGIN = {
  Obama: "African-origin", Romney: "European (Welsh/English)", Ryan: "European (Irish)",
  Biden: "European (Irish/English)", Trump: "European (German)",
  Abbott: "European (English)", Davis: "European (Welsh/English)", Glass: "European (English)",
  Cornyn: "European (Irish)", Alameel: "Arabic-origin",
  Cruz: "Spanish-origin",
};

// Returns a races object for a general election.
async function fetchGeneral(election, raceSpecs) {
  const races = {};
  for (const { office, slug, label } of raceSpecs) {
    let rows;
    try {
      rows = parseCsv(await fetchCsv(
        `https://ted.capitol.texas.gov/api/Offices/${election}/${office}/vtd`
      )).filter(r => r.CNTYVTD.startsWith(HARRIS));
    } catch {
      console.warn(`  Skipping ${label} (election ${election} office ${office}) — not available`);
      continue;
    }
    if (!rows.length) continue;

    const header = Object.keys(rows[0]);
    const cands = candidateColumns(header);
    if (!cands.length) {
      console.warn(`  No candidate columns for ${label}`);
      continue;
    }

    const votes = {};
    for (const row of rows) {
      const prec = row.CNTYVTD.slice(3);
      votes[prec] = cands.map(c => parseInt(row[c.col], 10) || 0);
    }
    races[slug] = {
      label,
      candidates: cands.map(c => ({ name: c.name, party: c.party, surnameOrigin: SURNAME_ORIGIN[c.name] ?? null })),
      votes,
    };
    console.log(`    ${rows.length} Harris VTDs, ${cands.length} candidates: ${cands.map(c => c.name + "-" + c.party).join(", ")}`);
  }
  return races;
}

// ── Primary cycle definitions ─────────────────────────────────────────────────
const PRIMARIES = [
  { key: "2024P", label: "2024 Primary", dElection: 502, rElection: 503, office: 1 },
  { key: "2022P", label: "2022 Primary", dElection: 489, rElection: 490, office: 37 },
  { key: "2020P", label: "2020 Primary", dElection: 479, rElection: 478, office: 1 },
  { key: "2018P", label: "2018 Primary", dElection: 447, rElection: 446, office: 37 },
  { key: "2016P", label: "2016 Primary", dElection: 436, rElection: 437, office: 1 },
  { key: "2014P", label: "2014 Primary", dElection: 403, rElection: 404, office: 37 },
  { key: "2012P", label: "2012 Primary", dElection: 389, rElection: 390, office: 1 },
];

// ── General cycle definitions ─────────────────────────────────────────────────
const GENERALS = [
  {
    key: "2014G", label: "2014 General", election: 414,
    races: [
      { office: 37, slug: "governor", label: "Governor" },
      { office: 2,  slug: "senate",   label: "U.S. Senate" },
    ],
  },
  {
    key: "2012G", label: "2012 General", election: 395,
    races: [
      { office: 1, slug: "president", label: "President" },
      { office: 2, slug: "senate",    label: "U.S. Senate" },
    ],
  },
];

// ── Main ───────────────────────────────────────────────────────────────────────
const hist = JSON.parse(readFileSync(join(ROOT, "public/data/precinct-history.json"), "utf-8"));
const existing = new Set(Object.keys(hist.cycles));

// Primaries
for (const p of PRIMARIES) {
  if (existing.has(p.key)) { console.log(`Skip ${p.key} — already present`); continue; }
  console.log(`\n[ ${p.key} ]`);
  const primary = await fetchPrimary(p.dElection, p.rElection, p.office);
  const count = Object.keys(primary).length;
  const demTotal = Object.values(primary).reduce((s, v) => s + v.dem, 0);
  const repTotal = Object.values(primary).reduce((s, v) => s + v.rep, 0);
  console.log(`  → ${count} precincts, D=${demTotal.toLocaleString()}, R=${repTotal.toLocaleString()}`);
  hist.cycles[p.key] = { label: p.label, primary };
}

// Generals
for (const g of GENERALS) {
  if (existing.has(g.key)) { console.log(`Skip ${g.key} — already present`); continue; }
  console.log(`\n[ ${g.key} ]`);
  const races = await fetchGeneral(g.election, g.races);
  if (!Object.keys(races).length) { console.warn(`  No races fetched for ${g.key} — skipping`); continue; }
  hist.cycles[g.key] = { label: g.label, races, voter: {} };
}

const dest = join(ROOT, "public/data/precinct-history.json");
writeFileSync(dest, JSON.stringify(hist));
console.log(`\nWrote ${dest} (${(JSON.stringify(hist).length / 1024).toFixed(0)} KB)`);
