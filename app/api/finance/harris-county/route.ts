import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import Anthropic from "@anthropic-ai/sdk";

const HC_BASE = "https://ethics.harrisvotes.com";
const SEARCH_URL = `${HC_BASE}/CampaignFinanceReports/COR.aspx`;

// Harris County local filers — search name must be "Last, First"
// All county elected officials file at ethics.harrisvotes.com
const HC_CANDIDATES = [
  // 2026 County Judge nominees (open seat)
  { searchName: "Plummer, Letitia",    name: "Letitia Plummer",       office: "County Judge (D nominee)",    party: "D" as const, incumbent: false },
  { searchName: "Sanchez, Orlando",    name: "Orlando Sanchez",       office: "County Judge (R nominee)",    party: "R" as const, incumbent: false },
  // Commissioners Court
  { searchName: "Ellis, Rodney",       name: "Rodney Ellis",          office: "Commissioner PCT 1",          party: "D" as const, incumbent: true },
  { searchName: "Hidalgo, Lina",       name: "Lina Hidalgo",          office: "County Judge (lame duck)",    party: "D" as const, incumbent: true },
  { searchName: "Garcia, Adrian",      name: "Adrian Garcia",         office: "Commissioner PCT 2",          party: "D" as const, incumbent: true },
  { searchName: "Ramsey, Tom",         name: "Tom Ramsey",            office: "Commissioner PCT 3",          party: "R" as const, incumbent: true },
  { searchName: "Briones, Lesley",     name: "Lesley Briones",        office: "Commissioner PCT 4",          party: "D" as const, incumbent: true },
  // Justice of the Peace — sourced from jp.hctx.net
  { searchName: "Carter, Eric",        name: "Eric William Carter",   office: "Justice of the Peace PCT 1 PL 1", party: "D" as const, incumbent: true },
  { searchName: "Duble, Steve",        name: "Steve Duble",           office: "Justice of the Peace PCT 1 PL 2", party: "D" as const, incumbent: true },
  { searchName: "Delgado, Jo Ann",     name: "Jo Ann Delgado",        office: "Justice of the Peace PCT 2 PL 1", party: "D" as const, incumbent: true },
  { searchName: "Lozano, Dolores",     name: "Dolores Lozano",        office: "Justice of the Peace PCT 2 PL 2", party: "D" as const, incumbent: true },
  { searchName: "Stephens, Joe",       name: "Joe Stephens",          office: "Justice of the Peace PCT 3 PL 1", party: "D" as const, incumbent: true },
  { searchName: "Bates, Lucia",        name: "Lucia Bates",           office: "Justice of the Peace PCT 3 PL 2", party: "D" as const, incumbent: true },
  { searchName: "Goodwin, Lincoln",    name: "Lincoln Goodwin",       office: "Justice of the Peace PCT 4 PL 1", party: "D" as const, incumbent: true },
  { searchName: "Korduba, Laryssa",    name: "Laryssa Korduba",       office: "Justice of the Peace PCT 4 PL 2", party: "D" as const, incumbent: true },
  { searchName: "Lombardino, James",   name: "James Lombardino",      office: "Justice of the Peace PCT 5 PL 1", party: "R" as const, incumbent: true },
  // Bob Wolfe lost May 2026 R primary to Mark Fury — keep for historical data, add nominees
  { searchName: "Wolfe, Bob",          name: "Bob Wolfe",             office: "Justice of the Peace PCT 5 PL 2 (lost R primary)", party: "R" as const, incumbent: false },
  { searchName: "Fury, Mark",          name: "Mark Fury",             office: "Justice of the Peace PCT 5 PL 2 (R nominee)", party: "R" as const, incumbent: false },
  { searchName: "Jefferson, Lisa",     name: "Lisa Jefferson",        office: "Justice of the Peace PCT 5 PL 2 (D nominee)", party: "D" as const, incumbent: false },
  { searchName: "Trevino, Victor",     name: "Victor Treviño III",    office: "Justice of the Peace PCT 6 PL 1", party: "D" as const, incumbent: true },
  { searchName: "Rodriguez, Angela",   name: "Angela D. Rodriguez",   office: "Justice of the Peace PCT 6 PL 2", party: "D" as const, incumbent: true },
  { searchName: "Adams, Wanda",        name: "Wanda E. Adams",        office: "Justice of the Peace PCT 7 PL 1", party: "D" as const, incumbent: true },
  // Sharon Burney lost May 2026 D runoff to Melanie Miles
  { searchName: "Burney, Sharon",      name: "Sharon M. Burney",      office: "Justice of the Peace PCT 7 PL 2 (lost D runoff)", party: "D" as const, incumbent: false },
  { searchName: "Miles, Melanie",      name: "Melanie Miles",         office: "Justice of the Peace PCT 7 PL 2 (D nominee)", party: "D" as const, incumbent: false },
  { searchName: "Williamson, Holly",   name: "Holly Williamson",      office: "Justice of the Peace PCT 8 PL 1", party: "R" as const, incumbent: true },
  { searchName: "Ditta, Louie",        name: "Louie Ditta",           office: "Justice of the Peace PCT 8 PL 2", party: "R" as const, incumbent: true },
  // Constables — also file at ethics.harrisvotes.com
  { searchName: "Rosen, Alan",         name: "Alan Rosen",            office: "Constable PCT 1",                 party: "D" as const, incumbent: true },
  { searchName: "Garcia, Jerry",       name: "Jerry Garcia",          office: "Constable PCT 2",                 party: "D" as const, incumbent: true },
  { searchName: "Eagleton, Sherman",   name: "Sherman Eagleton",      office: "Constable PCT 3",                 party: "D" as const, incumbent: true },
  { searchName: "Herman, Mark",        name: "Mark Herman",           office: "Constable PCT 4",                 party: "R" as const, incumbent: true },
  { searchName: "Allbritton, Terry",   name: "Terry Allbritton",      office: "Constable PCT 5",                 party: "R" as const, incumbent: true },
  { searchName: "Trevino, Silvia",     name: "Silvia Trevino",        office: "Constable PCT 6",                 party: "D" as const, incumbent: true },
  { searchName: "Phillips, James",     name: "James Phillips",        office: "Constable PCT 7",                 party: "D" as const, incumbent: true },
  { searchName: "Sandlin, Phil",       name: "Phil Sandlin",          office: "Constable PCT 8",                 party: "R" as const, incumbent: true },
];

export interface HCCandidate {
  name: string;
  office: string;
  level: "county";
  party: "D" | "R";
  cash: number;
  raised: number;
  spent: number;
  investments: number;
  loans: number;
  asOf: string;
  filingDate: string;
  incumbent: boolean;
  filingUrl: string;
  dataSource: "live" | "error";
  fetchedAt: string;
}

// Step 1: GET the search page to grab ASP.NET hidden fields
async function getFormTokens(): Promise<{
  viewState: string;
  viewStateGen: string;
  eventValidation: string;
  cookies: string;
}> {
  const res = await fetch(SEARCH_URL, { cache: "no-store" });
  const html = await res.text();
  const cookies = res.headers.get("set-cookie") ?? "";

  const get = (name: string) => {
    const m = html.match(new RegExp(`name="${name}"[^>]*value="([^"]*)"`, "s"));
    return m ? m[1] : "";
  };

  return {
    viewState:      get("__VIEWSTATE"),
    viewStateGen:   get("__VIEWSTATEGENERATOR"),
    eventValidation: get("__EVENTVALIDATION"),
    cookies,
  };
}

// Step 2: POST search and extract the first CFR filing URL + date
async function getLatestFilingUrl(
  searchName: string,
  tokens: { viewState: string; viewStateGen: string; eventValidation: string; cookies: string }
): Promise<{ url: string; date: string } | null> {
  const body = new URLSearchParams({
    "__VIEWSTATE":         tokens.viewState,
    "__VIEWSTATEGENERATOR": tokens.viewStateGen,
    "__VIEWSTATEENCRYPTED": "",
    "__EVENTVALIDATION":   tokens.eventValidation,
    "ctl00$ContentPlaceHolder1$txtName": searchName,
    "ctl00$ContentPlaceHolder1$btnSearch": "Search",
  });

  const res = await fetch(SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": tokens.cookies,
    },
    body: body.toString(),
    cache: "no-store",
  });

  const html = await res.text();

  // Find all CFR rows: Document.aspx?ID=... with date + category
  // Rows contain: lblFileDate and a link to Document.aspx
  const rowRegex = /lblFileDate[^>]*>([^<]+)<\/span>[\s\S]*?lblCategory[^>]*>(Campaign Finance Report[^<]*)<\/span>[\s\S]*?href="(\.\.\/Document\.aspx\?ID=[^"]+)"/g;
  const matches = [...html.matchAll(rowRegex)];

  if (!matches.length) return null;

  // First result is most recent (sorted by date desc)
  const [, date, , relUrl] = matches[0];
  const fullUrl = `${HC_BASE}/${relUrl.replace(/^\.\.\//, "")}`;
  return { url: fullUrl, date: date.trim() };
}

// Step 3: Download full PDF, extract the cover-sheet summary pages.
// Harris County C/OH form: summary totals are on page 4 for multi-page filings,
// but JP and smaller filers often submit 2–3 page forms where the totals are on
// the last page. We extract up to the first 4 pages (or all pages if fewer).
async function extractSummaryPages(pdfUrl: string): Promise<Uint8Array> {
  const res = await fetch(pdfUrl);
  if (!res.ok) throw new Error(`PDF fetch failed: ${res.status}`);
  const fullBytes = new Uint8Array(await res.arrayBuffer());

  const srcDoc = await PDFDocument.load(fullBytes, { ignoreEncryption: true });
  const total  = srcDoc.getPageCount();
  // Take pages 1–4 (indices 0–3), or all pages if fewer than 4
  const indices = Array.from({ length: Math.min(total, 4) }, (_, i) => i);
  const outDoc  = await PDFDocument.create();
  const copied  = await outDoc.copyPages(srcDoc, indices);
  copied.forEach(p => outDoc.addPage(p));
  return outDoc.save();
}

// Step 4: Send page 4 to Claude and extract all financial fields
async function extractFinancialsFromPage(
  pdfBytes: Uint8Array,
  candidateName: string
): Promise<{
  cash: number;
  raised: number;
  spent: number;
  investments: number;
  loans: number;
  asOf: string;
}> {
  const client = new Anthropic();
  const base64 = Buffer.from(pdfBytes).toString("base64");

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [{
      role: "user",
      content: [
        {
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: base64 },
        },
        {
          type: "text",
          text: `This is a Texas C/OH campaign finance report for ${candidateName}. Find the COVER SHEET SUPPORT & TOTALS page (labeled "FORM C/OH SUPPORT & TOTALS COVER SHEET PG 2" or similar). For Justice of the Peace filers this is typically page 3; for city/county officials it may be page 2 or 4. Extract these exact dollar amounts and return ONLY valid JSON with no markdown:
{
  "cash_on_hand_end": <number>,
  "total_receipts": <number>,
  "total_expenditures": <number>,
  "investments": <number>,
  "loans_outstanding": <number>,
  "period_end_date": "<MM/DD/YYYY string>"
}
Look for: field 2 = TOTAL POLITICAL CONTRIBUTIONS, field 4 = TOTAL POLITICAL EXPENDITURES, field 5 = TOTAL POLITICAL CONTRIBUTIONS MAINTAINED AS OF THE LAST DAY OF REPORTING PERIOD (this is cash on hand), field 6 = TOTAL PRINCIPAL AMOUNT OF ALL OUTSTANDING LOANS.
Use 0 for any field not found. Do not include $ or commas in numbers.`,
        },
      ],
    }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "{}";
  // Strip any markdown code fences if present
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
    cash:        toNum(parsed.cash_on_hand_end),
    raised:      toNum(parsed.total_receipts),
    spent:       toNum(parsed.total_expenditures),
    investments: toNum(parsed.investments),
    loans:       toNum(parsed.loans_outstanding),
    asOf,
  };
}

export async function GET() {
  const fetchedAt = new Date().toISOString();
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not set", results: [], fetchedAt }, { status: 500 });
  }

  const results: HCCandidate[] = [];

  // Get form tokens once for all searches
  let tokens: Awaited<ReturnType<typeof getFormTokens>>;
  try {
    tokens = await getFormTokens();
  } catch {
    return NextResponse.json({ error: "Failed to load Harris County search page", results: [], fetchedAt }, { status: 500 });
  }

  // Process candidates sequentially (ASP.NET state, avoid race conditions)
  for (const cand of HC_CANDIDATES) {
    try {
      const filing = await getLatestFilingUrl(cand.searchName, tokens);
      if (!filing) throw new Error("No filing found");

      const page4 = await extractSummaryPages(filing.url);
      const fin = await extractFinancialsFromPage(page4, cand.name);

      results.push({
        name: cand.name,
        office: cand.office,
        level: "county",
        party: cand.party,
        cash:        fin.cash,
        raised:      fin.raised,
        spent:       fin.spent,
        investments: fin.investments,
        loans:       fin.loans,
        asOf:        fin.asOf,
        filingDate:  filing.date,
        incumbent:   cand.incumbent,
        filingUrl:   filing.url,
        dataSource:  "live",
        fetchedAt,
      });
    } catch (err) {
      results.push({
        name: cand.name, office: cand.office, level: "county", party: cand.party,
        cash: 0, raised: 0, spent: 0, investments: 0, loans: 0,
        asOf: "N/A", filingDate: "N/A", incumbent: cand.incumbent,
        filingUrl: `${HC_BASE}/CampaignFinanceReports/COR.aspx`,
        dataSource: "error",
        fetchedAt,
      });
      console.error(`Harris County scrape failed for ${cand.name}:`, err);
    }
  }

  results.sort((a, b) => b.cash - a.cash);

  return NextResponse.json({ results, fetchedAt }, {
    headers: {
      // Cache aggressively — data only changes after TEC filing deadlines
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
