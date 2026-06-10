#!/usr/bin/env node
/* Reads data/update-schedule.json, compares each source file's mtime against
   its expected update frequency, and writes DATA-FRESHNESS-REPORT.md.
   Also writes public/data/freshness.json so /admin/freshness can render it.
   Run: npm run check-freshness */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const schedule = JSON.parse(fs.readFileSync(path.join(ROOT, "data/update-schedule.json"), "utf8"));

const now = Date.now();
const rows = schedule.sources.map((s) => {
  const full = path.join(ROOT, s.path);
  let mtime = null;
  try { mtime = fs.statSync(full).mtime; } catch { /* missing file */ }
  const ageDays = mtime ? (now - mtime.getTime()) / 86400000 : null;
  let status = "missing";
  if (ageDays !== null) {
    if (ageDays <= s.maxAgeDays) status = "current";
    else if (ageDays <= s.maxAgeDays * 1.5) status = "stale";
    else status = "overdue";
  }
  return { ...s, mtime: mtime ? mtime.toISOString().slice(0, 10) : null, ageDays: ageDays === null ? null : Math.round(ageDays), status };
});

const icon = { current: "✅", stale: "⚠️", overdue: "🔴", missing: "❌" };
const order = { overdue: 0, missing: 1, stale: 2, current: 3 };
rows.sort((a, b) => order[a.status] - order[b.status]);

const counts = rows.reduce((m, r) => ((m[r.status] = (m[r.status] || 0) + 1), m), {});

const md = `# Data Freshness Report
Generated: ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC
Summary: ${rows.length} sources — ${counts.current || 0} current, ${counts.stale || 0} stale, ${counts.overdue || 0} overdue, ${counts.missing || 0} missing.

| Status | Source | File | Last updated | Age (days) | Allowed (days) | Frequency |
|---|---|---|---|---|---|---|
${rows.map(r => `| ${icon[r.status]} ${r.status} | ${r.name} | \`${r.path}\` | ${r.mtime ?? "—"} | ${r.ageDays ?? "—"} | ${r.maxAgeDays} | ${r.frequency} |`).join("\n")}

> "stale" = past its window but under 1.5×. "overdue" = more than 1.5× past its window.
> File mtimes are a proxy — a git checkout resets them, so treat this as a prompt to verify, not gospel.
`;

fs.writeFileSync(path.join(ROOT, "DATA-FRESHNESS-REPORT.md"), md);
fs.mkdirSync(path.join(ROOT, "public/data"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "public/data/freshness.json"), JSON.stringify({ generated: new Date().toISOString(), rows }, null, 2));

console.log(`DATA-FRESHNESS-REPORT.md written. ${counts.current || 0} current / ${counts.stale || 0} stale / ${counts.overdue || 0} overdue / ${counts.missing || 0} missing.`);
if ((counts.overdue || 0) + (counts.missing || 0) > 0) process.exitCode = 1;
