// Backfill historical finance snapshots for data/finance-history/
//
// Sources covered:
//   - TEC state candidates: scrapes historical CashOnHand HTML reports (no PDF needed)
//   - FEC federal candidates: FEC API with historical cycle parameter
//   - Harris County + Houston: NOT included (require Claude PDF extraction;
//     run the regular pipeline for those and they'll merge into the snapshot)
//
// Usage:
//   node scripts/backfill-finance-history.mjs
//   node scripts/backfill-finance-history.mjs --periods 2025-01,2025-07,2024-12
//   node scripts/backfill-finance-history.mjs --overwrite   # overwrite existing periods
//   node scripts/backfill-finance-history.mjs --dry-run     # print plan, write nothing

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT     = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HIST_DIR = path.join(ROOT, "data/finance-history");
const FEC_KEY  = process.env.FEC_API_KEY ?? "DEMO_KEY";
const DRY_RUN  = process.argv.includes("--dry-run");
const OVERWRITE = process.argv.includes("--overwrite");

// Periods to backfill when --periods is not specified.
// These match TEC semiannual filing months (January = -01, July = -07)
// and FEC even-year election cycles. Adjust as needed.
const DEFAULT_PERIODS = ["2023-07", "2024-01", "2024-07", "2025-01", "2025-07", "2026-01"];

function parsePeriods() {
  const idx = process.argv.indexOf("--periods");
  if (idx !== -1 && process.argv[idx + 1]) {
    return process.argv[idx + 1].split(",").map(p => p.trim());
  }
  return DEFAULT_PERIODS;
}

// ── TEC candidate roster (mirrors app/api/finance/tec/route.ts) ───────────────
const TEC_CANDIDATES = [
  { tecName: "Friends of Brandon Creighton",   name: "Brandon Creighton",    office: "State Senator SD-4",                           party: "R", incumbent: true  },
  { tecName: "Alvarado, Carol",                name: "Carol Alvarado",       office: "State Senator SD-6",                           party: "D", incumbent: true  },
  { tecName: "Miles, Borris Lee",              name: "Borris Miles",         office: "State Senator SD-13",                          party: "D", incumbent: true  },
  { tecName: "Texans for Joan Huffman",        name: "Joan Huffman",         office: "State Senator SD-17",                          party: "R", incumbent: true  },
  { tecName: "Kolkhorst, Lois W.",             name: "Lois Kolkhorst",       office: "State Senator SD-18",                          party: "R", incumbent: true  },
  { tecName: "Cook, Molly C.",                 name: "Molly Cook",           office: "State Senator SD-15",                          party: "D", incumbent: true  },
  { tecName: "Friends of Paul Bettencourt",    name: "Paul Bettencourt",     office: "State Senator SD-7",                           party: "R", incumbent: true  },
  { tecName: "Thompson, Senfronia",            name: "Senfronia Thompson",   office: "State Rep HD-141",                             party: "D", incumbent: true  },
  { tecName: "Dutton, Harold V.",              name: "Harold Dutton Jr.",    office: "State Rep HD-142",                             party: "D", incumbent: true  },
  { tecName: "Wu, Eugene Y.",                  name: "Gene Wu",              office: "State Rep HD-137",                             party: "D", incumbent: true  },
  { tecName: "Jones, Jolanda",                 name: "Jolanda Jones",        office: "State Rep HD-147",                             party: "D", incumbent: true  },
  { tecName: "Simmons, Lauren Ashley",         name: "Lauren Ashley Simmons",office: "State Rep HD-146",                             party: "D", incumbent: true  },
  { tecName: "Morales, Christina",             name: "Christina Morales",    office: "State Rep HD-145",                             party: "D", incumbent: true  },
  { tecName: "Ward Johnson, Charlene",         name: "Charlene Ward Johnson",office: "State Rep HD-139",                             party: "D", incumbent: true  },
  { tecName: "Rosenthal, Jon E.",              name: "Jon Rosenthal",        office: "State Rep HD-135",                             party: "D", incumbent: true  },
  { tecName: "Hull, Lacey M.",                 name: "Lacey Hull",           office: "State Rep HD-138",                             party: "R", incumbent: true  },
  { tecName: "Friends of Tom Oliverson",       name: "Tom Oliverson",        office: "State Rep HD-130",                             party: "R", incumbent: true  },
  { tecName: "Paul, Dennis R.",                name: "Dennis Paul",          office: "State Rep HD-129",                             party: "R", incumbent: true  },
  { tecName: "Friends of Dr. Greg Bonnen",     name: "Greg Bonnen",          office: "State Rep HD-24",                              party: "R", incumbent: true  },
  { tecName: "Schofield, Michael",             name: "Mike Schofield",       office: "State Rep HD-132",                             party: "R", incumbent: true  },
  { tecName: "Shaw, Penny",                    name: "Penny Morales Shaw",   office: "State Rep HD-148",                             party: "D", incumbent: true  },
  { tecName: "Johnson, Ann",                   name: "Ann Johnson",          office: "State Rep HD-134",                             party: "D", incumbent: true  },
  { tecName: "Hernandez, Ana E.",              name: "Ana Hernandez",        office: "State Rep HD-143",                             party: "D", incumbent: true  },
  { tecName: "Walle, Armando L.",              name: "Armando Walle",        office: "State Rep HD-140",                             party: "D", incumbent: true  },
  { tecName: "Perez, Mary Ann G.",             name: "Mary Ann Perez",       office: "State Rep HD-144",                             party: "D", incumbent: true  },
  { tecName: "Talarico, James",               name: "James Talarico",       office: "U.S. Senate (D nominee)",                      party: "D", incumbent: false },
  { tecName: "Texans for Dan Patrick",         name: "Dan Patrick",          office: "Lt. Governor",                                 party: "R", incumbent: true  },
  { tecName: "Hegar, Glenn A.",               name: "Glenn Hegar",          office: "Comptroller",                                  party: "R", incumbent: true  },
  { tecName: "Cunningham, Charles",           name: "Charles Cunningham",   office: "State Rep HD-127",                             party: "R", incumbent: true  },
  { tecName: "Cain, Briscoe R.",              name: "Briscoe Cain",         office: "State Rep HD-128",                             party: "R", incumbent: true  },
  { tecName: "DeAyala, Emilio F.",            name: "Mano DeAyala",         office: "State Rep HD-133",                             party: "R", incumbent: true  },
  { tecName: "Dorazio, Mark E.",              name: "Mark Dorazio",         office: "State Rep HD-150",                             party: "R", incumbent: true  },
  { tecName: "Kellum, A'Yonna L.",            name: "A'Yonna Kellum",       office: "State Rep HD-150 (D nominee)",                 party: "D", incumbent: false },
  { tecName: "Breaux, Darlene E.",            name: "Darlene Breaux",       office: "State Rep HD-149 (D nominee)",                 party: "D", incumbent: false },
  { tecName: "Dicely, Shannon A.",            name: "Shannon Dicely",       office: "State Senator SD-11 (D nominee)",              party: "D", incumbent: false },
  { tecName: "Bord, Stefanie",               name: "Stefanie Bord",        office: "State Rep HD-126 (D nominee)",                 party: "D", incumbent: false },
  { tecName: "Stanart, Stan",                name: "Stan Stanart",         office: "State Rep HD-126 (R nominee)",                 party: "R", incumbent: false },
  { tecName: "Childs, Staci D.",             name: "Staci Childs",         office: "State Rep HD-131 (D nominee)",                 party: "D", incumbent: false },
  { tecName: "Allen, Alma A.",               name: "Alma Allen",           office: "State Rep HD-131 (not seeking reelection)",     party: "D", incumbent: true  },
  { tecName: "Vo, Hubert",                   name: "Hubert Vo",            office: "State Rep HD-149 (lost D runoff)",              party: "D", incumbent: true  },
  { tecName: "Butler , Alexandria Nicole",   name: "Alexandria Butler",    office: "State Rep HD-146 (R nominee)",                  party: "R", incumbent: false },
  { tecName: "Haynes , William Brent",       name: "Brent Haynes",         office: "182nd District Court (R nominee)",              party: "R", incumbent: false },
  { tecName: "Bennett, David L.",            name: "Dave Bennett",         office: "State Rep HD-149 (R nominee)",                  party: "R", incumbent: false },
  { tecName: "Garcia De Leon, Laura",        name: "Laura Garcia DeLeon",  office: "State Rep HD-140 (R nominee)",                  party: "R", incumbent: false },
  { tecName: "Jones, DaSean A.",             name: "DaSean Jones",         office: "180th District Court (not seeking reelection)", party: "D", incumbent: true  },
];

// ── FEC candidate roster (mirrors app/api/finance/fec/route.ts) ───────────────
const FEDERAL_CANDIDATES = [
  { id: "S6TX00338", name: "Jasmine Crockett",  office: "U.S. Senate (lost D runoff)",      party: "D", incumbent: false },
  { id: "S4TX00462", name: "Ken Paxton",         office: "U.S. Senate (R nominee)",           party: "R", incumbent: false },
  { id: "S6TX00462", name: "James Talarico",     office: "U.S. Senate (D nominee)",           party: "D", incumbent: false },
  { id: "S0TX00999", name: "John Cornyn",        office: "U.S. Senate",                       party: "R", incumbent: true  },
  { id: "H8TX07139", name: "Lizzie Fletcher",    office: "U.S. Rep CD-07",                    party: "D", incumbent: true  },
  { id: "H4TX02177", name: "Shaun Finnie",       office: "U.S. Rep CD-02 (D nominee)",        party: "D", incumbent: false },
  { id: "H4TX18126", name: "Christian Menefee",  office: "U.S. Rep CD-18 (D nominee 2026)",   party: "D", incumbent: false },
  { id: "H8TX29049", name: "Sylvia Garcia",      office: "U.S. Rep CD-29",                    party: "D", incumbent: true  },
];

// ── TEC HTML parsing ──────────────────────────────────────────────────────────
function buildTECUrl(year, period) {
  const yy = String(year).slice(2);
  return `https://ethics.state.tx.us/search/cf/${year}/CashOnHand_${period}SA${yy}.html`;
}

function parseCash(raw) {
  const n = parseFloat(raw.replace(/[$,\s]/g, ""));
  return isNaN(n) ? 0 : n;
}

function formatTECDate(raw) {
  if (!raw) return "Unknown";
  const [m, , y] = raw.split("/");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(m, 10) - 1]} ${y}`;
}

// TEC CashOnHand HTML is a JasperReports XHTML table. Each <tr> contains 5 text
// nodes (after tag-stripping): [filerId, reportNum, filerName, $cash, M/D/YYYY]
async function fetchTEC(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const results = new Map();
  // Extract every <tr>…</tr> block and parse its text cells
  const trRegex = /<tr[\s\S]*?<\/tr>/gi;
  let trMatch;
  while ((trMatch = trRegex.exec(html)) !== null) {
    const row = trMatch[0];
    const cells = row
      .replace(/<[^>]+>/g, "|")
      .replace(/\|+/g, "|")
      .split("|")
      .map(s => s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim())
      .filter(Boolean);
    // Row structure: [filerId, reportNum?, filerName, $cash, date]
    // The cash cell starts with "$"
    const cashIdx = cells.findIndex(c => c.startsWith("$"));
    if (cashIdx >= 2) {
      const name = cells[cashIdx - 1];
      const date = cells[cashIdx + 1] ?? "";
      results.set(name, { cash: parseCash(cells[cashIdx]), date });
    }
  }
  return results;
}

// ── FEC API fetch ─────────────────────────────────────────────────────────────
async function fetchFEC(candidateId, cycle) {
  const url = `https://api.fec.gov/v1/candidates/totals/?candidate_id=${candidateId}&cycle=${cycle}&api_key=${FEC_KEY}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) return null;
  const json = await res.json();
  return json.results?.[0] ?? null;
}

// ── Period → report mapping ───────────────────────────────────────────────────
// Map a YYYY-MM period string to the appropriate TEC Cash on Hand report.
// Period naming follows TEC semiannual FILING months (Jan = -01, Jul = -07).
// Jan report (due Jan 15): cash as of Dec 31 of prior year.
// Jul report (due Jul 15): cash as of Jun 30 of same year.
// For non-standard months, snap to the nearest prior semiannual.
function periodToTEC(period) {
  const [yearStr, monthStr] = period.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  if (month >= 1 && month <= 6)  return { year, tecPeriod: "Jan" };
  if (month >= 7 && month <= 12) return { year, tecPeriod: "Jul" };
  return { year, tecPeriod: "Jan" };
}

// FEC operates on 2-year election cycles ending on even years.
// 2025 or 2026 → cycle 2026; 2023 or 2024 → cycle 2024; 2021/2022 → 2022
function periodToFECCycle(period) {
  const year = parseInt(period.split("-")[0], 10);
  return year % 2 === 0 ? year : year + 1;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const periods = parsePeriods();
  console.log(`\nBackfilling ${periods.length} period(s): ${periods.join(", ")}`);
  if (DRY_RUN) console.log("(dry run — no files will be written)\n");
  if (FEC_KEY === "DEMO_KEY") console.log("⚠  No FEC_API_KEY set — using DEMO_KEY (rate-limited)\n");

  const written = [];

  for (const period of periods) {
    const outPath = path.join(HIST_DIR, `${period}.json`);

    if (!OVERWRITE && fs.existsSync(outPath)) {
      console.log(`  ${period}: already exists — skipping (use --overwrite to replace)`);
      continue;
    }

    console.log(`\n  ── ${period} ──`);
    const candidates = [];

    // ── TEC ──────────────────────────────────────────────────────────────────
    const { year: tecYear, tecPeriod } = periodToTEC(period);
    const tecUrl = buildTECUrl(tecYear, tecPeriod);
    process.stdout.write(`    TEC (${tecPeriod} ${tecYear}): `);
    try {
      const tecData = await fetchTEC(tecUrl);
      console.log(`${tecData.size} entries found`);
      let matched = 0;
      for (const cand of TEC_CANDIDATES) {
        const row = tecData.get(cand.tecName);
        if (row) matched++;
        candidates.push({
          name:      cand.name,
          office:    cand.office,
          level:     "state",
          party:     cand.party,
          cash:      row?.cash ?? 0,
          raised:    0,
          spent:     0,
          loans:     0,
          asOf:      row ? formatTECDate(row.date) : `${tecPeriod} ${tecYear}`,
          incumbent: cand.incumbent,
          dataSource: row ? "live" : "not-found",
        });
      }
      console.log(`    TEC: ${matched}/${TEC_CANDIDATES.length} candidates matched`);
    } catch (err) {
      console.log(`ERROR — ${err.message}`);
      console.log(`    Skipping TEC for this period`);
    }

    // ── FEC ──────────────────────────────────────────────────────────────────
    const cycle = periodToFECCycle(period);
    console.log(`    FEC: cycle ${cycle}`);
    const fecResults = await Promise.all(
      FEDERAL_CANDIDATES.map(async (c) => {
        try {
          const totals = await fetchFEC(c.id, cycle);
          const cash = totals?.cash_on_hand_end_period ?? 0;
          const asOf = totals?.coverage_end_date
            ? new Date(totals.coverage_end_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })
            : `Cycle ${cycle}`;
          if (totals) process.stdout.write(`      ✓ ${c.name} $${cash.toLocaleString()} (${asOf})\n`);
          else        process.stdout.write(`      ✗ ${c.name} — no data for cycle ${cycle}\n`);
          return {
            name:      c.name,
            office:    c.office,
            level:     "federal",
            party:     c.party,
            cash:      cash,
            raised:    totals?.receipts ?? 0,
            spent:     totals?.disbursements ?? 0,
            loans:     0,
            asOf,
            incumbent: c.incumbent,
            dataSource: totals ? "live" : "not-found",
          };
        } catch (err) {
          console.log(`      ✗ ${c.name}: ${err.message}`);
          return {
            name: c.name, office: c.office, level: "federal", party: c.party,
            cash: 0, raised: 0, spent: 0, loans: 0,
            asOf: `Cycle ${cycle}`, incumbent: c.incumbent, dataSource: "error",
          };
        }
      })
    );
    candidates.push(...fecResults);

    // Only keep candidates where we have real data
    const withData = candidates.filter(c => c.dataSource === "live");
    console.log(`    → ${withData.length} candidates with data (${candidates.length - withData.length} not-found skipped)`);

    const snapshot = {
      capturedAt: `${period}-01T00:00:00.000Z`,
      period,
      sources: ["tec", "fec"],
      note: "Backfill snapshot — county and Houston require separate PDF extraction",
      candidates: withData,
    };

    if (!DRY_RUN) {
      fs.mkdirSync(HIST_DIR, { recursive: true });
      fs.writeFileSync(outPath, JSON.stringify(snapshot, null, 2) + "\n");
      console.log(`    ✓ Wrote ${outPath}`);
      written.push(period);
    }
  }

  // Update index.json additively
  if (!DRY_RUN && written.length > 0) {
    const indexPath = path.join(HIST_DIR, "index.json");
    const existing = fs.existsSync(indexPath)
      ? JSON.parse(fs.readFileSync(indexPath, "utf8")).periods ?? []
      : [];
    const allPeriods = [...new Set([...existing, ...written])].sort();
    fs.writeFileSync(indexPath, JSON.stringify({ updatedAt: new Date().toISOString(), periods: allPeriods }, null, 2) + "\n");
    console.log(`\nindex.json updated — all periods: ${allPeriods.join(", ")}`);
  }

  if (DRY_RUN) {
    console.log("\n(dry run complete — rerun without --dry-run to write files)");
  } else if (written.length === 0) {
    console.log("\nNo new periods written.");
  }
  console.log("\nDone.");
}

main().catch(err => { console.error(err); process.exit(1); });
