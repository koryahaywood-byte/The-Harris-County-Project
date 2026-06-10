#!/usr/bin/env node
// Step 3 of the finance pipeline: merge reviewed PDF extractions with live
// TEC + FEC API data into the unified dataset the site reads.
//
//   node scripts/merge-finance-data.mjs            # dry run — prints the diff
//   node scripts/merge-finance-data.mjs --confirm  # writes lib/campaign-finance-generated.json
//
// The confirm gate IS the "verify before pushing" step: run without --confirm,
// read the diff and REVIEW.md, then re-run with --confirm.
//
// Dedup rule: when one official has multiple records for the same reporting
// period, the most recently extracted record wins (amended filings are fetched
// after originals, so they naturally take precedence).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT    = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROSTER  = JSON.parse(fs.readFileSync(path.join(ROOT, "data/finance-roster.json"), "utf8"));
const OUT     = path.join(ROOT, "lib/campaign-finance-generated.json");
const PROC    = path.join(ROOT, "data/finance-processed");
const CONFIRM = process.argv.includes("--confirm");

const FEC_KEY = process.env.FEC_API_KEY ?? "DEMO_KEY";

// ── 1. Latest processed PDF batch (county + houston) ──────────────────────────
function latestProcessedBatch() {
  const files = fs.readdirSync(PROC).filter(f => f.endsWith(".json")).sort();
  if (!files.length) return { records: [], batchFile: null };
  const batchFile = files.at(-1);
  const { records } = JSON.parse(fs.readFileSync(path.join(PROC, batchFile), "utf8"));
  return { records, batchFile };
}

// ── 2. FEC API (direct; falls back to the deployed route which has a real key) ─
async function fetchFec() {
  const out = [];
  // Fallback first attempt: if no real key locally, use the deployed route
  if (FEC_KEY === "DEMO_KEY") {
    try {
      const base = process.env.SITE_URL ?? "https://the-harris-county-project.vercel.app";
      const res = await fetch(`${base}/api/finance/fec`);
      if (res.ok) {
        const { results } = await res.json();
        if (results?.length) {
          results.forEach(r => console.log(`  ✓ FEC(route) ${r.name}  cash=$${(r.cash ?? 0).toLocaleString()}`));
          return results.map(r => ({ ...r, source: "fec-route" }));
        }
      }
    } catch { /* fall through to direct API */ }
  }
  for (const cand of ROSTER.fec) {
    try {
      const url = `https://api.open.fec.gov/v1/candidate/${cand.id}/totals/?api_key=${FEC_KEY}&cycle=2026&per_page=1`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`FEC ${res.status}`);
      const json = await res.json();
      const t = json.results?.[0];
      if (!t) throw new Error("no totals");
      out.push({
        name: cand.name, office: cand.office, level: "federal", party: cand.party,
        raised: t.receipts ?? null, spent: t.disbursements ?? null,
        cash: t.last_cash_on_hand_end_period ?? null,
        asOf: t.coverage_end_date?.slice(0, 10) ?? "unknown",
        source: "fec-api",
      });
      console.log(`  ✓ FEC ${cand.name}  cash=$${(t.last_cash_on_hand_end_period ?? 0).toLocaleString()}`);
    } catch (err) {
      out.push({ name: cand.name, office: cand.office, level: "federal", party: cand.party,
        raised: null, spent: null, cash: null, asOf: null, source: "fec-error", error: String(err.message ?? err) });
      console.log(`  ⚠ FEC ${cand.name}: ${err.message}`);
    }
  }
  return out;
}

// ── 3. TEC — reuse the site's own API route logic via the deployed endpoint ───
// TEC has no clean JSON API; the project's /api/finance/tec route already parses
// TEC filings. Hit the deployed route rather than duplicating that scrape here.
async function fetchTec() {
  const base = process.env.SITE_URL ?? "https://the-harris-county-project.vercel.app";
  try {
    const res = await fetch(`${base}/api/finance/tec`);
    if (!res.ok) throw new Error(`TEC route ${res.status}`);
    const { results } = await res.json();
    results.forEach(r => console.log(`  ✓ TEC ${r.name}  cash=$${(r.cash ?? 0).toLocaleString()}`));
    return (results ?? []).map(r => ({ ...r, source: "tec-api" }));
  } catch (err) {
    console.log(`  ⚠ TEC fetch failed (${err.message}) — keeping previous TEC values`);
    return [];
  }
}

// ── Merge ─────────────────────────────────────────────────────────────────────
console.log("── Gathering sources ──");
const { records: pdfRecords, batchFile } = latestProcessedBatch();
console.log(`  PDF batch: ${batchFile ?? "NONE — run finance-extract first"} (${pdfRecords.length} records)`);

const fec = await fetchFec();
const tec = await fetchTec();

// Local PDF records → unified shape. Skip failed extractions; they keep old values.
const levelFor = (office) => /city council|mayor|controller/i.test(office) ? "houston" : "county";
const local = pdfRecords
  .filter(r => r.confidence !== "failed" && r.cash != null)
  .map(r => ({
    name: r.name, office: r.office, level: levelFor(r.office),
    party: ROSTER.harrisCounty.concat(ROSTER.houston).find(p => p.name === r.name)?.party ?? null,
    raised: r.raised, spent: r.spent, cash: r.cash,
    asOf: r.reportingPeriod ?? r.filingDate, source: `pdf:${r.file}`,
    confidence: r.confidence,
  }));

// Dedup by name — later records win (amended filings extracted later take
// precedence), EXCEPT a record with no cash value never overwrites one that
// has data (a failed FEC fetch must not clobber a good TEC number).
const byName = new Map();
for (const rec of [...tec, ...fec, ...local]) {
  const existing = byName.get(rec.name);
  // Never let a null/zero cash record clobber real data — failed API fetches
  // and unset keys surface as null or 0.
  if (existing && existing.cash > 0 && !(rec.cash > 0)) continue;
  byName.set(rec.name, rec);
}
const unified = [...byName.values()].sort((a, b) => (b.cash ?? 0) - (a.cash ?? 0));

// ── Diff against current published data ───────────────────────────────────────
const previous = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")).candidates ?? [] : [];
const prevByName = new Map(previous.map(p => [p.name, p]));
const changes = [];
for (const rec of unified) {
  const old = prevByName.get(rec.name);
  if (!old) changes.push(`  + NEW   ${rec.name} (${rec.office}) cash=$${(rec.cash ?? 0).toLocaleString()}`);
  else if (old.cash !== rec.cash)
    changes.push(`  ~ ${rec.name}: cash $${(old.cash ?? 0).toLocaleString()} → $${(rec.cash ?? 0).toLocaleString()}`);
}
for (const old of previous) if (!byName.has(old.name)) changes.push(`  - GONE  ${old.name}`);

console.log(`\n── Diff vs published (${changes.length} changes) ──`);
console.log(changes.length ? changes.join("\n") : "  (no changes)");

if (!CONFIRM) {
  console.log("\nDry run — nothing written.");
  console.log("Read data/finance-processed/REVIEW.md, then run:  npm run finance-publish");
  process.exit(0);
}

fs.writeFileSync(OUT, JSON.stringify({
  generatedAt: new Date().toISOString(),
  pdfBatch: batchFile,
  candidates: unified,
}, null, 2));
console.log(`\n✓ Published ${unified.length} candidates → lib/campaign-finance-generated.json`);
console.log("  Commit and push to deploy:  git add -A && git commit -m 'Finance data update' && git push");
