// Embeddable election countdown. Self-contained HTML for iframes on other
// sites (blogs, newsletters, partner dashboards). No site chrome, no JS.
// Usage: <iframe src="https://.../embed/countdown" width="320" height="120">

import { EVENTS } from "@/lib/civic-events";
import { SITE_URL, SITE_NAME } from "@/lib/site";

export const revalidate = 3600;

const ELECTION_DAY_IDS = new Set(["primary-2026", "runoff-2026", "general-2026", "hcc-election-2027"]);

export async function GET() {
  const todayStr = new Date().toISOString().slice(0, 10);
  const next = EVENTS
    .filter(e => ELECTION_DAY_IDS.has(e.id) && e.date > todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;

  const days = next
    ? Math.ceil((new Date(next.date + "T00:00:00").getTime() - new Date(todayStr + "T00:00:00").getTime()) / 86400000)
    : null;
  const dateLabel = next
    ? new Date(next.date + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "";

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Election countdown · ${SITE_NAME}</title>
<style>
  html,body{margin:0;padding:0;background:transparent}
  .card{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
    background:#1a3a5c;color:#fff;border-radius:16px;padding:18px 20px;display:flex;flex-direction:column;
    gap:2px;min-height:100px;justify-content:center}
  .eyebrow{font-size:9px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:#7dd3fc;opacity:.9}
  .num{font-size:34px;font-weight:800;line-height:1.05}
  .num small{font-size:13px;font-weight:600;opacity:.85;margin-left:6px}
  .what{font-size:11px;opacity:.8}
  a.credit{font-size:9px;color:#7dd3fc;text-decoration:none;margin-top:6px;opacity:.85}
  a.credit:hover{text-decoration:underline}
</style></head>
<body><div class="card">
  <span class="eyebrow">Days until election</span>
  ${days !== null
    ? `<span class="num">${days}<small>days</small></span><span class="what">${next!.title.replace(/</g, "&lt;")} · ${dateLabel}</span>`
    : `<span class="num">–</span><span class="what">No upcoming election on the calendar</span>`}
  <a class="credit" href="${SITE_URL}/tools/civic-calendar" target="_blank" rel="noopener">${SITE_NAME} →</a>
</div></body></html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
