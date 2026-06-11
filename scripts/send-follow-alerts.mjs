// Follow-an-Official alert worker — the "simple backend queue".
// Run on a schedule (cron or post-filing-deadline, alongside the
// finance-snapshot cron):  node scripts/send-follow-alerts.mjs
//
// 1. Reads subscriber list  (data/follows/follows.jsonl)
// 2. Diffs each followed official's current public state (finance filing,
//    bill movement) against the last-seen snapshot (data/follows/last-state.json)
// 3. Writes alert records to data/follows/queue/<date>.jsonl  AND posts each
//    to EMAIL_WEBHOOK_URL (Zapier/Make → email) when configured.
// 4. Saves the new snapshot. Append-only; never overwrites the queue.

import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FOLLOWS = join(ROOT, "data/follows/follows.jsonl");
const STATE = join(ROOT, "data/follows/last-state.json");
const QUEUE_DIR = join(ROOT, "data/follows/queue");
const SITE = process.env.SITE_URL ?? "http://localhost:3000";
const WEBHOOK = process.env.EMAIL_WEBHOOK_URL;

if (!existsSync(FOLLOWS)) {
  console.log("No followers yet — nothing to do.");
  process.exit(0);
}

const follows = readFileSync(FOLLOWS, "utf8").trim().split("\n").filter(Boolean).map(l => JSON.parse(l));
const bySlug = new Map();
for (const f of follows) {
  if (!bySlug.has(f.slug)) bySlug.set(f.slug, []);
  bySlug.get(f.slug).push(f);
}
console.log(`${follows.length} follows across ${bySlug.size} officials`);

const prev = existsSync(STATE) ? JSON.parse(readFileSync(STATE, "utf8")) : {};
const next = {};
const alerts = [];

for (const [slug, subscribers] of bySlug) {
  const official = subscribers[0].official;
  let finance = null;
  try {
    const res = await fetch(`${SITE}/api/finance/by-name?name=${encodeURIComponent(official)}`);
    if (res.ok) finance = await res.json();
  } catch { /* site not reachable — skip finance diff this run */ }

  const cur = {
    asOf: finance?.asOf ?? null,
    cash: finance?.cash ?? null,
    raised: finance?.raised ?? null,
  };
  next[slug] = cur;
  const old = prev[slug];
  if (!old) continue; // first sighting — baseline only, no alert

  // New filing: the as-of period changed
  if (cur.asOf && old.asOf && cur.asOf !== old.asOf) {
    alerts.push({
      type: "new-filing", slug, official, subscribers: subscribers.map(s => s.email),
      message: `${official} filed a new campaign finance report (${cur.asOf}). Cash on hand: $${(cur.cash ?? 0).toLocaleString()}.`,
      link: `${SITE}/politicians/${slug}`,
    });
  }
  // Significant fundraising move within a period: raised jumped ≥ $50k or ≥ 25%
  else if (cur.raised && old.raised && (cur.raised - old.raised >= 50_000 || cur.raised >= old.raised * 1.25)) {
    alerts.push({
      type: "significant-donor", slug, official, subscribers: subscribers.map(s => s.email),
      message: `${official} reported a significant fundraising jump: $${old.raised.toLocaleString()} → $${cur.raised.toLocaleString()}.`,
      link: `${SITE}/politicians/${slug}`,
    });
  }
  // Bill movement requires LegiScan — piggyback on the site API when key is set
  // (diffing law counts per official is wired once /api/bills supports ?summary)
}

if (!alerts.length) {
  console.log("No state changes — no alerts queued.");
} else {
  if (!existsSync(QUEUE_DIR)) mkdirSync(QUEUE_DIR, { recursive: true });
  const qfile = join(QUEUE_DIR, `${new Date().toISOString().slice(0, 10)}.jsonl`);
  for (const a of alerts) {
    appendFileSync(qfile, JSON.stringify({ ...a, queuedAt: new Date().toISOString() }) + "\n");
    if (WEBHOOK) {
      try {
        await fetch(WEBHOOK, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...a, source: "The Harris County Project — Follow Alert" }),
        });
      } catch (e) {
        console.error(`webhook failed for ${a.slug}: ${e.message}`);
      }
    }
    console.log(`[ALERT] ${a.type} — ${a.official} → ${a.subscribers.length} subscriber(s)`);
  }
  console.log(`${alerts.length} alert(s) queued to ${qfile}${WEBHOOK ? " + webhook" : " (no EMAIL_WEBHOOK_URL — queued only)"}`);
}

mkdirSync(dirname(STATE), { recursive: true });
writeFileSync(STATE, JSON.stringify(next, null, 2));
console.log("Snapshot saved.");
