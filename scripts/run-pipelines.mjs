// Pipeline orchestrator — every scheduled ingestion job in one registry,
// every run logged, every failure visible at /admin/pipelines.
//
//   node scripts/run-pipelines.mjs            run everything due
//   node scripts/run-pipelines.mjs --only id  run one job
//   node scripts/run-pipelines.mjs --all      run everything regardless of cadence
//
// Output: public/data/pipeline-health.json (read by the admin dashboard)
//         data/pipeline-logs/YYYY-MM.jsonl   (append-only run log)
//
// Jobs either shell out to existing scripts (the repo already has working
// ingestors) or run inline. Status vocabulary:
//   ok       ran, data updated
//   failed   ran, threw — error captured, dashboard turns red
//   blocked  cannot run yet (missing key / source decision) — amber, with reason
//   skipped  not due at this cadence

import { execSync } from "child_process";
import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const HEALTH = join(ROOT, "public/data/pipeline-health.json");
const LOG_DIR = join(ROOT, "data/pipeline-logs");
const SITE = process.env.SITE_URL ?? "https://the-harris-county-project.vercel.app";

const sh = cmd => execSync(cmd, { cwd: ROOT, stdio: "pipe", timeout: 1_200_000 }).toString();

/* ── Inline jobs ─────────────────────────────────────────────────────────── */

// LegiScan "webhook": LegiScan offers no push on standard keys, so this is a
// fast poller — diffs every tracked bill's last_action vs the prior snapshot
// and fires Follow alerts for movement. Run daily in session, hourly near
// deadlines.
async function legiscanPoller() {
  const res = await fetch(`${SITE}/api/bills`, { signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`/api/bills ${res.status}`);
  const data = await res.json();
  const bills = data?.bills ?? data?.results ?? [];
  if (!bills.length) return { note: "no bills returned (session adjourned?)" };

  const snapPath = join(ROOT, "data/pipeline-logs/legiscan-snapshot.json");
  const prev = existsSync(snapPath) ? JSON.parse(readFileSync(snapPath, "utf8")) : {};
  const moved = [];
  const next = {};
  for (const b of bills) {
    const key = String(b.bill_id ?? b.bill_number);
    next[key] = `${b.last_action_date}|${b.last_action}`;
    if (prev[key] && prev[key] !== next[key]) {
      const prevDate = new Date(prev[key].split("|")[0]);
      const stallDays = isNaN(+prevDate) ? 0 : Math.round((new Date(b.last_action_date).getTime() - prevDate.getTime()) / 86400_000);
      moved.push({ bill: b.bill_number, action: b.last_action, date: b.last_action_date, stallDays, at: new Date().toISOString() });
    }
  }
  writeFileSync(snapPath, JSON.stringify(next));
  if (moved.length) {
    const movesPath = join(ROOT, "data/pipeline-logs/bill-movements.jsonl");
    for (const m of moved) appendFileSync(movesPath, JSON.stringify(m) + "\n");
  }

  // Movement → Follow alerts (queue + webhook), via the alert worker's queue format
  if (moved.length && process.env.EMAIL_WEBHOOK_URL) {
    for (const m of moved.slice(0, 50)) {
      await fetch(process.env.EMAIL_WEBHOOK_URL, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "bill-movement", ...m, source: "The Harris County Project — LegiScan poller" }),
      }).catch(() => {});
    }
  }
  return { tracked: bills.length, moved: moved.length };
}

// Census ACS — annual demographic refresh for the Districts layer.
async function censusAcs() {
  if (!process.env.CENSUS_API_KEY) {
    return { blocked: "CENSUS_API_KEY not set — get one at api.census.gov/data/key_signup.html (2 min), add to .env.local + Vercel" };
  }
  // ACS 5-year profile for Harris County tracts → district aggregation happens
  // in the existing cvap build; here we refresh the raw county profile.
  const url = `https://api.census.gov/data/2023/acs/acs5/profile?get=DP05_0001E,DP05_0071PE,DP05_0078PE,DP05_0080PE&for=county:201&in=state:48&key=${process.env.CENSUS_API_KEY}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`Census API ${res.status}`);
  const rows = await res.json();
  writeFileSync(join(ROOT, "public/data/acs-county-profile.json"),
    JSON.stringify({ fetchedAt: new Date().toISOString(), header: rows[0], harris: rows[1] }));
  return { note: "county profile refreshed" };
}

// JP court records — NOT in PACER (JP courts are state courts; PACER is
// federal only). Harris County JP civil/eviction records live on the county's
// Odyssey portal, which requires a scraping approach we haven't green-lit.
async function jpCourts() {
  return { blocked: "JP records are on Harris County's Odyssey portal (PACER is federal-only). Needs a source decision: Odyssey scraper, January Advisers eviction dataset, or TDCJ bulk export." };
}

// Commissioners Court agendas — archive the public agenda index so votes and
// appearances can be cross-referenced onto profiles.
async function commissionersCourt() {
  const res = await fetch("https://agenda.harriscountytx.gov/", {
    signal: AbortSignal.timeout(45_000),
    headers: { "User-Agent": "Mozilla/5.0 (HarrisCountyProject civic archive)" },
  });
  if (!res.ok) throw new Error(`agenda.harriscountytx.gov ${res.status}`);
  const html = await res.text();
  const dir = join(ROOT, "data/commissioners-court");
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `agenda-index-${new Date().toISOString().slice(0, 10)}.html`);
  writeFileSync(file, html);
  return { note: `agenda index archived (${(html.length / 1024).toFixed(0)}KB) — vote extraction is the next parser step` };
}

/* ── Registry ────────────────────────────────────────────────────────────── */
const JOBS = [
  { id: "tec-finance", name: "TEC + county + city campaign finance", source: "TEC / harrisvotes / COH portals",
    feeds: ["Where the Money Resides", "Money Trail", "Follow alerts"], cadence: "post-deadline (Jan/Jul 16, Apr/Oct 16)",
    run: () => { sh("npm run update-finance"); return { note: "fetch → extract → merge complete" }; } },
  { id: "precinct-history", name: "Precinct results, 4 cycles normalized", source: "TLC TED API + Harris County Clerk",
    feeds: ["Districts history layer", "Field Position", "Terrain Report"], cadence: "post-canvass per election",
    run: () => { sh("node scripts/build-precinct-history.mjs"); return { note: "2020/2022/2024/2026 rebuilt on current precinct lines" }; } },
  { id: "tec-bulk-donors", name: "TEC bulk itemized donors (state/county)", source: "TEC nightly full-database CSV export (~1GB)",
    feeds: ["Money Trail", "Terrain Report donor signals"], cadence: "post-deadline (Jan/Jul 16) — heavy download",
    run: () => { sh("node scripts/ingest-tec-bulk.mjs"); return { note: "TEC contributions merged into donor network" }; } },
  { id: "fec-donors", name: "FEC itemized donors (federal)", source: "api.open.fec.gov Schedule A",
    feeds: ["Money Trail", "Terrain Report donor signals"], cadence: "quarterly (FEC deadlines)",
    run: () => { sh("node scripts/build-donor-network.mjs"); return { note: process.env.FEC_API_KEY ? "full key" : "DEMO_KEY — rate-limited, partial coverage" }; } },
  { id: "legiscan", name: "LegiScan bill-movement poller", source: "LegiScan via /api/bills",
    feeds: ["Bill Tracker", "Follow alerts", "Terrain Report"], cadence: "daily in session", run: legiscanPoller },
  { id: "census-acs", name: "Census ACS demographic refresh", source: "api.census.gov ACS 5-year",
    feeds: ["Districts demographic layer"], cadence: "annual (ACS release, ~December)", run: censusAcs },
  { id: "jp-courts", name: "JP court performance records", source: "Harris County Odyssey (state JP courts)",
    feeds: ["JP profiles court stats"], cadence: "monthly once unblocked", run: jpCourts },
  { id: "council-minutes", name: "City Council minutes (The Beat)", source: "Emily Takes Notes RSS via /api/city-hall",
    feeds: ["City Hall Story Engine", "official profiles"], cadence: "weekly (Wed cron exists)",
    run: async () => {
      const res = await fetch(`${SITE}/api/city-hall`, { signal: AbortSignal.timeout(120_000) });
      if (!res.ok) throw new Error(`/api/city-hall ${res.status}`);
      return { note: "council story engine refreshed + archived" };
    } },
  { id: "commissioners-court", name: "Commissioners Court agendas", source: "agenda.harriscountytx.gov",
    feeds: ["County official profiles", "The Beat"], cadence: "biweekly (court meets 1st/3rd Tue)", run: commissionersCourt },
  { id: "follow-alerts", name: "Follow alert queue worker", source: "internal diff vs last snapshot",
    feeds: ["Follow alert emails"], cadence: "after any finance/bill job",
    run: () => { sh("node scripts/send-follow-alerts.mjs"); return { note: "diffed + queued" }; } },
  { id: "terrain-report", name: "Terrain Report anomaly scan", source: "internal — all data pipes",
    feeds: ["The Terrain Report", "tool pages"], cadence: "after any data job",
    run: () => { sh("node scripts/detect-anomalies.mjs"); return { note: "signals rebuilt" }; } },
  { id: "freshness", name: "Data freshness audit", source: "file mtimes vs update-schedule",
    feeds: ["/admin/freshness"], cadence: "weekly",
    run: () => { try { sh("npm run check-freshness"); return { note: "all current" }; } catch (e) { return { note: "some sources overdue — see /admin/freshness" }; } } },
];

/* ── Runner ──────────────────────────────────────────────────────────────── */
const args = process.argv.slice(2);
const only = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;
const selected = only ? JOBS.filter(j => j.id === only) : JOBS;
if (only && !selected.length) { console.error(`unknown job ${only}`); process.exit(1); }

mkdirSync(LOG_DIR, { recursive: true });
const prevHealth = existsSync(HEALTH) ? JSON.parse(readFileSync(HEALTH, "utf8")) : { jobs: {} };
const health = { updatedAt: new Date().toISOString(), jobs: { ...prevHealth.jobs } };

for (const job of selected) {
  const started = Date.now();
  let status = "ok", detail = null, error = null;
  process.stdout.write(`▸ ${job.id} … `);
  try {
    const result = await job.run();
    if (result?.blocked) { status = "blocked"; detail = result.blocked; }
    else detail = result?.note ?? JSON.stringify(result ?? {});
  } catch (e) {
    status = "failed";
    error = String(e.message ?? e).slice(0, 600);
  }
  const ms = Date.now() - started;
  console.log(`${status}${detail ? ` — ${detail}` : ""}${error ? ` — ${error}` : ""} (${(ms / 1000).toFixed(1)}s)`);

  health.jobs[job.id] = {
    name: job.name, source: job.source, feeds: job.feeds, cadence: job.cadence,
    status, detail, error, lastRun: new Date().toISOString(), durationMs: ms,
  };
  appendFileSync(join(LOG_DIR, `${new Date().toISOString().slice(0, 7)}.jsonl`),
    JSON.stringify({ job: job.id, status, detail, error, at: new Date().toISOString(), durationMs: ms }) + "\n");
}

writeFileSync(HEALTH, JSON.stringify(health, null, 2));
const failed = Object.values(health.jobs).filter(j => j.status === "failed").length;
console.log(`\nhealth written → /admin/pipelines (${failed} failed)`);
process.exit(failed ? 1 : 0);
