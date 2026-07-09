// The Weekly Briefing as a ready-to-send email.
//
// GET /api/newsletter        → self-contained HTML email (inline styles)
// GET /api/newsletter?format=json → structured digest for automations
//
// SENDING (user-side, once an email provider is chosen): point a weekly
// automation (Zapier/Make/Buttondown "fetch URL", or a small script hitting
// any ESP API) at this route and mail the body to the list collected by
// /api/email-collect (EMAIL_WEBHOOK_URL destination). This route only
// RENDERS the digest; it never sends and holds no addresses.

import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/dashboard-data";
import { MATCHUPS_2026, type RaceLean } from "@/lib/matchups-2026";
import { EVENTS } from "@/lib/civic-events";
import { STAKES } from "@/lib/race-stakes";
import { SITE_URL, SITE_NAME } from "@/lib/site";

export const revalidate = 3600;

const NAVY = "#1a3a5c", SKY = "#2563a8", CREAM = "#f5f3ef", MUTED = "#6b7280";
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const LEAN_LABEL: Record<RaceLean, string> = {
  "safe-d": "Safe D", "likely-d": "Likely D", "lean-d": "Lean D",
  "toss-up": "Toss-up",
  "lean-r": "Lean R", "likely-r": "Likely R", "safe-r": "Safe R",
  "uncontested-d": "Uncontested D", "uncontested-r": "Uncontested R",
};

const WATCHLIST = ["US-Senate", "HC-Countywide", "CD-7", "CD-9", "HD-135", "PCT-4"];

function upcomingEvents(todayStr: string, days: number) {
  const end = new Date(new Date(todayStr).getTime() + days * 86400000).toISOString().slice(0, 10);
  return EVENTS
    .filter(e => e.date > todayStr && e.date <= end)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);
}

export async function GET(req: Request) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const data = await getDashboardData();
  const week = upcomingEvents(todayStr, 10);
  const dateLabel = new Date(todayStr + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  const watch = WATCHLIST
    .filter(k => MATCHUPS_2026[k])
    .map(k => {
      const m = MATCHUPS_2026[k];
      const d = m.sides.find(s => s.party === "D")?.name ?? "TBD";
      const r = m.sides.find(s => s.party === "R")?.name ?? "TBD";
      return { key: k, office: m.office, d, r, lean: m.lean ? LEAN_LABEL[m.lean] : "", stakes: STAKES[k] ?? "" };
    });

  if (new URL(req.url).searchParams.get("format") === "json") {
    return NextResponse.json({
      date: todayStr,
      news: { local: data.local, state: data.state, federal: data.federal },
      countdown: data.nextElection,
      nextFiling: data.nextFiling,
      upcoming: week,
      watchlist: watch,
    });
  }

  const story = (label: string, s: typeof data.local) => !s ? "" : `
    <tr><td style="padding:14px 24px 0">
      <p style="margin:0 0 2px;font-size:10px;font-weight:700;letter-spacing:.2em;color:${SKY}">${label}</p>
      <a href="${esc(s.link)}" style="font-size:15px;font-weight:700;color:${NAVY};text-decoration:none;line-height:1.35">${esc(s.title)}</a>
      <p style="margin:2px 0 0;font-size:11px;color:${MUTED}">${esc(s.source)}</p>
    </td></tr>`;

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>The Weekly Briefing</title></head>
<body style="margin:0;padding:0;background:${CREAM};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Georgia,serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};padding:24px 12px">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden">

  <tr><td style="background:${NAVY};padding:28px 24px">
    <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:.25em;color:#7dd3fc">HARRIS COUNTY · POLITICAL INTELLIGENCE</p>
    <h1 style="margin:0;font-size:26px;color:#ffffff;font-weight:800">The Weekly Briefing</h1>
    <p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,.75)">${dateLabel}</p>
  </td></tr>

  ${data.nextElection ? `
  <tr><td style="background:${SKY};padding:12px 24px">
    <p style="margin:0;font-size:13px;color:#ffffff"><strong>${data.nextElection.daysAway} days</strong> until ${esc(data.nextElection.title)}${data.nextFiling ? ` · next finance deadline: ${esc(data.nextFiling.title)} in ${data.nextFiling.daysAway} days` : ""}</p>
  </td></tr>` : ""}

  ${story("HOUSTON", data.local)}
  ${story("TEXAS", data.state)}
  ${story("D.C.", data.federal)}

  <tr><td style="padding:22px 24px 0">
    <p style="margin:0 0 8px;font-size:10px;font-weight:700;letter-spacing:.2em;color:${SKY}">RACES WE'RE WATCHING</p>
    ${watch.map(w => `
      <p style="margin:0 0 10px;font-size:13px;line-height:1.45;color:${NAVY}">
        <strong>${esc(w.office)}</strong> · ${esc(w.lean)}<br>
        <span style="color:#1d4ed8">${esc(w.d)}</span> vs <span style="color:#b91c1c">${esc(w.r)}</span>
        ${w.stakes ? `<br><span style="font-size:11px;color:${MUTED}">${esc(w.stakes)}</span>` : ""}
      </p>`).join("")}
  </td></tr>

  ${week.length ? `
  <tr><td style="padding:10px 24px 0">
    <p style="margin:0 0 8px;font-size:10px;font-weight:700;letter-spacing:.2em;color:${SKY}">NEXT 10 DAYS</p>
    ${week.map(e => `<p style="margin:0 0 6px;font-size:12px;color:${NAVY}"><strong>${new Date(e.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</strong> · ${esc(e.title)}</p>`).join("")}
  </td></tr>` : ""}

  <tr><td style="padding:22px 24px 26px">
    <a href="${SITE_URL}/tools/my-ballot" style="display:inline-block;background:${NAVY};color:#ffffff;font-size:13px;font-weight:700;padding:10px 20px;border-radius:999px;text-decoration:none">Build your November ballot →</a>
    <p style="margin:14px 0 0;font-size:10px;color:#9ca3af;line-height:1.5">
      ${SITE_NAME} · free, public data, no party registration.<br>
      You're receiving this because you signed up at <a href="${SITE_URL}" style="color:${SKY}">${SITE_URL.replace("https://", "")}</a>.
    </p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
