// Fetch ALL contested Harris County races across 7 general election cycles
// from the TED API and build public/data/district-races.json.
//
// Covers: state house, state senate, congressional, JP, constable,
//         commissioner, county offices, and contested district/county judges.
//
// Run: node scripts/fetch-all-races.mjs
// Output: public/data/district-races.json

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const HARRIS = "201";

// ── Election cycle IDs ────────────────────────────────────────────────────────
const ELECTIONS = [
  { key: "2024G", label: "2024 General", id: 510 },
  { key: "2022G", label: "2022 General", id: 497 },
  { key: "2020G", label: "2020 General", id: 377 },
  { key: "2018G", label: "2018 General", id: 456 },
  { key: "2016G", label: "2016 General", id: 444 },
  { key: "2014G", label: "2014 General", id: 414 },
  { key: "2012G", label: "2012 General", id: 395 },
];

// ── Office ID definitions (consistent across all elections) ───────────────────
// Each entry: { officeId, districtType, districtValue, slug, label }
// districtType = "hd"|"sd"|"cd"|"jp"|"pct"|"county" (null = county-wide)

const OFFICES = [
  // ── State House ─────────────────────────────────────────────────────────────
  { officeId: 240, districtType: "hd", districtValue: "126", slug: "state_rep_126" },
  { officeId: 241, districtType: "hd", districtValue: "127", slug: "state_rep_127" },
  { officeId: 242, districtType: "hd", districtValue: "128", slug: "state_rep_128" },
  { officeId: 243, districtType: "hd", districtValue: "129", slug: "state_rep_129" },
  { officeId: 244, districtType: "hd", districtValue: "130", slug: "state_rep_130" },
  { officeId: 245, districtType: "hd", districtValue: "131", slug: "state_rep_131" },
  { officeId: 246, districtType: "hd", districtValue: "132", slug: "state_rep_132" },
  { officeId: 247, districtType: "hd", districtValue: "133", slug: "state_rep_133" },
  { officeId: 248, districtType: "hd", districtValue: "134", slug: "state_rep_134" },
  { officeId: 249, districtType: "hd", districtValue: "135", slug: "state_rep_135" },
  { officeId: 251, districtType: "hd", districtValue: "137", slug: "state_rep_137" },
  { officeId: 252, districtType: "hd", districtValue: "138", slug: "state_rep_138" },
  { officeId: 253, districtType: "hd", districtValue: "139", slug: "state_rep_139" },
  { officeId: 254, districtType: "hd", districtValue: "140", slug: "state_rep_140" },
  { officeId: 255, districtType: "hd", districtValue: "141", slug: "state_rep_141" },
  { officeId: 256, districtType: "hd", districtValue: "142", slug: "state_rep_142" },
  { officeId: 257, districtType: "hd", districtValue: "143", slug: "state_rep_143" },
  { officeId: 258, districtType: "hd", districtValue: "144", slug: "state_rep_144" },
  { officeId: 259, districtType: "hd", districtValue: "145", slug: "state_rep_145" },
  { officeId: 260, districtType: "hd", districtValue: "146", slug: "state_rep_146" },
  { officeId: 261, districtType: "hd", districtValue: "147", slug: "state_rep_147" },
  { officeId: 262, districtType: "hd", districtValue: "148", slug: "state_rep_148" },
  { officeId: 263, districtType: "hd", districtValue: "149", slug: "state_rep_149" },
  { officeId: 264, districtType: "hd", districtValue: "150", slug: "state_rep_150" },

  // ── State Senate (Harris County districts) ───────────────────────────────────
  { officeId: 88,  districtType: "sd", districtValue: "6",  slug: "state_sen_6"  },
  { officeId: 89,  districtType: "sd", districtValue: "7",  slug: "state_sen_7"  },
  { officeId: 97,  districtType: "sd", districtValue: "15", slug: "state_sen_15" },
  { officeId: 99,  districtType: "sd", districtValue: "17", slug: "state_sen_17" },
  // Also try SD 11 and SD 13 (may partially cover Harris)
  { officeId: 92,  districtType: "sd", districtValue: "11", slug: "state_sen_11" },
  { officeId: 94,  districtType: "sd", districtValue: "13", slug: "state_sen_13" },

  // ── Congressional (Harris County districts) ──────────────────────────────────
  { officeId: 6,    districtType: "cd", districtValue: "2",  slug: "us_rep_2"  },
  { officeId: 11,   districtType: "cd", districtValue: "7",  slug: "us_rep_7"  },
  { officeId: 12,   districtType: "cd", districtValue: "8",  slug: "us_rep_8"  },
  { officeId: 13,   districtType: "cd", districtValue: "9",  slug: "us_rep_9"  },
  { officeId: 22,   districtType: "cd", districtValue: "18", slug: "us_rep_18" },
  { officeId: 26,   districtType: "cd", districtValue: "22", slug: "us_rep_22" },
  { officeId: 33,   districtType: "cd", districtValue: "29", slug: "us_rep_29" },
  { officeId: 1642, districtType: "cd", districtValue: "36", slug: "us_rep_36" },

  // ── JP (Justice of the Peace) ────────────────────────────────────────────────
  { officeId: 1063, districtType: "jp", districtValue: "5", slug: "jp_5_pl1" },
  { officeId: 1067, districtType: "jp", districtValue: "7", slug: "jp_7_pl1" },
  { officeId: 1069, districtType: "jp", districtValue: "8", slug: "jp_8_pl1" },
  // Try other JP precincts (may not be contested in 2024G but could be in other cycles)
  { officeId: 1050, districtType: "jp", districtValue: "1", slug: "jp_1_pl1" },
  { officeId: 1051, districtType: "jp", districtValue: "1", slug: "jp_1_pl2" },
  { officeId: 1053, districtType: "jp", districtValue: "2", slug: "jp_2_pl1" },
  { officeId: 1054, districtType: "jp", districtValue: "2", slug: "jp_2_pl2" },
  { officeId: 1056, districtType: "jp", districtValue: "3", slug: "jp_3_pl1" },
  { officeId: 1057, districtType: "jp", districtValue: "3", slug: "jp_3_pl2" },
  { officeId: 1059, districtType: "jp", districtValue: "4", slug: "jp_4_pl1" },
  { officeId: 1060, districtType: "jp", districtValue: "4", slug: "jp_4_pl2" },
  { officeId: 1062, districtType: "jp", districtValue: "5", slug: "jp_5_pl2" },
  { officeId: 1064, districtType: "jp", districtValue: "6", slug: "jp_6_pl1" },
  { officeId: 1065, districtType: "jp", districtValue: "6", slug: "jp_6_pl2" },
  { officeId: 1068, districtType: "jp", districtValue: "7", slug: "jp_7_pl2" },
  { officeId: 1070, districtType: "jp", districtValue: "8", slug: "jp_8_pl2" },

  // ── Constable ────────────────────────────────────────────────────────────────
  { officeId: 1197, districtType: "jp", districtValue: "3", slug: "constable_3" },
  { officeId: 1198, districtType: "jp", districtValue: "4", slug: "constable_4" },
  { officeId: 1199, districtType: "jp", districtValue: "5", slug: "constable_5" },
  // Other constables
  { officeId: 1193, districtType: "jp", districtValue: "1", slug: "constable_1" },
  { officeId: 1194, districtType: "jp", districtValue: "2", slug: "constable_2" },
  { officeId: 1200, districtType: "jp", districtValue: "6", slug: "constable_6" },
  { officeId: 1201, districtType: "jp", districtValue: "7", slug: "constable_7" },
  { officeId: 1202, districtType: "jp", districtValue: "8", slug: "constable_8" },

  // ── County Commissioner ──────────────────────────────────────────────────────
  { officeId: 874, districtType: "pct", districtValue: "1", slug: "commissioner_1" },
  { officeId: 876, districtType: "pct", districtValue: "3", slug: "commissioner_3" },
  // Pct 2 and 4 might be at other offices (check):
  { officeId: 875, districtType: "pct", districtValue: "2", slug: "commissioner_2" },
  { officeId: 877, districtType: "pct", districtValue: "4", slug: "commissioner_4" },

  // ── County-wide offices (Harris County) ─────────────────────────────────────
  { officeId: 729,  districtType: "county", slug: "harris_da"          },
  { officeId: 737,  districtType: "county", slug: "harris_co_attorney" },
  { officeId: 777,  districtType: "county", slug: "harris_tax_ac"      },
  { officeId: 789,  districtType: "county", slug: "harris_sheriff"     },

  // ── Contested District Judges (Harris County) ────────────────────────────────
  { officeId: 451,  districtType: "county", slug: "district_judge_11th"  },
  { officeId: 453,  districtType: "county", slug: "district_judge_61st"  },
  { officeId: 454,  districtType: "county", slug: "district_judge_80th"  },
  { officeId: 458,  districtType: "county", slug: "district_judge_129th" },
  { officeId: 459,  districtType: "county", slug: "district_judge_133rd" },
  { officeId: 463,  districtType: "county", slug: "district_judge_164th" },
  { officeId: 464,  districtType: "county", slug: "district_judge_165th" },
  { officeId: 467,  districtType: "county", slug: "district_judge_177th" },
  { officeId: 479,  districtType: "county", slug: "district_judge_215th" },
  { officeId: 504,  districtType: "county", slug: "district_judge_333rd" },
  { officeId: 507,  districtType: "county", slug: "district_judge_338th" },
  { officeId: 1743, districtType: "county", slug: "district_judge_507th" },
  { officeId: 1744, districtType: "county", slug: "county_crim_ct_16"   },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
async function fetchCsv(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

function parseCsv(text) {
  const lines = text.trim().split("\n");
  const header = lines[0].split(",").map(h => h.trim());
  return { header, rows: lines.slice(1).map(l => {
    const cells = l.split(",").map(c => c.replace(/^"|"$/g, "").trim());
    return Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ""]));
  })};
}

// Parse TED column name: "AllredD_24G_U.S. Sen" → { name, party, race }
function parseCol(col) {
  // Match: {Name}{Party}_{YY}{Cycle}_{RaceName}
  const m = col.match(/^(.+?)([DRLWG])_\d\d[GPRA]_(.+)$/);
  if (!m) return null;
  return { name: m[1], party: m[2], race: m[3] };
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

// ── Main fetch ────────────────────────────────────────────────────────────────
// Result structure: district-races[districtType][districtValue][cycleKey] = race
// For county-type: district-races["county"][slug][cycleKey] = race
const output = { hd: {}, sd: {}, cd: {}, jp: {}, pct: {}, county: {} };

let fetched = 0, skipped = 0, errors = 0;

// Process in batches to avoid hammering the API
const CONCURRENCY = 12;

async function processOfficeForElection(office, electionDef) {
  const url = `https://ted.capitol.texas.gov/api/Offices/${electionDef.id}/${office.officeId}/vtd`;
  let data;
  try {
    const text = await fetchCsv(url);
    data = parseCsv(text);
  } catch (e) {
    errors++;
    return;
  }

  // Filter to Harris County
  const harrisRows = data.rows.filter(r => r.CNTYVTD?.startsWith(HARRIS));
  if (harrisRows.length === 0) { skipped++; return; }

  // Find candidate columns (exclude CNTYVTD, VTDKEY, voter reg)
  const candCols = data.header
    .filter(h => !["CNTYVTD", "VTDKEY", "Voter_Registration", "Turnout"].includes(h))
    .map(h => ({ col: h, parsed: parseCol(h) }))
    .filter(x => x.parsed !== null);

  if (candCols.length < 2) { skipped++; return; } // skip uncontested

  // Check if it's actually contested (D and R present)
  const hasD = candCols.some(c => c.parsed.party === "D");
  const hasR = candCols.some(c => c.parsed.party === "R");
  if (!hasD || !hasR) { skipped++; return; }

  // Derive label from race name in first candidate column
  const raceLabel = candCols[0].parsed.race + " (" + electionDef.label + ")";

  // Build votes object: { precinct: [vote0, vote1, ...] }
  const votes = {};
  for (const row of harrisRows) {
    const prec = row.CNTYVTD.slice(3);
    votes[prec] = candCols.map(c => parseInt(row[c.col], 10) || 0);
  }

  const raceEntry = {
    label: candCols[0].parsed.race,
    candidates: candCols.map(c => ({ name: c.parsed.name, party: c.parsed.party })),
    votes,
  };

  // Store in correct place
  const { districtType, districtValue, slug } = office;
  if (districtType === "county") {
    if (!output.county[slug]) output.county[slug] = {};
    output.county[slug][electionDef.key] = raceEntry;
  } else {
    const dv = districtValue;
    // Use slug as sub-key within district (for jp that has jp_N_pl1 and constable_N)
    const raceSlug = slug;
    if (!output[districtType][dv]) output[districtType][dv] = {};
    if (!output[districtType][dv][electionDef.key]) output[districtType][dv][electionDef.key] = {};
    output[districtType][dv][electionDef.key][raceSlug] = raceEntry;
  }
  fetched++;
}

// Run all fetches with concurrency limit
const tasks = [];
for (const elec of ELECTIONS) {
  for (const office of OFFICES) {
    tasks.push({ elec, office });
  }
}

console.log(`Fetching ${tasks.length} office×election combinations (${CONCURRENCY} concurrent)…`);
for (let i = 0; i < tasks.length; i += CONCURRENCY) {
  const batch = tasks.slice(i, i + CONCURRENCY);
  await Promise.all(batch.map(t => processOfficeForElection(t.office, t.elec)));
  process.stdout.write(`\r  ${i + batch.length}/${tasks.length} done, ${fetched} stored, ${skipped} skipped`);
}
console.log("\n");

// Summary
console.log("Results:");
for (const [dtype, districts] of Object.entries(output)) {
  const races = dtype === "county"
    ? Object.keys(districts).length
    : Object.values(districts).reduce((s, d) => s + Object.keys(d).length, 0);
  if (races > 0) console.log("  " + dtype + ": " + Object.keys(districts).length + " districts, " + races + " district×cycle entries");
}

// Write output
const dest = join(ROOT, "public/data/district-races.json");
writeFileSync(dest, JSON.stringify(output));
const kb = Math.round(JSON.stringify(output).length / 1024);
console.log(`\nWrote ${dest} (${kb} KB)`);
console.log(`Fetched: ${fetched}, Skipped (uncontested/missing): ${skipped}, Errors: ${errors}`);
