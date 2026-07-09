// Embeddable race card. Self-contained HTML for iframes on partner sites.
// Usage: <iframe src="https://.../embed/race/CD-7" width="360" height="170">

import { MATCHUPS_2026, type RaceLean } from "@/lib/matchups-2026";
import { getFinanceByName, fmt } from "@/lib/campaign-finance";
import { SITE_URL, SITE_NAME } from "@/lib/site";

export const revalidate = 3600;

const LEAN_LABEL: Record<RaceLean, string> = {
  "safe-d": "Safe D", "likely-d": "Likely D", "lean-d": "Lean D",
  "toss-up": "Toss-up",
  "lean-r": "Lean R", "likely-r": "Likely R", "safe-r": "Safe R",
  "uncontested-d": "Uncontested D", "uncontested-r": "Uncontested R",
};
const LEAN_HEX: Record<RaceLean, string> = {
  "safe-d": "#60a5fa", "likely-d": "#60a5fa", "lean-d": "#93c5fd",
  "toss-up": "#c4b5fd",
  "lean-r": "#fca5a5", "likely-r": "#f87171", "safe-r": "#f87171",
  "uncontested-d": "#60a5fa", "uncontested-r": "#f87171",
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function GET(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const m = MATCHUPS_2026[key];
  if (!m) {
    return new Response("Unknown race key", { status: 404, headers: { "Content-Type": "text/plain" } });
  }

  const side = (party: "D" | "R") => {
    const s = m.sides.find(x => x.party === party);
    if (!s) return `<div class="cand"><span class="name none">No ${party} filed</span></div>`;
    const fin = getFinanceByName(s.name);
    return `<div class="cand">
      <span class="name ${party === "D" ? "d" : "r"}">${esc(s.name)}${s.incumbent ? ' <em class="inc">INC</em>' : ""}</span>
      ${fin && fin.cash > 0 ? `<span class="cash">${fmt(fin.cash)}</span>` : ""}
    </div>`;
  };

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(m.office)} · ${SITE_NAME}</title>
<style>
  html,body{margin:0;padding:0;background:transparent}
  .card{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
    background:#1a3a5c;color:#fff;border-radius:16px;padding:16px 18px;min-height:150px;
    display:flex;flex-direction:column;gap:8px}
  .head{display:flex;justify-content:space-between;align-items:baseline;gap:10px}
  .office{font-size:14px;font-weight:800;line-height:1.25}
  .lean{font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap}
  .cand{display:flex;justify-content:space-between;align-items:baseline;gap:10px}
  .name{font-size:13px;font-weight:700}
  .name.d{color:#93c5fd}.name.r{color:#fca5a5}.name.none{color:#94a3b8;font-weight:500;font-style:italic;font-size:11px}
  .inc{font-style:normal;font-size:8px;font-weight:800;background:rgba(255,255,255,.15);border-radius:4px;padding:1px 4px;vertical-align:1px}
  .cash{font-size:11px;opacity:.75;font-variant-numeric:tabular-nums}
  a.credit{font-size:9px;color:#7dd3fc;text-decoration:none;margin-top:auto;opacity:.85}
  a.credit:hover{text-decoration:underline}
</style></head>
<body><div class="card">
  <div class="head">
    <span class="office">${esc(m.office)}</span>
    ${m.lean ? `<span class="lean" style="color:${LEAN_HEX[m.lean]}">${LEAN_LABEL[m.lean]}</span>` : ""}
  </div>
  ${side("D")}
  ${side("R")}
  <a class="credit" href="${SITE_URL}/tools/ballot-2026?q=${encodeURIComponent(m.office)}" target="_blank" rel="noopener">Full race coverage · ${SITE_NAME} →</a>
</div></body></html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
