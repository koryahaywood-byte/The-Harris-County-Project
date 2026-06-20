#!/usr/bin/env node
// Snapshot the current lib/campaign-finance-generated.json into
// data/finance-history/{YYYY-MM}.json for historical trend tracking.
//
// Run after each finance pipeline update:
//   npm run update-finance && node scripts/save-finance-history.mjs
//
// Or add to package.json: "finance-day": "npm run update-finance && node scripts/save-finance-history.mjs"
//
// Each period file captures all candidates' financials at that point in time.
// Politician profile pages read from these snapshots to render trend charts.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC  = path.join(ROOT, "lib/campaign-finance-generated.json");
const DIR  = path.join(ROOT, "data/finance-history");

fs.mkdirSync(DIR, { recursive: true });

const generated = JSON.parse(fs.readFileSync(SRC, "utf8"));
const now = new Date();
const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

const snapshot = {
  period,
  capturedAt: now.toISOString(),
  source: "pipeline:merge-finance-data",
  candidates: generated.candidates.map(c => ({
    name:    c.name,
    office:  c.office,
    level:   c.level,
    party:   c.party,
    cash:    c.cash   ?? 0,
    raised:  c.raised ?? 0,
    spent:   c.spent  ?? 0,
    loans:   c.loans  ?? 0,
    asOf:    c.asOf   ?? "unknown",
  })),
};

const dest = path.join(DIR, `${period}.json`);
if (fs.existsSync(dest)) {
  console.log(`⚠  ${period}.json already exists — overwriting with latest data`);
}

fs.writeFileSync(dest, JSON.stringify(snapshot, null, 2), "utf8");
console.log(`✓ Saved ${period}.json (${snapshot.candidates.length} candidates)`);

// Also write an index file listing all available periods
const allPeriods = fs.readdirSync(DIR)
  .filter(f => /^\d{4}-\d{2}\.json$/.test(f))
  .map(f => f.replace(".json", ""))
  .sort()
  .reverse();

fs.writeFileSync(path.join(DIR, "index.json"), JSON.stringify({
  updatedAt: now.toISOString(),
  periods: allPeriods,
}, null, 2), "utf8");
console.log(`✓ Updated history index (${allPeriods.length} periods: ${allPeriods.join(", ")})`);
