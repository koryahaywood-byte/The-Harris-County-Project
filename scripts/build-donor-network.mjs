// Money Trail — build the cross-official donor network.
// Pulls itemized Schedule A receipts from the FEC API for every federal
// candidate in the roster (resolving principal committees BY NAME — the
// roster's stored candidate IDs proved stale), aggregates by contributor,
// and links donors who fund 2+ tracked officials.
//
// Coverage note baked into the output: FEDERAL ONLY for now. State (TEC)
// and county filings list itemized donors in Schedule A of the PDFs the
// pipeline already downloads — extraction is the next step and extends this
// same file format.
//
// Run: FEC_API_KEY=... node scripts/build-donor-network.mjs   (DEMO_KEY fallback)

import { writeFileSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const KEY = process.env.FEC_API_KEY || "DEMO_KEY";
const BASE = "https://api.open.fec.gov/v1";

const roster = JSON.parse(readFileSync(join(ROOT, "data/finance-roster.json"), "utf8"));
const fecCandidates = roster.fec.filter(c => !/lost/i.test(c.office));

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fec(path, params) {
  const url = `${BASE}${path}?${new URLSearchParams({ ...params, api_key: KEY })}`;
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (res.status === 429) { console.log(`  429 — backing off ${20 * (attempt + 1)}s`); await sleep(20_000 * (attempt + 1)); continue; }
    if (!res.ok) throw new Error(`${res.status} ${path}`);
    return res.json();
  }
  throw new Error(`429 after retries ${path}`);
}

function normalizeDonor(name) {
  return name?.trim().toUpperCase().replace(/\s+/g, " ").replace(/\.$/, "") ?? "";
}

const officials = [];
const donorMap = new Map(); // norm name -> { name, employer, recipients: Map(official -> amount) }

for (const cand of fecCandidates) {
  await sleep(4000); // stay under DEMO_KEY throttle
  // Resolve principal committee by name (stored IDs are stale)
  let committee = null, resolvedId = null;
  try {
    const search = await fec("/candidates/search/", { q: cand.name.split(" ").pop(), state: "TX" });
    const hit = search.results.find(r =>
      r.name.toUpperCase().includes(cand.name.split(" ").pop().toUpperCase()) &&
      r.name.toUpperCase().includes(cand.name.split(" ")[0].toUpperCase()) &&
      r.principal_committees?.length);
    if (hit) { committee = hit.principal_committees[0].committee_id; resolvedId = hit.candidate_id; }
  } catch (e) { console.error(`search failed for ${cand.name}: ${e.message}`); }
  if (!committee) { console.log(`SKIP ${cand.name} — no principal committee resolved`); continue; }
  console.log(`${cand.name}: ${resolvedId} → ${committee}${resolvedId !== cand.id ? `  (roster had stale ${cand.id})` : ""}`);

  officials.push({ name: cand.name, office: cand.office, party: cand.party, committee });

  // Top itemized receipts, 2 pages × 100 = top 200 by amount
  let lastIndexes = {};
  for (let page = 0; page < 2; page++) {
    let data;
    try {
      data = await fec("/schedules/schedule_a/", {
        committee_id: committee, two_year_transaction_period: "2026",
        sort: "-contribution_receipt_amount", per_page: "100", ...lastIndexes,
      });
    } catch (e) { console.error(`  schedule_a page ${page} failed: ${e.message}`); break; }
    for (const r of data.results) {
      const norm = normalizeDonor(r.contributor_name);
      if (!norm || norm.includes("UNITEMIZED")) continue;
      if (!donorMap.has(norm)) donorMap.set(norm, { name: r.contributor_name.trim(), employer: r.contributor_employer ?? null, recipients: new Map() });
      const d = donorMap.get(norm);
      d.recipients.set(cand.name, (d.recipients.get(cand.name) ?? 0) + (r.contribution_receipt_amount ?? 0));
      if (!d.employer && r.contributor_employer) d.employer = r.contributor_employer;
    }
    const li = data.pagination?.last_indexes;
    if (!li || !data.results.length) break;
    lastIndexes = { last_index: li.last_index, last_contribution_receipt_amount: li.last_contribution_receipt_amount };
  }
  console.log(`  donors so far: ${donorMap.size}`);
}

const donors = [...donorMap.values()]
  .map(d => ({
    name: d.name, employer: d.employer,
    total: Math.round([...d.recipients.values()].reduce((s, v) => s + v, 0)),
    recipients: [...d.recipients.entries()].map(([official, amount]) => ({ official, amount: Math.round(amount) })),
  }))
  .filter(d => d.total >= 1000)
  .sort((a, b) => b.total - a.total);

const shared = donors.filter(d => d.recipients.length >= 2);

const out = {
  builtAt: new Date().toISOString(),
  coverage: "Federal candidates only (FEC itemized Schedule A, 2026 cycle, top ~200 receipts per committee). State and county itemized donors pending Schedule A extraction from TEC/county filings.",
  officials,
  donors: donors.slice(0, 800),
  sharedCount: shared.length,
};

writeFileSync(join(ROOT, "public/data/donor-network.json"), JSON.stringify(out));
console.log(`\n${officials.length} officials, ${donors.length} donors ≥$1k, ${shared.length} fund 2+ officials`);
console.log("wrote public/data/donor-network.json");
