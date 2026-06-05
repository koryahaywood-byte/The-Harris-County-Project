import { NextResponse } from "next/server";

export const revalidate = 86400; // 24h CDN cache

const ARCGIS_URL =
  "https://services.arcgis.com/su8ic9KbA7PYVxPS/arcgis/rest/services/Voting_Precincts/FeatureServer/0/query" +
  "?where=1%3D1" +
  "&outFields=PRECINCT_N,PCT_CODE,CONG_DIST,SNDIST,HDDIST,JP_PRECINCT,CITY_COUNCIL" +
  "&f=geojson" +
  "&geometryPrecision=4" +
  "&outSR=4326" +
  "&resultRecordCount=2000";

export async function GET() {
  try {
    const res = await fetch(ARCGIS_URL, {
      next: { revalidate: 86400 },
      headers: { "Accept": "application/json" },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Upstream fetch failed", status: res.status }, { status: 502 });
    }

    const geojson = await res.json();

    // Return with cache headers
    return NextResponse.json(geojson, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.error("Precincts fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch precinct data" }, { status: 500 });
  }
}
