import { NextRequest, NextResponse } from "next/server";
import { getMarketOdds, MIN_OPEN_INTEREST } from "@/lib/kalshi";

export const revalidate = 300; // cache 5 minutes

/* GET /api/kalshi?race=CD-7 | US-Senate | TX-Governor
   Returns { available: false } when there is no market OR the market is too
   thin to trust (see lib/kalshi.ts liquidity rule). */
export async function GET(req: NextRequest) {
  const race = req.nextUrl.searchParams.get("race") ?? "";
  const odds = await getMarketOdds(race);
  if (!odds) return NextResponse.json({ available: false, minOpenInterest: MIN_OPEN_INTEREST });
  return NextResponse.json({ available: true, ...odds, volume: odds.openInterest });
}
