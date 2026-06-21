// Comprehensive election data sync for Harris County.
// Phase 1 — DISCOVER: probe TED API for every Harris County office ID
// Phase 2 — FETCH:    download precinct-level results for all cycles
// Phase 3 — WRITE:    merge into public/data/district-races.json
//                     and public/data/office-map.json (audit trail)
//
// Idempotent — safe to re-run. Adds new data, never deletes existing.
//
// Run: node scripts/sync-all-elections.mjs
// Options:
//   --discover-only   Only run discovery, don't fetch
//   --fetch-only      Skip discovery, use saved office-map.json
//   --cycle 2024G     Only fetch one cycle (for quick updates)
//   --county-only     Only fetch county-wide offices (fast, ~30 races)

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT   = join(dirname(fileURLToPath(import.meta.url)), "..");
const HARRIS = "201"; // Harris County FIPS prefix in CNTYVTD

const ARGS = process.argv.slice(2);
const DISCOVER_ONLY = ARGS.includes("--discover-only");
const FETCH_ONLY    = ARGS.includes("--fetch-only");
const COUNTY_ONLY   = ARGS.includes("--county-only");
const CYCLE_ARG     = ARGS.find(a => a.startsWith("--cycle"))?.split("=")[1]
                   ?? (ARGS.indexOf("--cycle") >= 0 ? ARGS[ARGS.indexOf("--cycle") + 1] : null);

// ── Election cycles ───────────────────────────────────────────────────────────
const ALL_ELECTIONS = [
  { key: "2024G", id: 510 },
  { key: "2022G", id: 497 },
  { key: "2020G", id: 377 },
  { key: "2018G", id: 456 },
  { key: "2016G", id: 444 },
  { key: "2014G", id: 414 },
  { key: "2012G", id: 395 },
];
const ELECTIONS = CYCLE_ARG
  ? ALL_ELECTIONS.filter(e => e.key === CYCLE_ARG)
  : ALL_ELECTIONS;

// Discovery uses the most recent general — office IDs are consistent across cycles
const DISCOVERY_ELECTION = 510; // 2024G

// ── ID ranges to probe (informed by prior work) ───────────────────────────────
// We probe these ranges for the discovery election to find all Harris offices.
const PROBE_RANGES = [
  [1,   50],   // statewide/federal (president, senate, governor, AG, etc.)
  [80,  115],  // state senate (88-99 known, buffer both sides)
  [230, 275],  // state house (240-264 known)
  [440, 540],  // district judges (451+ known)
  [700, 810],  // county-wide offices (729 DA, 777 tax, 789 sheriff known)
  [860, 900],  // commissioners (874-877 known)
  [960, 970],  // county clerk / district clerk area
  [1040, 1230], // JP + constable (1050-1202 range from prior guesses)
  [1600, 1850], // newer courts + recent offices
];

// IDs confirmed from prior work — skip probing, use directly
const KNOWN_OFFICES = {
  1:   { label: "President",            districtType: "county" },
  2:   { label: "U.S. Senate",          districtType: "county" },
  6:   { label: "U.S. Rep. CD-2",       districtType: "cd", districtValue: "2"  },
  11:  { label: "U.S. Rep. CD-7",       districtType: "cd", districtValue: "7"  },
  12:  { label: "U.S. Rep. CD-8",       districtType: "cd", districtValue: "8"  },
  13:  { label: "U.S. Rep. CD-9",       districtType: "cd", districtValue: "9"  },
  22:  { label: "U.S. Rep. CD-18",      districtType: "cd", districtValue: "18" },
  26:  { label: "U.S. Rep. CD-22",      districtType: "cd", districtValue: "22" },
  33:  { label: "U.S. Rep. CD-29",      districtType: "cd", districtValue: "29" },
  37:  { label: "Governor",             districtType: "county" },
  88:  { label: "State Sen. SD-6",      districtType: "sd", districtValue: "6"  },
  89:  { label: "State Sen. SD-7",      districtType: "sd", districtValue: "7"  },
  92:  { label: "State Sen. SD-11",     districtType: "sd", districtValue: "11" },
  94:  { label: "State Sen. SD-13",     districtType: "sd", districtValue: "13" },
  97:  { label: "State Sen. SD-15",     districtType: "sd", districtValue: "15" },
  99:  { label: "State Sen. SD-17",     districtType: "sd", districtValue: "17" },
  240: { label: "State Rep. HD-126",    districtType: "hd", districtValue: "126" },
  241: { label: "State Rep. HD-127",    districtType: "hd", districtValue: "127" },
  242: { label: "State Rep. HD-128",    districtType: "hd", districtValue: "128" },
  243: { label: "State Rep. HD-129",    districtType: "hd", districtValue: "129" },
  244: { label: "State Rep. HD-130",    districtType: "hd", districtValue: "130" },
  245: { label: "State Rep. HD-131",    districtType: "hd", districtValue: "131" },
  246: { label: "State Rep. HD-132",    districtType: "hd", districtValue: "132" },
  247: { label: "State Rep. HD-133",    districtType: "hd", districtValue: "133" },
  248: { label: "State Rep. HD-134",    districtType: "hd", districtValue: "134" },
  249: { label: "State Rep. HD-135",    districtType: "hd", districtValue: "135" },
  251: { label: "State Rep. HD-137",    districtType: "hd", districtValue: "137" },
  252: { label: "State Rep. HD-138",    districtType: "hd", districtValue: "138" },
  253: { label: "State Rep. HD-139",    districtType: "hd", districtValue: "139" },
  254: { label: "State Rep. HD-140",    districtType: "hd", districtValue: "140" },
  255: { label: "State Rep. HD-141",    districtType: "hd", districtValue: "141" },
  256: { label: "State Rep. HD-142",    districtType: "hd", districtValue: "142" },
  257: { label: "State Rep. HD-143",    districtType: "hd", districtValue: "143" },
  258: { label: "State Rep. HD-144",    districtType: "hd", districtValue: "144" },
  259: { label: "State Rep. HD-145",    districtType: "hd", districtValue: "145" },
  260: { label: "State Rep. HD-146",    districtType: "hd", districtValue: "146" },
  261: { label: "State Rep. HD-147",    districtType: "hd", districtValue: "147" },
  262: { label: "State Rep. HD-148",    districtType: "hd", districtValue: "148" },
  263: { label: "State Rep. HD-149",    districtType: "hd", districtValue: "149" },
  264: { label: "State Rep. HD-150",    districtType: "hd", districtValue: "150" },
  729: { label: "Harris DA",            districtType: "county" },
  737: { label: "Harris Co. Attorney",  districtType: "county" },
  777: { label: "Harris Tax A-C",       districtType: "county" },
  789: { label: "Harris Sheriff",       districtType: "county" },
  874: { label: "Commissioner PCT-1",   districtType: "pct", districtValue: "1" },
  875: { label: "Commissioner PCT-2",   districtType: "pct", districtValue: "2" },
  876: { label: "Commissioner PCT-3",   districtType: "pct", districtValue: "3" },
  877: { label: "Commissioner PCT-4",   districtType: "pct", districtValue: "4" },
  1642: { label: "U.S. Rep. CD-36",    districtType: "cd", districtValue: "36" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
async function tryFetch(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    return res.text();
  } catch { return null; }
}

function parseCsv(text) {
  const lines = text.trim().split("\n");
  const header = lines[0].split(",").map(h => h.replace(/^"|"$/g, "").trim());
  return {
    header,
    rows: lines.slice(1).map(l => {
      const cells = l.split(",").map(c => c.replace(/^"|"$/g, "").trim());
      return Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ""]));
    }),
  };
}

function parseCol(col) {
  const m = col.match(/^(.+?)([DRLWG])_\d\d[GPRA]_(.+)$/);
  if (!m) return null;
  return { name: m[1], party: m[2], race: m[3] };
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

// Infer district type + value from column race label
function inferDistrict(raceLabel) {
  let m;
  if ((m = raceLabel.match(/State\s+Rep\.?\s+(?:Dist\.?\s+)?(\d+)/i)))
    return { districtType: "hd", districtValue: m[1] };
  if ((m = raceLabel.match(/State\s+Sen(?:ator|ate)?\.?\s+(?:Dist\.?\s+)?(\d+)/i)))
    return { districtType: "sd", districtValue: m[1] };
  if ((m = raceLabel.match(/U\.?S\.?\s+Rep(?:resentative)?\.?\s+(?:Dist\.?\s+)?(\d+)/i)))
    return { districtType: "cd", districtValue: m[1] };
  if ((m = raceLabel.match(/(?:Justice|JP)\s+(?:of\s+the\s+Peace\s+)?Pct\.?\s*(\d+)/i)))
    return { districtType: "jp", districtValue: m[1] };
  if ((m = raceLabel.match(/Constable\s+Pct\.?\s*(\d+)/i)))
    return { districtType: "jp", districtValue: m[1] };
  if ((m = raceLabel.match(/Commissioner\s+Pct\.?\s*(\d+)/i)))
    return { districtType: "pct", districtValue: m[1] };
  return { districtType: "county", districtValue: null };
}

// ── Phase 1: Discover ─────────────────────────────────────────────────────────
async function discoverOffices() {
  const officeMapPath = join(ROOT, "public/data/office-map.json");
  const existing = existsSync(officeMapPath)
    ? JSON.parse(readFileSync(officeMapPath, "utf-8"))
    : {};

  // Merge known offices in
  for (const [id, info] of Object.entries(KNOWN_OFFICES)) {
    existing[id] = { ...existing[id], ...info, confirmed: true };
  }

  // Build probe list from ranges, skipping already confirmed
  const toProbe = [];
  for (const [lo, hi] of PROBE_RANGES) {
    for (let id = lo; id <= hi; id++) {
      if (!existing[id]?.confirmed) toProbe.push(id);
    }
  }

  console.log(`\n[Phase 1] Probing ${toProbe.length} office IDs in election ${DISCOVERY_ELECTION}…`);

  let found = 0, probed = 0;
  const BATCH = 30;

  for (let i = 0; i < toProbe.length; i += BATCH) {
    const batch = toProbe.slice(i, i + BATCH);
    await Promise.all(batch.map(async id => {
      const url = `https://ted.capitol.texas.gov/api/Offices/${DISCOVERY_ELECTION}/${id}/vtd`;
      const text = await tryFetch(url);
      probed++;
      if (!text) return;

      let parsed;
      try { parsed = parseCsv(text); } catch { return; }

      const harrisRows = parsed.rows.filter(r => r.CNTYVTD?.startsWith(HARRIS));
      if (harrisRows.length < 3) return; // skip if barely any Harris precincts

      // Derive office info from candidate columns
      const candCols = parsed.header.map(h => ({ col: h, parsed: parseCol(h) })).filter(x => x.parsed);
      if (candCols.length === 0) return;

      const raceLabel = candCols[0].parsed.race;
      const { districtType, districtValue } = inferDistrict(raceLabel);

      // Check if any candidates exist
      const hasD = candCols.some(c => c.parsed.party === "D");
      const hasR = candCols.some(c => c.parsed.party === "R");

      existing[id] = {
        label:         raceLabel,
        slug:          slugify(raceLabel),
        districtType,
        districtValue,
        hasD, hasR,
        harrisPrecincts: harrisRows.length,
        candidates2024G: candCols.map(c => `${c.parsed.name}(${c.parsed.party})`),
        confirmed:     true,
      };
      found++;
    }));
    process.stdout.write(`\r  Probed ${probed}/${toProbe.length}, found ${found} Harris offices`);
  }
  console.log("\n");

  writeFileSync(officeMapPath, JSON.stringify(existing, null, 2));
  console.log(`Saved office map: ${Object.keys(existing).length} total offices → public/data/office-map.json`);

  return existing;
}

// ── Phase 2: Fetch ────────────────────────────────────────────────────────────
async function fetchAllRaces(officeMap) {
  // Load existing district-races.json
  const destPath = join(ROOT, "public/data/district-races.json");
  const output = existsSync(destPath)
    ? JSON.parse(readFileSync(destPath, "utf-8"))
    : { hd: {}, sd: {}, cd: {}, jp: {}, pct: {}, county: {} };

  // Ensure all district types exist
  for (const t of ["hd", "sd", "cd", "jp", "pct", "county"]) {
    output[t] ??= {};
  }

  // Build task list from office map
  const offices = Object.entries(officeMap)
    .filter(([, info]) => info.confirmed && info.hasD && info.hasR)
    .filter(([, info]) => !COUNTY_ONLY || info.districtType === "county");

  const tasks = [];
  for (const [idStr, info] of offices) {
    for (const elec of ELECTIONS) {
      tasks.push({ id: parseInt(idStr), info, elec });
    }
  }

  console.log(`\n[Phase 2] Fetching ${tasks.length} office×election combinations…`);

  let fetched = 0, skipped = 0, errs = 0;
  const BATCH = 20;

  for (let i = 0; i < tasks.length; i += BATCH) {
    const batch = tasks.slice(i, i + BATCH);

    await Promise.all(batch.map(async ({ id, info, elec }) => {
      const url = `https://ted.capitol.texas.gov/api/Offices/${elec.id}/${id}/vtd`;
      const text = await tryFetch(url);
      if (!text) { errs++; return; }

      let parsed;
      try { parsed = parseCsv(text); } catch { errs++; return; }

      const harrisRows = parsed.rows.filter(r => r.CNTYVTD?.startsWith(HARRIS));
      if (harrisRows.length === 0) { skipped++; return; }

      const candCols = parsed.header
        .map(h => ({ col: h, p: parseCol(h) }))
        .filter(x => x.p !== null);

      const hasD = candCols.some(c => c.p.party === "D");
      const hasR = candCols.some(c => c.p.party === "R");
      if (!hasD || !hasR) { skipped++; return; }

      const raceEntry = {
        label:      info.label || candCols[0].p.race,
        candidates: candCols.map(c => ({ name: c.p.name, party: c.p.party })),
        votes:      Object.fromEntries(harrisRows.map(row => {
          const prec = row.CNTYVTD.slice(3);
          return [prec, candCols.map(c => parseInt(row[c.col], 10) || 0)];
        })),
      };

      const slug = info.slug || slugify(info.label || candCols[0].p.race);
      const { districtType, districtValue } = info;

      if (districtType === "county") {
        output.county[slug] ??= {};
        output.county[slug][elec.key] = raceEntry;
      } else if (districtType && districtValue) {
        output[districtType]     ??= {};
        output[districtType][districtValue] ??= {};
        output[districtType][districtValue][elec.key] ??= {};
        output[districtType][districtValue][elec.key][slug] = raceEntry;
      }
      fetched++;
    }));

    process.stdout.write(`\r  ${i + batch.length}/${tasks.length} — ${fetched} stored, ${skipped} skipped, ${errs} errors`);
  }
  console.log("\n");

  writeFileSync(destPath, JSON.stringify(output));
  const kb = Math.round(JSON.stringify(output).length / 1024);

  console.log("Summary:");
  for (const [dtype, content] of Object.entries(output)) {
    if (Object.keys(content).length === 0) continue;
    const races = dtype === "county"
      ? Object.values(content).reduce((s, c) => s + Object.keys(c).length, 0)
      : Object.values(content).reduce((s, d) =>
          s + Object.values(d).reduce((ss, cy) => ss + Object.keys(cy).length, 0), 0);
    console.log(`  ${dtype}: ${Object.keys(content).length} districts, ${races} race×cycle entries`);
  }
  console.log(`\nWrote ${destPath} (${kb} KB)`);
  console.log(`Fetched: ${fetched}  Skipped: ${skipped}  Errors: ${errs}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
console.log("Harris County Election Data Sync");
console.log("=================================");
if (CYCLE_ARG)     console.log(`  Cycle filter: ${CYCLE_ARG}`);
if (COUNTY_ONLY)   console.log(`  County-only mode`);

let officeMap;

if (FETCH_ONLY) {
  const p = join(ROOT, "public/data/office-map.json");
  if (!existsSync(p)) {
    console.error("office-map.json not found. Run without --fetch-only first.");
    process.exit(1);
  }
  officeMap = JSON.parse(readFileSync(p, "utf-8"));
  console.log(`\nLoaded office map: ${Object.keys(officeMap).length} offices`);
} else {
  officeMap = await discoverOffices();
}

if (!DISCOVER_ONLY) {
  await fetchAllRaces(officeMap);
}

console.log("\nDone.");
