import { NextResponse } from "next/server";
import { FINANCE_DATA, getFinanceByName } from "@/lib/campaign-finance";

// GET /api/finance/by-name?name=John+Whitmire
// Returns live data from the appropriate finance API route, falling back to static data.

const BASE = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

const LEVEL_ROUTES: Record<string, string> = {
  federal: "/api/finance/fec",
  state:   "/api/finance/tec",
  county:  "/api/finance/harris-county",
  houston: "/api/finance/houston",
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawName = searchParams.get("name")?.trim();
  if (!rawName) {
    return NextResponse.json({ error: "Missing name parameter" }, { status: 400 });
  }

  // Find static entry to know which level to query
  const staticEntry = getFinanceByName(rawName);
  if (!staticEntry) {
    return NextResponse.json({ error: "No finance data found for this official" }, { status: 404 });
  }

  const routePath = LEVEL_ROUTES[staticEntry.level];
  if (!routePath) {
    return NextResponse.json(staticEntry);
  }

  try {
    const res = await fetch(`${BASE}${routePath}`, {
      signal: AbortSignal.timeout(20000),
      next: { revalidate: 3600 * 6 },
    });
    if (!res.ok) throw new Error("route error");
    const candidates = await res.json() as Array<{ name: string }>;
    const normalized = rawName.toLowerCase();
    const match = candidates.find((c) => c.name.toLowerCase() === normalized);
    if (match) return NextResponse.json({ ...match, dataSource: "live" });
  } catch {
    // fall through to static
  }

  return NextResponse.json({ ...staticEntry, dataSource: "static" });
}
