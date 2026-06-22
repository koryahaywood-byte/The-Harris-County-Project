import { NextResponse } from "next/server";

const TEC_BASE = "https://ethics.state.tx.us/search/cf";

// TEC filer names exactly as they appear in the report (Last, First)
// Maps to our display name + metadata
const TEC_CANDIDATES = [
  { tecName: "Friends of Brandon Creighton", name: "Brandon Creighton", office: "State Senator SD-4",     level: "state" as const, party: "R" as const, incumbent: true },
  { tecName: "Alvarado, Carol",       name: "Carol Alvarado",     office: "State Senator SD-6",          level: "state" as const, party: "D" as const, incumbent: true },
  { tecName: "Miles, Borris Lee",     name: "Borris Miles",       office: "State Senator SD-13",         level: "state" as const, party: "D" as const, incumbent: true },
  { tecName: "Texans for Joan Huffman",name: "Joan Huffman",      office: "State Senator SD-17",         level: "state" as const, party: "R" as const, incumbent: true },
  { tecName: "Kolkhorst, Lois W.",    name: "Lois Kolkhorst",     office: "State Senator SD-18",         level: "state" as const, party: "R" as const, incumbent: true },
  { tecName: "Cook, Molly C.",        name: "Molly Cook",          office: "State Senator SD-15",         level: "state" as const, party: "D" as const, incumbent: true },
  { tecName: "Friends of Paul Bettencourt", name: "Paul Bettencourt", office: "State Senator SD-7",      level: "state" as const, party: "R" as const, incumbent: true },
  { tecName: "Thompson, Senfronia",   name: "Senfronia Thompson",  office: "State Rep HD-141",            level: "state" as const, party: "D" as const, incumbent: true },
  { tecName: "Dutton, Harold V.",     name: "Harold Dutton Jr.",   office: "State Rep HD-142",            level: "state" as const, party: "D" as const, incumbent: true },
  { tecName: "Wu, Eugene Y.",         name: "Gene Wu",             office: "State Rep HD-137",            level: "state" as const, party: "D" as const, incumbent: true },
  { tecName: "Jones, Jolanda",        name: "Jolanda Jones",       office: "State Rep HD-147",            level: "state" as const, party: "D" as const, incumbent: true },
  { tecName: "Simmons, Lauren Ashley",name: "Lauren Ashley Simmons",office: "State Rep HD-146",           level: "state" as const, party: "D" as const, incumbent: true },
  { tecName: "Morales, Christina",    name: "Christina Morales",   office: "State Rep HD-145",            level: "state" as const, party: "D" as const, incumbent: true },
  { tecName: "Ward Johnson, Charlene",name: "Charlene Ward Johnson",office: "State Rep HD-139",           level: "state" as const, party: "D" as const, incumbent: true },
  { tecName: "Rosenthal, Jon E.",     name: "Jon Rosenthal",       office: "State Rep HD-135",            level: "state" as const, party: "D" as const, incumbent: true },
  { tecName: "Hull, Lacey M.",        name: "Lacey Hull",          office: "State Rep HD-138",            level: "state" as const, party: "R" as const, incumbent: true },
  { tecName: "Friends of Tom Oliverson", name: "Tom Oliverson",   office: "State Rep HD-130",            level: "state" as const, party: "R" as const, incumbent: true },
  { tecName: "Paul, Dennis R.",       name: "Dennis Paul",         office: "State Rep HD-129",            level: "state" as const, party: "R" as const, incumbent: true },
  { tecName: "Friends of Dr. Greg Bonnen", name: "Greg Bonnen",   office: "State Rep HD-24",             level: "state" as const, party: "R" as const, incumbent: true },
  { tecName: "Schofield, Michael",    name: "Mike Schofield",      office: "State Rep HD-132",            level: "state" as const, party: "R" as const, incumbent: true },
  { tecName: "Shaw, Penny",           name: "Penny Morales Shaw",  office: "State Rep HD-148",            level: "state" as const, party: "D" as const, incumbent: true },
  { tecName: "Johnson, Ann",          name: "Ann Johnson",         office: "State Rep HD-134",            level: "state" as const, party: "D" as const, incumbent: true },
  { tecName: "Hernandez, Ana E.",     name: "Ana Hernandez",       office: "State Rep HD-143",            level: "state" as const, party: "D" as const, incumbent: true },
  { tecName: "Walle, Armando L.",     name: "Armando Walle",       office: "State Rep HD-140",            level: "state" as const, party: "D" as const, incumbent: true },
  { tecName: "Perez, Mary Ann G.",    name: "Mary Ann Perez",      office: "State Rep HD-144",            level: "state" as const, party: "D" as const, incumbent: true },
  { tecName: "Talarico, James",       name: "James Talarico",      office: "U.S. Senate (D nominee)",     level: "state" as const, party: "D" as const, incumbent: false },
  { tecName: "Hinojosa, Gina",        name: "Gina Hinojosa",       office: "Governor (D nominee)",        level: "state" as const, party: "D" as const, incumbent: false },
  { tecName: "Texans for Dan Patrick", name: "Dan Patrick",         office: "Lt. Governor",                level: "state" as const, party: "R" as const, incumbent: true },
  { tecName: "Hegar, Glenn A.",       name: "Glenn Hegar",         office: "Comptroller",                 level: "state" as const, party: "R" as const, incumbent: true },
  { tecName: "Cunningham, Charles",   name: "Charles Cunningham",  office: "State Rep HD-127",             level: "state" as const, party: "R" as const, incumbent: true },
  { tecName: "Cain, Briscoe R.",      name: "Briscoe Cain",        office: "State Rep HD-128",             level: "state" as const, party: "R" as const, incumbent: true },
  { tecName: "DeAyala, Emilio F.",    name: "Mano DeAyala",        office: "State Rep HD-133",             level: "state" as const, party: "R" as const, incumbent: true },
  { tecName: "Dorazio, Mark E.",      name: "Mark Dorazio",        office: "State Rep HD-150",             level: "state" as const, party: "R" as const, incumbent: true },
  { tecName: "Kellum, A'Yonna L.",    name: "A'Yonna Kellum",      office: "State Rep HD-150 (D nominee)", level: "state" as const, party: "D" as const, incumbent: false },
  { tecName: "Breaux, Darlene E.",    name: "Darlene Breaux",      office: "State Rep HD-149 (D nominee)", level: "state" as const, party: "D" as const, incumbent: false },
  { tecName: "Kamin, Abbie",          name: "Abbie Kamin",         office: "County Attorney (D nominee)",  level: "state" as const, party: "D" as const, incumbent: false },
  { tecName: "Dicely, Shannon A.",     name: "Shannon Dicely",      office: "State Senator SD-11 (D nominee)", level: "state" as const, party: "D" as const, incumbent: false },
  { tecName: "Bord, Stefanie",        name: "Stefanie Bord",       office: "State Rep HD-126 (D nominee)", level: "state" as const, party: "D" as const, incumbent: false },
  { tecName: "Stanart, Stan",         name: "Stan Stanart",        office: "State Rep HD-126 (R nominee)", level: "state" as const, party: "R" as const, incumbent: false },
  { tecName: "Childs, Staci D.",       name: "Staci Childs",        office: "State Rep HD-131 (D nominee)", level: "state" as const, party: "D" as const, incumbent: false },
  // Incumbents not seeking reelection — still have active committees
  { tecName: "Allen, Alma A.",        name: "Alma Allen",           office: "State Rep HD-131 (not seeking reelection)", level: "state" as const, party: "D" as const, incumbent: true },
  { tecName: "Vo, Hubert",            name: "Hubert Vo",            office: "State Rep HD-149 (lost D runoff)", level: "state" as const, party: "D" as const, incumbent: true },
  // R nominees found in TEC Jan 2026 report
  { tecName: "Butler , Alexandria Nicole",  name: "Alexandria Butler", office: "State Rep HD-146 (R nominee)", level: "state" as const, party: "R" as const, incumbent: false },
  { tecName: "Haynes , William Brent", name: "Brent Haynes",        office: "182nd District Court (R nominee)", level: "state" as const, party: "R" as const, incumbent: false },
  { tecName: "Bennett, David L.",     name: "Dave Bennett",         office: "State Rep HD-149 (R nominee)", level: "state" as const, party: "R" as const, incumbent: false },
  { tecName: "Garcia De Leon, Laura", name: "Laura Garcia DeLeon",  office: "State Rep HD-140 (R nominee)", level: "state" as const, party: "R" as const, incumbent: false },
  // District court judges — confirmed in TEC report
  { tecName: "Jones, DaSean A.",      name: "DaSean Jones",         office: "180th District Court (not seeking reelection)", level: "state" as const, party: "D" as const, incumbent: true },
  // NOTE: Harris County elected officials (commissioners, DA, county clerk, etc.)
  // file with harrisvotes.com (the county filing authority), NOT TEC. They are
  // not in TEC's Cash On Hand report and have been removed from this list.
];

export interface TECCandidate {
  name: string;
  office: string;
  level: "state";
  party: "D" | "R";
  cash: number;
  asOf: string;
  incumbent: boolean;
  filingUrl: string;
  dataSource: "live" | "error";
  fetchedAt: string;
}

function buildCashOnHandUrl(year: number, period: "Jan" | "Jul"): string {
  const yy = String(year).slice(2);
  return `${TEC_BASE}/${year}/CashOnHand_${period}SA${yy}.html`;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "|");
}

function parseSegments(html: string): string[] {
  return stripHtml(html)
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseCash(raw: string): number {
  const cleaned = raw.replace(/[$,\s]/g, "");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function formatDate(raw: string): string {
  // raw is M/D/YYYY
  if (!raw) return "Unknown";
  const [m, d, y] = raw.split("/");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(m) - 1]} ${y}`;
}

async function fetchAndParse(url: string): Promise<Map<string, { cash: number; date: string }>> {
  const res = await fetch(url, { next: { revalidate: 3600 * 12 } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const segs = parseSegments(html);

  const results = new Map<string, { cash: number; date: string }>();

  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i];
    // Each filer row: [filer_id] | [Name, Last First] | [$amount] | [date] | ...
    // Cash amount pattern: starts with $
    if (seg.startsWith("$") && i >= 2) {
      const nameSeg = segs[i - 1];
      const dateSeg = segs[i + 1] ?? "";
      results.set(nameSeg, { cash: parseCash(seg), date: dateSeg });
    }
  }
  return results;
}

async function getMostRecentReport(): Promise<Map<string, { cash: number; date: string }>> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-based

  // Try July first (available after Jul 15), then January, then prior year July
  const candidates = [
    month >= 8  ? buildCashOnHandUrl(year, "Jul")  : null,
    month >= 2  ? buildCashOnHandUrl(year, "Jan")  : null,
    buildCashOnHandUrl(year - 1, "Jul"),
    buildCashOnHandUrl(year - 1, "Jan"),
  ].filter(Boolean) as string[];

  for (const url of candidates) {
    try {
      const data = await fetchAndParse(url);
      if (data.size > 0) return data;
    } catch {
      // try next
    }
  }
  throw new Error("No TEC report found");
}

export async function GET() {
  const fetchedAt = new Date().toISOString();

  try {
    const parsed = await getMostRecentReport();
    const results: TECCandidate[] = [];

    for (const cand of TEC_CANDIDATES) {
      const row = parsed.get(cand.tecName);
      results.push({
        name: cand.name,
        office: cand.office,
        level: cand.level,
        party: cand.party,
        cash: row?.cash ?? 0,
        asOf: row ? formatDate(row.date) : "N/A",
        incumbent: cand.incumbent,
        filingUrl: `https://ethics.state.tx.us/search/cf/SimpleSearch.php?q=${encodeURIComponent(cand.tecName)}`,
        dataSource: row ? "live" : "error",
        fetchedAt,
      });
    }

    results.sort((a, b) => b.cash - a.cash);

    return NextResponse.json({ results, fetchedAt }, {
      headers: { "Cache-Control": "public, s-maxage=43200, stale-while-revalidate=86400" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: String(err), results: [], fetchedAt },
      { status: 500 }
    );
  }
}
