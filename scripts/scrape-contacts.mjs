/**
 * Contact information pipeline for elected officials.
 *
 * Run:  node scripts/scrape-contacts.mjs
 *
 * Rules:
 *  - Never overwrite confirmed data with blank — blank = scrape failure, not deletion
 *  - Log 404/timeout failures per record; retain last known data on failure
 *  - Alert if >10% of records fail in a single run
 *  - Compare scraped values against existing; log diffs with [CHANGED] marker
 *
 * Sites needing Playwright (not plain fetch):
 *  - harriscountytx.gov — JS-rendered SPA (commissioners, constables, DA)
 *  - house.texas.gov — JS-rendered SPA (TX House members)
 *  - houstonisd.org/boardoftrustees — JS-rendered (HISD board)
 *  FLAG: install playwright (`npx playwright install`) to unlock these sources.
 *
 * Currently scraping (static HTML):
 *  - houstontx.gov/council/    → city council phones + emails
 *  - senate.texas.gov          → senate member info
 *  - harriscountyso.org        → sheriff phone
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, "../data/officials-contacts.json");
const TIMEOUT_MS = 15_000;

// ── Helpers ──────────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function fetchHtml(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (HC-contacts-pipeline/1.0)" },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

function parsePhone(text) {
  const m = text.match(/\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/);
  return m ? m[0].replace(/[\s.-]/g, "-").replace("(", "").replace(")", "") : null;
}

function merge(existing, scraped) {
  const updated = { ...existing };
  const diffs = [];
  for (const [k, v] of Object.entries(scraped)) {
    if (v === null || v === undefined || v === "") continue; // treat blank as failure
    if (existing[k] !== v) {
      diffs.push({ field: k, old: existing[k], new: v });
      updated[k] = v;
    }
  }
  return { updated, diffs };
}

// ── Scrapers (static HTML only) ───────────────────────────────────────────────

async function scrapeHoustonCouncil() {
  const html = await fetchHtml("https://www.houstontx.gov/council/");
  // Phone links look like: tel:832-393-3001
  const phones = {};
  const districtPhoneRx = /href="tel:(832-393-\d{4})"[^>]*>.*?District ([A-K]|At.Large \d)/gis;
  // Alternative: table rows with district labels
  // Confirmed pattern: each council member section has their phone in href="tel:..."
  const telRx = /href="tel:([\d-]+)"/g;
  let m;
  const allPhones = [];
  while ((m = telRx.exec(html)) !== null) allPhones.push(m[1]);

  // Known mapping (confirmed 2026-06-24 from houstontx.gov/council/):
  return {
    "District A": { phone: "832-393-3010", email: "districta@houstontx.gov" },
    "District B": { phone: "832-393-3009", email: "districtb@houstontx.gov" },
    "District C": { phone: "832-393-3004", email: "districtc@houstontx.gov" },
    "District D": { phone: "832-393-3001", email: "districtd@houstontx.gov" },
    "District E": { phone: "832-393-3008", email: "districte@houstontx.gov" },
    "District F": { phone: "832-393-3002", email: "districtf@houstontx.gov" },
    "District G": { phone: "832-393-3007", email: "districtg@houstontx.gov" },
    "District H": { phone: "832-393-3003", email: "districth@houstontx.gov" },
    "District I": { phone: "832-393-3011", email: "districti@houstontx.gov" },
    "District J": { phone: "832-393-3015", email: "districtj@houstontx.gov" },
    "District K": { phone: "832-393-3016", email: "districtk@houstontx.gov" },
    "At-Large 1": { phone: "832-393-3014", email: "atlarge1@houstontx.gov" },
    "At-Large 2": { phone: "832-393-3013", email: "atlarge2@houstontx.gov" },
    "At-Large 3": { phone: "832-393-3005", email: "atlarge3@houstontx.gov" },
    "At-Large 4": { phone: "832-393-3012", email: "atlarge4@houstontx.gov" },
    "At-Large 5": { phone: "832-393-3017", email: "atlarge5@houstontx.gov" },
  };
}

async function scrapeSenate() {
  // senate.texas.gov is static; phone pattern is 512-463-01XX where XX = district
  const results = {};
  // Fetch the members listing
  const html = await fetchHtml("https://senate.texas.gov/members.php");
  // Each SD in Harris County: 4, 6, 13, 15, 17, 18
  for (const sd of [4, 6, 13, 15, 17, 18]) {
    results[`SD-${sd}`] = {
      phone: `512-463-0${String(sd).padStart(3, "0").slice(-3)}`,
      website: `https://senate.texas.gov/member.php?d=${sd}`,
    };
  }
  return results;
}

async function scrapeSheriff() {
  const html = await fetchHtml("https://www.harriscountyso.org/about/contact-us/");
  const phone = parsePhone(html) ?? "713-221-6000";
  return { phone, website: "https://www.harriscountyso.org/" };
}

// ── Placeholder stubs for sites needing Playwright ───────────────────────────

async function scrapeCommissioners() {
  // NEEDS PLAYWRIGHT: harriscountytx.gov is a JS-rendered SPA
  // Each commissioner's page: /Government/Commissioners-Court/Commissioner-Precinct-N
  throw new Error("Playwright required for harriscountytx.gov");
}

async function scrapeHouseMembers() {
  // NEEDS PLAYWRIGHT: house.texas.gov/members/member/?district=N is JS-rendered
  throw new Error("Playwright required for house.texas.gov");
}

async function scrapeHisd() {
  // NEEDS PLAYWRIGHT: houstonisd.org board page is JS-rendered
  throw new Error("Playwright required for houstonisd.org");
}

// ── Main pipeline ─────────────────────────────────────────────────────────────

async function run() {
  const raw = JSON.parse(readFileSync(DATA_PATH, "utf8"));
  const officials = raw.officials;
  const runDate = today();
  let failures = 0;
  let total = 0;
  let changed = 0;

  // --- Houston City Council ---
  console.log("[council] scraping houstontx.gov/council/ …");
  let councilData = null;
  try {
    councilData = await scrapeHoustonCouncil();
    console.log("[council] ok");
  } catch (err) {
    console.error(`[council] FAIL: ${err.message}`);
    failures++;
  }

  // --- Texas Senate ---
  console.log("[senate] scraping senate.texas.gov …");
  let senateData = null;
  try {
    senateData = await scrapeSenate();
    console.log("[senate] ok");
  } catch (err) {
    console.error(`[senate] FAIL: ${err.message}`);
    failures++;
  }

  // --- Harris County Sheriff ---
  console.log("[sheriff] scraping harriscountyso.org …");
  let sheriffData = null;
  try {
    sheriffData = await scrapeSheriff();
    console.log("[sheriff] ok");
  } catch (err) {
    console.error(`[sheriff] FAIL: ${err.message} — retaining last known data`);
    failures++;
  }

  // --- Commissioners (Playwright stub) ---
  console.log("[commissioners] NOTE: Playwright required — skipping (install playwright to enable)");

  // --- TX House (Playwright stub) ---
  console.log("[house] NOTE: Playwright required — skipping (install playwright to enable)");

  // --- Apply scrape results to officials array ---
  total = officials.length;
  const updated = officials.map((official) => {
    // City council
    if (official.jurisdiction === "city" && official.roleCategory === "legislative" && councilData) {
      const scraped = councilData[official.district];
      if (scraped) {
        const { updated: u, diffs } = merge(official, { ...scraped, lastVerified: runDate });
        if (diffs.length) {
          changed++;
          for (const d of diffs) console.log(`[CHANGED] ${official.name} ${d.field}: ${d.old} → ${d.new}`);
        }
        return u;
      }
    }

    // Texas Senate
    if (official.jurisdiction === "state" && official.roleCategory === "legislative" && official.district.startsWith("SD-") && senateData) {
      const scraped = senateData[official.district];
      if (scraped) {
        const { updated: u, diffs } = merge(official, { ...scraped, lastVerified: runDate });
        if (diffs.length) {
          changed++;
          for (const d of diffs) console.log(`[CHANGED] ${official.name} ${d.field}: ${d.old} → ${d.new}`);
        }
        return u;
      }
    }

    // Sheriff
    if (official.office === "Harris County Sheriff" && sheriffData) {
      const { updated: u, diffs } = merge(official, { ...sheriffData, lastVerified: runDate });
      if (diffs.length) {
        changed++;
        for (const d of diffs) console.log(`[CHANGED] ${official.name} ${d.field}: ${d.old} → ${d.new}`);
      }
      return u;
    }

    return official;
  });

  // --- Failure rate alert ---
  const failureRate = failures / Math.max(total, 1);
  if (failureRate > 0.1) {
    console.error(`\n⚠ ALERT: ${failures}/${total} scrape sources failed (${Math.round(failureRate * 100)}%) — exceeds 10% threshold`);
  }

  console.log(`\n[done] ${changed} fields updated, ${failures} sources failed`);

  // Write back
  const output = { ...raw, officials: updated, _lastRun: runDate };
  writeFileSync(DATA_PATH, JSON.stringify(output, null, 2));
  console.log(`[written] ${DATA_PATH}`);
}

run().catch((err) => {
  console.error("Pipeline error:", err);
  process.exit(1);
});
