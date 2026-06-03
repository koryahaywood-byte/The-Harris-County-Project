import { NextRequest, NextResponse } from "next/server";

const LEGISCAN_KEY = process.env.LEGISCAN_API_KEY || "";
const BASE = "https://api.legiscan.com/";

// TX 89th Legislature Regular Session 2025
const TX_SESSION_ID = 2160;

async function legiscan(op: string, params: Record<string, string>) {
  const url = new URL(BASE);
  url.searchParams.set("key", LEGISCAN_KEY);
  url.searchParams.set("op", op);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`LegiScan error: ${res.status}`);
  return res.json();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") || "leaderboard";
  const repName = searchParams.get("rep") || "";

  if (!LEGISCAN_KEY) {
    return NextResponse.json({ error: "LEGISCAN_API_KEY not set" }, { status: 500 });
  }

  try {
    if (action === "search" && repName) {
      // Search by last name — LegiScan searches bill text/sponsors
      const lastName = repName.split(" ").pop() || repName;
      const data = await legiscan("getSearch", {
        state: "TX",
        query: lastName,
        session_id: String(TX_SESSION_ID),
      });
      return NextResponse.json(data);
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
