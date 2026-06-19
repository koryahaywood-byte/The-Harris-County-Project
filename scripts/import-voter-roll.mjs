#!/usr/bin/env node
/**
 * Import a Harris County / Texas SOS voter roll into data/voters.db
 *
 * Usage:
 *   node scripts/import-voter-roll.mjs <path-to-voter-file> [--history <path-to-history-file>]
 *
 * Accepted input formats (auto-detected):
 *   - Texas SOS fixed-width .txt  (standard county delivery)
 *   - CSV or TSV with a header row  (commercial vendors: L2, TargetSmart, Aristotle)
 *
 * The history file (optional) is the standard SOS VUID-keyed file listing
 * which elections each voter participated in.
 */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DB_PATH = path.join(ROOT, "data", "voters.db");

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
if (!args.length || args[0] === "--help") {
  console.log(`
Usage:
  node scripts/import-voter-roll.mjs <voter-file> [--history <history-file>]

Examples:
  node scripts/import-voter-roll.mjs ~/Downloads/harris_voters.txt
  node scripts/import-voter-roll.mjs ~/Downloads/harris.csv --history ~/Downloads/harris_history.txt
`);
  process.exit(0);
}

const voterFilePath = path.resolve(args[0]);
let historyFilePath = null;
const histIdx = args.indexOf("--history");
if (histIdx !== -1 && args[histIdx + 1]) {
  historyFilePath = path.resolve(args[histIdx + 1]);
}

if (!fs.existsSync(voterFilePath)) {
  console.error(`File not found: ${voterFilePath}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Texas SOS fixed-width field spec
// Columns are 1-based, end is inclusive.
// Reference: Texas Secretary of State Voter Registration Data Dictionary
// ---------------------------------------------------------------------------
const FW_FIELDS = [
  { name: "vuid",           start: 1,   end: 9   },
  { name: "county_code",    start: 10,  end: 12  },
  { name: "precinct_number",start: 13,  end: 16  },
  { name: "last_name",      start: 17,  end: 46  },
  { name: "first_name",     start: 47,  end: 66  },
  { name: "middle_name",    start: 67,  end: 86  },
  { name: "suffix",         start: 87,  end: 90  },
  { name: "dob",            start: 91,  end: 98  },  // MMDDYYYY
  { name: "gender",         start: 99,  end: 99  },
  { name: "address_street", start: 100, end: 149 },
  { name: "address_line2",  start: 150, end: 179 },
  { name: "address_city",   start: 180, end: 209 },
  { name: "address_state",  start: 210, end: 211 },
  { name: "address_zip",    start: 212, end: 216 },
];

// Common CSV header aliases from commercial vendors
const CSV_ALIASES = {
  vuid:            ["vuid", "voter_id", "voterid", "registrant_id", "txvoterid"],
  last_name:       ["last_name", "lastname", "lname", "last"],
  first_name:      ["first_name", "firstname", "fname", "first"],
  middle_name:     ["middle_name", "middlename", "mname", "middle"],
  dob:             ["dob", "date_of_birth", "birthdate", "birth_date"],
  dob_year:        ["dob_year", "birth_year", "birthyear", "yob"],
  gender:          ["gender", "sex"],
  address_street:  ["address_street", "address1", "address_1", "street_address", "res_address1"],
  address_city:    ["address_city", "city", "res_city"],
  address_zip:     ["address_zip", "zip", "zipcode", "zip_code", "res_zip"],
  precinct_number: ["precinct_number", "precinct", "pct", "vtd", "county_precinct_number"],
  estimated_race:  ["estimated_race", "race", "modeled_race", "l2_race", "race_model"],
};

// ---------------------------------------------------------------------------
// Format detection
// ---------------------------------------------------------------------------
function detectFormat(filePath) {
  const buf = Buffer.alloc(512);
  const fd = fs.openSync(filePath, "r");
  fs.readSync(fd, buf, 0, 512, 0);
  fs.closeSync(fd);
  const firstLine = buf.toString("utf8").split("\n")[0];

  // If first line contains commas or tabs with text, it's delimited
  if (firstLine.includes(",") || firstLine.includes("\t")) {
    const sep = firstLine.includes("\t") ? "\t" : ",";
    return { type: "delimited", sep };
  }

  // If line length is >= 212 chars (minimum for our fixed-width spec) it's SOS fixed-width
  if (firstLine.trimEnd().length >= 99) {
    return { type: "fixed_width" };
  }

  // Fallback: try comma
  return { type: "delimited", sep: "," };
}

// ---------------------------------------------------------------------------
// Parse fixed-width row
// ---------------------------------------------------------------------------
function parseFWRow(line) {
  const get = (start, end) => line.substring(start - 1, end).trim();
  const dob = get(FW_FIELDS.find(f => f.name === "dob").start, FW_FIELDS.find(f => f.name === "dob").end);
  return {
    vuid:            get(1, 9),
    precinct_number: get(13, 16).replace(/^0+/, "") || "0",
    last_name:       get(17, 46),
    first_name:      get(47, 66),
    middle_name:     get(67, 86),
    dob_year:        dob.length >= 8 ? dob.slice(-4) : null,
    gender:          get(99, 99),
    address_street:  [get(100, 149), get(150, 179)].filter(Boolean).join(", "),
    address_city:    get(180, 209),
    address_zip:     get(212, 216),
    estimated_race:  null,
  };
}

// ---------------------------------------------------------------------------
// Parse CSV/TSV header → column map
// ---------------------------------------------------------------------------
function buildColumnMap(headers, sep) {
  const lower = headers.map(h => h.toLowerCase().trim().replace(/['"]/g, ""));
  const map = {};
  for (const [field, aliases] of Object.entries(CSV_ALIASES)) {
    for (const alias of aliases) {
      const idx = lower.indexOf(alias);
      if (idx !== -1) { map[field] = idx; break; }
    }
  }
  return map;
}

function parseCSVRow(line, sep) {
  // Minimal CSV parse — handles quoted fields
  const result = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQ = !inQ; continue; }
    if (ch === sep && !inQ) { result.push(cur); cur = ""; continue; }
    cur += ch;
  }
  result.push(cur);
  return result;
}

function csvRowToRecord(cells, colMap) {
  const g = (field) => (colMap[field] !== undefined ? (cells[colMap[field]] || "").trim() : null);
  const dobRaw = g("dob") || "";
  let dob_year = g("dob_year");
  if (!dob_year && dobRaw) {
    // Try MMDDYYYY (SOS style)
    if (/^\d{8}$/.test(dobRaw)) dob_year = dobRaw.slice(-4);
    // Try YYYY-MM-DD or MM/DD/YYYY
    else if (/^\d{4}-\d{2}-\d{2}$/.test(dobRaw)) dob_year = dobRaw.slice(0, 4);
    else if (/^\d{1,2}\/\d{1,2}\/(\d{4})$/.test(dobRaw)) dob_year = dobRaw.match(/(\d{4})$/)?.[1] || null;
  }
  const prec = g("precinct_number") || "";
  return {
    vuid:            g("vuid"),
    precinct_number: prec.replace(/^0+/, "") || "0",
    last_name:       g("last_name"),
    first_name:      g("first_name"),
    middle_name:     g("middle_name"),
    dob_year,
    gender:          g("gender"),
    address_street:  g("address_street"),
    address_city:    g("address_city"),
    address_zip:     g("address_zip"),
    estimated_race:  g("estimated_race"),
  };
}

// ---------------------------------------------------------------------------
// DB setup
// ---------------------------------------------------------------------------
function initDb() {
  fs.mkdirSync(path.join(ROOT, "data"), { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS voters (
      vuid            TEXT PRIMARY KEY,
      last_name       TEXT NOT NULL,
      first_name      TEXT,
      middle_name     TEXT,
      dob_year        TEXT,
      gender          TEXT,
      address_street  TEXT,
      address_city    TEXT,
      address_zip     TEXT,
      precinct_number TEXT,
      estimated_race  TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_voters_last ON voters(last_name);
    CREATE INDEX IF NOT EXISTS idx_voters_precinct ON voters(precinct_number);

    CREATE TABLE IF NOT EXISTS voter_history (
      vuid          TEXT NOT NULL,
      election_code TEXT NOT NULL,
      method        TEXT,
      PRIMARY KEY (vuid, election_code)
    );
    CREATE INDEX IF NOT EXISTS idx_history_vuid ON voter_history(vuid);
  `);
  return db;
}

// ---------------------------------------------------------------------------
// Main import
// ---------------------------------------------------------------------------
async function importVoters(db, filePath, format) {
  console.log(`\nImporting voter roll: ${filePath}`);
  console.log(`Format detected: ${format.type}${format.sep ? ` (sep=${JSON.stringify(format.sep)})` : ""}`);

  const insert = db.prepare(`
    INSERT OR REPLACE INTO voters
      (vuid, last_name, first_name, middle_name, dob_year, gender,
       address_street, address_city, address_zip, precinct_number, estimated_race)
    VALUES
      (@vuid, @last_name, @first_name, @middle_name, @dob_year, @gender,
       @address_street, @address_city, @address_zip, @precinct_number, @estimated_race)
  `);

  const insertMany = db.transaction((rows) => {
    for (const row of rows) insert.run(row);
  });

  const rl = readline.createInterface({ input: fs.createReadStream(filePath), crlfDelay: Infinity });

  let lineNum = 0;
  let colMap = null;
  let batch = [];
  let total = 0;
  const BATCH_SIZE = 5000;

  for await (const line of rl) {
    lineNum++;
    if (!line.trim()) continue;

    if (format.type === "fixed_width") {
      const rec = parseFWRow(line);
      if (!rec.vuid || !rec.last_name) continue;
      batch.push(rec);
    } else {
      if (lineNum === 1) {
        // Header row
        const cells = parseCSVRow(line, format.sep);
        colMap = buildColumnMap(cells, format.sep);
        const mapped = Object.keys(colMap);
        console.log(`Mapped columns: ${mapped.join(", ")}`);
        if (!colMap.vuid) {
          console.warn("Warning: could not find VUID column — using row number as VUID");
        }
        if (!colMap.last_name) {
          console.error("Error: could not find last_name column in header. Headers found:");
          console.error("  " + cells.map((h, i) => `[${i}]=${h}`).join(", "));
          process.exit(1);
        }
        continue;
      }
      const cells = parseCSVRow(line, format.sep);
      const rec = csvRowToRecord(cells, colMap);
      if (!rec.vuid) rec.vuid = String(lineNum);
      if (!rec.last_name) continue;
      batch.push(rec);
    }

    if (batch.length >= BATCH_SIZE) {
      insertMany(batch);
      total += batch.length;
      batch = [];
      if (total % 50000 === 0) process.stdout.write(`  ${total.toLocaleString()} rows...\r`);
    }
  }

  if (batch.length) {
    insertMany(batch);
    total += batch.length;
  }

  console.log(`\nVoter roll: ${total.toLocaleString()} records imported.`);
  return total;
}

// ---------------------------------------------------------------------------
// History file import
// Texas SOS voter history format:
//   VUID (9) | Election Date (8 MMDDYYYY) | Election Type (2) | Method (1)
// Vendor CSV typically has headers: VUID, ELECTION_DATE, ELECTION_TYPE, VOTE_METHOD
// ---------------------------------------------------------------------------
async function importHistory(db, filePath) {
  console.log(`\nImporting voter history: ${filePath}`);

  const insert = db.prepare(`
    INSERT OR IGNORE INTO voter_history (vuid, election_code, method)
    VALUES (@vuid, @election_code, @method)
  `);
  const insertMany = db.transaction((rows) => {
    for (const row of rows) insert.run(row);
  });

  const rl = readline.createInterface({ input: fs.createReadStream(filePath), crlfDelay: Infinity });

  let lineNum = 0;
  let isCSV = false;
  let vuidIdx = 0, dateIdx = 1, typeIdx = 2, methodIdx = 3;
  let batch = [];
  let total = 0;
  const BATCH_SIZE = 10000;

  for await (const line of rl) {
    lineNum++;
    if (!line.trim()) continue;

    if (lineNum === 1) {
      isCSV = line.includes(",") || line.includes("\t");
      if (isCSV) {
        const sep = line.includes("\t") ? "\t" : ",";
        const headers = line.split(sep).map(h => h.toLowerCase().trim().replace(/['"]/g, ""));
        vuidIdx  = headers.findIndex(h => ["vuid","voter_id","voterid"].includes(h));
        dateIdx  = headers.findIndex(h => h.includes("date"));
        typeIdx  = headers.findIndex(h => h.includes("type") || h.includes("election_cd"));
        methodIdx= headers.findIndex(h => h.includes("method") || h.includes("vote_method"));
        if (vuidIdx === -1) vuidIdx = 0;
        continue;
      }
    }

    let vuid, election_code, method;
    if (isCSV) {
      const sep = line.includes("\t") ? "\t" : ",";
      const cells = line.split(sep).map(c => c.trim().replace(/^"|"$/g, ""));
      vuid          = cells[vuidIdx];
      const edate   = cells[dateIdx] || "";
      const etype   = cells[typeIdx] || "";
      election_code = `${edate}_${etype}`.replace(/\s+/g, "_");
      method        = cells[methodIdx] || null;
    } else {
      // Fixed-width SOS history: VUID(9) + date(8) + type(2) + method(1)
      vuid          = line.substring(0, 9).trim();
      const edate   = line.substring(9, 17).trim();
      const etype   = line.substring(17, 19).trim();
      election_code = `${edate}_${etype}`;
      method        = line.substring(19, 20).trim() || null;
    }

    if (!vuid) continue;
    batch.push({ vuid, election_code, method });

    if (batch.length >= BATCH_SIZE) {
      insertMany(batch);
      total += batch.length;
      batch = [];
      if (total % 100000 === 0) process.stdout.write(`  ${total.toLocaleString()} history rows...\r`);
    }
  }

  if (batch.length) { insertMany(batch); total += batch.length; }
  console.log(`\nVoter history: ${total.toLocaleString()} records imported.`);
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
(async () => {
  const format = detectFormat(voterFilePath);
  const db = initDb();

  await importVoters(db, voterFilePath, format);

  if (historyFilePath) {
    if (!fs.existsSync(historyFilePath)) {
      console.warn(`History file not found: ${historyFilePath} — skipping`);
    } else {
      await importHistory(db, historyFilePath);
    }
  }

  // Summary stats
  const voterCount = db.prepare("SELECT COUNT(*) as n FROM voters").get().n;
  const histCount  = db.prepare("SELECT COUNT(*) as n FROM voter_history").get().n;
  const precincts  = db.prepare("SELECT COUNT(DISTINCT precinct_number) as n FROM voters").get().n;

  console.log(`
Done.
  Voters:    ${voterCount.toLocaleString()}
  History:   ${histCount.toLocaleString()}
  Precincts: ${precincts.toLocaleString()}
  DB path:   ${DB_PATH}
  `);

  db.close();
})().catch(err => {
  console.error(err);
  process.exit(1);
});
