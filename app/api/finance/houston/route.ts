import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

// Allow up to 5 minutes — Vercel cron uses this route, which needs time for 17 sequential scrapes
export const maxDuration = 300;

const COH_SEARCH  = "https://cohweb.houstontx.gov/CampaignFinanceWeb/CFRwebsiteSimpleSearch.aspx";
const COH_RESULTS = "https://cohweb.houstontx.gov/CampaignFinanceWeb/CFRwebsiteSimpleSearchResult.aspx";

const COH_CANDIDATES = [
  { last: "Whitmire",      first: "John",      name: "John Whitmire",        office: "Mayor",                     party: "D" as const, incumbent: true  },
  { last: "Pollard",       first: "Edward",    name: "Edward Pollard",       office: "City Council At-Large 2",   party: "D" as const, incumbent: true  },
  { last: "Hollins",       first: "Chris",     name: "Chris Hollins",        office: "City Controller",           party: "D" as const, incumbent: true  },
  { last: "Castex-Tatum",  first: "Martha",    name: "Martha Castex-Tatum",  office: "City Council District K",   party: "D" as const, incumbent: true  },
  { last: "Thomas",        first: "Tiffany",   name: "Tiffany Thomas",       office: "City Council District F",   party: "D" as const, incumbent: true  },
  { last: "Castillo",      first: "Mario",     name: "Mario Castillo",       office: "City Council District H",   party: "D" as const, incumbent: true  },
  { last: "Ramirez",       first: "Julian",    name: "Julian Ramirez",       office: "City Council At-Large 1",   party: "R" as const, incumbent: true  },
  { last: "Carter",        first: "Twila",     name: "Twila Carter",         office: "City Council At-Large 3",   party: "R" as const, incumbent: true  },
  { last: "Salinas",       first: "Alejandra", name: "Alejandra Salinas",    office: "City Council At-Large 4",   party: "D" as const, incumbent: true  },
  { last: "Alcorn",        first: "Sallie",    name: "Sallie Alcorn",        office: "City Council At-Large 5",   party: "D" as const, incumbent: true  },
  { last: "Jackson",       first: "Tarsha",    name: "Tarsha Jackson",       office: "City Council District B",   party: "D" as const, incumbent: true  },
  { last: "Evans-Shabazz", first: "Carolyn",   name: "Carolyn Evans-Shabazz",office: "City Council District D",   party: "D" as const, incumbent: true  },
  { last: "Flickinger",    first: "Fred",      name: "Fred Flickinger",      office: "City Council District E",   party: "R" as const, incumbent: true  },
  { last: "Panzarella",    first: "Joe",       name: "Joe Panzarella",       office: "City Council District C",   party: "R" as const, incumbent: true  },
  { last: "Huffman",       first: "Mary Nan",  name: "Mary Nan Huffman",     office: "City Council District G",   party: "R" as const, incumbent: true  },
  { last: "Martinez",      first: "Joaquin",   name: "Joaquin Martinez",     office: "City Council District I",   party: "D" as const, incumbent: true  },
  { last: "Pollard",       first: "Edward",    name: "Edward Pollard",       office: "City Council At-Large 2",   party: "D" as const, incumbent: true  },
  { last: "Peck",          first: "Amy",       name: "Amy Peck",             office: "City Council District A",   party: "R" as const, incumbent: true  },
];

export interface COHCandidate {
  name: string;
  office: string;
  level: "houston";
  party: "D" | "R";
  cash: number;
  raised: number;
  spent: number;
  loans: number;
  asOf: string;
  filingDate: string;
  incumbent: boolean;
  filingUrl: string;
  dataSource: "live" | "error";
  fetchedAt: string;
}

interface FormTokens {
  viewState: string;
  viewStateGen: string;
  eventValidation: string;
  cookies: string;
}

async function getFormTokens(url: string, cookies = ""): Promise<FormTokens> {
  const res = await fetch(url, {
    headers: cookies ? { Cookie: cookies } : {},
    cache: "no-store",
  });
  const html = await res.text();
  const rawCookies = res.headers.get("set-cookie") ?? "";

  // Collect ALL cookies the site sets — session + anonymous token both required
  const parts: string[] = [];
  for (const match of rawCookies.matchAll(/([A-Za-z_.][A-Za-z0-9_.]*=[^;,]+)/g)) {
    const kv = match[1].trim();
    if (!kv.toLowerCase().startsWith("path") && !kv.toLowerCase().startsWith("domain") &&
        !kv.toLowerCase().startsWith("expires") && !kv.toLowerCase().startsWith("samesite") &&
        !kv.toLowerCase().startsWith("httponly") && !kv.toLowerCase().startsWith("secure")) {
      parts.push(kv);
    }
  }
  const allCookies = parts.length > 0 ? parts.join("; ") : cookies;

  const get = (name: string) => html.match(new RegExp(`name="${name}"[^>]*value="([^"]*)"`, "s"))?.[1] ?? "";

  return {
    viewState:       get("__VIEWSTATE"),
    viewStateGen:    get("__VIEWSTATEGENERATOR"),
    eventValidation: get("__EVENTVALIDATION"),
    cookies:         allCookies,
  };
}

// Step 1+2: Search and get row data (date, filing index for postback)
async function searchAndGetRows(
  last: string, first: string, tokens: FormTokens
): Promise<{ rowIndex: number; date: string; reportId: string } | null> {
  const body = new URLSearchParams({
    "__VIEWSTATE":          tokens.viewState,
    "__VIEWSTATEGENERATOR": tokens.viewStateGen,
    "__EVENTVALIDATION":    tokens.eventValidation,
    "ctl00$ContentPlaceHolder1$rdoWildCard": "Exact",
    "ctl00$ContentPlaceHolder1$txtLast_EntityName_coh":  last,
    "ctl00$ContentPlaceHolder1$txtFirstName_coh":        first,
    "ctl00$ContentPlaceHolder1$btnSearch_coh":           "Search",
  });

  const searchRes = await fetch(COH_SEARCH, {
    method: "POST",
    headers: {
      "Content-Type":  "application/x-www-form-urlencoded",
      "Cookie":         tokens.cookies,
    },
    body: body.toString(),
    redirect: "manual",
    cache:    "no-store",
  });

  // Keep all cookies from redirect response too
  const redirectCookieHeader = searchRes.headers.get("set-cookie") ?? "";
  if (redirectCookieHeader) {
    const updatedParts: string[] = [];
    for (const match of redirectCookieHeader.matchAll(/([A-Za-z_.][A-Za-z0-9_.]*=[^;,]+)/g)) {
      const kv = match[1].trim();
      const key = kv.toLowerCase();
      if (!key.startsWith("path") && !key.startsWith("domain") && !key.startsWith("expires") &&
          !key.startsWith("samesite") && !key.startsWith("httponly") && !key.startsWith("secure")) {
        updatedParts.push(kv);
      }
    }
    if (updatedParts.length) tokens.cookies = updatedParts.join("; ");
  }

  const resultsRes = await fetch(COH_RESULTS, {
    headers: { Cookie: tokens.cookies },
    cache: "no-store",
  });
  const html = await resultsRes.text();

  // Extract row tokens for postback
  const vsMatch = html.match(/name="__VIEWSTATE"[^>]*value="([^"]*)"/);
  const vgMatch = html.match(/name="__VIEWSTATEGENERATOR"[^>]*value="([^"]*)"/);
  const evMatch = html.match(/name="__EVENTVALIDATION"[^>]*value="([^"]*)"/);
  if (!vsMatch) return null;

  tokens.viewState       = vsMatch[1];
  tokens.viewStateGen    = vgMatch?.[1] ?? "";
  tokens.eventValidation = evMatch?.[1] ?? "";

  // Find all rows — match Select$N then grab nearest date (MM/DD/YYYY) and report ID number
  // Two patterns: old <font> tags and newer <span>/<td> markup
  const rowRegex = /Select\$(\d+)[\s\S]{0,600}?(\d{2}\/\d{2}\/\d{4})[\s\S]{0,400}?(?:<[^>]+>)*(\d{5,})/g;
  const rows: { rowIndex: number; date: string; reportId: string }[] = [];
  for (const m of html.matchAll(rowRegex)) {
    rows.push({ rowIndex: parseInt(m[1]), date: m[2].trim(), reportId: m[3] });
  }
  if (!rows.length) return null;

  // Return most recent (last in list or highest date)
  return rows[rows.length - 1];
}

// Step 3: Trigger postback to get the PDF
async function downloadPdf(rowIndex: number, tokens: FormTokens): Promise<Uint8Array> {
  const body = new URLSearchParams({
    "__VIEWSTATE":          tokens.viewState,
    "__VIEWSTATEGENERATOR": tokens.viewStateGen,
    "__EVENTVALIDATION":    tokens.eventValidation,
    "__EVENTTARGET":        "ctl00$ContentPlaceHolder1$grdCandidate",
    "__EVENTARGUMENT":      `Select$${rowIndex}`,
  });

  const res = await fetch(COH_RESULTS, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie":        tokens.cookies,
    },
    body: body.toString(),
    cache: "no-store",
  });

  if (!res.ok || !res.headers.get("content-type")?.includes("pdf")) {
    throw new Error(`PDF fetch failed: ${res.status} ${res.headers.get("content-type")}`);
  }
  return new Uint8Array(await res.arrayBuffer());
}

// Step 4: Extract page 2 and parse financial fields from plain text
async function extractFinancials(pdfBytes: Uint8Array): Promise<{
  cash: number; raised: number; spent: number; loans: number; asOf: string;
}> {
  // pdf-lib for page extraction — but we need text, so use a different approach:
  // Grab only page 2 (index 1) bytes via pdf-lib, then parse text inline
  const srcDoc  = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const outDoc  = await PDFDocument.create();
  const [page2] = await outDoc.copyPages(srcDoc, [1]);
  outDoc.addPage(page2);
  const page2Bytes = await outDoc.save();

  // Extract text from page 2 using a pure-JS PDF text extractor
  // pdf-lib doesn't extract text — use the raw content stream approach
  // Instead, parse the original full PDF for page 2 text via content streams
  const textMap = extractTextFromPage(pdfBytes, 1);

  const parseDollar = (s: string) => {
    const m = s.match(/\$[\d,]+\.?\d*/);
    return m ? parseFloat(m[0].replace(/[$,]/g, "")) : 0;
  };

  const lines = textMap.split("\n");
  let cash = 0, raised = 0, spent = 0, loans = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Field 2: TOTAL POLITICAL CONTRIBUTIONS
    if (line.includes("TOTAL POLITICAL CONTRIBUTIONS") && !line.includes("MAINTAINED") && !line.includes("PLEDGES")) {
      const next = lines.slice(i + 1, i + 4).join(" ");
      raised = parseDollar(line + " " + next);
    }
    // Field 4: TOTAL POLITICAL EXPENDITURES
    if (line.includes("TOTAL POLITICAL EXPENDITURES")) {
      const next = lines.slice(i + 1, i + 3).join(" ");
      spent = parseDollar(line + " " + next);
    }
    // Field 5: cash on hand
    if (line.includes("TOTAL POLITICAL CONTRIBUTIONS MAINTAINED") || line.includes("CONTRIBUTION BALANCE") || line.includes("LAST DAY")) {
      const next = lines.slice(i + 1, i + 5).join(" ");
      const val = parseDollar(next);
      if (val > 0) cash = val;
    }
    // Field 6: loans
    if (line.includes("TOTAL PRINCIPAL AMOUNT") || line.includes("OUTSTANDING LOANS")) {
      const next = lines.slice(i + 1, i + 4).join(" ");
      const val = parseDollar(next);
      loans = val;
    }
  }

  // Determine period end from page text
  const periodMatch = textMap.match(/(\d{1,2}\/\d{1,2}\/\d{4})/g);
  const lastDate = periodMatch?.[periodMatch.length - 1] ?? "";
  let asOf = "Unknown";
  if (lastDate) {
    const [m, , y] = lastDate.split("/");
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    asOf = `${months[parseInt(m) - 1]} ${y}`;
  }

  void page2Bytes; // suppress unused warning
  return { cash, raised, spent, loans, asOf };
}

// Minimal raw PDF text extraction for a single page
function extractTextFromPage(pdfBytes: Uint8Array, pageIndex: number): string {
  // Find page content stream by looking for text operators in the raw bytes
  const raw = Buffer.from(pdfBytes).toString("latin1");

  // Find BT...ET blocks (Begin Text / End Text in PDF)
  const btEtRegex = /BT([\s\S]*?)ET/g;
  const textParts: string[] = [];

  // Find page objects to identify which content belongs to our page
  // Simplified: extract all text from the whole document, filter by page marker
  // For a cover-sheet style PDF, page 2 content appears after "2 of" marker
  for (const m of raw.matchAll(btEtRegex)) {
    const block = m[1];
    // Extract strings from Tj and TJ operators
    const strRegex = /\(([^)]*)\)\s*Tj|\[([^\]]*)\]\s*TJ/g;
    for (const sm of block.matchAll(strRegex)) {
      const str = sm[1] ?? sm[2] ?? "";
      // Clean PDF string encoding
      const cleaned = str
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, " ")
        .replace(/\\t/g, " ")
        .replace(/\\\\/g, "\\")
        .replace(/\\([0-7]{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)));
      if (cleaned.trim()) textParts.push(cleaned.trim());
    }
  }

  return textParts.join("\n");
}

export async function GET() {
  const fetchedAt = new Date().toISOString();
  const results: COHCandidate[] = [];
  const seen = new Set<string>();

  // Each candidate needs its own fresh session — run in parallel, 4 at a time
  const unique = COH_CANDIDATES.filter((c) => {
    if (seen.has(c.name)) return false;
    seen.add(c.name);
    return true;
  });

  async function fetchOne(cand: typeof COH_CANDIDATES[0]): Promise<COHCandidate> {
    const tokens = await getFormTokens(COH_SEARCH);
    const row = await searchAndGetRows(cand.last, cand.first, tokens);
    if (!row) throw new Error("No filings found");
    const pdfBytes = await downloadPdf(row.rowIndex, tokens);
    const fin = await extractFinancials(pdfBytes);
    return {
      name: cand.name, office: cand.office, level: "houston", party: cand.party,
      cash: fin.cash, raised: fin.raised, spent: fin.spent, loans: fin.loans,
      asOf: fin.asOf, filingDate: row.date, incumbent: cand.incumbent,
      filingUrl: COH_RESULTS, dataSource: "live", fetchedAt,
    };
  }

  // Concurrency-limited parallel fetch: 4 at a time
  const BATCH = 4;
  for (let i = 0; i < unique.length; i += BATCH) {
    const batch = unique.slice(i, i + BATCH);
    const settled = await Promise.allSettled(batch.map(fetchOne));
    for (let j = 0; j < batch.length; j++) {
      const cand = batch[j];
      const res = settled[j];
      if (res.status === "fulfilled") {
        results.push(res.value);
      } else {
        results.push({
          name: cand.name, office: cand.office, level: "houston", party: cand.party,
          cash: 0, raised: 0, spent: 0, loans: 0,
          asOf: "N/A", filingDate: "N/A", incumbent: cand.incumbent,
          filingUrl: COH_SEARCH, dataSource: "error", fetchedAt,
        });
        console.error(`COH scrape failed for ${cand.name}:`, res.reason);
      }
    }
  }

  results.sort((a, b) => b.cash - a.cash);

  return NextResponse.json({ results, fetchedAt }, {
    headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
  });
}
