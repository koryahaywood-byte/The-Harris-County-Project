import { NextResponse } from "next/server";

// Harris County voting precincts via Census TIGERweb (layer 15 = Voting Districts)
// The WHERE clause MUST use literal single quotes — Census ArcGIS rejects %27 encoding.
// We build the URL manually to avoid URLSearchParams encoding the quotes.
const BASE = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Legislative/MapServer/15/query";
const COMMON = "&outFields=VTD,NAME&f=geojson&geometryPrecision=4&outSR=4326&maxAllowableOffset=0.003&resultRecordCount=550&orderByFields=VTD";

function pageUrl(offset: number) {
  return `${BASE}?where=STATE='48'+AND+COUNTY='201'${COMMON}&resultOffset=${offset}`;
}

export async function GET() {
  try {
    // Harris County has ~1011 precincts — fetch in two pages of 550
    const [res1, res2] = await Promise.all([
      fetch(pageUrl(0),   { next: { revalidate: 86400 } }),
      fetch(pageUrl(550), { next: { revalidate: 86400 } }),
    ]);

    if (!res1.ok) {
      return NextResponse.json({ error: "Upstream fetch failed", status: res1.status }, { status: 502 });
    }

    const [d1, d2] = await Promise.all([
      res1.json(),
      res2.ok ? res2.json() : { features: [] },
    ]);

    const features = [
      ...(d1.features ?? []),
      ...(d2.features ?? []),
    ].map((f: { properties: Record<string, unknown>; [key: string]: unknown }) => ({
      ...f,
      properties: {
        precinct: f.properties.VTD,
        name:     f.properties.NAME,
      },
    }));

    return NextResponse.json(
      { type: "FeatureCollection", features },
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600" } }
    );
  } catch (err) {
    console.error("Precincts fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch precinct data" }, { status: 500 });
  }
}
