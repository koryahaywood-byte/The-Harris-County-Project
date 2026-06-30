// Lat/lng → voting precinct + every district that contains the point.
// Same point-in-polygon pipeline as /api/my-officials, but skips geocoding since the
// browser's Geolocation API already gives us coordinates. Returns the precinct geometry
// so the client can draw it on a map.

import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import crosswalkRaw from "@/lib/precinct-crosswalk.json";
import { findRepresentatives, type CrosswalkEntry, type RepEntry } from "@/lib/representatives";
import { POLITICIANS } from "@/lib/politicians";
import { ALL_CONTACTS } from "@/lib/officials-contact";

export const dynamic = "force-dynamic";

// Attach a headshot (from the politicians dataset) and contact methods (from the
// officials-contact dataset) to each elected official the location resolves to.
function enrich(rep: RepEntry) {
  const pol = POLITICIANS.find((p) => (rep.slug && p.slug === rep.slug) || p.name === rep.name);
  const contact = ALL_CONTACTS.find((c) => c.name === rep.name);
  return {
    name: rep.name,
    office: rep.office,
    level: rep.level,
    party: rep.party,
    district: rep.district,
    note: rep.note,
    slug: rep.slug ?? pol?.slug,
    photo: pol?.photo,
    birthYear: pol?.birthYear ?? rep.birthYear,
    phone: contact?.phone,
    districtPhone: contact?.districtPhone,
    email: contact?.email,
    website: contact?.website ?? rep.url,
    contactForm: contact?.contactForm,
  };
}

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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "Missing or invalid lat/lng." }, { status: 400 });
  }

  // Find the voting precinct that contains the point.
  const feature = loadPrecincts().find((f) => pointInFeature(lng, lat, f));
  if (!feature) {
    return NextResponse.json(
      { error: "That location is outside Harris County voting precincts." },
      { status: 404 }
    );
  }
  const precinct = String(feature.properties.PREC);

  // Direct PIP for commissioner precinct (more accurate than the crosswalk centroid at borders).
  const commFeature = loadCommPrecincts().find((f) => pointInFeature(lng, lat, f));
  const commPct = commFeature ? String(commFeature.properties.PCT_NO) : undefined;

  const cwBase = (crosswalkRaw as { precincts: Record<string, CrosswalkEntry> }).precincts[precinct] ?? {};
  const districts: CrosswalkEntry = commPct ? { ...cwBase, pct: commPct } : cwBase;

  // A council district is only assigned inside the City of Houston, so it doubles as a
  // reliable "are you inside city limits?" signal for routing.
  const inHouston = !!districts.council;

  const officials = findRepresentatives(districts).map(enrich);

  return NextResponse.json({
    lat,
    lng,
    precinct,
    districts,
    inHouston,
    geometry: feature.geometry,
    officials,
  });
}
