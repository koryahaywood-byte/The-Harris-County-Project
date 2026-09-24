"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import crosswalkRaw from "@/lib/precinct-crosswalk.json";
import ShareButton from "@/components/ShareButton";
import RelatedTools from "@/components/RelatedTools";
import HeatCheckInsights from "@/components/HeatCheckInsights";
import { useUrlState, readUrlParams } from "@/lib/useUrlState";
import "leaflet/dist/leaflet.css";
import { BASEMAP } from "@/lib/basemap";

// ── Types ─────────────────────────────────────────────────────────────────────
interface HistCandidate { name: string; party: string }
interface HistRace { label: string; candidates: HistCandidate[]; votes: Record<string, number[]> }
interface HistCycle {
  label: string;
  races?: Record<string, HistRace>;
  primary?: Record<string, { dem: number; rep: number }>;
}
interface PrecinctHistory { cycles: Record<string, HistCycle> }
interface GeoFeature { type: string; properties: { PREC: string }; geometry: object }
interface PrecinctData {
  pct: number | null; d: number; r: number; total: number; dName: string; rName: string;
}

// ── Color scales ──────────────────────────────────────────────────────────────
function partisanColor(pct: number): string {
  if (pct >= 0.65) return "#1A3A93";
  if (pct >= 0.57) return "#3F66CF";
  if (pct >= 0.52) return "#93AAE8";
  if (pct >= 0.48) return "#E6C35C";
  if (pct >= 0.43) return "#EC9C92";
  if (pct >= 0.35) return "#D2584B";
  return "#86211A";
}

function swingColor(swing: number): string {
  if (swing >= 0.10) return "#1A3A93";
  if (swing >= 0.05) return "#3F66CF";
  if (swing >= 0.02) return "#93AAE8";
  if (swing >= -0.02) return "#D6D8D1";
  if (swing >= -0.05) return "#EC9C92";
  if (swing >= -0.10) return "#D2584B";
  return "#86211A";
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function findDR(candidates: HistCandidate[]): { dIdx: number; rIdx: number } | null {
  const dIdx = candidates.findIndex(c => c.party === "D");
  const rIdx = candidates.findIndex(c => c.party === "R");
  if (dIdx === -1 || rIdx === -1) return null;
  return { dIdx, rIdx };
}

function normPrec(raw: string): string { return raw.replace(/^0+/, "") || "0"; }

function lookupPrec<T>(map: Record<string, T>, raw: string): T | undefined {
  const n = normPrec(raw);
  return map[raw] ?? map[n] ?? map[n.padStart(4, "0")];
}

// Pure function. Compute precinct data for any cycle/race
function computeLookup(
  history: PrecinctHistory | null, cycle: string, race: string | null
): Record<string, PrecinctData> {
  if (!history) return {};
  const cd = history.cycles[cycle];
  if (!cd) return {};
  const result: Record<string, PrecinctData> = {};

  if (cd.primary) {
    for (const [prec, v] of Object.entries(cd.primary)) {
      const d = v.dem, r = v.rep, total = d + r;
      result[prec] = { pct: total ? d / total : null, d, r, total, dName: "Dem Primary", rName: "Rep Primary" };
    }
    return result;
  }

  if (cd.races && race && cd.races[race]) {
    const r_ = cd.races[race];
    const dr = findDR(r_.candidates);
    if (!dr) return {};
    const dName = r_.candidates[dr.dIdx].name;
    const rName = r_.candidates[dr.rIdx].name;
    for (const [prec, votes] of Object.entries(r_.votes)) {
      const d = votes[dr.dIdx] ?? 0, r = votes[dr.rIdx] ?? 0, total = d + r;
      result[prec] = { pct: total ? d / total : null, d, r, total, dName, rName };
    }
  }
  return result;
}

// ── Legends ───────────────────────────────────────────────────────────────────
const PARTISAN_LEGEND = [
  { color: "#1A3A93", label: "D 65%+" },
  { color: "#3F66CF", label: "D 57–65%" },
  { color: "#93AAE8", label: "D 52–57%" },
  { color: "#E6C35C", label: "Even, 48–52%" },
  { color: "#EC9C92", label: "R 52–57%" },
  { color: "#D2584B", label: "R 57–65%" },
  { color: "#86211A", label: "R 65%+" },
];

const SWING_LEGEND = [
  { color: "#1A3A93", label: "Toward D 10+ pts" },
  { color: "#3F66CF", label: "Toward D 5–10" },
  { color: "#93AAE8", label: "Toward D 2–5" },
  { color: "#D6D8D1", label: "Within 2 pts" },
  { color: "#EC9C92", label: "Toward R 2–5" },
  { color: "#D2584B", label: "Toward R 5–10" },
  { color: "#86211A", label: "Toward R 10+ pts" },
];

// General cycles used for the pinned-precinct trend sparkline, oldest first
const GENERAL_TREND_CYCLES = ["2012G", "2014G", "2016G", "2018G", "2020G", "2022G", "2024G"];

const CYCLES = [
  { key: "2026P", label: "2026 Primary" },
  { key: "2024G", label: "2024 General" },
  { key: "2024P", label: "2024 Primary" },
  { key: "2022G", label: "2022 General" },
  { key: "2022P", label: "2022 Primary" },
  { key: "2020G", label: "2020 General" },
  { key: "2020P", label: "2020 Primary" },
  { key: "2018G", label: "2018 General" },
  { key: "2018P", label: "2018 Primary" },
  { key: "2016G", label: "2016 General" },
  { key: "2016P", label: "2016 Primary" },
  { key: "2014G", label: "2014 General" },
  { key: "2014P", label: "2014 Primary" },
  { key: "2012G", label: "2012 General" },
  { key: "2012P", label: "2012 Primary" },
];

type Jurisdiction = "county" | "houston";

type SortCol = "prec" | "d" | "r" | "total" | "pct" | "margin" | "swing";
type SortDir = "asc" | "desc";
type ViewMode = "partisan" | "swing";

// ── Precinct crosswalk ─────────────────────────────────────────────────────────
const CROSSWALK = (crosswalkRaw as { precincts: Record<string, { hd?: string; sd?: string; cd?: string; jp?: string; pct?: string }> }).precincts;

function precinctDistricts(rawPrec: string): { hd?: string; sd?: string; cd?: string } {
  const norm = normPrec(rawPrec);
  return CROSSWALK[rawPrec] ?? CROSSWALK[norm] ?? CROSSWALK[norm.padStart(4, "0")] ?? {};
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function HeatCheckHistoryMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const geoLayerRef = useRef<L.GeoJSON | null>(null);

  const [history, setHistory] = useState<PrecinctHistory | null>(null);
  const [geojson, setGeojson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [houstonPrecs, setHoustonPrecs] = useState<Set<string> | null>(null);
  const [loadError, setLoadError] = useState(false);

  // Selectors
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction>("county");
  const [cycle, setCycle] = useState("2024G");
  const [showIframe, setShowIframe] = useState(false);
  const [race, setRace] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("partisan");
  const [compareCycle, setCompareCycle] = useState("2020G");
  const [compareRace, setCompareRace] = useState<string | null>(null);

  // Table
  const [sortCol, setSortCol] = useState<SortCol>("prec");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Tooltip (transient hover) + pinned precinct (click-to-pin, survives mouseout)
  const [hovered, setHovered] = useState<{
    prec: string; data: PrecinctData | null; baseData: PrecinctData | null; swing: number | null;
  } | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);

  // Touch devices: one finger scrolls the PAGE and taps pick a precinct; the
  // map only moves with two fingers. Hover cards are desktop-only.
  const [coarse, setCoarse] = useState(false);
  useEffect(() => { setCoarse(window.matchMedia("(pointer: coarse)").matches); }, []);

  // Find a precinct by number or street address
  const [findQ, setFindQ] = useState("");
  const [finding, setFinding] = useState(false);
  const [findErr, setFindErr] = useState<string | null>(null);
  const layerByPrec = useRef<Map<string, L.Path>>(new Map());
  const [layerVersion, setLayerVersion] = useState(0);

  // ── URL round-trip ─────────────────────────────────────────────────────────
  const pendingUrlRace = useRef<string | null>(null);
  useEffect(() => {
    const p = readUrlParams(["view", "cycle", "from", "race", "area", "prec"]);
    if (p.view === "swing") setViewMode("swing");
    if (p.cycle && CYCLES.some(c => c.key === p.cycle)) setCycle(p.cycle);
    if (p.from && CYCLES.some(c => c.key === p.from)) setCompareCycle(p.from);
    if (p.area === "houston") setJurisdiction("houston");
    if (p.race) pendingUrlRace.current = p.race;
    if (p.prec) setPinned(p.prec);
  }, []);

  // ── Load data ──────────────────────────────────────────────────────────────
  const loadData = useCallback(() => {
    setLoadError(false);
    const getJson = (url: string) =>
      fetch(url).then(r => { if (!r.ok) throw new Error(`${url} → ${r.status}`); return r.json(); });
    Promise.all([
      getJson("/data/precinct-history.json"),
      getJson("/data/harris-precincts.geojson"),
      getJson("/data/houston-precincts.json"),
    ]).then(([h, g, hp]) => {
      setHistory(h);
      setGeojson(g);
      setHoustonPrecs(new Set<string>(hp));
    }).catch(err => {
      console.error("[HeatCheck] precinct data failed to load:", err);
      setLoadError(true);
    });
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Auto-select race when cycle changes (honoring a race carried in the URL once)
  useEffect(() => {
    if (!history) return;
    const cd = history.cycles[cycle];
    if (!cd?.races) { setRace(null); return; }
    const keys = Object.keys(cd.races);
    const pending = pendingUrlRace.current;
    pendingUrlRace.current = null;
    setRace(pending && keys.includes(pending) ? pending : keys[0]);
  }, [cycle, history]);

  useEffect(() => {
    if (!history) return;
    const cd = history.cycles[compareCycle];
    if (!cd?.races) { setCompareRace(null); return; }
    const keys = Object.keys(cd.races);
    setCompareRace(race && keys.includes(race) ? race : keys[0]);
  }, [compareCycle, race, history]);

  // ── Computed lookups ───────────────────────────────────────────────────────
  const filterPrec = useCallback((raw: string) => {
    if (jurisdiction !== "houston" || !houstonPrecs) return true;
    const norm = normPrec(raw);
    return houstonPrecs.has(raw) || houstonPrecs.has(norm) || houstonPrecs.has(norm.padStart(4, "0"));
  }, [jurisdiction, houstonPrecs]);

  const rawLookup = useMemo(() => computeLookup(history, cycle, race), [history, cycle, race]);
  const rawBaseLookup = useMemo(() => computeLookup(history, compareCycle, compareRace), [history, compareCycle, compareRace]);

  const lookup = useMemo(() => {
    if (jurisdiction !== "houston" || !houstonPrecs) return rawLookup;
    return Object.fromEntries(Object.entries(rawLookup).filter(([p]) => filterPrec(p)));
  }, [rawLookup, jurisdiction, houstonPrecs, filterPrec]);

  const baseLookup = useMemo(() => {
    if (jurisdiction !== "houston" || !houstonPrecs) return rawBaseLookup;
    return Object.fromEntries(Object.entries(rawBaseLookup).filter(([p]) => filterPrec(p)));
  }, [rawBaseLookup, jurisdiction, houstonPrecs, filterPrec]);

  const swingMap = useMemo<Record<string, number | null>>(() => {
    const result: Record<string, number | null> = {};
    for (const [prec, cur] of Object.entries(lookup)) {
      const base = baseLookup[prec];
      result[prec] = cur.pct != null && base?.pct != null ? cur.pct - base.pct : null;
    }
    return result;
  }, [lookup, baseLookup]);

  // ── Init Leaflet ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;
    import("leaflet").then(L => {
      const touch = window.matchMedia("(pointer: coarse)").matches;
      const map = L.map(mapRef.current!, {
        zoomControl: true,
        scrollWheelZoom: false,     // scrolling the page never zooms the map
        dragging: !touch,           // phones: one finger scrolls the page, two fingers move the map
        touchZoom: true,
        doubleClickZoom: true,
        zoomSnap: 0.5,
      }).setView([29.78, -95.37], touch ? 9.5 : 10);
      L.tileLayer(BASEMAP.base, {
        attribution: BASEMAP.attribution, maxNativeZoom: BASEMAP.maxNativeZoom, maxZoom: 18,
      }).addTo(map);
      leafletMap.current = map;
    });
    return () => { if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null; } };
  }, []);

  // ── Render GeoJSON layer ───────────────────────────────────────────────────
  useEffect(() => {
    if (!leafletMap.current || !geojson) return;
    import("leaflet").then(L => {
      if (geoLayerRef.current) { geoLayerRef.current.remove(); geoLayerRef.current = null; }
      layerByPrec.current = new Map();
      const touch = window.matchMedia("(pointer: coarse)").matches;

      const layer = L.geoJSON(geojson as GeoJSON.FeatureCollection, {
        style: (feature) => {
          const raw = (feature as GeoFeature).properties.PREC || "";
          const inJurisdiction = jurisdiction !== "houston" || filterPrec(raw);
          if (!inJurisdiction) {
            return { fillColor: "#e5e7eb", fillOpacity: 0.12, color: "#d1d5db", weight: 0.3, opacity: 0.3 };
          }
          if (viewMode === "swing") {
            const swing = lookupPrec(swingMap, raw);
            return {
              fillColor: swing != null ? swingColor(swing) : "#e5e7eb",
              fillOpacity: swing != null ? 0.82 : 0.18,
              color: "white", weight: 0.5, opacity: 0.7,
            };
          } else {
            const data = lookupPrec(lookup, raw);
            return {
              fillColor: data?.pct != null ? partisanColor(data.pct) : "#c8c4be",
              fillOpacity: data?.pct != null ? 0.78 : 0.22,
              color: "white", weight: 0.5, opacity: 0.7,
            };
          }
        },
        onEachFeature: (feature, lyr) => {
          const raw = (feature as GeoFeature).properties.PREC || "";
          layerByPrec.current.set(normPrec(raw), lyr as L.Path);
          if (!touch) lyr.on("mouseover", () => {
            const inJurisdiction = jurisdiction !== "houston" || filterPrec(raw);
            if (!inJurisdiction) return;
            (lyr as L.Path).setStyle({ weight: 2, color: "#fbbf24", opacity: 1 });
            // Signal that the precinct itself is clickable (navigates to its district breakdown).
            const el = (lyr as L.Path).getElement();
            if (el) (el as SVGElement).style.cursor = "pointer";
            const norm = normPrec(raw).padStart(4, "0");
            setHovered({
              prec: norm,
              data: lookupPrec(lookup, raw) ?? null,
              baseData: lookupPrec(baseLookup, raw) ?? null,
              swing: lookupPrec(swingMap, raw) ?? null,
            });
          });
          if (!touch) lyr.on("mouseout", () => { layer.resetStyle(lyr); setHovered(null); });
          lyr.on("click", () => {
            const inJurisdiction = jurisdiction !== "houston" || filterPrec(raw);
            if (!inJurisdiction) return;
            // Pin the detail card (click again to unpin) so its links are clickable.
            setPinned(prev => (prev != null && normPrec(prev) === normPrec(raw) ? null : raw));
          });
        },
      }).addTo(leafletMap.current!);

      geoLayerRef.current = layer;
      setLayerVersion(v => v + 1);
    });
  }, [geojson, lookup, baseLookup, swingMap, viewMode, jurisdiction, filterPrec]); // eslint-disable-line

  // Keep the selected precinct outlined in gold, whatever the layer rebuilds do.
  const outlined = useRef<L.Path | null>(null);
  useEffect(() => {
    const layer = geoLayerRef.current;
    if (outlined.current && layer) layer.resetStyle(outlined.current);
    outlined.current = null;
    if (pinned == null) return;
    const lyr = layerByPrec.current.get(normPrec(pinned));
    if (!lyr) return;
    lyr.setStyle({ weight: 3, color: "#E2B13C", opacity: 1 });
    lyr.bringToFront();
    outlined.current = lyr;
  }, [pinned, layerVersion]);

  // A precinct carried in the URL (?prec=0890, e.g. from the 3D county) is
  // zoomed to once, as soon as its shape exists.
  const zoomedFromUrl = useRef(false);
  useEffect(() => {
    if (zoomedFromUrl.current || pinned == null || !layerByPrec.current.size) return;
    zoomedFromUrl.current = true;
    zoomTo(pinned);
  }, [pinned, layerVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  function zoomTo(prec: string) {
    const lyr = layerByPrec.current.get(normPrec(prec)) as (L.Path & { getBounds?: () => L.LatLngBounds }) | undefined;
    const map = leafletMap.current;
    if (lyr?.getBounds && map) map.fitBounds(lyr.getBounds(), { maxZoom: 14, padding: [40, 40] });
  }

  async function findPrecinct(e: React.FormEvent) {
    e.preventDefault();
    const q = findQ.trim();
    if (!q) return;
    setFindErr(null);
    const digits = q.replace(/^pct\.?\s*|^precinct\s*/i, "");
    if (/^\d{1,4}$/.test(digits)) {
      if (!layerByPrec.current.has(normPrec(digits))) { setFindErr(`There is no precinct ${digits} on the county map.`); return; }
      setPinned(digits.padStart(4, "0")); zoomTo(digits);
      return;
    }
    setFinding(true);
    try {
      const res = await fetch(`/api/my-officials?address=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok || !data.precinct) { setFindErr(data.error ?? "That address wasn’t found. Add the street number and ZIP."); return; }
      setPinned(String(data.precinct)); zoomTo(String(data.precinct));
    } catch {
      setFindErr("The address lookup didn’t respond. Try the precinct number instead.");
    } finally { setFinding(false); }
  }

  // ── Derived display values ─────────────────────────────────────────────────
  const cycleData = history?.cycles[cycle];
  const availableRaces = cycleData?.races ? Object.entries(cycleData.races).map(([k, v]) => ({ key: k, label: v.label })) : [];

  // Popup shows the pinned precinct if set, otherwise the hovered one.
  // Pinned data is derived fresh so cycle/race changes update the card in place.
  const popup = useMemo(() => {
    if (pinned != null) {
      return {
        prec: normPrec(pinned).padStart(4, "0"),
        data: lookupPrec(lookup, pinned) ?? null,
        baseData: lookupPrec(baseLookup, pinned) ?? null,
        swing: lookupPrec(swingMap, pinned) ?? null,
        isPinned: true,
      };
    }
    return hovered ? { ...hovered, isPinned: false } : null;
  }, [pinned, hovered, lookup, baseLookup, swingMap]);

  // D% across general cycles for the pinned precinct (top-of-ballot race each cycle)
  const pinnedTrend = useMemo(() => {
    if (pinned == null || !history) return [];
    const pts: { year: string; pct: number }[] = [];
    for (const key of GENERAL_TREND_CYCLES) {
      const cd = history.cycles[key];
      if (!cd?.races) continue;
      const race0 = cd.races[Object.keys(cd.races)[0]];
      const dr = findDR(race0.candidates);
      if (!dr) continue;
      const votes = lookupPrec(race0.votes, pinned);
      if (!votes) continue;
      const d = votes[dr.dIdx] ?? 0, r = votes[dr.rIdx] ?? 0;
      if (d + r === 0) continue;
      pts.push({ year: "'" + key.slice(2, 4), pct: d / (d + r) });
    }
    return pts;
  }, [pinned, history]);

  // Mirror the view into the query string so shared links reproduce it exactly
  const defaultRace = cycleData?.races ? Object.keys(cycleData.races)[0] : "";
  useUrlState(
    {
      view: viewMode,
      cycle,
      from: viewMode === "swing" ? compareCycle : null,
      race,
      area: jurisdiction,
      prec: pinned != null ? normPrec(pinned).padStart(4, "0") : null,
    },
    { view: "partisan", cycle: "2024G", from: "2020G", race: defaultRace, area: "county", prec: "" }
  );

  const deltaPresetActive = viewMode === "swing" && cycle === "2024G" && compareCycle === "2020G";

  const compareCycleData = history?.cycles[compareCycle];
  const compareAvailableRaces = compareCycleData?.races ? Object.entries(compareCycleData.races).map(([k, v]) => ({ key: k, label: v.label })) : [];

  const precincts = useMemo(() => Object.values(lookup).filter(v => v.pct != null), [lookup]);
  const demPrecincts = useMemo(() => precincts.filter(v => v.pct! > 0.5).length, [precincts]);
  const totalVotes = useMemo(() => precincts.reduce((s, v) => s + v.total, 0), [precincts]);
  const demVotes = useMemo(() => precincts.reduce((s, v) => s + v.d, 0), [precincts]);
  const overallDemPct = totalVotes ? Math.round((demVotes / totalVotes) * 100) : 0;

  const swings = useMemo(() => Object.values(swingMap).filter((s): s is number => s != null), [swingMap]);
  const dSwingCount = useMemo(() => swings.filter(s => s > 0.02).length, [swings]);
  const rSwingCount = useMemo(() => swings.filter(s => s < -0.02).length, [swings]);
  const avgSwing = useMemo(() => swings.length ? swings.reduce((a, b) => a + b, 0) / swings.length : 0, [swings]);

  const curCycleLabel = CYCLES.find(c => c.key === cycle)?.label ?? cycle;
  const cmpCycleLabel = CYCLES.find(c => c.key === compareCycle)?.label ?? compareCycle;
  const dName = precincts[0]?.dName?.split(" ").pop()?.toUpperCase() || "DEM";
  const rName = precincts[0]?.rName?.split(" ").pop()?.toUpperCase() || "REP";

  // ── Table ──────────────────────────────────────────────────────────────────
  type TableRow = PrecinctData & { prec: string; swing: number | null };
  const tableRows = useMemo<TableRow[]>(() => (
    Object.entries(lookup)
      .filter(([, d]) => d.pct != null)
      .map(([prec, d]) => ({ prec, ...d, swing: swingMap[prec] ?? null }))
  ), [lookup, swingMap]);

  const sortedRows = useMemo(() => {
    return [...tableRows].sort((a, b) => {
      let av = 0, bv = 0;
      if (sortCol === "prec") { av = parseInt(a.prec) || 0; bv = parseInt(b.prec) || 0; }
      else if (sortCol === "d") { av = a.d; bv = b.d; }
      else if (sortCol === "r") { av = a.r; bv = b.r; }
      else if (sortCol === "total") { av = a.total; bv = b.total; }
      else if (sortCol === "pct") { av = a.pct ?? 0; bv = b.pct ?? 0; }
      else if (sortCol === "margin") { av = Math.abs((a.pct ?? 0.5) - 0.5); bv = Math.abs((b.pct ?? 0.5) - 0.5); }
      else if (sortCol === "swing") { av = a.swing ?? 0; bv = b.swing ?? 0; }
      return sortDir === "asc" ? av - bv : bv - av;
    });
  }, [tableRows, sortCol, sortDir]);

  const handleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir(col === "prec" ? "asc" : "desc"); }
  };

  const legend = viewMode === "swing" ? SWING_LEGEND : PARTISAN_LEGEND;

  // One sentence that says what the map shows, computed from what's on screen.
  const where = jurisdiction === "houston" ? "City of Houston precincts" : "Harris County precincts";
  const raceLabel = availableRaces.find(r => r.key === race)?.label ?? "";
  const dFull = precincts[0]?.dName ?? "";
  const demShare = totalVotes ? (demVotes / totalVotes) * 100 : 0;
  const headline = !history
    ? "Loading precinct results…"
    : viewMode === "swing"
      ? `From the ${cmpCycleLabel.toLowerCase()} to the ${curCycleLabel.toLowerCase()}, ${dSwingCount.toLocaleString()} precincts moved toward Democrats and ${rSwingCount.toLocaleString()} toward Republicans. The average precinct moved ${Math.abs(avgSwing * 100).toFixed(1)} points toward ${avgSwing >= 0 ? "Democrats" : "Republicans"}.`
      : cycleData?.primary
        ? `In the ${curCycleLabel.toLowerCase()}, ${demShare.toFixed(1)}% of primary ballots in ${where} were cast in the Democratic primary.`
        : `In the ${curCycleLabel.slice(0, 4)} race for ${raceLabel === "President" ? "president" : raceLabel}, ${dFull} (D) won ${demShare.toFixed(1)}% of the two-party vote across ${precincts.length.toLocaleString()} ${where}.`;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "var(--font-outfit,sans-serif)" }}>

      {/* ── Header: what you're looking at, in one sentence ─────────────── */}
      <div className="border-b" style={{ background: "var(--surface)", borderColor: "var(--rule)" }}>
        <div className="max-w-6xl mx-auto px-4 md:px-6 pt-6 pb-4 flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <p className="label" style={{ color: "var(--brand)" }}>Maps · Precinct results</p>
            <h1 className="serif text-[30px] md:text-[38px] font-semibold leading-[1.05] tracking-[-0.01em] mt-1" style={{ color: "var(--ink)" }}>
              How every precinct voted
            </h1>
            <p className="text-[15px] md:text-[16px] leading-relaxed mt-2 max-w-2xl" style={{ color: "#3C443F" }}>{headline}</p>
          </div>
          <div className="shrink-0 pt-1">
            <ShareButton
              toolName="Precinct results"
              section="Maps"
              description={`Precinct-level election results · ${jurisdiction === "houston" ? "City of Houston" : "Harris County"} · 2012–2026`}
              stats={totalVotes > 0 ? [
                { label: "D", value: `${overallDemPct}%` },
                { label: "R", value: `${100 - overallDemPct}%` },
                { label: "Votes", value: totalVotes.toLocaleString() },
              ] : undefined}
              summary={`${headline} Via The Harris County Project`}
              light={false}
            />
          </div>
        </div>

        {/* ── Controls: plain words, one job each ───────────────────────── */}
        <div className="max-w-6xl mx-auto px-4 md:px-6 pb-4 grid gap-3 md:grid-cols-[auto_1fr] md:items-end">
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 items-end">
            <div className="col-span-2 sm:col-span-1">
              <p className="label mb-1.5" style={{ color: "#6B726D", fontSize: 10 }}>Show</p>
              <div className="flex rounded-md p-0.5 border w-full sm:w-auto" style={{ borderColor: "var(--rule-strong)", background: "var(--surface)" }} role="tablist" aria-label="What the colors show">
                {(["partisan", "swing"] as const).map(mode => (
                  <button key={mode} role="tab" aria-selected={viewMode === mode}
                    onClick={() => {
                      setViewMode(mode);
                      if (mode === "swing" && !cycle.endsWith("G")) { setCycle("2024G"); setCompareCycle("2020G"); }
                      setShowIframe(false);
                    }}
                    className="flex-1 sm:flex-none px-3.5 py-2 text-[14px] font-semibold rounded-[5px] transition-colors"
                    style={viewMode === mode ? { background: "var(--ink)", color: "#fff" } : { color: "#3C443F" }}>
                    {mode === "partisan" ? "Who won" : "What changed"}
                  </button>
                ))}
              </div>
            </div>

            {viewMode === "swing" && (
              <Field label="Compared with">
                <select value={compareCycle} onChange={e => setCompareCycle(e.target.value)} className={SELECT} style={SELECT_STYLE}>
                  {CYCLES.filter(c => c.key !== cycle).map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </Field>
            )}
            <Field label={viewMode === "swing" ? "Election" : "Election"}>
              <select value={cycle} onChange={e => { setCycle(e.target.value); setShowIframe(false); }} className={SELECT} style={SELECT_STYLE}>
                <optgroup label="General elections">
                  {CYCLES.filter(c => c.key.endsWith("G")).map(c => <option key={c.key} value={c.key}>{c.label.replace(" General", " general")}</option>)}
                </optgroup>
                <optgroup label="Primaries (ballots cast in each party)">
                  {CYCLES.filter(c => c.key.endsWith("P")).map(c => <option key={c.key} value={c.key}>{c.label.replace(" Primary", " primary")}</option>)}
                </optgroup>
              </select>
            </Field>
            {availableRaces.length > 1 && (
              <Field label="Race">
                <select value={race ?? ""} onChange={e => setRace(e.target.value || null)} className={SELECT} style={SELECT_STYLE}>
                  {availableRaces.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                </select>
              </Field>
            )}
            <Field label="Area">
              <select value={jurisdiction} onChange={e => setJurisdiction(e.target.value as Jurisdiction)} className={SELECT} style={SELECT_STYLE}>
                <option value="county">All of Harris County</option>
                <option value="houston">City of Houston precincts</option>
              </select>
            </Field>
          </div>

          <form onSubmit={findPrecinct} className="md:justify-self-end w-full md:max-w-sm" role="search" aria-label="Find a precinct">
            <p className="label mb-1.5" style={{ color: "#6B726D", fontSize: 10 }}>Find a precinct</p>
            <div className="flex gap-2">
              <input value={findQ} onChange={e => setFindQ(e.target.value)} inputMode="search" enterKeyHint="search"
                placeholder="Precinct number or street address" aria-label="Precinct number or street address"
                className="min-w-0 flex-1 rounded-md border px-3 py-2 text-[15px] outline-none focus:ring-2"
                style={{ borderColor: "var(--rule-strong)", background: "#fff", ["--tw-ring-color" as string]: "var(--brand)" }} />
              <button type="submit" className="btn btn-ink !py-2 shrink-0" disabled={finding}>{finding ? "…" : "Go"}</button>
            </div>
            {findErr && <p role="alert" className="text-[13px] mt-1.5" style={{ color: "#962A20" }}>{findErr}</p>}
          </form>
        </div>

        {cycle === "2026P" && (
          <div className="max-w-6xl mx-auto px-4 md:px-6 pb-4">
            <button onClick={() => setShowIframe(v => !v)} className="text-[14px] font-bold" style={{ color: "var(--brand)" }}>
              {showIframe ? "← Back to the map" : "See the 2026 primaries race by race →"}
            </button>
          </div>
        )}
      </div>

      {/* 2026 race-by-race iframe panel */}
      {showIframe && (
        <iframe
          src="/heat-check.html"
          className="w-full border-0"
          style={{ height: "calc(100dvh - 160px)" }}
          title="2026 primary results, race by race"
          allowFullScreen
        />
      )}

      {!showIframe && (<>
      {/* ── Legend: above the map, never covering it ─────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-3">
        <div className="flex gap-[3px]" role="img" aria-label={`Color key: ${legend.map(l => l.label).join(", ")}`}>
          {legend.map(l => (
            <div key={l.color} className="flex-1 min-w-0">
              <div className="h-2.5 rounded-[2px]" style={{ background: l.color }} />
              <p className="hidden sm:block text-[11px] mt-1 truncate num" style={{ color: "#4F5752" }}>{l.label}</p>
            </div>
          ))}
        </div>
        <div className="sm:hidden flex justify-between text-[11px] mt-1" style={{ color: "#4F5752" }}>
          <span>{viewMode === "swing" ? "Moved toward D" : "More Democratic"}</span>
          <span>{viewMode === "swing" ? "No change" : "Even"}</span>
          <span>{viewMode === "swing" ? "Moved toward R" : "More Republican"}</span>
        </div>
      </div>

      <div className="relative md:max-w-none" style={{ height: coarse ? "min(62vh, 520px)" : 560 }}>
        <div ref={mapRef} style={{ height: "100%", width: "100%" }} aria-label="Precinct map. Use the Find a precinct box above for a text lookup." />

        {loadError && (
          <div className="absolute inset-0 z-[1100] flex items-center justify-center" style={{ background: "rgba(241,242,238,0.96)" }}>
            <div className="text-center max-w-xs px-4">
              <p className="text-[15px] font-bold mb-1" style={{ color: "var(--ink)" }}>Precinct data didn’t load</p>
              <p className="text-[13px] mb-3 leading-relaxed" style={{ color: "#5B635E" }}>Check your connection and try again.</p>
              <button onClick={loadData} className="btn btn-ink">Try again</button>
            </div>
          </div>
        )}

        {/* Desktop: card floats over the map */}
        {popup && !coarse && (
          <div className="absolute bottom-4 left-4 z-[1000] w-[280px] hidden md:block">
            <PrecinctCard popup={popup} viewMode={viewMode} curCycleLabel={curCycleLabel} cmpCycleLabel={cmpCycleLabel} trend={pinnedTrend} onClose={() => setPinned(null)} />
          </div>
        )}
      </div>

      {/* Phones and tablets: numbers sit below the map, where a thumb can't knock the map around */}
      <div className={coarse ? "block" : "md:hidden"}>
        <div className="max-w-6xl mx-auto px-4 md:px-6 pt-3">
          {popup ? (
            <PrecinctCard popup={popup} viewMode={viewMode} curCycleLabel={curCycleLabel} cmpCycleLabel={cmpCycleLabel} trend={pinnedTrend} onClose={() => setPinned(null)} />
          ) : (
            <p className="text-[14px] leading-relaxed" style={{ color: "#4F5752" }}>
              {coarse
                ? "Tap any precinct for its numbers. Scroll the page with one finger; pinch or use two fingers to move the map."
                : "Select any precinct for its numbers, or search above."}
            </p>
          )}
        </div>
      </div>
      {!coarse && !popup && (
        <p className="hidden md:block max-w-6xl mx-auto px-6 pt-2 text-[13px]" style={{ color: "#6B726D" }}>
          Hover a precinct for its numbers; click to keep the card open. Zoom with the + and − buttons or double-click.
        </p>
      )}

      {/* Insight rail: computed shift, turnout, and flippable rankings */}
      <HeatCheckInsights history={history} />

      {/* Detail table */}
      {sortedRows.length > 0 && (
        <div className="border-t border-black/8">
          <div className="px-5 py-2.5 flex items-center justify-between bg-white/70 border-b border-black/8">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "#374151" }}>
              {viewMode === "swing"
                ? `Precinct Swing · ${cmpCycleLabel} → ${curCycleLabel}`
                : `Precinct Detail · ${curCycleLabel}`}
              <span className="font-normal ml-1.5" style={{ color: "#9ca3af" }}>({precincts.length.toLocaleString()} precincts)</span>
            </p>
            <p className="text-[9px]" style={{ color: "#9ca3af" }}>Click headers to sort</p>
          </div>

          <div style={{ maxHeight: 380, overflowY: "auto" }}>
            <table className="w-full" style={{ borderCollapse: "collapse", fontSize: 11 }}>
              <thead style={{ position: "sticky", top: 0, background: "#fff", zIndex: 10, borderBottom: "2px solid rgba(0,0,0,0.08)" }}>
                <tr>
                  {([
                    { col: "prec" as SortCol, label: "PREC" },
                    { col: "d" as SortCol, label: dName },
                    { col: "r" as SortCol, label: rName },
                    { col: "total" as SortCol, label: "VOTES" },
                    { col: "pct" as SortCol, label: "D%" },
                    viewMode === "swing"
                      ? { col: "swing" as SortCol, label: "SWING" }
                      : { col: "margin" as SortCol, label: "LEAD%" },
                  ]).map(h => (
                    <th key={h.col} onClick={() => handleSort(h.col)}
                      className="px-3 py-2 text-left cursor-pointer select-none"
                      style={{
                        color: sortCol === h.col ? "#0D2A21" : "#6b7280",
                        fontWeight: sortCol === h.col ? 800 : 600,
                        letterSpacing: "0.12em",
                        fontSize: 9,
                        whiteSpace: "nowrap",
                      }}>
                      {h.label}{sortCol === h.col ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row, i) => {
                  const isD = (row.pct ?? 0) > 0.5;
                  const margin = Math.abs((row.pct ?? 0.5) - 0.5) * 2;
                  return (
                    <tr key={row.prec}
                      style={{ background: i % 2 === 0 ? "#fff" : "#f9fafb", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                      <td className="px-3 py-1.5">
                        <span className="font-bold" style={{ color: "#374151" }}>{row.prec.padStart(4, "0")}</span>
                        {(() => {
                          const d = precinctDistricts(row.prec);
                          const chips = [
                            d.hd && { label: `HD ${d.hd}`, href: `/tools/districts?type=hd&district=${d.hd}` },
                            d.sd && { label: `SD ${d.sd}`, href: `/tools/districts?type=sd&district=${d.sd}` },
                          ].filter(Boolean) as { label: string; href: string }[];
                          if (!chips.length) return null;
                          return (
                            <div className="flex gap-1 mt-0.5">
                              {chips.map(c => (
                                <Link key={c.href} href={c.href}
                                  className="text-[8px] font-semibold hover:opacity-75"
                                  style={{ color: "#7aaee8" }}>
                                  {c.label} →
                                </Link>
                              ))}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-3 py-1.5 font-semibold tabular-nums" style={{ color: "#1d4ed8" }}>
                        {row.d.toLocaleString()}
                      </td>
                      <td className="px-3 py-1.5 font-semibold tabular-nums" style={{ color: "#dc2626" }}>
                        {row.r.toLocaleString()}
                      </td>
                      <td className="px-3 py-1.5 tabular-nums" style={{ color: "#374151" }}>
                        {row.total.toLocaleString()}
                      </td>
                      <td className="px-3 py-1.5 font-bold tabular-nums" style={{ color: isD ? "#1d4ed8" : "#dc2626" }}>
                        {Math.round((row.pct ?? 0) * 100)}%
                      </td>
                      {viewMode === "swing" ? (
                        <td className="px-3 py-1.5 font-bold tabular-nums"
                          style={{ color: row.swing != null ? (row.swing > 0 ? "#1d4ed8" : "#dc2626") : "#9ca3af" }}>
                          {row.swing != null
                            ? `${row.swing > 0 ? "+" : ""}${(row.swing * 100).toFixed(1)}%`
                            : "–"}
                        </td>
                      ) : (
                        <td className="px-3 py-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold tabular-nums" style={{ color: isD ? "#1d4ed8" : "#dc2626", minWidth: 28, fontSize: 11 }}>
                              {Math.round(margin * 100)}%
                            </span>
                            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#e5e7eb", width: 48 }}>
                              <div className="h-full rounded-full transition-all" style={{
                                width: `${Math.min(margin * 100, 100)}%`,
                                background: isD ? "#2563a8" : "#dc2626",
                              }} />
                            </div>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="px-5 py-2 text-[10px] border-t border-black/8" style={{ color: "#9ca3af" }}>
        {viewMode === "swing"
          ? `Swing = ${curCycleLabel} D% minus ${cmpCycleLabel} D% (two-party share). Source: TLC TED API (2012–2024) · MEDSL (2018G) · VEST/Harvard (2016G) · HC Clerk (2026 primary).`
          : cycle === "2026P"
            ? `Source: Harris County Clerk · 2026 Primary · D primary vs R primary ballot counts by precinct.`
            : cycle === "2016G"
              ? `Source: VEST / Harvard Dataverse (doi:10.7910/DVN/NH5S2I) · ${curCycleLabel} · Two-party share (D vs R).`
              : cycle === "2018G"
                ? `Source: MIT Election Data + Science Lab (MEDSL) · ${curCycleLabel} · Two-party share (D vs R).`
                : cycle.endsWith("P")
                  ? `Source: Texas Legislative Council TED API · ${curCycleLabel} · D primary vs R primary ballot counts by precinct.`
                  : `Source: Texas Legislative Council TED API · ${curCycleLabel} · Two-party share (D vs R).`}
        {jurisdiction === "houston" ? " City of Houston boundary: U.S. Census TIGER 2020." : ""}
      </p>

      <RelatedTools current="/tools/heat-check" className="px-5 py-4 border-t border-black/8" />
      </>)}
    </div>
  );
}


/* ── Small pieces ───────────────────────────────────────────────────────── */

const SELECT = "w-full rounded-md border px-2.5 py-2 text-[14px] font-semibold";
const SELECT_STYLE: React.CSSProperties = { borderColor: "var(--rule-strong)", background: "#fff", color: "var(--ink)" };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="label block mb-1.5" style={{ color: "#6B726D", fontSize: 10 }}>{label}</span>
      {children}
    </label>
  );
}

interface CardData { prec: string; data: PrecinctData | null; baseData: PrecinctData | null; swing: number | null; isPinned: boolean }

function PrecinctCard({ popup, viewMode, curCycleLabel, cmpCycleLabel, trend, onClose }: {
  popup: CardData; viewMode: ViewMode; curCycleLabel: string; cmpCycleLabel: string;
  trend: { year: string; pct: number }[]; onClose: () => void;
}) {
  const d = precinctDistricts(popup.prec);
  const pct = popup.data?.pct;
  return (
    <div className="panel p-4 shadow-[0_10px_30px_rgba(18,23,20,0.14)]" role="region" aria-label={`Precinct ${popup.prec}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="label" style={{ color: "#6B726D", fontSize: 10 }}>{curCycleLabel}</p>
          <p className="serif text-[22px] font-semibold leading-tight" style={{ color: "var(--ink)" }}>Precinct {popup.prec}</p>
        </div>
        {popup.isPinned && (
          <button onClick={onClose} aria-label="Close precinct card" className="w-9 h-9 -mr-2 -mt-1 rounded-md text-[18px] hover:bg-[var(--paper)]" style={{ color: "#5B635E" }}>×</button>
        )}
      </div>

      {pct != null ? (
        viewMode === "swing" && popup.swing != null ? (
          <div className="mt-3 space-y-1.5 text-[14px] num">
            <div className="flex justify-between"><span style={{ color: "#5B635E" }}>{cmpCycleLabel}</span><strong>{((popup.baseData?.pct ?? 0) * 100).toFixed(1)}% D</strong></div>
            <div className="flex justify-between"><span style={{ color: "#5B635E" }}>{curCycleLabel}</span><strong>{(pct * 100).toFixed(1)}% D</strong></div>
            <div className="flex justify-between pt-1.5 border-t" style={{ borderColor: "var(--rule)" }}>
              <span style={{ color: "#5B635E" }}>Change</span>
              <strong style={{ color: popup.swing > 0 ? "#2350C2" : "#C0392E" }}>{Math.abs(popup.swing * 100).toFixed(1)} pts toward {popup.swing > 0 ? "D" : "R"}</strong>
            </div>
          </div>
        ) : (
          <div className="mt-3">
            <div className="flex justify-between text-[14px] font-bold num">
              <span style={{ color: "#2350C2" }}>{popup.data!.dName} {(pct * 100).toFixed(1)}%</span>
              <span style={{ color: "#C0392E" }}>{((1 - pct) * 100).toFixed(1)}% {popup.data!.rName}</span>
            </div>
            <div className="flex h-2.5 rounded-full overflow-hidden mt-1.5" style={{ background: "#E4E6E0" }}>
              <span style={{ width: `${pct * 100}%`, background: "#2350C2" }} />
              <span style={{ width: `${(1 - pct) * 100}%`, background: "#C0392E" }} />
            </div>
            <p className="text-[13px] mt-1.5 num" style={{ color: "#5B635E" }}>
              {popup.data!.d.toLocaleString()} to {popup.data!.r.toLocaleString()} · {popup.data!.total.toLocaleString()} two-party votes
            </p>
          </div>
        )
      ) : (
        <p className="text-[14px] mt-3" style={{ color: "#6B726D" }}>No votes recorded here for this election.</p>
      )}

      {popup.isPinned && trend.length >= 2 && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--rule)" }}>
          <p className="label mb-1.5" style={{ color: "#6B726D", fontSize: 10 }}>Democratic share, every general since {trend[0].year}</p>
          <div className="flex items-end gap-1.5 h-[68px]" aria-label={trend.map(t => `${t.year} ${Math.round(t.pct * 100)}%`).join(", ")}>
            {trend.map(t => (
              <div key={t.year} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[11px] font-bold num" style={{ color: t.pct >= 0.5 ? "#2350C2" : "#C0392E" }}>{Math.round(t.pct * 100)}</span>
                <div className="w-full rounded-t-[2px]" style={{ height: `${Math.max(3, (t.pct - 0.2) / 0.8 * 34)}px`, background: t.pct >= 0.5 ? "#3F66CF" : "#D2584B" }} />
                <span className="text-[10px] num" style={{ color: "#6B726D" }}>{t.year}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(d.hd || d.sd || d.cd) && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {d.cd && <Link href={`/races/cd-${d.cd}`} className="text-[13px] font-semibold px-2.5 py-1 rounded-full border hover:bg-[var(--paper)]" style={{ borderColor: "var(--rule-strong)", color: "var(--ink)" }}>Congress {d.cd}</Link>}
          {d.sd && <Link href={`/tools/districts?type=sd&district=${d.sd}`} className="text-[13px] font-semibold px-2.5 py-1 rounded-full border hover:bg-[var(--paper)]" style={{ borderColor: "var(--rule-strong)", color: "var(--ink)" }}>State Senate {d.sd}</Link>}
          {d.hd && <Link href={`/tools/districts?type=hd&district=${d.hd}`} className="text-[13px] font-semibold px-2.5 py-1 rounded-full border hover:bg-[var(--paper)]" style={{ borderColor: "var(--rule-strong)", color: "var(--ink)" }}>State House {d.hd}</Link>}
        </div>
      )}

      {popup.isPinned ? (
        <Link href={`/tools/precinct-lookup?p=${popup.prec}`} className="btn btn-gold w-full justify-center mt-3 !py-2.5">
          Full history for precinct {popup.prec} →
        </Link>
      ) : (
        <p className="text-[12px] mt-3" style={{ color: "#8A918C" }}>Click to keep this card open.</p>
      )}
    </div>
  );
}
