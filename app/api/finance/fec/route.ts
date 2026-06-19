import { NextResponse } from "next/server";

// FEC candidate IDs for Harris County-area federal candidates
const FEDERAL_CANDIDATES = [
  { id: "S6TX00338", name: "Jasmine Crockett", office: "U.S. Senate (lost D runoff)",    party: "D" as const, incumbent: false },
  { id: "S4TX00462", name: "Ken Paxton",        office: "U.S. Senate (R nominee)",        party: "R" as const, incumbent: false },
  { id: "S6TX00462", name: "James Talarico",    office: "U.S. Senate (D nominee)",        party: "D" as const, incumbent: false },
  { id: "S0TX00999", name: "John Cornyn",       office: "U.S. Senate",                    party: "R" as const, incumbent: true  },
  { id: "H8TX07139", name: "Lizzie Fletcher",   office: "U.S. Rep CD-07",                 party: "D" as const, incumbent: true  },
  { id: "H4TX02177", name: "Shaun Finnie",      office: "U.S. Rep CD-02 (D nominee)",     party: "D" as const, incumbent: false },
  { id: "H4TX18126", name: "Christian Menefee", office: "U.S. Rep CD-18 (D nominee 2026)", party: "D" as const, incumbent: false },
  { id: "H8TX29049", name: "Sylvia Garcia",     office: "U.S. Rep CD-29",                 party: "D" as const, incumbent: true  },
];

const FEC_KEY = process.env.FEC_API_KEY ?? "DEMO_KEY";
const CYCLE = 2026;

export interface FECCandidate {
  name: string;
  office: string;
  level: "federal";
  party: "D" | "R";
  cash: number;
  raised: number;
  spent: number;
  asOf: string;
  incumbent: boolean;
  filingUrl: string;
  dataSource: "live" | "error";
  fetchedAt: string;
}

async function fetchCandidateTotals(id: string): Promise<{
  cash_on_hand_end_period: number;
  receipts: number;
  disbursements: number;
  coverage_end_date: string;
} | null> {
  const url = `https://api.fec.gov/v1/candidates/totals/?candidate_id=${id}&cycle=${CYCLE}&api_key=${FEC_KEY}`;
  const res = await fetch(url, { next: { revalidate: 3600 * 6 } }); // 6h CDN cache
  if (!res.ok) return null;
  const json = await res.json();
  const result = json.results?.[0];
  if (!result) return null;
  return {
    cash_on_hand_end_period: result.cash_on_hand_end_period ?? 0,
    receipts: result.receipts ?? 0,
    disbursements: result.disbursements ?? 0,
    coverage_end_date: result.coverage_end_date ?? "",
  };
}

function formatDate(iso: string): string {
  if (!iso) return "Unknown";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export async function GET() {
  const results: FECCandidate[] = [];
  const fetchedAt = new Date().toISOString();

  await Promise.all(
    FEDERAL_CANDIDATES.map(async (c) => {
      try {
        const totals = await fetchCandidateTotals(c.id);
        results.push({
          name: c.name,
          office: c.office,
          level: "federal",
          party: c.party,
          cash:   totals?.cash_on_hand_end_period ?? 0,
          raised: totals?.receipts ?? 0,
          spent:  totals?.disbursements ?? 0,
          asOf:   totals ? formatDate(totals.coverage_end_date) : "N/A",
          incumbent: c.incumbent,
          filingUrl: `https://www.fec.gov/data/candidate/${c.id}/`,
          dataSource: totals ? "live" : "error",
          fetchedAt,
        });
      } catch {
        results.push({
          name: c.name, office: c.office, level: "federal", party: c.party,
          cash: 0, raised: 0, spent: 0, asOf: "N/A",
          incumbent: c.incumbent,
          filingUrl: `https://www.fec.gov/data/candidate/${c.id}/`,
          dataSource: "error",
          fetchedAt,
        });
      }
    })
  );

  // Sort by cash descending
  results.sort((a, b) => b.cash - a.cash);

  return NextResponse.json({ results, fetchedAt, cycle: CYCLE }, {
    headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" },
  });
}
