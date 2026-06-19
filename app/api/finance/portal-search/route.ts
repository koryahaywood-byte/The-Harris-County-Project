import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export interface PortalFiling {
  date: string;
  label: string;   // e.g. "Campaign Finance Report"
  url: string;     // direct PDF or document link
  portal: "harris-county" | "houston";
}

export interface PortalSearchResult {
  status: "ok" | "no_results" | "error";
  name: string;
  portal: "harris-county" | "houston" | "both";
  filings: PortalFiling[];
  error?: string;
}

// ── Harris County portal ──────────────────────────────────────────────────
const HC_BASE    = "https://ethics.harrisvotes.com";
const HC_SEARCH  = `${HC_BASE}/CampaignFinanceReports/COR.aspx`;

async function hcGetTokens() {
  const res  = await fetch(HC_SEARCH, { cache: "no-store" });
  const html = await res.text();
  const cookies = res.headers.get("set-cookie") ?? "";
  const get = (n: string) =>
    html.match(new RegExp(`name="${n}"[^>]*value="([^"]*)"`, "s"))?.[1] ?? "";
  return {
    viewState:       get("__VIEWSTATE"),
    viewStateGen:    get("__VIEWSTATEGENERATOR"),
    eventValidation: get("__EVENTVALIDATION"),
    cookies,
  };
}

async function hcSearch(searchName: string): Promise<PortalFiling[]> {
  const tokens = await hcGetTokens();

  const body = new URLSearchParams({
    "__VIEWSTATE":            tokens.viewState,
    "__VIEWSTATEGENERATOR":   tokens.viewStateGen,
    "__VIEWSTATEENCRYPTED":   "",
    "__EVENTVALIDATION":      tokens.eventValidation,
    "ctl00$ContentPlaceHolder1$txtName":   searchName,
    "ctl00$ContentPlaceHolder1$btnSearch": "Search",
  });

  const res = await fetch(HC_SEARCH, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": tokens.cookies,
    },
    body: body.toString(),
    cache: "no-store",
  });

  const html = await res.text();

  // Pattern: date label span → category span → href to Document.aspx
  // Try a more permissive multi-pattern approach
  const filings: PortalFiling[] = [];

  // Extract all Document.aspx links with surrounding date context
  const docRegex = /href="(\.\.\/Document\.aspx\?ID=[^"]+)"/g;
  const dateRegex = /(\d{1,2}\/\d{1,2}\/\d{4})/g;

  // Get all dates from the page
  const allDates = [...html.matchAll(dateRegex)].map(m => m[1]);
  const allDocs  = [...html.matchAll(docRegex)].map(m =>
    `${HC_BASE}/${m[1].replace(/^\.\.\//, "")}`
  );

  // Pair them — each doc row has a date before it
  for (let i = 0; i < allDocs.length; i++) {
    filings.push({
      date:   allDates[i] ?? "Unknown",
      label:  "Campaign Finance Report",
      url:    allDocs[i],
      portal: "harris-county",
    });
  }

  // Deduplicate by URL
  const seen = new Set<string>();
  return filings.filter(f => {
    if (seen.has(f.url)) return false;
    seen.add(f.url);
    return true;
  });
}

// ── Houston COH portal ────────────────────────────────────────────────────
const COH_SEARCH  = "https://cohweb.houstontx.gov/CampaignFinanceWeb/CFRwebsiteSimpleSearch.aspx";
const COH_RESULTS = "https://cohweb.houstontx.gov/CampaignFinanceWeb/CFRwebsiteSimpleSearchResult.aspx";
const COH_DOC_BASE = "https://cohweb.houstontx.gov/CampaignFinanceWeb/";

function parseCookies(header: string, existing = ""): string {
  const parts: string[] = existing ? existing.split("; ") : [];
  for (const m of header.matchAll(/([A-Za-z_.][A-Za-z0-9_.]*=[^;,\n]+)/g)) {
    const kv = m[1].trim();
    const low = kv.toLowerCase();
    if (["path","domain","expires","samesite","httponly","secure"].some(x => low.startsWith(x))) continue;
    const key = kv.split("=")[0];
    const idx = parts.findIndex(p => p.startsWith(key + "="));
    if (idx >= 0) parts[idx] = kv; else parts.push(kv);
  }
  return parts.join("; ");
}

async function cohSearch(last: string, first: string): Promise<PortalFiling[]> {
  // Step 1: get search page tokens
  const initRes  = await fetch(COH_SEARCH, { cache: "no-store" });
  const initHtml = await initRes.text();
  let cookies    = parseCookies(initRes.headers.get("set-cookie") ?? "");

  const get = (n: string) =>
    initHtml.match(new RegExp(`name="${n}"[^>]*value="([^"]*)"`, "s"))?.[1] ?? "";

  const viewState       = get("__VIEWSTATE");
  const viewStateGen    = get("__VIEWSTATEGENERATOR");
  const eventValidation = get("__EVENTVALIDATION");

  // Step 2: POST search
  const searchBody = new URLSearchParams({
    "__VIEWSTATE":          viewState,
    "__VIEWSTATEGENERATOR": viewStateGen,
    "__EVENTVALIDATION":    eventValidation,
    "ctl00$ContentPlaceHolder1$rdoWildCard":               "Exact",
    "ctl00$ContentPlaceHolder1$txtLast_EntityName_coh":    last,
    "ctl00$ContentPlaceHolder1$txtFirstName_coh":          first,
    "ctl00$ContentPlaceHolder1$btnSearch_coh":             "Search",
  });

  const searchRes = await fetch(COH_SEARCH, {
    method:   "POST",
    headers:  { "Content-Type": "application/x-www-form-urlencoded", Cookie: cookies },
    body:     searchBody.toString(),
    redirect: "manual",
    cache:    "no-store",
  });
  cookies = parseCookies(searchRes.headers.get("set-cookie") ?? "", cookies);

  // Step 3: load results page
  const resultsRes  = await fetch(COH_RESULTS, { headers: { Cookie: cookies }, cache: "no-store" });
  const resultsHtml = await resultsRes.text();

  // Extract filing links — Houston COH results page has either:
  // (a) a grid with Select$N postback rows (requires another POST to get PDF)
  // (b) direct links to PDFs in the grid
  const filings: PortalFiling[] = [];

  // Try pattern: rows with date + "Campaign Finance" text
  // Match table rows containing dates and filing type
  const rowRegex = /(\d{2}\/\d{2}\/\d{4})[\s\S]{0,300}?(Campaign Finance[^<]{0,60})/g;
  const dates: string[] = [];
  const labels: string[] = [];
  for (const m of resultsHtml.matchAll(rowRegex)) {
    dates.push(m[1]);
    labels.push(m[2].trim());
  }

  // Extract all PDF/document links
  const linkRegex = /href="([^"]*(?:CFR|Document|Report|pdf)[^"]*)"/gi;
  const links: string[] = [];
  for (const m of resultsHtml.matchAll(linkRegex)) {
    const href = m[1];
    const full = href.startsWith("http") ? href : COH_DOC_BASE + href.replace(/^\.\.\//, "");
    links.push(full);
  }

  // If we found links, pair with dates
  const count = Math.max(dates.length, links.length);
  if (count === 0) {
    // No filings found — check if it's a "no results" page
    if (resultsHtml.includes("No records") || resultsHtml.includes("no results") || resultsHtml.includes("0 records")) {
      return [];
    }
    // Could be postback-only grid — return a stub pointing to the results page
    // with note that user should use the portal directly
    if (resultsHtml.includes("Select$")) {
      filings.push({
        date:   "See portal",
        label:  "Filings found — open portal to download",
        url:    COH_RESULTS,
        portal: "houston",
      });
    }
    return filings;
  }

  const seen = new Set<string>();
  for (let i = 0; i < Math.max(dates.length, links.length); i++) {
    const url = links[i] ?? COH_RESULTS;
    if (seen.has(url)) continue;
    seen.add(url);
    filings.push({
      date:   dates[i] ?? "Unknown",
      label:  labels[i] ?? "Campaign Finance Report",
      url,
      portal: "houston",
    });
  }

  return filings;
}

// ── Route handler ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest): Promise<NextResponse<PortalSearchResult>> {
  const body = await req.json().catch(() => ({})) as {
    name?: string;
    portal?: "harris-county" | "houston" | "both";
  };

  const rawName = (body.name ?? "").trim();
  if (!rawName) {
    return NextResponse.json({ status: "error", name: "", portal: "both", filings: [], error: "Name is required" });
  }

  const portal = body.portal ?? "both";

  try {
    const tasks: Promise<PortalFiling[]>[] = [];

    if (portal === "harris-county" || portal === "both") {
      // HC portal: search name can be "Last, First" or just "Last"
      tasks.push(hcSearch(rawName).catch(() => []));
    }

    if (portal === "houston" || portal === "both") {
      // COH portal: needs last + first separately
      // Try to split: "Last, First" or "First Last"
      let last = rawName, first = "";
      if (rawName.includes(",")) {
        [last, first] = rawName.split(",").map(s => s.trim());
      } else {
        const parts = rawName.split(" ");
        last  = parts[parts.length - 1];
        first = parts.slice(0, -1).join(" ");
      }
      tasks.push(cohSearch(last, first).catch(() => []));
    }

    const results = await Promise.all(tasks);
    const filings = results.flat();

    // Sort by date desc
    filings.sort((a, b) => {
      const da = new Date(a.date).getTime() || 0;
      const db = new Date(b.date).getTime() || 0;
      return db - da;
    });

    return NextResponse.json({
      status: filings.length ? "ok" : "no_results",
      name: rawName,
      portal,
      filings,
    });
  } catch (err) {
    return NextResponse.json({
      status: "error",
      name: rawName,
      portal,
      filings: [],
      error: String(err),
    });
  }
}
