"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import "leaflet/dist/leaflet.css";

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
  if (pct >= 0.65) return "#1e3a8a";
  if (pct >= 0.57) return "#2563a8";
  if (pct >= 0.52) return "#7aaee8";
  if (pct >= 0.48) return "#a78bfa";
  if (pct >= 0.43) return "#e58f8f";
  if (pct >= 0.35) return "#dc2626";
  return "#991b1b";
}

function swingColor(swing: number): string {
  if (swing >= 0.10) return "#1e3a8a";
  if (swing >= 0.05) return "#2563a8";
  if (swing >= 0.02) return "#93c5fd";
  if (swing >= -0.02) return "#d1d5db";
  if (swing >= -0.05) return "#fca5a5";
  if (swing >= -0.10) return "#dc2626";
  return "#991b1b";
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

// Pure function — compute precinct data for any cycle/race
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
  { color: "#1e3a8a", label: "Strong Dem (65%+)" },
  { color: "#2563a8", label: "Dem (57–65%)" },
  { color: "#7aaee8", label: "Lean Dem (52–57%)" },
  { color: "#a78bfa", label: "Toss-up (48–52%)" },
  { color: "#e58f8f", label: "Lean Rep (43–48%)" },
  { color: "#dc2626", label: "Rep (35–43%)" },
  { color: "#991b1b", label: "Strong Rep (<35% D)" },
];

const SWING_LEGEND = [
  { color: "#1e3a8a", label: "Shifted D 10%+" },
  { color: "#2563a8", label: "Shifted D 5–10%" },
  { color: "#93c5fd", label: "Shifted D 2–5%" },
  { color: "#d1d5db", label: "Stable (±2%)" },
  { color: "#fca5a5", label: "Shifted R 2–5%" },
  { color: "#dc2626", label: "Shifted R 5–10%" },
  { color: "#991b1b", label: "Shifted R 10%+" },
];

const CYCLES = [
  { key: "2026P", label: "2026 Primary" },
  { key: "2024G", label: "2024 General" },
  { key: "2022G", label: "2022 General" },
  { key: "2020G", label: "2020 General" },
  { key: "2018G", label: "2018 General" },
  { key: "2016G", label: "2016 General" },
];

type Jurisdiction = "county" | "houston";

type SortCol = "prec" | "d" | "r" | "total" | "pct" | "margin" | "swing";
type SortDir = "asc" | "desc";
type ViewMode = "partisan" | "swing";

// ── Component ─────────────────────────────────────────────────────────────────
export default function HeatCheckHistoryMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const geoLayerRef = useRef<L.GeoJSON | null>(null);

  const [history, setHistory] = useState<PrecinctHistory | null>(null);
  const [geojson, setGeojson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [houstonPrecs, setHoustonPrecs] = useState<Set<string> | null>(null);

  // Selectors
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction>("county");
  const [cycle, setCycle] = useState("2026P");
  const [showIframe, setShowIframe] = useState(false);
  const [race, setRace] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("partisan");
  const [compareCycle, setCompareCycle] = useState("2020G");
  const [compareRace, setCompareRace] = useState<string | null>(null);

  // Table
  const [sortCol, setSortCol] = useState<SortCol>("prec");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Tooltip
  const [hovered, setHovered] = useState<{
    prec: string; data: PrecinctData | null; baseData: PrecinctData | null; swing: number | null;
  } | null>(null);

  // ── Load data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch("/data/precinct-history.json").then(r => r.json()),
      fetch("/data/harris-precincts.geojson").then(r => r.json()),
      fetch("/data/houston-precincts.json").then(r => r.json()),
    ]).then(([h, g, hp]) => {
      setHistory(h);
      setGeojson(g);
      setHoustonPrecs(new Set<string>(hp));
    }).catch(console.error);
  }, []);

  // Auto-select race when cycle changes
  useEffect(() => {
    if (!history) return;
    const cd = history.cycles[cycle];
    setRace(cd?.races ? Object.keys(cd.races)[0] : null);
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
      const map = L.map(mapRef.current!, { zoomControl: true, scrollWheelZoom: true })
        .setView([29.78, -95.37], 10);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", {
        attribution: "© CartoDB", maxZoom: 16,
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
          lyr.on("mouseover", () => {
            const inJurisdiction = jurisdiction !== "houston" || filterPrec(raw);
            if (!inJurisdiction) return;
            (lyr as L.Path).setStyle({ weight: 2, color: "#fbbf24", opacity: 1 });
            const norm = normPrec(raw).padStart(4, "0");
            setHovered({
              prec: norm,
              data: lookupPrec(lookup, raw) ?? null,
              baseData: lookupPrec(baseLookup, raw) ?? null,
              swing: lookupPrec(swingMap, raw) ?? null,
            });
          });
          lyr.on("mouseout", () => { layer.resetStyle(lyr); setHovered(null); });
        },
      }).addTo(leafletMap.current!);

      geoLayerRef.current = layer;
    });
  }, [geojson, lookup, baseLookup, swingMap, viewMode, jurisdiction, filterPrec]); // eslint-disable-line

  // ── Derived display values ─────────────────────────────────────────────────
  const cycleData = history?.cycles[cycle];
  const availableRaces = cycleData?.races ? Object.entries(cycleData.races).map(([k, v]) => ({ key: k, label: v.label })) : [];

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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "var(--font-outfit,sans-serif)" }}>

      {/* Page header */}
      <div className="flex items-end gap-0 px-5 pt-5 pb-0 border-b border-black/8"
        style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)" }}>
        <div className="pb-3 mr-auto">
          <h1 style={{ fontFamily: "var(--font-dancing), cursive", fontSize: "1.6rem", lineHeight: 1, color: "var(--accent)" }}>
            Heat Check
          </h1>
          <p className="text-[10px]" style={{ color: "#9ca3af" }}>
            {jurisdiction === "houston" ? "City of Houston precincts" : "Harris County"} · precinct-level election results · 2016 – 2026
          </p>
        </div>
      </div>

      {/* Controls row 1 */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-black/8 bg-white/60"
        style={{ backdropFilter: "blur(8px)" }}>

        {/* Jurisdiction selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "#6b7280" }}>Area</span>
          <select
            value={jurisdiction}
            onChange={e => setJurisdiction(e.target.value as Jurisdiction)}
            className="rounded-lg border border-black/10 px-2.5 py-1.5 text-[11px] font-semibold bg-white"
            style={{ color: "#374151" }}>
            <option value="county">Harris County</option>
            <option value="houston">City of Houston</option>
          </select>
        </div>

        {/* View mode toggle */}
        <div className="flex rounded-lg overflow-hidden border border-black/10">
          {(["partisan", "swing"] as const).map(mode => (
            <button key={mode} onClick={() => setViewMode(mode)}
              className="px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] transition-colors"
              style={{
                background: viewMode === mode ? "#0f2540" : "#fff",
                color: viewMode === mode ? "#fbbf24" : "#6b7280",
                borderRight: "1px solid rgba(0,0,0,0.08)",
              }}>
              {mode === "partisan" ? "Partisan" : "⇄ Swing"}
            </button>
          ))}
        </div>

        {/* Cycle dropdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "#6b7280" }}>
            {viewMode === "swing" ? "To" : "Election"}
          </span>
          <select
            value={cycle}
            onChange={e => { setCycle(e.target.value); setShowIframe(false); }}
            className="rounded-lg border border-black/10 px-2.5 py-1.5 text-[11px] font-semibold bg-white"
            style={{ color: "#374151" }}>
            {CYCLES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </div>

        {/* Race dropdown */}
        {availableRaces.length > 1 && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "#6b7280" }}>Race</span>
            <select
              value={race ?? ""}
              onChange={e => setRace(e.target.value || null)}
              className="rounded-lg border border-black/10 px-2.5 py-1.5 text-[11px] font-semibold bg-white"
              style={{ color: "#374151" }}>
              {availableRaces.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>
          </div>
        )}

        {/* 2026 race detail toggle */}
        {cycle === "2026P" && (
          <button
            onClick={() => setShowIframe(v => !v)}
            className="px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors"
            style={{
              background: showIframe ? "#2563a8" : "#fff",
              color: showIframe ? "#fff" : "#2563a8",
              borderColor: "#2563a8",
            }}>
            {showIframe ? "← Partisan Map" : "Race Breakdown →"}
          </button>
        )}

        {/* Partisan summary chips */}
        {viewMode === "partisan" && precincts.length > 0 && !showIframe && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold" style={{ background: "#dbeafe", color: "#1d4ed8" }}>
              {demPrecincts.toLocaleString()} D precincts
            </span>
            <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold" style={{ background: "#fee2e2", color: "#dc2626" }}>
              {(precincts.length - demPrecincts).toLocaleString()} R
            </span>
            <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold" style={{ background: "#f3f4f6", color: "#374151" }}>
              {overallDemPct}% D countywide
            </span>
          </div>
        )}
      </div>

      {/* Controls row 2 — swing compare */}
      {viewMode === "swing" && !showIframe && (
        <div className="flex flex-wrap items-center gap-3 px-5 py-2.5 border-b border-black/8"
          style={{ background: "rgba(254,243,199,0.5)" }}>
          <span className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: "#92400e" }}>From</span>

          <select
            value={compareCycle}
            onChange={e => setCompareCycle(e.target.value)}
            className="rounded-lg border border-amber-200 px-2.5 py-1.5 text-[11px] font-semibold bg-white"
            style={{ color: "#374151" }}>
            {CYCLES.filter(c => c.key !== cycle).map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>

          {compareAvailableRaces.length > 1 && (
            <>
              <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "#92400e" }}>Race</span>
              <select
                value={compareRace ?? ""}
                onChange={e => setCompareRace(e.target.value || null)}
                className="rounded-lg border border-amber-200 px-2.5 py-1.5 text-[11px] font-semibold bg-white"
                style={{ color: "#374151" }}>
                {compareAvailableRaces.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
              </select>
            </>
          )}

          {swings.length > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold" style={{ background: "#dbeafe", color: "#1d4ed8" }}>
                {dSwingCount.toLocaleString()} → D
              </span>
              <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold" style={{ background: "#fee2e2", color: "#dc2626" }}>
                {rSwingCount.toLocaleString()} → R
              </span>
              <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold"
                style={{ background: "#f3f4f6", color: avgSwing > 0 ? "#1d4ed8" : "#dc2626" }}>
                Avg {avgSwing >= 0 ? "+" : ""}{(avgSwing * 100).toFixed(1)}% D
              </span>
            </div>
          )}
        </div>
      )}

      {/* 2026 race-by-race iframe panel */}
      {showIframe && (
        <iframe
          src="/heat-check.html"
          className="w-full border-0"
          style={{ height: "calc(100dvh - 41px - 112px)" }}
          title="Heat Check — Harris County 2026 Primary Race Detail"
          allowFullScreen
        />
      )}

      {/* Map + table + footer — hidden when iframe is shown */}
      {!showIframe && (<><div className="relative" style={{ height: 520 }}>
        <div ref={mapRef} style={{ height: "100%", width: "100%" }} />

        {/* Hover tooltip */}
        {hovered && (
          <div className="absolute bottom-4 left-4 rounded-xl p-3 z-[1000] min-w-[200px]"
            style={{ background: "rgba(15,37,64,0.93)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
              Precinct {hovered.prec}
            </p>
            {hovered.data?.pct != null ? (
              viewMode === "swing" && hovered.swing != null ? (
                <>
                  <div className="flex justify-between mb-1">
                    <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>{cmpCycleLabel}</span>
                    <span className="text-xs font-bold text-white">{Math.round((hovered.baseData?.pct ?? 0) * 100)}% D</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>{curCycleLabel}</span>
                    <span className="text-xs font-bold text-white">{Math.round(hovered.data.pct * 100)}% D</span>
                  </div>
                  <div className="flex justify-between mt-1.5 pt-1.5 border-t border-white/10">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "rgba(255,255,255,0.45)" }}>Swing</span>
                    <span className="text-sm font-black" style={{ color: hovered.swing > 0 ? "#7aaee8" : "#f87171" }}>
                      {hovered.swing > 0 ? "+" : ""}{(hovered.swing * 100).toFixed(1)}% {hovered.swing > 0 ? "D" : "R"}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between gap-4 mb-1">
                    <span className="text-xs font-bold" style={{ color: "#7aaee8" }}>{hovered.data.dName}</span>
                    <span className="text-xs font-bold text-white">{Math.round(hovered.data.pct * 100)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full mb-2 overflow-hidden" style={{ background: "#f87171" }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.round(hovered.data.pct * 100)}%`, background: "#2563a8" }} />
                  </div>
                  <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.45)" }}>
                    {hovered.data.d.toLocaleString()} D · {hovered.data.r.toLocaleString()} R · {hovered.data.total.toLocaleString()} total
                  </p>
                </>
              )
            ) : (
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>No data</p>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="absolute top-3 right-3 rounded-xl p-2.5 z-[1000]"
          style={{ background: "rgba(255,255,255,0.93)", backdropFilter: "blur(8px)", border: "1px solid rgba(0,0,0,0.08)" }}>
          {legend.map(l => (
            <div key={l.color} className="flex items-center gap-1.5 mb-0.5">
              <span className="inline-block w-3 h-3 rounded-sm flex-shrink-0" style={{ background: l.color }} />
              <span className="text-[9px]" style={{ color: "#374151" }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

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
                        color: sortCol === h.col ? "#1a3a5c" : "#6b7280",
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
                      <td className="px-3 py-1.5 font-bold" style={{ color: "#374151" }}>
                        {row.prec.padStart(4, "0")}
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
                            : "—"}
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
          ? `Swing = ${curCycleLabel} D% minus ${cmpCycleLabel} D% (two-party share). Source: TLC TED API (2020–2024) · MEDSL (2018) · VEST/Harvard (2016) · HC Clerk (2026 primary).`
          : cycle === "2026P"
            ? `Source: Harris County Clerk · 2026 Primary · D primary vs R primary ballot counts by precinct.`
            : cycle === "2016G"
              ? `Source: VEST / Harvard Dataverse (doi:10.7910/DVN/NH5S2I) · ${curCycleLabel} · Two-party share (D vs R).`
              : cycle === "2018G"
                ? `Source: MIT Election Data + Science Lab (MEDSL) · ${curCycleLabel} · Two-party share (D vs R).`
                : `Source: Texas Legislative Council TED API · ${curCycleLabel} · Two-party share (D vs R).`}
        {jurisdiction === "houston" ? " City of Houston boundary: U.S. Census TIGER 2020." : ""}
      </p>
      </>)}
    </div>
  );
}
