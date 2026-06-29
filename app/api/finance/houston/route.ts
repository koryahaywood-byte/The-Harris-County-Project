import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import Anthropic from "@anthropic-ai/sdk";

// Allow up to 5 minutes. Vercel cron uses this route, which needs time for 17 sequential scrapes
export const maxDuration = 300;

const COH_SEARCH  = "https://cohweb.houstontx.gov/CampaignFinanceWeb/CFRwebsiteSimpleSearch.aspx";
const COH_RESULTS = "https://cohweb.houstontx.gov/CampaignFinanceWeb/CFRwebsiteSimpleSearchResult.aspx";

const COH_CANDIDATES = [
  { last: "Whitmire",      first: "John",      name: "John Whitmire",        office: "Mayor",                     party: "D" as const, incumbent: true  },
  { last: "Pollard",       first: "Edward",    name: "Ed Pollard",           office: "City Council District J",   party: "D" as const, incumbent: true  },
  { last: "Hollins",       first: "Chris",     name: "Chris Hollins",        office: "City Controller",           party: "D" as const, incumbent: true  },
  { last: "Castex-Tatum",  first: "Martha",    name: "Martha Castex-Tatum",  office: "City Council District K",   party: "D" as const, incumbent: true  },
  { last: "Thomas",        first: "Tiffany",   name: "Tiffany Thomas",       office: "City Council District F",   party: "D" as const, incumbent: true  },
  { last: "Castillo",      first: "Mario",     name: "Mario Castillo",       office: "City Council District H",   party: "D" as const, incumbent: true  },
  { last: "Ramirez",       first: "Julian",    name: "Julian Ramirez",       office: "City Council At-Large 1",   party: "R" as const, incumbent: true  },
  { last: "Davis",         first: "Willie",    name: "Willie Davis",         office: "City Council At-Large 2",   party: "R" as const, incumbent: true  },
  { last: "Carter",        first: "Twila",     name: "Twila Carter",         office: "City Council At-Large 3",   party: "R" as const, incumbent: true  },
  { last: "Salinas",       first: "Alejandra", name: "Alejandra Salinas",    office: "City Council At-Large 4",   party: "D" as const, incumbent: true  },
  { last: "Alcorn",        first: "Sallie",    name: "Sallie Alcorn",        office: "City Council At-Large 5",   party: "D" as const, incumbent: true  },
  { last: "Jackson",       first: "Tarsha",    name: "Tarsha Jackson",       office: "City Council District B",   party: "D" as const, incumbent: true  },
  { last: "Evans-Shabazz", first: "Carolyn",   name: "Carolyn Evans-Shabazz",office: "City Council District D",   party: "D" as const, incumbent: true  },
  { last: "Flickinger",    first: "Fred",      name: "Fred Flickinger",      office: "City Council District E",   party: "R" as const, incumbent: true  },
  { last: "Panzarella",    first: "Joe",       name: "Joe Panzarella",       office: "City Council District C",   party: "D" as const, incumbent: true  },
  { last: "Huffman",       first: "Mary Nan",  name: "Mary Nan Huffman",     office: "City Council District G",   party: "R" as const, incumbent: true  },
  { last: "Martinez",      first: "Joaquin",   name: "Joaquin Martinez",     office: "City Council District I",   party: "D" as const, incumbent: true  },
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

  // Collect ALL cookies the site sets. Session + anonymous token both required
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

  // Find all rows. Match Select$N then grab nearest date (MM/DD/YYYY) and report ID number
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

// Step 4a: Extract summary pages (first 4) to keep token cost low
async function extractSummaryPages(pdfBytes: Uint8Array): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const total  = srcDoc.getPageCount();
  const indices = Array.from({ length: Math.min(total, 4) }, (_, i) => i);
  const outDoc = await PDFDocument.create();
  const copied = await outDoc.copyPages(srcDoc, indices);
  copied.forEach(p => outDoc.addPage(p));
  return outDoc.save();
}

// Step 4b: Send pages to Claude and extract financial fields
async function extractFinancials(pdfBytes: Uint8Array, candidateName: string): Promise<{
  cash: number; raised: number; spent: number; loans: number; asOf: string;
}> {
  const summaryBytes = await extractSummaryPages(pdfBytes);
  const base64 = Buffer.from(summaryBytes).toString("base64");

  const client = new Anthropic();
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [{
      role: "user",
      content: [
        {
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: base64 },
        } as never,
        {
          type: "text",
          text: `This is a Houston City campaign finance report (Texas C/OH form) for ${candidateName}. Find the COVER SHEET SUPPORT & TOTALS page. Extract these exact dollar amounts and return ONLY valid JSON with no markdown:
{
  "cash_on_hand_end": <number>,
  "total_receipts": <number>,
  "total_expenditures": <number>,
  "loans_outstanding": <number>,
  "period_end_date": "<MM/DD/YYYY string>"
}
Look for: field 2 = TOTAL POLITICAL CONTRIBUTIONS (total_receipts), field 4 = TOTAL POLITICAL EXPENDITURES, field 5 = TOTAL POLITICAL CONTRIBUTIONS MAINTAINED AS OF THE LAST DAY OF REPORTING PERIOD (cash_on_hand_end), field 6 = TOTAL PRINCIPAL AMOUNT OF ALL OUTSTANDING LOANS.
Use 0 for any field not found. Do not include $ or commas in numbers.`,
        },
      ],
    }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "{}";
  const clean = text.replace(/```[a-z]*\n?/g, "").trim();
  const parsed = JSON.parse(clean);

  const toNum = (v: unknown) => typeof v === "number" ? v : parseFloat(String(v ?? "0").replace(/[,$]/g, "")) || 0;

  const dateStr: string = parsed.period_end_date ?? "";
  let asOf = "Unknown";
  if (dateStr) {
    const [m, , y] = dateStr.split("/");
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    asOf = `${months[parseInt(m) - 1]} ${y}`;
  }

  return {
    cash:   toNum(parsed.cash_on_hand_end),
    raised: toNum(parsed.total_receipts),
    spent:  toNum(parsed.total_expenditures),
    loans:  toNum(parsed.loans_outstanding),
    asOf,
  };
}

export async function GET() {
  const fetchedAt = new Date().toISOString();
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not set", results: [], fetchedAt }, { status: 500 });
  }
  const results: COHCandidate[] = [];
  const seen = new Set<string>();

  // Each candidate needs its own fresh session. Run in parallel, 4 at a time
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
    const fin = await extractFinancials(pdfBytes, cand.name);
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
