// Address → every official who represents it.
// 1. Census geocoder (free, no key) → lat/lng
// 2. Point-in-polygon against harris-precincts.geojson → voting precinct
// 3. Direct PIP against harris-commissioner-precincts.geojson → commissioner pct (overrides crosswalk)
// 4. Precinct crosswalk → CD/SD/HD/JP/Council
// 5. findRepresentatives() → grouped officials list

import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import crosswalkRaw from "@/lib/precinct-crosswalk.json";
import { findRepresentatives, type CrosswalkEntry } from "@/lib/representatives";

export const dynamic = "force-dynamic";

type Ring = [number, number][];
interface GeoFeature {
  properties: Record<string, string | number>;
  geometry: { type: "Polygon" | "MultiPolygon"; coordinates: Ring[] | Ring[][] };
}

let GEO_CACHE: GeoFeature[] | null = null;
function loadPrecincts(): GeoFeature[] {
  if (!GEO_CACHE) {
    const raw = readFileSync(join(process.cwd(), "public/data/harris-precincts.geojson"), "utf8");
    GEO_CACHE = JSON.parse(raw).features;
  }
  return GEO_CACHE!;
}

let COMM_CACHE: GeoFeature[] | null = null;
function loadCommPrecincts(): GeoFeature[] {
  if (!COMM_CACHE) {
    const raw = readFileSync(join(process.cwd(), "public/data/harris-commissioner-precincts.geojson"), "utf8");
    COMM_CACHE = JSON.parse(raw).features;
  }
  return COMM_CACHE!;
}

function pointInRing(x: number, y: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function pointInFeature(x: number, y: number, f: GeoFeature): boolean {
  if (f.geometry.type === "Polygon") {
    const rings = f.geometry.coordinates as Ring[];
    if (!pointInRing(x, y, rings[0])) return false;
    for (let i = 1; i < rings.length; i++) if (pointInRing(x, y, rings[i])) return false; // hole
    return true;
  }
  for (const poly of f.geometry.coordinates as Ring[][]) {
    if (pointInRing(x, y, poly[0])) {
      let inHole = false;
      for (let i = 1; i < poly.length; i++) if (pointInRing(x, y, poly[i])) { inHole = true; break; }
      if (!inHole) return true;
    }
  }
  return false;
}

// Precinct lines run down street centerlines, and the simplified boundary file
// leaves 1–15 m seams between neighbors. Phone GPS often snaps to the street,
// i.e. into a seam, so a strict point-in-polygon test reports a real Harris
// County location as "outside". Fall back to the nearest feature whose edge is
// within `maxMeters`.
function distToFeatureMeters(x: number, y: number, f: GeoFeature): number {
  const kx = 111_320 * Math.cos((y * Math.PI) / 180), ky = 110_540;
  const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates as Ring[]] : (f.geometry.coordinates as Ring[][]);
  let best = Infinity;
  for (const poly of polys) {
    for (const ring of poly) {
      for (let i = 0; i < ring.length - 1; i++) {
        const [ax, ay] = ring[i], [bx, by] = ring[i + 1];
        const dx = (bx - ax) * kx, dy = (by - ay) * ky;
        const px = (x - ax) * kx, py = (y - ay) * ky;
        const len = dx * dx + dy * dy;
        const t = len ? Math.max(0, Math.min(1, (px * dx + py * dy) / len)) : 0;
        const d = Math.hypot(px - t * dx, py - t * dy);
        if (d < best) best = d;
      }
    }
  }
  return best;
}

function findFeature(x: number, y: number, features: GeoFeature[], maxMeters = 300): GeoFeature | null {
  const hit = features.find(f => pointInFeature(x, y, f));
  if (hit) return hit;
  let best: GeoFeature | null = null, bestD = maxMeters;
  for (const f of features) {
    const d = distToFeatureMeters(x, y, f);
    if (d < bestD) { bestD = d; best = f; }
  }
  return best;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address")?.trim();
  // Number(null) is 0, so guard for param presence before parsing. Otherwise
  // every address-only request "has coords" at (0,0) and 404s as outside Harris.
  const latRaw = searchParams.get("lat");
  const lngRaw = searchParams.get("lng");
  const latParam = latRaw === null ? NaN : Number(latRaw);
  const lngParam = lngRaw === null ? NaN : Number(lngRaw);
  const hasCoords = Number.isFinite(latParam) && Number.isFinite(lngParam);
  if (!address && !hasCoords) return NextResponse.json({ error: "Missing address" }, { status: 400 });

  let lat: number, lng: number, matched: string;

  if (hasCoords) {
    // Coordinates from the browser's Geolocation API: skip geocoding.
    lat = latParam;
    lng = lngParam;
    matched = "Your current location";
  } else {
    // 1. Geocode via Census (no key required)
    const geoUrl = `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${encodeURIComponent(
      address! + (/(tx|texas)/i.test(address!) ? "" : ", TX")
    )}&benchmark=Public_AR_Current&format=json`;
    try {
      const res = await fetch(geoUrl, { signal: AbortSignal.timeout(10_000) });
      const data = await res.json();
      const match = data?.result?.addressMatches?.[0];
      if (!match) {
        return NextResponse.json({ error: "Address not found. Try adding street number, city, and ZIP." }, { status: 404 });
      }
      lat = match.coordinates.y;
      lng = match.coordinates.x;
      matched = match.matchedAddress;
    } catch {
      return NextResponse.json({ error: "Geocoding service unavailable. Try again in a moment." }, { status: 502 });
    }
  }

  // 2. Find the voting precinct
  const feature = findFeature(lng, lat, loadPrecincts());
  if (!feature) {
    return NextResponse.json(
      { error: hasCoords
          ? "Your device reported a location outside Harris County. Location on laptops can be miles off; type your street address instead."
          : "That address geocoded outside Harris County voting precincts.", matched },
      { status: 404 }
    );
  }
  const precinct = String(feature.properties.PREC);

  // 3. Direct PIP for commissioner precinct. Overrides crosswalk centroid which fails at boundaries
  const commFeature = findFeature(lng, lat, loadCommPrecincts());
  const commPct = commFeature ? String(commFeature.properties.PCT_NO) : undefined;

  // 4. Crosswalk → all other districts; override pct with direct PIP result
  const cwBase = (crosswalkRaw as { precincts: Record<string, CrosswalkEntry> }).precincts[precinct] ?? {};
  const cw: CrosswalkEntry = commPct ? { ...cwBase, pct: commPct } : cwBase;
  const reps = findRepresentatives(cw);

  return NextResponse.json({ matched, precinct, districts: cw, officials: reps });
}
