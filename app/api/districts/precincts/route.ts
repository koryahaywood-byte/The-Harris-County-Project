import { NextResponse } from "next/server";

// Harris County voting precincts via Census TIGERweb (layer 15 = Voting Districts)
// maxAllowableOffset=0.003 simplifies vertices server-side → ~236KB (vs 3MB at full precision)
const TIGERWEB =
  "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Legislative/MapServer/15/query" +
  "?where=STATE%3D%2748%27+AND+COUNTY%3D%27201%27" +
  "&outFields=VTD,NAME" +
  "&f=geojson" +
  "&geometryPrecision=4" +
  "&outSR=4326" +
  "&resultRecordCount=1100" +
  "&maxAllowableOffset=0.003";

export async function GET() {
  try {
    const res = await fetch(TIGERWEB, {
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Upstream fetch failed", status: res.status }, { status: 502 });
    }

    const geojson = await res.json();

    // Normalize: rename VTD → precinct for consistency with the rest of the app
    if (geojson.features) {
      geojson.features = geojson.features.map((f: { properties: Record<string, unknown>; [key: string]: unknown }) => ({
        ...f,
        properties: {
          precinct: f.properties.VTD,
          name: f.properties.NAME,
        },
      }));
    }

    return NextResponse.json(geojson, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
      },
    });
  } catch (err) {
    console.error("Precincts fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch precinct data" }, { status: 500 });
  }
}
