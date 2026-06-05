import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/dashboard-data";

// Re-export types so DashboardWidget can still import from here if needed
export type { NewsStory, DashboardData } from "@/lib/dashboard-data";

export async function GET() {
  const data = await getDashboardData();
  return NextResponse.json(data, {
    headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" },
  });
}
