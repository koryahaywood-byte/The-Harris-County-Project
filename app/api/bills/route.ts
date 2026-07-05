import { NextRequest, NextResponse } from "next/server";

const LEGISCAN_KEY = process.env.LEGISCAN_API_KEY || "";
const BASE = "https://api.legiscan.com/";
const TX_SESSION_ID = 2160;

async function legiscan(op: string, params: Record<string, string>) {
  const url = new URL(BASE);
  url.searchParams.set("key", LEGISCAN_KEY);
  url.searchParams.set("op", op);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`LegiScan error: ${res.status}`);
  return res.json();
}

type BillRecord = { bill_id: number; bill_number: string; title: string; last_action: string; last_action_date: string; url: string };

function extractBills(searchresult: Record<string, unknown>): BillRecord[] {
  return (Object.values(searchresult) as unknown[]).filter(
    (b): b is BillRecord => typeof b === "object" && b !== null && "bill_id" in b
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") || "";
  const repName = searchParams.get("rep") || "";

  if (!LEGISCAN_KEY) {
    // 200 with an explicit flag: tools render a configuration notice, not an error.
    return NextResponse.json({ available: false, reason: "key", bills: [], total: 0 });
  }

  try {
    // Summary for leaderboard pre-load. Fetches all pages for accurate counts
    if (action === "summary" && repName) {
      const parts = repName.trim().split(/\s+/);
      const lastName = parts[parts.length - 1];
      const firstName = parts[0];
      const query = `${firstName} ${lastName}`;

      const first = await legiscan("getSearch", {
        state: "TX", query, session_id: String(TX_SESSION_ID), page: "1",
      });
      const sr1 = first.searchresult || {};
      const summary = sr1.summary || {};
      const pageTotal: number = summary.page_total ?? 1;
      const totalCount: number = summary.count ?? 0;

      let allBills: BillRecord[] = extractBills(sr1);

      if (pageTotal > 1) {
        const pages = Array.from({ length: Math.min(pageTotal, 10) - 1 }, (_, i) => i + 2);
        const rest = await Promise.allSettled(
          pages.map(p => legiscan("getSearch", {
            state: "TX", query, session_id: String(TX_SESSION_ID), page: String(p),
          }))
        );
        for (const r of rest) {
          if (r.status === "fulfilled") {
            allBills = allBills.concat(extractBills(r.value.searchresult || {}));
          }
        }
      }

      return NextResponse.json({ total: totalCount, page_total: pageTotal, bills: allBills });
    }

    // Full search. Fetches all pages for drill-down
    if (action === "search" && repName) {
      const parts = repName.trim().split(/\s+/);
      const lastName = parts[parts.length - 1];
      const firstName = parts[0];
      const query = `${firstName} ${lastName}`;

      const first = await legiscan("getSearch", {
        state: "TX", query, session_id: String(TX_SESSION_ID), page: "1",
      });
      const sr1 = first.searchresult || {};
      const summary = sr1.summary || {};
      const pageTotal: number = summary.page_total ?? 1;
      const totalCount: number = summary.count ?? 0;

      let allBills: BillRecord[] = extractBills(sr1);

      if (pageTotal > 1) {
        const pages = Array.from({ length: Math.min(pageTotal, 10) - 1 }, (_, i) => i + 2);
        const rest = await Promise.allSettled(
          pages.map(p => legiscan("getSearch", {
            state: "TX", query, session_id: String(TX_SESSION_ID), page: String(p),
          }))
        );
        for (const r of rest) {
          if (r.status === "fulfilled") {
            allBills = allBills.concat(extractBills(r.value.searchresult || {}));
          }
        }
      }

      return NextResponse.json({ bills: allBills, total: totalCount });
    }

    if (action === "bill") {
      const billId = searchParams.get("bill_id") || "";
      const data = await legiscan("getBill", { bill_id: billId });
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
