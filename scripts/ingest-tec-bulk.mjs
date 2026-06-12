// TEC bulk ingest — the master source for state/county itemized donors.
// The TEC publishes its ENTIRE campaign-finance database nightly as CSV
// (TEC_CF_CSV.zip, ~1GB): every itemized contribution, statewide.
//
// Architecture (v2 — streams everything, never buffers a member):
//   1. Stream filers.csv → resolve tracked officials to exact filerIdents
//      (name-substring matching against the CONTRIBUTOR column would catch
//      every unrelated "Whitmire" donating to ActBlue)
//   2. Stream each contribs_##.csv via `unzip -p` + readline; cheap ident
//      prefilter, full CSV parse only for kept rows
//   3. Aggregate per donor, merge into public/data/donor-network.json
//      alongside the FEC federal network
//
// Run: node scripts/ingest-tec-bulk.mjs [--keep-zip]

import { execSync, spawn } from "child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import readline from "readline";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TMP = join(ROOT, "data/tmp");
const ZIP = join(TMP, "TEC_CF_CSV.zip");
const URL = "https://prd.tecprd.ethicsefile.com/public/cf/public/TEC_CF_CSV.zip";

// Minimal CSV line parser (handles quoted fields with commas + doubled quotes)
function parseCsvLine(line) {
  const out = [];
  let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = false;
      } else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ",") { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

function streamMember(member) {
  const child = spawn("unzip", ["-p", ZIP, member]);
  return { rl: readline.createInterface({ input: child.stdout, crlfDelay: Infinity }), child };
}

// ── 0. Download ──────────────────────────────────────────────────────────
mkdirSync(TMP, { recursive: true });
if (!existsSync(ZIP)) {
  console.log("downloading TEC_CF_CSV.zip (~1GB)…");
  execSync(`curl -sL --retry 3 -o "${ZIP}" "${URL}"`, { stdio: "inherit", timeout: 3_600_000 });
}
console.log("zip:", execSync(`du -h "${ZIP}"`).toString().split("\t")[0].trim());

// ── 1. Resolve tracked officials → filerIdents (stream filers.csv) ───────
const roster = JSON.parse(readFileSync(join(ROOT, "data/finance-roster.json"), "utf8"));
const TRACKED = [
  ...(roster.tec ?? []).map(c => c.name),
  ...(roster.harrisCounty ?? []).map(c => (c.searchName ?? c.name ?? "").split(",").reverse().join(" ").trim()),
].filter(Boolean);

const norm = s => s.toUpperCase().replace(/[^A-Z ]/g, " ").replace(/\s+/g, " ").trim();
const trackedParts = TRACKED.map(n => {
  const parts = norm(n).split(" ");
  return { full: n, first: parts[0], last: parts[parts.length - 1] };
});

const identToOfficial = new Map();
{
  const { rl } = streamMember("filers.csv");
  let header = null, iIdent = -1, iLast = -1, iFirst = -1;
  for await (const line of rl) {
    if (!header) {
      header = parseCsvLine(line);
      iIdent = header.indexOf("filerIdent");
      iLast = header.indexOf("filerNameLast");
      iFirst = header.indexOf("filerNameFirst");
      continue;
    }
    // cheap prefilter: any tracked last name present?
    const upper = line.toUpperCase();
    if (!trackedParts.some(t => upper.includes(t.last))) continue;
    const cells = parseCsvLine(line);
    const last = norm(cells[iLast] ?? ""), first = norm(cells[iFirst] ?? "");
    const hit = trackedParts.find(t => last === t.last && first.startsWith(t.first));
    if (hit) identToOfficial.set(cells[iIdent], hit.full);
  }
}
console.log(`${identToOfficial.size} TEC filer records matched to ${new Set(identToOfficial.values()).size} tracked officials`);
if (!identToOfficial.size) { console.log("nothing to do"); process.exit(0); }

// ── 2. Stream contribution files ─────────────────────────────────────────
const members = execSync(`unzip -Z1 "${ZIP}"`).toString().trim().split("\n")
  .filter(m => /^contribs_\d+\.csv$/i.test(m)).sort();
console.log(`${members.length} contribution files`);

const identTokens = [...identToOfficial.keys()].map(id => `,${id},`);
const donorMap = new Map();
let kept = 0;
let idx = null;

for (const m of members) {
  const { rl } = streamMember(m);
  let isHeader = true;
  for await (const line of rl) {
    if (isHeader) {
      if (!idx) {
        const header = parseCsvLine(line);
        idx = {
          ident: header.indexOf("filerIdent"),
          org: header.indexOf("contributorNameOrganization"),
          last: header.indexOf("contributorNameLast"),
          first: header.indexOf("contributorNameFirst"),
          employer: header.indexOf("contributorEmployer"),
          amount: header.indexOf("contributionAmount"),
        };
      }
      isHeader = false;
      continue;
    }
    if (!identTokens.some(t => line.includes(t))) continue;
    const cells = parseCsvLine(line);
    const official = identToOfficial.get(cells[idx.ident]);
    if (!official) continue;
    const amount = parseFloat(cells[idx.amount]) || 0;
    if (amount < 100) continue;
    const donor = (cells[idx.org] || `${cells[idx.first] ?? ""} ${cells[idx.last] ?? ""}`).trim();
    if (!donor) continue;
    kept++;
    const key = donor.toUpperCase().replace(/\s+/g, " ");
    if (!donorMap.has(key)) donorMap.set(key, { name: donor, employer: cells[idx.employer] || null, recipients: new Map() });
    const d = donorMap.get(key);
    d.recipients.set(official, (d.recipients.get(official) ?? 0) + amount);
    if (!d.employer && cells[idx.employer]) d.employer = cells[idx.employer];
  }
  process.stdout.write(`\r  ${m}  kept ${kept.toLocaleString()} rows, ${donorMap.size.toLocaleString()} donors   `);
}
console.log();

// ── 3. Merge into the donor network ──────────────────────────────────────
const netPath = join(ROOT, "public/data/donor-network.json");
const net = JSON.parse(readFileSync(netPath, "utf8"));
const existing = new Map(net.donors.map(d => [d.name.toUpperCase().replace(/\s+/g, " "), d]));

const officialMeta = new Map([
  ...(roster.tec ?? []).map(c => [c.name, { office: c.office ?? "State official", party: c.party ?? "D" }]),
  ...(roster.harrisCounty ?? []).map(c => [(c.searchName ?? c.name ?? "").split(",").reverse().join(" ").trim(), { office: c.office ?? "County official", party: c.party ?? "D" }]),
]);
for (const name of new Set(identToOfficial.values())) {
  if (!net.officials.some(o => o.name === name)) {
    const meta = officialMeta.get(name) ?? { office: "Official", party: "D" };
    net.officials.push({ name, office: meta.office, party: meta.party, committee: "TEC" });
  }
}

for (const [key, d] of donorMap) {
  const recipients = [...d.recipients.entries()].map(([official, amount]) => ({ official, amount: Math.round(amount) }));
  const total = recipients.reduce((s, r) => s + r.amount, 0);
  if (total < 1000) continue;
  if (existing.has(key)) {
    const f = existing.get(key);
    for (const r of recipients) {
      const prior = f.recipients.find(x => x.official === r.official);
      if (prior) prior.amount += r.amount; else f.recipients.push(r);
    }
    f.total += total;
    if (!f.employer && d.employer) f.employer = d.employer;
  } else {
    const rec = { name: d.name, employer: d.employer, total, recipients };
    net.donors.push(rec);
    existing.set(key, rec);
  }
}

net.donors.sort((a, b) => b.total - a.total);
net.donors = net.donors.slice(0, 2000);
net.sharedCount = net.donors.filter(d => d.recipients.length >= 2).length;
net.coverage = "Federal (FEC itemized Schedule A) + state/county (TEC nightly bulk export, all itemized contributions ≥$100). City of Houston itemized donors pending COH schedule extraction.";
net.builtAt = new Date().toISOString();
writeFileSync(netPath, JSON.stringify(net));
console.log(`merged → ${net.officials.length} officials, ${net.donors.length} donors, ${net.sharedCount} fund 2+ officials`);

if (!process.argv.includes("--keep-zip")) rmSync(ZIP, { force: true });
