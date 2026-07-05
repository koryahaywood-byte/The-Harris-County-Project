import { NextRequest, NextResponse } from "next/server";

const LEGISCAN_KEY = process.env.LEGISCAN_API_KEY || "";
const BASE = "https://api.legiscan.com/";

async function legiscan(op: string, params: Record<string, string>) {
  const url = new URL(BASE);
  url.searchParams.set("key", LEGISCAN_KEY);
  url.searchParams.set("op", op);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`LegiScan error: ${res.status}`);
  return res.json();
}

type BillRecord = {
  bill_id: number;
  bill_number: string;
  title: string;
  last_action: string;
  last_action_date: string;
  url: string;
};

function extractBills(searchresult: Record<string, unknown>): BillRecord[] {
  return (Object.values(searchresult) as unknown[]).filter(
    (b): b is BillRecord => typeof b === "object" && b !== null && "bill_id" in b
  );
}

// Cache the US session IDs (House + Senate of most recent Congress)
let cachedSessionIds: number[] | null = null;

async function getUSSessionIds(): Promise<number[]> {
  if (cachedSessionIds) return cachedSessionIds;
  const data = await legiscan("getSessionList", { state: "US" });
  const sessions: { session_id: number; year_start: number; year_end: number; session_name: string }[] =
    Object.values(data.sessions ?? {});
  // Pick the two sessions with the highest year_start (current Congress, House + Senate)
  const sorted = sessions.sort((a, b) => b.year_start - a.year_start);
  const currentYear = new Date().getFullYear();
  const current = sorted.filter(
    (s) => s.year_start <= currentYear && s.year_end >= currentYear
  );
  const ids = current.length > 0 ? current.map((s) => s.session_id) : [sorted[0].session_id];
  cachedSessionIds = ids;
  return ids;
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
    if (action === "summary" && repName) {
      const sessionIds = await getUSSessionIds();
      const lastName = repName.split(" ").pop() || repName;

      // Try each session ID, take whichever returns results first
      let allBills: BillRecord[] = [];
      let total = 0;

      for (const sessionId of sessionIds) {
        const data = await legiscan("getSearch", {
          state: "US",
          query: lastName,
          session_id: String(sessionId),
          page: "1",
        });
        const sr = data.searchresult || {};
        const summary = sr.summary || {};
        const bills = extractBills(sr);
        if (bills.length > 0) {
          allBills = bills;
          total = summary.count ?? bills.length;
          break;
        }
      }

      return NextResponse.json({ total, bills: allBills });
    }

    if (action === "search" && repName) {
      const sessionIds = await getUSSessionIds();
      const lastName = repName.split(" ").pop() || repName;

      let allBills: BillRecord[] = [];
      let totalCount = 0;

      for (const sessionId of sessionIds) {
        const first = await legiscan("getSearch", {
          state: "US",
          query: lastName,
          session_id: String(sessionId),
          page: "1",
        });
        const sr1 = first.searchresult || {};
        const summary = sr1.summary || {};
        const pageTotal: number = summary.page_total ?? 1;
        totalCount = summary.count ?? 0;

        const bills = extractBills(sr1);
        if (bills.length === 0 && sessionIds.indexOf(sessionId) < sessionIds.length - 1) continue;

        allBills = bills;
        if (pageTotal > 1) {
          const pages = Array.from({ length: Math.min(pageTotal, 10) - 1 }, (_, i) => i + 2);
          const rest = await Promise.allSettled(
            pages.map((p) =>
              legiscan("getSearch", {
                state: "US",
                query: lastName,
                session_id: String(sessionId),
                page: String(p),
              })
            )
          );
          for (const r of rest) {
            if (r.status === "fulfilled") {
              allBills = allBills.concat(extractBills(r.value.searchresult || {}));
            }
          }
        }
        break;
      }

      return NextResponse.json({ bills: allBills, total: totalCount });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
