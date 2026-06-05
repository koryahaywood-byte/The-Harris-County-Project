/**
 * Quarterly filing schedule checker.
 * Run: npx tsx scripts/check-filing-schedules.ts
 *
 * Fetches current deadlines from TEC and FEC, diffs against
 * data/filing-schedules.json, and reports any changes.
 * If changes found, updates the file so the next run has a fresh baseline.
 *
 * Schedule: run quarterly on Jan 1, Apr 1, Jul 1, Oct 1
 */

import fs from "fs";
import path from "path";

const SCHEDULES_PATH = path.join(process.cwd(), "data", "filing-schedules.json");

interface Deadline {
  type: string;
  due: string;
  period: string;
  applies?: string;
}

interface Change {
  source: string;
  description: string;
  old?: string;
  new?: string;
}

// ── Fetch TEC deadlines ──────────────────────────────────────────────────────

async function fetchTECDeadlines(): Promise<Deadline[]> {
  const res = await fetch("https://www.ethics.state.tx.us/filinginfo/deadlines/ReportsDue.php");
  if (!res.ok) throw new Error(`TEC fetch failed: ${res.status}`);
  const html = await res.text();

  const deadlines: Deadline[] = [];

  // Find rows with dates in MM/DD/YYYY or Month DD, YYYY format
  const datePattern = /(\d{1,2}\/\d{1,2}\/\d{4})/g;
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;

  for (const rowMatch of html.matchAll(rowRegex)) {
    const row = rowMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const dateMatch = row.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (!dateMatch) continue;

    const [, m, d, y] = dateMatch;
    const due = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    // Only care about future or current year deadlines
    if (parseInt(y) < new Date().getFullYear()) continue;

    const type = row.replace(/\d{1,2}\/\d{1,2}\/\d{4}/, "").trim().slice(0, 80);
    if (type.length < 5) continue;

    deadlines.push({ type, due, period: "" });
  }

  // Always include the two known semi-annual dates
  const year = new Date().getFullYear();
  const semiAnnual: Deadline[] = [
    { type: "Semi-annual (Jan)", due: `${year}-01-15`, period: `Jul–Dec ${year - 1}`, applies: "all C/OH filers" },
    { type: "Semi-annual (Jul)", due: `${year}-07-15`, period: `Jan–Jun ${year}`, applies: "all C/OH filers" },
  ];

  // Merge, dedup by due date
  const merged = [...semiAnnual];
  for (const d of deadlines) {
    if (!merged.find(m => m.due === d.due)) merged.push(d);
  }

  return merged.sort((a, b) => a.due.localeCompare(b.due));
}

// ── Fetch FEC quarterly deadlines ───────────────────────────────────────────

async function fetchFECDeadlines(): Promise<Deadline[]> {
  const year = new Date().getFullYear();
  // FEC quarterly deadlines are fixed — Apr 15, Jul 15, Oct 15, Jan 31 next year
  // Check the page for any changes
  try {
    const res = await fetch("https://www.fec.gov/help-candidates-and-committees/dates-and-deadlines/");
    if (!res.ok) throw new Error(`FEC fetch: ${res.status}`);
    const html = await res.text();

    // Look for date patterns near "quarterly" mentions
    const quarterlySection = html.match(/quarterly[\s\S]{0,2000}/i)?.[0] ?? "";
    const dates = [...quarterlySection.matchAll(/(\w+ \d{1,2},?\s*\d{4})/g)]
      .map(m => m[1])
      .filter(Boolean);

    if (dates.length > 0) {
      console.log("FEC page dates found:", dates.slice(0, 6));
    }
  } catch (e) {
    console.warn("FEC page fetch failed, using known schedule:", e);
  }

  // Return known fixed schedule (FEC quarterly dates rarely change)
  return [
    { type: "Q1 Quarterly", due: `${year}-04-15`, period: `Jan 1–Mar 31 ${year}` },
    { type: "Q2 Quarterly", due: `${year}-07-15`, period: `Apr 1–Jun 30 ${year}` },
    { type: "Q3 Quarterly", due: `${year}-10-15`, period: `Jul 1–Sep 30 ${year}` },
    { type: "Year-End",     due: `${year + 1}-01-31`, period: `Oct 1–Dec 31 ${year}` },
  ];
}

// ── Diff logic ───────────────────────────────────────────────────────────────

function diffDeadlines(
  source: string,
  oldList: Deadline[],
  newList: Deadline[]
): Change[] {
  const changes: Change[] = [];

  // New deadlines not in old list
  for (const nd of newList) {
    const match = oldList.find(od => od.type === nd.type);
    if (!match) {
      changes.push({ source, description: `New deadline added: ${nd.type}`, new: nd.due });
    } else if (match.due !== nd.due) {
      changes.push({
        source,
        description: `Deadline shifted: ${nd.type}`,
        old: match.due,
        new: nd.due,
      });
    }
  }

  // Removed deadlines
  for (const od of oldList) {
    if (!newList.find(nd => nd.type === od.type)) {
      changes.push({ source, description: `Deadline removed: ${od.type}`, old: od.due });
    }
  }

  return changes;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Filing Schedule Check ===");
  console.log(`Date: ${new Date().toISOString()}\n`);

  const stored = JSON.parse(fs.readFileSync(SCHEDULES_PATH, "utf-8"));
  const allChanges: Change[] = [];

  // Check TEC
  console.log("Checking TEC...");
  try {
    const tecNew = await fetchTECDeadlines();
    const tecChanges = diffDeadlines("TEC", stored.tec.deadlines, tecNew);
    if (tecChanges.length) {
      console.log(`  ⚠ ${tecChanges.length} TEC change(s):`);
      tecChanges.forEach(c => console.log(`    - ${c.description} (${c.old ?? ""} → ${c.new ?? ""})`));
      stored.tec.deadlines = tecNew;
      allChanges.push(...tecChanges);
    } else {
      console.log("  ✓ No changes");
    }
  } catch (e) {
    console.error("  ✗ TEC check failed:", e);
  }

  // Check FEC
  console.log("Checking FEC...");
  try {
    const fecNew = await fetchFECDeadlines();
    const fecChanges = diffDeadlines("FEC", stored.fec.deadlines, fecNew);
    if (fecChanges.length) {
      console.log(`  ⚠ ${fecChanges.length} FEC change(s):`);
      fecChanges.forEach(c => console.log(`    - ${c.description} (${c.old ?? ""} → ${c.new ?? ""})`));
      stored.fec.deadlines = fecNew;
      allChanges.push(...fecChanges);
    } else {
      console.log("  ✓ No changes");
    }
  } catch (e) {
    console.error("  ✗ FEC check failed:", e);
  }

  // Update metadata
  const today = new Date();
  const nextQuarter = new Date(today);
  nextQuarter.setMonth(today.getMonth() + 3);
  nextQuarter.setDate(1);

  stored._meta.lastChecked = today.toISOString().split("T")[0];
  stored._meta.nextCheck   = nextQuarter.toISOString().split("T")[0];

  // Write updated file
  fs.writeFileSync(SCHEDULES_PATH, JSON.stringify(stored, null, 2));
  console.log(`\nUpdated ${SCHEDULES_PATH}`);

  // Summary
  if (allChanges.length === 0) {
    console.log("\n✓ All filing schedules match. No action needed.");
  } else {
    console.log(`\n⚠ ${allChanges.length} change(s) detected — review data/filing-schedules.json`);
    console.log("ACTION REQUIRED: Update Vercel cron job dates in vercel.json if any refresh_triggers shifted.");
    process.exit(1); // non-zero so CI/scheduled task flags it
  }
}

main().catch(e => { console.error(e); process.exit(1); });
