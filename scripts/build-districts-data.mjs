// Build real data for the Districts tool:
//  1. public/data/harris-precincts.geojson   — precinct polygons extracted from heat-check.html (same shapes as Heat Check)
//  2. public/data/precinct-turnout-2026.json — real 2026 primary ballots cast per precinct (D + R top-of-ticket)
//  3. lib/precinct-crosswalk.json            — precinct → HD / SD / CD via centroid point-in-polygon against TIGERweb
//     (+ JP / City Council if their ArcGIS services respond)
//
// Run: node scripts/build-districts-data.mjs

import { readFileSync, writeFileSync, mkdirSync } from "fs";

const ROOT = new URL("..", import.meta.url).pathname;

/* ── 1. Extract GEO from heat-check.html ──────────────────────────────────── */
const html = readFileSync(`${ROOT}public/heat-check.html`, "utf8");

function extractConst(name) {
  const marker = `const ${name}=`;
  const start = html.indexOf(marker);
  if (start < 0) throw new Error(`${name} not found`);
  let i = html.indexOf("{", start);
  let depth = 0, j = i;
  for (;;) {
    const ch = html[j];
    if (ch === "{") depth++;
    else if (ch === "}") { depth--; if (depth === 0) break; }
    j++;
  }
  return JSON.parse(html.slice(i, j + 1));
}

const GEO = extractConst("GEO");
console.log(`GEO: ${GEO.features.length} precinct polygons`);
mkdirSync(`${ROOT}public/data`, { recursive: true });
writeFileSync(`${ROOT}public/data/harris-precincts.geojson`, JSON.stringify(GEO));

/* ── 2. Per-precinct primary turnout from the US Senate race (top of ticket) ── */
const D = extractConst("D");
const D_REP = extractConst("D_REP");

// p[prec] = [winnerIdx, sharePermille, totalVotes, [votes...]]
const demRace = D["United States Senator"];
const repRace = D_REP["United States Senator"];
const turnout = {};
for (const [prec, row] of Object.entries(demRace?.p ?? {})) {
  turnout[prec] = { dem: row[2] ?? 0, rep: 0 };
}
for (const [prec, row] of Object.entries(repRace?.p ?? {})) {
  turnout[prec] = turnout[prec] ?? { dem: 0, rep: 0 };
  turnout[prec].rep = row[2] ?? 0;
}
console.log(`Turnout: ${Object.keys(turnout).length} precincts with 2026 primary ballots`);
writeFileSync(`${ROOT}public/data/precinct-turnout-2026.json`, JSON.stringify({
  source: "Harris County Clerk — March 2026 primary, US Senate race ballots cast",
  precincts: turnout,
}));

/* ── 3. Crosswalk via centroid point-in-polygon ───────────────────────────── */
function centroid(geom) {
  // average of outer-ring vertices — good enough for assignment
  const ring = geom.type === "Polygon" ? geom.coordinates[0]
    : geom.coordinates.reduce((best, poly) => (poly[0].length > best.length ? poly[0] : best), geom.coordinates[0][0]);
  let x = 0, y = 0;
  for (const [px, py] of ring) { x += px; y += py; }
  return [x / ring.length, y / ring.length];
}

function pointInRing(pt, ring) {
  const [x, y] = pt;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function pointInGeom(pt, geom) {
  if (geom.type === "Polygon") {
    if (!pointInRing(pt, geom.coordinates[0])) return false;
    for (let h = 1; h < geom.coordinates.length; h++) if (pointInRing(pt, geom.coordinates[h])) return false;
    return true;
  }
  if (geom.type === "MultiPolygon") {
    for (const poly of geom.coordinates) {
      if (pointInRing(pt, poly[0])) {
        let inHole = false;
        for (let h = 1; h < poly.length; h++) if (pointInRing(pt, poly[h])) { inHole = true; break; }
        if (!inHole) return true;
      }
    }
  }
  return false;
}

const TIGER = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Legislative/MapServer";
const HARRIS_BBOX = "-96.0,29.4,-94.8,30.3";

async function fetchDistrictPolys(layer, field) {
  const url = `${TIGER}/${layer}/query?where=${encodeURIComponent(`STATE='48'`)}&geometry=${HARRIS_BBOX}&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=${field}&f=geojson&outSR=4326&geometryPrecision=4`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TIGER layer ${layer}: HTTP ${res.status}`);
  const data = await res.json();
  return (data.features ?? []).map(f => ({ id: f.properties[field], geom: f.geometry }));
}

async function tryFetchJson(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

const centroids = GEO.features.map(f => ({ prec: f.properties.PREC, pt: centroid(f.geometry) }));

const crosswalk = {}; // prec -> { hd, sd, cd, jp?, council? }
for (const { prec } of centroids) crosswalk[prec] = {};

// TLC PLANC2333 — Texas 2026 congressional district boundaries.
// Endpoint: Texas Legislative Council GIS service for the enacted 2025 redistricting plan.
async function assignFromTLC() {
  const url = "https://services.tlc.state.tx.us/arcgis/rest/services/Plans/PLANC2333/MapServer/0/query?where=1%3D1&outFields=DISTRICT&f=geojson&outSR=4326&geometryPrecision=4";
  let polys;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error(`TLC PLANC2333 HTTP ${res.status}`);
    const data = await res.json();
    polys = (data.features ?? []).map(f => ({ id: String(parseInt(f.properties.DISTRICT, 10)), geom: f.geometry }));
    console.log(`TLC PLANC2333 (cd): ${polys.length} district polygons`);
  } catch (e) {
    console.error(`TLC PLANC2333 fetch failed: ${e.message} — falling back to TIGERweb CD119 (WRONG for 2026)`);
    const polys2 = await fetchDistrictPolys(0, "CD119");
    polys = polys2;
  }
  let assigned = 0;
  for (const { prec, pt } of centroids) {
    for (const { id, geom } of polys) {
      if (geom && pointInGeom(pt, geom)) { crosswalk[prec].cd = id; assigned++; break; }
    }
  }
  console.log(`  assigned ${assigned}/${centroids.length} precincts`);
}

async function assign(layer, field, key, transform = v => v) {
  const polys = await fetchDistrictPolys(layer, field);
  console.log(`Layer ${layer} (${key}): ${polys.length} district polygons`);
  let assigned = 0;
  for (const { prec, pt } of centroids) {
    for (const { id, geom } of polys) {
      if (geom && pointInGeom(pt, geom)) { crosswalk[prec][key] = transform(id); assigned++; break; }
    }
  }
  console.log(`  assigned ${assigned}/${centroids.length} precincts`);
}

await assign(2, "SLDL", "hd", v => String(parseInt(v, 10)));
await assign(1, "SLDU", "sd", v => String(parseInt(v, 10)));
// CD: use TLC PLANC2333 (2026 Texas redistricting), NOT TIGERweb CD119.
// TIGERweb reflects 2022-drawn 119th Congress lines; PLANC2333 changed 574 precincts for 2026.
// When the 120th Congress lines land in TIGERweb (late 2027), this can revert to assign().
await assignFromTLC();

/* JP / Constable precincts — Harris County ArcGIS (best-effort) */
const jpUrls = [
  "https://services.arcgis.com/su8ic9KbA7PYVxPS/arcgis/rest/services/Harris_County_Constable_Precincts/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson&outSR=4326&geometryPrecision=4",
];
let jpDone = false;
for (const url of jpUrls) {
  const data = await tryFetchJson(url);
  if (data?.features?.length) {
    const numField = "PCT_NUM" in data.features[0].properties ? "PCT_NUM"
      : Object.keys(data.features[0].properties).find(k => /pct_num|prec|number/i.test(k));
    console.log(`JP precincts: ${data.features.length} polygons (field ${numField})`);
    let n = 0;
    for (const { prec, pt } of centroids) {
      for (const f of data.features) {
        if (f.geometry && pointInGeom(pt, f.geometry)) {
          crosswalk[prec].jp = String(parseInt(f.properties[numField], 10));
          n++; break;
        }
      }
    }
    console.log(`  assigned ${n}/${centroids.length}`);
    jpDone = true;
    break;
  }
}
if (!jpDone) console.log("JP precinct boundaries: NO SERVICE RESPONDED — jp omitted from crosswalk");

/* Commissioner Precincts — Harris County ArcGIS (PCT_NO field) */
// Use Commissioner_Precinct (updated June 2026) not Harris_County_Commissioner_Precincts (last edited Jan 2021, pre-redistricting)
const commUrl = "https://services.arcgis.com/su8ic9KbA7PYVxPS/arcgis/rest/services/Commissioner_Precinct/FeatureServer/0/query?where=1%3D1&outFields=PCT_NO&f=geojson&outSR=4326&geometryPrecision=5";
const commData = await tryFetchJson(commUrl);
if (commData?.features?.length) {
  console.log(`Commissioner precincts: ${commData.features.length} polygons`);
  let n = 0;
  for (const { prec, pt } of centroids) {
    for (const f of commData.features) {
      if (f.geometry && pointInGeom(pt, f.geometry)) {
        crosswalk[prec].pct = String(parseInt(f.properties.PCT_NO, 10));
        n++; break;
      }
    }
  }
  console.log(`  assigned ${n}/${centroids.length}`);
} else {
  console.log("Commissioner precinct boundaries: NO SERVICE RESPONDED — pct omitted from crosswalk");
}

/* Houston City Council districts — COH GIS (best-effort) */
const ccUrls = [
  "https://services.arcgis.com/NummVBqZSIJKUeVR/arcgis/rest/services/City_Council_Districts/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson&outSR=4326&geometryPrecision=4",
  "https://mycity.maps.arcgis.com/sharing/rest/content/items/COH_COUNCIL/data",
  "https://cohgis-mycity.opendata.arcgis.com/datasets/coh-council-districts.geojson",
];
let ccDone = false;
for (const url of ccUrls) {
  const data = await tryFetchJson(url);
  if (data?.features?.length) {
    const f0 = data.features[0].properties;
    const distField = Object.keys(f0).find(k => /district/i.test(k) && typeof f0[k] === "string");
    console.log(`Council districts: ${data.features.length} polygons (field ${distField})`);
    let n = 0;
    for (const { prec, pt } of centroids) {
      for (const f of data.features) {
        if (f.geometry && pointInGeom(pt, f.geometry)) {
          crosswalk[prec].council = String(f.properties[distField]).replace(/^district\s*/i, "").trim();
          n++; break;
        }
      }
    }
    console.log(`  assigned ${n}/${centroids.length}`);
    ccDone = true;
    break;
  }
}
if (!ccDone) console.log("Council district boundaries: NO SERVICE RESPONDED — council omitted from crosswalk");

writeFileSync(`${ROOT}lib/precinct-crosswalk.json`, JSON.stringify({
  builtAt: new Date().toISOString(),
  method: "precinct centroid PIP: HD/SD/JP from TIGERweb; CD from TLC PLANC2333 (2026 redistricting); pct from Harris County ArcGIS direct PIP",
  precincts: crosswalk,
}));
console.log("Wrote lib/precinct-crosswalk.json");
