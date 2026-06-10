#!/usr/bin/env node
// Step 1 of the finance pipeline: download the most recent filing PDF for every
// official in data/finance-roster.json from the Harris County and City of Houston
// campaign finance portals.
//
//   node scripts/fetch-finance-pdfs.mjs              # fetch all
//   node scripts/fetch-finance-pdfs.mjs --county     # Harris County portal only
//   node scripts/fetch-finance-pdfs.mjs --houston    # Houston portal only
//   node scripts/fetch-finance-pdfs.mjs --discover   # search county portal by office
//                                                    # keywords to find judge filers
//
// PDFs land in data/finance-pdfs/ as LASTNAME-FIRSTNAME-OFFICE-DATE.pdf.
// Manual fallback is first-class: drop PDFs into that folder by hand with the
// same naming convention and Steps 2-3 work identically.
//
// TEC and FEC are NOT fetched here — they're structured APIs consumed directly
// by merge-finance-data.mjs.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  HC_SEARCH, COH_SEARCH,
  getFormTokens, hcSearch, cohSearch, cohDownloadPdf, downloadPdf, fileSlug, sleep,
} from "./finance-portals.mjs";

const ROOT    = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROSTER  = JSON.parse(fs.readFileSync(path.join(ROOT, "data/finance-roster.json"), "utf8"));
const OUT_DIR = path.join(ROOT, "data/finance-pdfs");
fs.mkdirSync(OUT_DIR, { recursive: true });

const args = process.argv.slice(2);
const only = args.includes("--county") ? "county" : args.includes("--houston") ? "houston" : "all";
const discover = args.includes("--discover");

const log = { found: [], notFound: [], multiple: [], errors: [], skipped: [] };

async function fetchHarrisCounty() {
  console.log(`\n── Harris County portal (${ROSTER.harrisCounty.length} officials) ──`);
  for (const person of ROSTER.harrisCounty) {
    try {
      // Fresh tokens per search — the portal invalidates ViewState after postbacks
      const tokens = await getFormTokens(HC_SEARCH);
      const { rows } = await hcSearch(person.searchName, tokens);

      if (!rows.length) {
        log.notFound.push({ ...person, portal: "harris-county" });
        console.log(`  ✗ NOT FOUND  ${person.name} (searched "${person.searchName}")`);
        continue;
      }
      if (rows.length > 1) {
        log.multiple.push({ ...person, portal: "harris-county", count: rows.length,
          filings: rows.slice(0, 5).map(r => `${r.date} ${r.category}`) });
      }

      // Most recent filing is first (portal sorts date desc). Amended reports for
      // the same period also sort first, which is what we want.
      const latest = rows[0];
      const fname  = fileSlug(person.name, person.office, latest.date);
      const dest   = path.join(OUT_DIR, fname);

      if (fs.existsSync(dest)) {
        log.skipped.push({ name: person.name, file: fname });
        console.log(`  ↺ EXISTS     ${fname}`);
        continue;
      }

      const pdf = await downloadPdf(latest.url, tokens.cookies);
      fs.writeFileSync(dest, pdf);
      log.found.push({ name: person.name, office: person.office, date: latest.date,
        file: fname, sourceUrl: latest.url, portal: "harris-county" });
      console.log(`  ✓ ${fname} (${(pdf.length / 1024).toFixed(0)} KB)`);
      await sleep(1500); // be polite to the county server
    } catch (err) {
      log.errors.push({ name: person.name, portal: "harris-county", error: String(err.message ?? err) });
      console.log(`  ⚠ ERROR      ${person.name}: ${err.message}`);
    }
  }
}

async function fetchHouston() {
  console.log(`\n── City of Houston portal (${ROSTER.houston.length} officials) ──`);
  for (const person of ROSTER.houston) {
    try {
      const tokens = await getFormTokens(COH_SEARCH);
      const { rows, tokens: resultTokens } = await cohSearch(person.last, person.first, tokens);

      if (!rows.length) {
        log.notFound.push({ ...person, portal: "houston" });
        console.log(`  ✗ NOT FOUND  ${person.name} (searched "${person.last}, ${person.first}")`);
        continue;
      }
      if (rows.length > 1) {
        log.multiple.push({ ...person, portal: "houston", count: rows.length,
          filings: rows.slice(0, 5).map(r => `${r.date}`) });
      }

      const latest = rows[0];
      const fname  = fileSlug(person.name, person.office, latest.date);
      const dest   = path.join(OUT_DIR, fname);

      if (fs.existsSync(dest)) {
        log.skipped.push({ name: person.name, file: fname });
        console.log(`  ↺ EXISTS     ${fname}`);
        continue;
      }

      const pdf = await cohDownloadPdf(latest.rowIndex, resultTokens);
      fs.writeFileSync(dest, pdf);
      log.found.push({ name: person.name, office: person.office, date: latest.date,
        file: fname, reportId: latest.reportId, portal: "houston" });
      console.log(`  ✓ ${fname} (${(pdf.length / 1024).toFixed(0)} KB)`);
      await sleep(1500);
    } catch (err) {
      log.errors.push({ name: person.name, portal: "houston", error: String(err.message ?? err) });
      console.log(`  ⚠ ERROR      ${person.name}: ${err.message}`);
    }
  }
}

// Discovery mode: search the county portal with office-title keywords to surface
// judge filers (County Criminal/Civil Courts at Law, Probate). Results are written
// to data/finance-roster-discovered.json for HUMAN REVIEW — never auto-merged.
async function discoverJudges() {
  const terms = ROSTER._harrisCountyDiscovery?.searchTerms ?? [];
  console.log(`\n── Discovery mode: ${terms.length} office-keyword searches ──`);
  const discovered = [];
  for (const term of terms) {
    try {
      const tokens = await getFormTokens(HC_SEARCH);
      const { rows, filerNames } = await hcSearch(term, tokens);
      console.log(`  "${term}" → ${filerNames.length} filer names, ${rows.length} filings`);
      discovered.push({ searchTerm: term, filerNames, filingCount: rows.length });
      await sleep(2000);
    } catch (err) {
      console.log(`  ⚠ "${term}": ${err.message}`);
      discovered.push({ searchTerm: term, error: String(err.message ?? err) });
    }
  }
  const out = path.join(ROOT, "data/finance-roster-discovered.json");
  fs.writeFileSync(out, JSON.stringify({ discoveredAt: new Date().toISOString(), results: discovered }, null, 2));
  console.log(`\nDiscovered filers written to ${path.relative(ROOT, out)}`);
  console.log("Review the names, verify offices at jp.hctx.net / justex.net, then add entries to harrisCounty in data/finance-roster.json.");
}

// ── Run ───────────────────────────────────────────────────────────────────────
if (discover) {
  await discoverJudges();
} else {
  if (only !== "houston") await fetchHarrisCounty();
  if (only !== "county")  await fetchHouston();

  const logFile = path.join(ROOT, "data/finance-pdfs/_fetch-log.json");
  fs.writeFileSync(logFile, JSON.stringify({ fetchedAt: new Date().toISOString(), ...log }, null, 2));

  console.log("\n══ Fetch summary ══");
  console.log(`  Downloaded: ${log.found.length}   Already had: ${log.skipped.length}`);
  console.log(`  Not found:  ${log.notFound.length}   Multiple filings: ${log.multiple.length}   Errors: ${log.errors.length}`);
  if (log.notFound.length) {
    console.log("\n  Officials with no portal results (download manually if they should have filings):");
    log.notFound.forEach(p => console.log(`    - ${p.name} (${p.office}) [${p.portal}]`));
  }
  if (log.errors.length) {
    console.log("\n  Errors (CAPTCHA/login wall would show here as non-PDF response):");
    log.errors.forEach(e => console.log(`    - ${e.name}: ${e.error}`));
  }
  console.log(`\n  Full log: data/finance-pdfs/_fetch-log.json`);
  console.log(`  Manual fallback: drop PDFs into data/finance-pdfs/ named LASTNAME-FIRSTNAME-OFFICE-YYYY-MM-DD.pdf`);
}
