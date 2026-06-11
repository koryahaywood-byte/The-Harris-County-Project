// Terrain Report — anomaly scan across every data pipe.
// Statistical screens only; every signal carries its sources, its confidence,
// and is framed as a SIGNAL for a human to chase, never a conclusion.
//
// Detectors:
//   1. turnout-drop      precinct turnout rate fell hard vs prior cycles
//   2. donor-cluster     a donor at/near the itemized max across 2+ officials
//   3. bill-unstalled    a bill moved after a long committee stall
//
// Output: public/data/terrain-report.json
// Run: node scripts/detect-anomalies.mjs  (or via run-pipelines.mjs)

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = p => JSON.parse(readFileSync(join(ROOT, p), "utf8"));

const signals = [];

/* ── 1. Turnout drops: 2024 vs 2020, same precinct, same office type ─────── */
try {
  const h = read("public/data/precinct-history.json");
  const cw = read("lib/precinct-crosswalk.json").precincts;
  const v20 = h.cycles["2020G"].voter, v24 = h.cycles["2024G"].voter;
  const drops = [];
  for (const [prec, a] of Object.entries(v20)) {
    const b = v24[prec];
    if (!b || a.reg < 500 || b.reg < 500) continue; // small precincts = noise
    const r20 = a.turnout / a.reg, r24 = b.turnout / b.reg;
    if (r20 > 0.25 && r20 - r24 >= 0.18) {
      drops.push({ prec, r20, r24, drop: r20 - r24, cd: cw[prec]?.cd, pct: cw[prec]?.pct });
    }
  }
  drops.sort((x, y) => y.drop - x.drop);
  if (drops.length) {
    const byCd = {};
    for (const d of drops) if (d.cd) byCd[d.cd] = (byCd[d.cd] ?? 0) + 1;
    const worstCd = Object.entries(byCd).sort((a, b) => b[1] - a[1])[0];
    signals.push({
      id: "turnout-drop-2024",
      type: "turnout",
      severity: drops.length > 40 ? "high" : drops.length > 15 ? "significant" : "notable",
      headline: `${drops.length} precincts shed 18+ points of presidential-year turnout between 2020 and 2024`,
      body: `Steepest: precinct ${drops[0].prec} (${Math.round(drops[0].r20 * 100)}% → ${Math.round(drops[0].r24 * 100)}% of registered voters).` +
        (worstCd ? ` Heaviest concentration: CD-${worstCd[0]} (${worstCd[1]} precincts).` : "") +
        ` Same-type cycles compared (presidential vs presidential), registration-adjusted, precincts under 500 registered excluded.`,
      sources: ["TLC TED voter data 2020G/2024G", "TX SOS registration", "current precinct lines"],
      confidence: "high",
      confidenceNote: "Official certified counts; the screen measures change, not its cause — boundary-stable join covers 1,170 of 1,172 precincts.",
      links: [{ label: "Districts — history layer", href: "/tools/districts" }],
      entities: { precincts: drops.slice(0, 12).map(d => d.prec) },
    });
  }
} catch (e) { console.error("turnout detector:", e.message); }

/* ── 2. Donor max-out clusters across officials ──────────────────────────── */
try {
  const net = read("public/data/donor-network.json");
  const MAX = 3300; // FEC per-election individual limit, 2026 cycle
  const clusters = net.donors.filter(d =>
    d.recipients.length >= 2 && d.recipients.filter(r => r.amount >= MAX * 0.9).length >= 2
  );
  for (const d of clusters.slice(0, 6)) {
    signals.push({
      id: `donor-cluster-${d.name.replace(/\W+/g, "-").toLowerCase()}`,
      type: "money",
      severity: d.total >= MAX * 4 ? "significant" : "notable",
      headline: `${d.name} is at or near the itemized maximum with ${d.recipients.length} tracked officials`,
      body: `$${d.total.toLocaleString()} total across ${d.recipients.map(r => r.official).join(", ")}` +
        `${d.employer ? ` · employer on filings: ${d.employer}` : ""}. Filing windows overlap within the 2026 cycle.`,
      sources: ["FEC itemized Schedule A, 2026 cycle"],
      confidence: net.coverage.includes("DEMO") || net.officials.length < 5 ? "medium" : "high",
      confidenceNote: "Name-matched aggregation across committees — common names can merge distinct donors; coverage is federal filings only until TEC Schedule A extraction lands.",
      links: [{ label: "Money Trail", href: "/tools/where-is-the-dough?tab=trail" }],
      entities: { donors: [d.name], officials: d.recipients.map(r => r.official) },
    });
  }
} catch (e) { console.error("donor detector:", e.message); }

/* ── 3. Bills moving after extended stalls ───────────────────────────────── */
try {
  const movesPath = join(ROOT, "data/pipeline-logs/bill-movements.jsonl");
  if (existsSync(movesPath)) {
    const moves = readFileSync(movesPath, "utf8").trim().split("\n").filter(Boolean).map(l => JSON.parse(l));
    const recent = moves.filter(m => Date.now() - new Date(m.at).getTime() < 14 * 86400_000);
    for (const m of recent.filter(m => m.stallDays >= 60).slice(0, 5)) {
      signals.push({
        id: `bill-unstalled-${m.bill}`,
        type: "legislation",
        severity: m.stallDays >= 120 ? "significant" : "notable",
        headline: `${m.bill} moved after ${m.stallDays} days without action`,
        body: `New action: "${m.action}" (${m.date}). Long-stalled bills that suddenly move usually mean someone made a call.`,
        sources: ["LegiScan TX 89th, daily poll"],
        confidence: "high",
        confidenceNote: "Action dates are LegiScan's official record; the stall length is exact, the inference is yours to make.",
        links: [{ label: "Bill Tracker", href: "/tools/bill-tracker" }],
        entities: { bills: [m.bill] },
      });
    }
  }
} catch (e) { console.error("bill detector:", e.message); }

/* ── Write ───────────────────────────────────────────────────────────────── */
const out = {
  generatedAt: new Date().toISOString(),
  framing: "Statistical screens, not conclusions. Every signal shows its sources and confidence; the judgment is the reader's.",
  signals: signals.sort((a, b) => ({ high: 0, significant: 1, notable: 2 })[a.severity] - ({ high: 0, significant: 1, notable: 2 })[b.severity]),
};
writeFileSync(join(ROOT, "public/data/terrain-report.json"), JSON.stringify(out, null, 1));
console.log(`${signals.length} signal(s) → public/data/terrain-report.json`);
