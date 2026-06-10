// Shared portal helpers for the finance pipeline.
// Both portals are ASP.NET WebForms — plain fetch with ViewState tokens works,
// no headless browser needed. Mirrors the logic proven in
// app/api/finance/harris-county/route.ts and app/api/finance/houston/route.ts.

export const HC_BASE    = "https://ethics.harrisvotes.com";
export const HC_SEARCH  = `${HC_BASE}/CampaignFinanceReports/COR.aspx`;
export const COH_SEARCH = "https://cohweb.houstontx.gov/CampaignFinanceWeb/CFRwebsiteSimpleSearch.aspx";

function extractCookies(raw, fallback = "") {
  const parts = [];
  for (const m of (raw ?? "").matchAll(/([A-Za-z_.][A-Za-z0-9_.]*=[^;,]+)/g)) {
    const kv = m[1].trim();
    const k = kv.toLowerCase();
    if (!k.startsWith("path") && !k.startsWith("domain") && !k.startsWith("expires") &&
        !k.startsWith("samesite") && !k.startsWith("httponly") && !k.startsWith("secure")) {
      parts.push(kv);
    }
  }
  return parts.length ? parts.join("; ") : fallback;
}

export async function getFormTokens(url, cookies = "") {
  const res = await fetch(url, { headers: cookies ? { Cookie: cookies } : {} });
  if (!res.ok) throw new Error(`Token fetch failed ${res.status} for ${url}`);
  const html = await res.text();
  const get = (name) =>
    html.match(new RegExp(`name="${name}"[^>]*value="([^"]*)"`, "s"))?.[1] ?? "";
  return {
    viewState:       get("__VIEWSTATE"),
    viewStateGen:    get("__VIEWSTATEGENERATOR"),
    eventValidation: get("__EVENTVALIDATION"),
    cookies:         extractCookies(res.headers.get("set-cookie"), cookies),
    html,
  };
}

// ── Harris County: search by name, return ALL filing rows ─────────────────────
export async function hcSearch(searchName, tokens) {
  const body = new URLSearchParams({
    "__VIEWSTATE":          tokens.viewState,
    "__VIEWSTATEGENERATOR": tokens.viewStateGen,
    "__VIEWSTATEENCRYPTED": "",
    "__EVENTVALIDATION":    tokens.eventValidation,
    "ctl00$ContentPlaceHolder1$txtName": searchName,
    "ctl00$ContentPlaceHolder1$btnSearch": "Search",
  });
  const res = await fetch(HC_SEARCH, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: tokens.cookies },
    body: body.toString(),
  });
  const html = await res.text();

  // Each row: file date, category, document link. Filer name appears in lblName when present.
  const rowRegex = /lblFileDate[^>]*>([^<]+)<\/span>[\s\S]*?lblCategory[^>]*>(Campaign Finance Report[^<]*)<\/span>[\s\S]*?href="(\.\.\/Document\.aspx\?ID=[^"]+)"/g;
  const rows = [...html.matchAll(rowRegex)].map(([, date, category, rel]) => ({
    date: date.trim(),
    category: category.trim(),
    url: `${HC_BASE}/${rel.replace(/^\.\.\//, "")}`,
  }));

  // Filer names visible in results (for --discover mode)
  const nameRegex = /lbl(?:Filer)?Name[^>]*>([^<]{3,60})<\/span>/g;
  const filerNames = [...new Set([...html.matchAll(nameRegex)].map(m => m[1].trim()))];

  return { rows, filerNames };
}

export const COH_RESULTS = "https://cohweb.houstontx.gov/CampaignFinanceWeb/CFRwebsiteSimpleSearchResult.aspx";

// ── Houston: two-step — POST search (redirect), GET results, parse grid rows ──
// Returns rows + updated tokens (results-page ViewState is needed for the
// Select$N postback that downloads the PDF).
export async function cohSearch(last, first, tokens) {
  const body = new URLSearchParams({
    "__VIEWSTATE":          tokens.viewState,
    "__VIEWSTATEGENERATOR": tokens.viewStateGen,
    "__EVENTVALIDATION":    tokens.eventValidation,
    "ctl00$ContentPlaceHolder1$rdoWildCard": "Exact",
    "ctl00$ContentPlaceHolder1$txtLast_EntityName_coh": last,
    "ctl00$ContentPlaceHolder1$txtFirstName_coh":       first,
    "ctl00$ContentPlaceHolder1$btnSearch_coh":          "Search",
  });
  const searchRes = await fetch(COH_SEARCH, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: tokens.cookies },
    body: body.toString(),
    redirect: "manual",
  });
  tokens.cookies = extractCookies(searchRes.headers.get("set-cookie"), tokens.cookies);

  const resultsRes = await fetch(COH_RESULTS, { headers: { Cookie: tokens.cookies } });
  const html = await resultsRes.text();

  const get = (name) =>
    html.match(new RegExp(`name="${name}"[^>]*value="([^"]*)"`, "s"))?.[1] ?? "";
  tokens.viewState       = get("__VIEWSTATE");
  tokens.viewStateGen    = get("__VIEWSTATEGENERATOR");
  tokens.eventValidation = get("__EVENTVALIDATION");

  // Grid rows: Select$N postback target near a MM/DD/YYYY date and a report ID
  const rowRegex = /Select\$(\d+)[\s\S]{0,600}?(\d{2}\/\d{2}\/\d{4})[\s\S]{0,400}?(?:<[^>]+>)*(\d{5,})/g;
  const rows = [...html.matchAll(rowRegex)].map(([, idx, date, reportId]) => ({
    rowIndex: parseInt(idx, 10),
    date: date.trim(),
    reportId,
    category: "Campaign Finance Report",
  }));
  // Most recent filing is the LAST grid row on this portal
  rows.reverse();
  return { rows, tokens };
}

// Houston PDF download: postback Select$N against the results page
export async function cohDownloadPdf(rowIndex, tokens) {
  const body = new URLSearchParams({
    "__VIEWSTATE":          tokens.viewState,
    "__VIEWSTATEGENERATOR": tokens.viewStateGen,
    "__EVENTVALIDATION":    tokens.eventValidation,
    "__EVENTTARGET":        "ctl00$ContentPlaceHolder1$grdCandidate",
    "__EVENTARGUMENT":      `Select$${rowIndex}`,
  });
  const res = await fetch(COH_RESULTS, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: tokens.cookies },
    body: body.toString(),
  });
  if (!res.ok || !res.headers.get("content-type")?.includes("pdf")) {
    throw new Error(`PDF postback failed: ${res.status} ${res.headers.get("content-type")} (login wall?)`);
  }
  return Buffer.from(await res.arrayBuffer());
}

export async function downloadPdf(url, cookies = "") {
  const res = await fetch(url, { headers: cookies ? { Cookie: cookies } : {} });
  if (!res.ok) throw new Error(`PDF download failed ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.subarray(0, 5).toString() !== "%PDF-") {
    throw new Error("Response is not a PDF (login wall or HTML error page?)");
  }
  return buf;
}

export const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Parse "Last, First ..." → LASTNAME-FIRSTNAME slug for filenames
export function fileSlug(name, office, dateStr) {
  const clean = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "").trim().replace(/\s+/g, "-").toUpperCase();
  const [y, m, d] = (() => {
    const dt = new Date(dateStr);
    return isNaN(dt) ? ["0000", "00", "00"]
      : [dt.getFullYear(), String(dt.getMonth() + 1).padStart(2, "0"), String(dt.getDate()).padStart(2, "0")];
  })();
  const parts = name.split(" ");
  const lastFirst = `${clean(parts.at(-1))}-${clean(parts.slice(0, -1).join(" "))}`;
  return `${lastFirst}-${clean(office)}-${y}-${m}-${d}.pdf`;
}
