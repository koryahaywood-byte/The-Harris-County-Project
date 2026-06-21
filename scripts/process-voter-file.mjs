// Process Harris County voter registration + vote history files into
// demographic breakdowns by district and election.
//
// INPUTS (place in /tmp/ or pass as env vars):
//   VOTER_REG_FILE  — path to Harris County voter registration CSV
//   VOTER_HIST_FILE — path to voter history CSV
//
// OUTPUT: public/data/voter-demographics.json
//
// Harris County voter file columns (typical format):
//   Registration: VoterID, LastName, FirstName, DOB, Gender, Ethnicity,
//                 Precinct, StreetAddr, City, Zip, RegDate, Status
//   History:      VoterID, ElectionDate, ElectionType, Party, VoteMethod
//
// Run: node scripts/process-voter-file.mjs
// Estimated runtime: 5-15 min for ~2M voter records.

import { readFileSync, writeFileSync, createReadStream } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import readline from "readline";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CROSSWALK_RAW = JSON.parse(readFileSync(join(ROOT, "lib/precinct-crosswalk.json"), "utf-8"));
const CROSSWALK = CROSSWALK_RAW.precincts; // { "0001": { hd, sd, cd, jp, pct, council } }

const REG_FILE  = process.env.VOTER_REG_FILE  ?? "/tmp/harris-voter-reg.csv";
const HIST_FILE = process.env.VOTER_HIST_FILE ?? "/tmp/harris-voter-history.csv";

// ── Election cycle definitions ────────────────────────────────────────────────
// Maps election date strings → our cycle keys.
// Harris County primaries are in March; generals in November.
const ELECTION_MAP = {
  "03/05/2024": "2024P",
  "05/28/2024": "2024R",  // runoff
  "11/05/2024": "2024G",
  "03/01/2022": "2022P",
  "05/24/2022": "2022R",
  "11/08/2022": "2022G",
  "03/03/2020": "2020P",
  "07/14/2020": "2020R",
  "11/03/2020": "2020G",
  "03/06/2018": "2018P",
  "05/22/2018": "2018R",
  "11/06/2018": "2018G",
  "03/01/2016": "2016P",
  "05/24/2016": "2016R",
  "11/08/2016": "2016G",
  "03/04/2014": "2014P",
  "05/27/2014": "2014R",
  "11/04/2014": "2014G",
  "03/06/2012": "2012P",
  "05/29/2012": "2012R",
  "11/06/2012": "2012G",
  "03/04/2026": "2026P",
  "05/19/2026": "2026R",
};

// Ethnicity codes → labels (Harris County uses ABBREV codes)
const ETHNICITY = {
  "W": "White", "B": "Black", "H": "Hispanic", "A": "Asian",
  "1": "White", "2": "Black", "3": "Hispanic", "4": "Asian",
  "5": "Other", "6": "Other", "7": "Other", "U": "Other",
  "O": "Other", "I": "Other",
};

function normPrec(raw) {
  return String(raw).replace(/^0+/, "") || "0";
}

function getDistricts(prec) {
  const n = normPrec(prec);
  return CROSSWALK[prec] ?? CROSSWALK[n] ?? CROSSWALK[n.padStart(4, "0")] ?? null;
}

// ── Read CSV line by line ─────────────────────────────────────────────────────
async function readCsv(path, onRow) {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({ input: createReadStream(path) });
    let header = null;
    let count = 0;
    rl.on("line", line => {
      const cells = line.split(",").map(c => c.replace(/^"|"$/g, "").trim());
      if (!header) { header = cells; return; }
      const row = Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ""]));
      onRow(row);
      if (++count % 100_000 === 0) process.stdout.write(`\r  ${(count/1000).toFixed(0)}k rows...`);
    });
    rl.on("close", () => { console.log(""); resolve(); });
    rl.on("error", reject);
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────
console.log("Step 1: Reading voter registration file...");

// voter map: { voterId: { dob, gender, race, prec } }
const voters = new Map();

await readCsv(REG_FILE, row => {
  // Adapt column names to what Harris County actually uses.
  // Common column names (may need adjustment):
  const id      = row["VoterID"] ?? row["VOTER_ID"] ?? row["ID"];
  const dob     = row["DOB"] ?? row["BIRTH_DATE"] ?? row["DateOfBirth"];
  const gender  = (row["Gender"] ?? row["GENDER"] ?? row["SEX"] ?? "U").toUpperCase()[0];
  const race    = row["Ethnicity"] ?? row["ETHNICITY"] ?? row["Race"] ?? "U";
  const prec    = row["Precinct"] ?? row["PRECINCT"] ?? row["PCT"];

  if (!id || !prec) return;

  const birthYear = dob ? parseInt(dob.split("/").pop()) : 0;
  const age = birthYear > 1900 ? (2026 - birthYear) : 0;

  voters.set(String(id).trim(), {
    age,
    gender: gender === "M" ? "M" : gender === "F" ? "F" : "U",
    race: ETHNICITY[race?.toUpperCase()] ?? "Other",
    prec: String(prec).trim(),
  });
});

console.log(`Loaded ${voters.size.toLocaleString()} registered voters.`);

// ── Aggregation structure ─────────────────────────────────────────────────────
// agg[districtType][districtValue][cycle][party][race+gender] = { count, totalAge }
const agg = {};

function bump(distType, distVal, cycle, party, race, gender, age) {
  agg[distType] ??= {};
  agg[distType][distVal] ??= {};
  agg[distType][distVal][cycle] ??= {};
  agg[distType][distVal][cycle][party] ??= {};
  const key = `${race}::${gender}`;
  agg[distType][distVal][cycle][party][key] ??= { count: 0, totalAge: 0 };
  agg[distType][distVal][cycle][party][key].count++;
  agg[distType][distVal][cycle][party][key].totalAge += age;
}

console.log("\nStep 2: Reading vote history file...");
let matched = 0, unmatched = 0;

await readCsv(HIST_FILE, row => {
  const id       = String(row["VoterID"] ?? row["VOTER_ID"] ?? row["ID"] ?? "").trim();
  const dateRaw  = row["ElectionDate"] ?? row["ELECTION_DATE"] ?? row["Date"] ?? "";
  const party    = (row["Party"] ?? row["PARTY"] ?? "").toUpperCase();

  const cycle = ELECTION_MAP[dateRaw];
  if (!cycle) return; // election outside our target range

  const voter = voters.get(id);
  if (!voter) { unmatched++; return; }
  matched++;

  const districts = getDistricts(voter.prec);
  if (!districts) return;

  const p = party === "D" ? "dem" : party === "R" ? "rep" : "total";

  for (const [field, val] of Object.entries(districts)) {
    if (!val) continue;
    bump(field, val, cycle, p, voter.race, voter.gender, voter.age);
    if (p !== "total") bump(field, val, cycle, "total", voter.race, voter.gender, voter.age);
  }
});

console.log(`Matched ${matched.toLocaleString()} vote records, unmatched ${unmatched.toLocaleString()}.`);

// ── Build output structure ────────────────────────────────────────────────────
console.log("\nStep 3: Building output...");

const GENDER_LABEL = { M: "Men", F: "Women", U: "Other" };

function formatDistrict(distAgg) {
  const out = {};
  for (const [cycle, parties] of Object.entries(distAgg)) {
    out[cycle] = {};
    for (const [party, segments] of Object.entries(parties)) {
      const rows = Object.entries(segments).map(([key, { count, totalAge }]) => {
        const [race, gender] = key.split("::");
        return {
          label: `${race} ${GENDER_LABEL[gender] ?? "Other"}`,
          race, gender,
          count,
          avg_age: count ? Math.round(totalAge / count) : 0,
        };
      });
      // Sort by count desc, assign rank
      rows.sort((a, b) => b.count - a.count);
      const total = rows.reduce((s, r) => s + r.count, 0);
      out[cycle][party] = rows.map((r, i) => ({
        rank: i + 1,
        label: r.label,
        race: r.race,
        gender: r.gender,
        count: r.count,
        avg_age: r.avg_age,
        pct: total ? Math.round(r.count / total * 1000) / 10 : 0,
      }));
    }
  }
  return out;
}

const output = {
  source: "Harris County voter registration + vote history",
  generated: new Date().toISOString().slice(0, 10),
  districts: {},
};

for (const [distType, districts] of Object.entries(agg)) {
  output.districts[distType] = {};
  for (const [distVal, distAgg] of Object.entries(districts)) {
    output.districts[distType][distVal] = formatDistrict(distAgg);
  }
}

const dest = join(ROOT, "public/data/voter-demographics.json");
writeFileSync(dest, JSON.stringify(output));
const kb = Math.round(JSON.stringify(output).length / 1024);
console.log(`\nWrote ${dest} (${kb} KB)`);
