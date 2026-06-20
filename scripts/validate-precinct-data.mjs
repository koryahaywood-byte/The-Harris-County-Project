// Validate precinct-history.json data quality.
//
// Checks:
//   1. All expected cycles present
//   2. Precinct counts in expected range
//   3. Vote totals match TED API turnout totals (internal consistency)
//   4. D% plausibility (Harris County general: 50–70% D is expected range)
//   5. Zero-vote precinct count not excessive
//   6. GeoJSON coverage: how many data precincts appear on the map
//   7. Live TED API spot-check: compare 2024G president for 5 random precincts
//
// Run: node scripts/validate-precinct-data.mjs
// Exit 1 on hard failures.

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PASS = "\x1b[32m✓\x1b[0m";
const FAIL = "\x1b[31m✗\x1b[0m";
const WARN = "\x1b[33m⚠\x1b[0m";
const INFO = "\x1b[36mℹ\x1b[0m";

let errors = 0, warnings = 0;
const ok   = msg => console.log(`  ${PASS} ${msg}`);
const fail = msg => { console.log(`  ${FAIL} ${msg}`); errors++; };
const warn = msg => { console.log(`  ${WARN} ${msg}`); warnings++; };
const info = msg => console.log(`  ${INFO} ${msg}`);

// Plausible D% ranges for Harris County general elections (D+R two-party share)
const D_PCT_RANGE = { min: 0.48, max: 0.72, label: "48–72% D (Harris Co. general)" };

// ── Load ──────────────────────────────────────────────────────────────────────
let hist;
try {
  hist = JSON.parse(readFileSync(join(ROOT, "public/data/precinct-history.json"), "utf-8"));
} catch (e) {
  fail(`Cannot load precinct-history.json: ${e.message}`);
  process.exit(1);
}

let geo;
try {
  geo = JSON.parse(readFileSync(join(ROOT, "public/data/harris-precincts.geojson"), "utf-8"));
} catch (e) {
  warn("Cannot load harris-precincts.geojson — skipping map coverage checks");
}
const geoPrecs = geo ? new Set(geo.features.map(f => f.properties.PREC)) : null;

function normId(p) { return p.replace(/^0+/, "") || "0"; }
function inGeo(p) {
  if (!geoPrecs) return true;
  return geoPrecs.has(p) || geoPrecs.has(normId(p)) || geoPrecs.has(normId(p).padStart(4, "0"));
}

console.log("\n═══ precinct-history.json Validation ═══\n");

// ── Check 1: Cycle presence ───────────────────────────────────────────────────
console.log("[ Cycles ]");
const EXPECTED = ["2016G", "2018G", "2020G", "2022G", "2024G", "2026P"];
const cycles = Object.keys(hist.cycles ?? {});
info(`Found: ${cycles.join(", ")}`);
const missing = EXPECTED.filter(c => !cycles.includes(c));
if (missing.length) fail(`Missing cycles: ${missing.join(", ")}`);
else ok(`All ${EXPECTED.length} expected cycles present`);

// ── Check 2–6: Per-cycle ──────────────────────────────────────────────────────
for (const [key, cd] of Object.entries(hist.cycles)) {
  console.log(`\n[ ${key} ]`);

  if (cd.primary) {
    const precs = Object.keys(cd.primary);
    info(`${precs.length} precincts (primary turnout)`);
    if (precs.length < 900) warn(`${precs.length} precincts — expected 900+`);
    else ok(`${precs.length} precincts`);

    const totalD = Object.values(cd.primary).reduce((s, v) => s + (v.dem ?? 0), 0);
    const totalR = Object.values(cd.primary).reduce((s, v) => s + (v.rep ?? 0), 0);
    info(`D ballots: ${totalD.toLocaleString()}, R ballots: ${totalR.toLocaleString()}`);
    if (totalD < 10_000 || totalR < 10_000) warn("Suspiciously low primary ballot counts");
    else ok("Primary ballot totals look reasonable");

    if (geoPrecs) {
      const matched = precs.filter(p => inGeo(p)).length;
      const pct = Math.round(matched / precs.length * 100);
      if (pct < 80) warn(`Only ${pct}% of precincts appear in GeoJSON`);
      else ok(`GeoJSON coverage: ${matched}/${precs.length} (${pct}%)`);
    }
    continue;
  }

  const races = cd.races ?? {};
  const voter = cd.voter ?? {};

  for (const [rk, race] of Object.entries(races)) {
    const precs = Object.keys(race.votes ?? {});
    info(`${race.label}: ${precs.length} precincts`);
    if (precs.length < 900) warn(`Only ${precs.length} precincts — expected 900+`);
    else ok(`${precs.length} precincts`);

    const cands = race.candidates ?? [];
    const dIdx = cands.findIndex(c => c.party === "D");
    const rIdx = cands.findIndex(c => c.party === "R");
    if (dIdx === -1 || rIdx === -1) { warn("Missing D or R candidate"); continue; }

    let totalD = 0, totalR = 0, allVotes = 0, zeroPrecs = 0;
    for (const votes of Object.values(race.votes)) {
      const d = votes[dIdx] ?? 0, r = votes[rIdx] ?? 0;
      totalD += d; totalR += r;
      allVotes += votes.reduce((s, v) => s + v, 0);
      if (d + r === 0) zeroPrecs++;
    }

    const dPct = totalD / (totalD + totalR);
    info(`${rk}: D=${totalD.toLocaleString()}, R=${totalR.toLocaleString()}, all=${allVotes.toLocaleString()}, D%=${(dPct*100).toFixed(1)}%`);

    // D% plausibility (skip primary-style races)
    if (dPct < D_PCT_RANGE.min || dPct > D_PCT_RANGE.max) {
      fail(`${rk} D% (${(dPct*100).toFixed(1)}%) outside expected range ${D_PCT_RANGE.label}`);
    } else {
      ok(`D% ${(dPct*100).toFixed(1)}% in expected range`);
    }

    // Internal consistency: total votes ≈ voter turnout
    if (Object.keys(voter).length > 0) {
      const tedTurnout = Object.values(voter).reduce((s, v) => s + (v.turnout ?? 0), 0);
      const diff = Math.abs(allVotes - tedTurnout) / tedTurnout;
      if (diff > 0.03) {
        fail(`${rk} total votes (${allVotes.toLocaleString()}) deviates ${(diff*100).toFixed(1)}% from TED turnout (${tedTurnout.toLocaleString()})`);
      } else {
        ok(`Votes vs TED turnout within ${(diff*100).toFixed(2)}% — data consistent`);
      }
    }

    if (zeroPrecs > 100) warn(`${zeroPrecs} precincts with zero D+R votes (>100 is suspicious)`);
    else info(`${zeroPrecs} zero-vote precincts (expected for split/inactive precincts)`);

    // GeoJSON coverage
    if (geoPrecs) {
      const matched = precs.filter(p => inGeo(p)).length;
      const pct = Math.round(matched / precs.length * 100);
      if (pct < 80) warn(`Only ${pct}% of precincts appear in GeoJSON`);
      else ok(`GeoJSON coverage: ${matched}/${precs.length} (${pct}%)`);
    }
  }
}

// ── Check 7: Live TED API spot-check ─────────────────────────────────────────
console.log("\n[ Live TED API spot-check — 2024G President ]");
info("Fetching 2024G President from ted.capitol.texas.gov…");

async function parseTedCsv(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  const lines = text.trim().split("\n");
  const header = lines[0].split(",").map(h => h.trim());
  return lines.slice(1).map(l => {
    const cells = l.split(",").map(c => c.replace(/^"|"$/g, "").trim());
    return Object.fromEntries(header.map((h, i) => [h, cells[i]]));
  });
}

try {
  const tedRows = (await parseTedCsv("https://ted.capitol.texas.gov/api/Offices/510/1/vtd"))
    .filter(r => r.CNTYVTD?.startsWith("201"));

  const header = Object.keys(tedRows[0] ?? {});
  const dCols = header.filter(h => /_24G_/.test(h) && h.match(/D_24G_/));
  const rCols = header.filter(h => /_24G_/.test(h) && h.match(/R_24G_/));

  // Build TED lookup
  const tedMap = {};
  for (const row of tedRows) {
    const prec = row.CNTYVTD.slice(3);
    tedMap[prec] = {
      d: dCols.reduce((s, c) => s + (parseInt(row[c]) || 0), 0),
      r: rCols.reduce((s, c) => s + (parseInt(row[c]) || 0), 0),
    };
  }

  info(`TED returned ${tedRows.length} Harris County precincts`);

  // Compare 5 sample precincts
  const localPres = hist.cycles["2024G"]?.races?.["president"];
  if (localPres) {
    const dIdx = localPres.candidates.findIndex(c => c.party === "D");
    const rIdx = localPres.candidates.findIndex(c => c.party === "R");
    const sample = Object.keys(localPres.votes).sort(() => Math.random() - 0.5).slice(0, 5);
    let mismatches = 0;
    for (const prec of sample) {
      const local = { d: localPres.votes[prec][dIdx], r: localPres.votes[prec][rIdx] };
      const ted   = tedMap[prec];
      if (!ted) { info(`  ${prec}: not in TED response`); continue; }
      const dOk = Math.abs(local.d - ted.d) <= 2;
      const rOk = Math.abs(local.r - ted.r) <= 2;
      if (!dOk || !rOk) {
        fail(`Prec ${prec}: local D=${local.d},R=${local.r} vs TED D=${ted.d},R=${ted.r}`);
        mismatches++;
      } else {
        ok(`Prec ${prec}: D=${local.d}, R=${local.r} matches TED`);
      }
    }
    if (mismatches === 0) ok("All sampled precincts match live TED data");
  }
} catch (e) {
  warn(`TED API unreachable (${e.message}) — skipping live spot-check`);
}

// ── Houston precincts coverage ────────────────────────────────────────────────
console.log("\n[ City of Houston filter coverage ]");
try {
  const houPrecs = JSON.parse(readFileSync(join(ROOT, "public/data/houston-precincts.json"), "utf-8"));
  info(`Houston precinct list: ${houPrecs.length} precincts`);
  if (houPrecs.length < 600 || houPrecs.length > 900) warn("Houston precinct count looks off (expected 600–900)");
  else ok(`${houPrecs.length} Houston precincts (${Math.round(houPrecs.length/1172*100)}% of county)`);
  if (geoPrecs) {
    const inMap = houPrecs.filter(p => inGeo(p)).length;
    if (inMap < houPrecs.length * 0.9) warn(`Only ${inMap}/${houPrecs.length} Houston precincts in GeoJSON`);
    else ok(`${inMap}/${houPrecs.length} Houston precincts found in GeoJSON`);
  }
} catch (e) {
  warn(`Cannot load houston-precincts.json: ${e.message}`);
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log("\n═══ Summary ═══\n");
if (errors === 0 && warnings === 0) {
  console.log(`  ${PASS} All checks passed — data looks clean.\n`);
} else {
  if (errors > 0)   console.log(`  ${FAIL} ${errors} error(s)`);
  if (warnings > 0) console.log(`  ${WARN} ${warnings} warning(s)`);
  console.log();
}

process.exit(errors > 0 ? 1 : 0);
