import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Fetch the actual district boundary polygon from Census TIGERweb
// Layer 0 = 119th Congressional Districts  (field: CD119)
// Layer 1 = TX State Senate                (field: SLDU)
// Layer 2 = TX State House                 (field: SLDL)
// City Council and JP districts not available in Census: no boundary returned

const BASE = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Legislative/MapServer";

const LAYER_MAP: Record<string, { layer: number; field: string; pad: number }> = {
  house:        { layer: 2, field: "SLDL",  pad: 3 },
  senate:       { layer: 1, field: "SLDU",  pad: 3 },
  congressional:{ layer: 0, field: "CD119", pad: 2 },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type     = searchParams.get("type");     // "house" | "senate" | "congressional"
  const district = searchParams.get("district"); // e.g. "148", "7"

  if (!type || !district) {
    return NextResponse.json({ error: "Missing type or district param" }, { status: 400 });
  }

  const cfg = LAYER_MAP[type];
  if (!cfg) {
    // City Council / JP. No Census boundary available
    return NextResponse.json({ features: [] }, { status: 200 });
  }

  const padded   = district.padStart(cfg.pad, "0");
  const unpadded = String(parseInt(district, 10));

  // Try padded first, then unpadded
  for (const val of [padded, unpadded]) {
    const where = `STATE='48' AND ${cfg.field}='${val}'`;
    const url   = `${BASE}/${cfg.layer}/query?where=${encodeURIComponent(where)}&outFields=${cfg.field},NAME&f=geojson&outSR=4326&geometryPrecision=4`;

    try {
      const res  = await fetch(url, { next: { revalidate: 86400 } });
      if (!res.ok) continue;
      const data = await res.json();
      if (data.features?.length) {
        return NextResponse.json(data, {
          headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600" },
        });
      }
    } catch { /* try next value */ }
  }

  return NextResponse.json({ features: [] }, { status: 200 });
}
