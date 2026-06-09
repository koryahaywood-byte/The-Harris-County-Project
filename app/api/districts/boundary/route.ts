import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Fetch the actual district boundary polygon from Census TIGERweb
// Layer 2 = TX State House (field: SLDL)
// Layer 1 = TX State Senate (field: SLDU)
// Returns a single GeoJSON feature for the requested district

const BASE = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Legislative/MapServer";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");     // "house" | "senate"
  const district = searchParams.get("district"); // e.g. "148", "6"

  if (!type || !district) {
    return NextResponse.json({ error: "Missing type or district param" }, { status: 400 });
  }

  const layer = type === "senate" ? 1 : 2;
  const field = type === "senate" ? "SLDU" : "SLDL";
  const paddedDistrict = district.padStart(3, "0");

  // Try both zero-padded and unpadded
  const where = `STATE='48' AND ${field}='${paddedDistrict}'`;
  const url = `${BASE}/${layer}/query?where=${encodeURIComponent(where)}&outFields=${field},NAME&f=geojson&outSR=4326&geometryPrecision=4`;

  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return NextResponse.json({ error: "Upstream error" }, { status: 502 });

    const data = await res.json();

    // If zero-padded didn't work, try unpadded
    if (!data.features?.length) {
      const where2 = `STATE='48' AND ${field}='${district}'`;
      const url2 = `${BASE}/${layer}/query?where=${encodeURIComponent(where2)}&outFields=${field},NAME&f=geojson&outSR=4326&geometryPrecision=4`;
      const res2 = await fetch(url2, { next: { revalidate: 86400 } });
      const data2 = res2.ok ? await res2.json() : { features: [] };
      return NextResponse.json(data2, {
        headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600" },
      });
    }

    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600" },
    });
  } catch (err) {
    console.error("Boundary fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch boundary" }, { status: 500 });
  }
}
