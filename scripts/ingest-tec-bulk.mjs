// TEC bulk ingest — the master move for state/county itemized donors.
// The Texas Ethics Commission publishes its ENTIRE campaign-finance database
// nightly as CSV (TEC_CF_CSV.zip, ~1GB): every itemized contribution,
// statewide, machine-readable. No scraping, no OCR, no per-filer requests.
//
// This job: download → stream the contribs_##.csv members → keep rows whose
// filer matches our tracked roster → aggregate per donor → merge into
// public/data/donor-network.json alongside the FEC federal donors.
//
// Heavy (1GB download): run post-deadline (Jan/Jul 16) on a machine with
// disk, not in CI. Requires `unzip` on PATH (macOS/Linux default).
//
// Run: node scripts/ingest-tec-bulk.mjs [--keep-zip]

import { execSync, spawnSync } from "child_process";
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { Readable } from "stream";
import { pipeline } from "stream/promises";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TMP = join(ROOT, "data/tmp");
const ZIP = join(TMP, "TEC_CF_CSV.zip");
const URL = "https://prd.tecprd.ethicsefile.com/public/cf/public/TEC_CF_CSV.zip";

// Tracked state/county filers (TEC filer name as it appears in filings).
const roster = JSON.parse(readFileSync(join(ROOT, "data/finance-roster.json"), "utf8"));
const TRACKED = [
  ...(roster.tec ?? []).map(c => c.name),
  ...(roster.harrisCounty ?? []).map(c => c.name?.split(",").reverse().join(" ").trim() ?? ""),
].filter(Boolean);
console.log(`${TRACKED.length} tracked state/county filers`);

mkdirSync(TMP, { recursive: true });

// 1. Download (resumable would be nicer; curl keeps it simple + fast)
if (!existsSync(ZIP)) {
  console.log("downloading TEC_CF_CSV.zip (~1GB)…");
  execSync(`curl -sL --retry 3 -o "${ZIP}" "${URL}"`, { stdio: "inherit", timeout: 3_600_000 });
}
console.log("zip ready:", (execSync(`du -h "${ZIP}"`).toString().split("\t")[0]).trim());

// 2. List contribution CSV members
const members = execSync(`unzip -Z1 "${ZIP}"`).toString().trim().split("\n")
  .filter(m => /^contribs_\d+\.csv$/i.test(m));
console.log(`${members.length} contribution CSV members`);

// 3. Stream each member, keep tracked-filer rows
//    CSV layout (CampaignFinanceCSVFileFormat.pdf): filerName is column
//    "filerName", contributor name/employer/amount/date in fixed columns.
const lastName = n => n.trim().toUpperCase().split(/\s+/).pop();
const TRACKED_LAST = new Map(TRACKED.map(n => [lastName(n), n]));
const donorMap = new Map();
let kept = 0, scanned = 0, header = null, idx = {};

for (const m of members) {
  const proc = spawnSync("unzip", ["-p", ZIP, m], { maxBuffer: 1024 * 1024 * 1024, encoding: "utf8" });
  const lines = proc.stdout.split("\n");
  if (!header) {
    header = lines[0].split(",").map(h => h.replace(/"/g, "").trim());
    const col = name => header.findIndex(h => h.toLowerCase() === name.toLowerCase());
    idx = {
      filer: col("filerName"), cName: col("contributorNameOrganization"),
      cLast: col("contributorNameLast"), cFirst: col("contributorNameFirst"),
      employer: col("contributorEmployer"), amount: col("contributionAmount"),
      date: col("contributionDt"),
    };
  }
  for (let i = 1; i < lines.length; i++) {
    scanned++;
    const line = lines[i];
    if (!line) continue;
    // cheap prefilter before CSV parse
    let hit = null;
    for (const [last, full] of TRACKED_LAST) {
      if (line.toUpperCase().includes(last)) { hit = full; break; }
    }
    if (!hit) continue;
    const cells = line.match(/("([^"]|"")*"|[^,]*)(,|$)/g)?.map(c => c.replace(/,$/, "").replace(/^"|"$/g, "").replace(/""/g, '"')) ?? [];
    const filer = cells[idx.filer] ?? "";
    const full = TRACKED.find(n => filer.toUpperCase().includes(lastName(n)) && filer.toUpperCase().includes(n.trim().toUpperCase().split(/\s+/)[0]));
    if (!full) continue;
    const donor = cells[idx.cName] || `${cells[idx.cFirst] ?? ""} ${cells[idx.cLast] ?? ""}`.trim();
    const amount = parseFloat(cells[idx.amount]) || 0;
    if (!donor || amount < 100) continue;
    kept++;
    const key = donor.toUpperCase().replace(/\s+/g, " ");
    if (!donorMap.has(key)) donorMap.set(key, { name: donor, employer: cells[idx.employer] || null, recipients: new Map() });
    const d = donorMap.get(key);
    d.recipients.set(full, (d.recipients.get(full) ?? 0) + amount);
  }
  console.log(`  ${m}: scanned ${scanned.toLocaleString()} rows, kept ${kept}`);
}

// 4. Merge with the existing (FEC) network
const netPath = join(ROOT, "public/data/donor-network.json");
const net = JSON.parse(readFileSync(netPath, "utf8"));
const fedDonors = new Map(net.donors.map(d => [d.name.toUpperCase().replace(/\s+/g, " "), d]));
for (const [key, d] of donorMap) {
  const recipients = [...d.recipients.entries()].map(([official, amount]) => ({ official, amount: Math.round(amount) }));
  if (fedDonors.has(key)) {
    const f = fedDonors.get(key);
    f.recipients.push(...recipients);
    f.total += recipients.reduce((s, r) => s + r.amount, 0);
    if (!f.employer && d.employer) f.employer = d.employer;
  } else {
    net.donors.push({ name: d.name, employer: d.employer, total: recipients.reduce((s, r) => s + r.amount, 0), recipients });
  }
}
net.donors.sort((a, b) => b.total - a.total);
net.donors = net.donors.slice(0, 1500);
net.sharedCount = net.donors.filter(d => d.recipients.length >= 2).length;
net.coverage = "Federal (FEC Schedule A) + state/county (TEC nightly bulk export). City of Houston itemized donors pending COH Schedule extraction.";
net.builtAt = new Date().toISOString();
writeFileSync(netPath, JSON.stringify(net));
console.log(`merged: ${net.donors.length} donors, ${net.sharedCount} fund 2+ officials → donor-network.json`);

if (!process.argv.includes("--keep-zip")) rmSync(ZIP, { force: true });
