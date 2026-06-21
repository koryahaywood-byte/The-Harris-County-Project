"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import "leaflet/dist/leaflet.css";
import crosswalkRaw from "@/lib/precinct-crosswalk.json";

type DistrictField = "cd" | "sd" | "hd" | "jp" | "council" | "pct";

interface Props {
  districtField: DistrictField | null;
  districtValue: string | null;
  districtLabel: string;
}

interface HistCandidate { name: string; party: string }
interface HistRace { label: string; candidates: HistCandidate[]; votes: Record<string, number[]> }
interface HistCycle {
  label: string;
  races?: Record<string, HistRace>;
  primary?: Record<string, { dem: number; rep: number }>;
}
interface PrecinctHistory { cycles: Record<string, HistCycle> }

const CROSSWALK = (crosswalkRaw as { precincts: Record<string, Record<string, string>> }).precincts;

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

function partisanColor(pct: number): string {
  if (pct >= 0.65) return "#1e3a8a";
  if (pct >= 0.57) return "#2563a8";
  if (pct >= 0.52) return "#7aaee8";
  if (pct >= 0.48) return "#a78bfa";
  if (pct >= 0.43) return "#e58f8f";
  if (pct >= 0.35) return "#dc2626";
  return "#991b1b";
}

function normPrec(raw: string): string { return raw.replace(/^0+/, "") || "0"; }

function computePrecinctData(
  history: PrecinctHistory, cycle: string, race: string | null
): Record<string, { pct: number | null; d: number; r: number; total: number }> {
  const cd = history.cycles[cycle];
  if (!cd) return {};
  const result: Record<string, { pct: number | null; d: number; r: number; total: number }> = {};

  if (cd.primary) {
    for (const [prec, v] of Object.entries(cd.primary)) {
      const d = v.dem, r = v.rep, total = d + r;
      result[prec] = { pct: total ? d / total : null, d, r, total };
    }
    return result;
  }

  if (cd.races && race && cd.races[race]) {
    const r_ = cd.races[race];
    const dIdx = r_.candidates.findIndex(c => c.party === "D");
    const rIdx = r_.candidates.findIndex(c => c.party === "R");
    if (dIdx === -1 || rIdx === -1) return {};
    for (const [prec, votes] of Object.entries(r_.votes)) {
      const d = votes[dIdx] ?? 0, r = votes[rIdx] ?? 0, total = d + r;
      result[prec] = { pct: total ? d / total : null, d, r, total };
    }
  }
  return result;
}

export default function DistrictHeatMap({ districtField, districtValue, districtLabel }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const geoLayerRef = useRef<L.GeoJSON | null>(null);

  const [history, setHistory] = useState<PrecinctHistory | null>(null);
  const [geojson, setGeojson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [cycle, setCycle] = useState("2024G");
  const [race, setRace] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/data/precinct-history.json").then(r => r.json()),
      fetch("/data/harris-precincts.geojson").then(r => r.json()),
    ]).then(([h, g]) => { setHistory(h); setGeojson(g); }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!history) return;
    const cd = history.cycles[cycle];
    setRace(cd?.races ? Object.keys(cd.races)[0] : null);
  }, [cycle, history]);

  // Precincts that belong to this district
  const districtPrecs = useMemo<Set<string> | null>(() => {
    if (!districtField || !districtValue) return null;
    const s = new Set<string>();
    for (const [prec, vals] of Object.entries(CROSSWALK)) {
      if (vals[districtField] === districtValue) s.add(prec);
    }
    return s;
  }, [districtField, districtValue]);

  function inDistrict(raw: string): boolean {
    if (!districtPrecs) return true;
    const n = normPrec(raw);
    return districtPrecs.has(raw) || districtPrecs.has(n) || districtPrecs.has(n.padStart(4, "0"));
  }

  const lookup = useMemo(
    () => history ? computePrecinctData(history, cycle, race) : {},
    [history, cycle, race]
  );

  function getPrec(raw: string) {
    const n = normPrec(raw);
    return lookup[raw] ?? lookup[n] ?? lookup[n.padStart(4, "0")];
  }

  // Init map
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;
    import("leaflet").then(L => {
      const map = L.map(mapRef.current!, { zoomControl: true, scrollWheelZoom: false })
        .setView([29.78, -95.37], 10);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", {
        attribution: "© CartoDB", maxZoom: 16,
      }).addTo(map);
      leafletMap.current = map;
    });
    return () => { if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null; } };
  }, []);

  // Render GeoJSON layer + fit to district bounds
  useEffect(() => {
    if (!leafletMap.current || !geojson) return;
    import("leaflet").then(L => {
      if (geoLayerRef.current) { geoLayerRef.current.remove(); geoLayerRef.current = null; }

      const layer = L.geoJSON(geojson as GeoJSON.FeatureCollection, {
        style: (feature) => {
          const raw = (feature as { properties: { PREC: string } }).properties.PREC || "";
          const inside = inDistrict(raw);
          if (!inside) {
            return { fillColor: "#e5e7eb", fillOpacity: 0.08, color: "#d1d5db", weight: 0.3, opacity: 0.25 };
          }
          const data = getPrec(raw);
          return {
            fillColor: data?.pct != null ? partisanColor(data.pct) : "#c8c4be",
            fillOpacity: data?.pct != null ? 0.82 : 0.22,
            color: "white", weight: 0.6, opacity: 0.7,
          };
        },
      }).addTo(leafletMap.current!);
      geoLayerRef.current = layer;

      // Fit to district bounds if a district is selected
      if (districtPrecs && districtPrecs.size > 0) {
        const districtFeatures = (geojson.features as Array<{ properties: { PREC: string }; geometry: object }>)
          .filter(f => inDistrict(f.properties.PREC));
        if (districtFeatures.length > 0) {
          const districtGeo = L.geoJSON({ type: "FeatureCollection", features: districtFeatures } as GeoJSON.GeoJsonObject);
          const bounds = districtGeo.getBounds();
          if (bounds.isValid()) leafletMap.current!.fitBounds(bounds, { padding: [16, 16] });
        }
      }
    });
  }, [geojson, lookup, districtPrecs]); // eslint-disable-line

  const cd = history?.cycles[cycle];
  const availableRaces = cd?.races ? Object.entries(cd.races).map(([k, v]) => ({ key: k, label: v.label })) : [];

  const districtData = useMemo(() => {
    const entries = Object.entries(lookup).filter(([prec]) => inDistrict(prec) && lookup);
    const valid = entries.filter(([, d]) => d.pct != null);
    const dPrecs = valid.filter(([, d]) => (d.pct ?? 0) > 0.5).length;
    const totalVotes = valid.reduce((s, [, d]) => s + d.total, 0);
    const demVotes = valid.reduce((s, [, d]) => s + d.d, 0);
    return {
      total: valid.length,
      dPrecs,
      rPrecs: valid.length - dPrecs,
      dPct: totalVotes ? Math.round(demVotes / totalVotes * 100) : 0,
    };
  }, [lookup, districtPrecs]); // eslint-disable-line

  const cycleLabel = CYCLES.find(c => c.key === cycle)?.label ?? cycle;

  return (
    <div className="rounded-[1.35rem] bg-white/70 ring-1 ring-black/8 p-[4px] mt-4">
      <div className="rounded-[1rem] overflow-hidden bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">

        {/* Header */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-black/8"
          style={{ background: "rgba(255,255,255,0.8)" }}>
          <div className="mr-auto">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: "#6b7280" }}>
              Partisan History
            </p>
            <p className="text-[11px] font-semibold" style={{ color: "#1a3a5c" }}>{districtLabel}</p>
          </div>

          {/* Cycle picker */}
          <select
            value={cycle}
            onChange={e => setCycle(e.target.value)}
            className="rounded-lg border border-black/10 px-2 py-1 text-[11px] font-semibold bg-white"
            style={{ color: "#374151" }}>
            {CYCLES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>

          {/* Race picker */}
          {availableRaces.length > 1 && (
            <select
              value={race ?? ""}
              onChange={e => setRace(e.target.value || null)}
              className="rounded-lg border border-black/10 px-2 py-1 text-[11px] font-semibold bg-white"
              style={{ color: "#374151" }}>
              {availableRaces.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>
          )}

          {/* Summary chips */}
          {districtData.total > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "#dbeafe", color: "#1d4ed8" }}>
                {districtData.dPrecs} D
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "#fee2e2", color: "#dc2626" }}>
                {districtData.rPrecs} R
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "#f3f4f6", color: "#374151" }}>
                {districtData.dPct}% D
              </span>
            </div>
          )}
        </div>

        {/* Map */}
        <div ref={mapRef} style={{ height: 380, width: "100%" }} />

        {/* Footer */}
        <div className="px-4 py-2 border-t border-black/8 space-y-0.5">
          <p className="text-[9px]" style={{ color: "#9ca3af" }}>
            {cycleLabel} · {cycle.endsWith("P") ? "D/R primary ballots" : "D vs R two-party share"} · Source: TLC TED API
            {cycle === "2016G" ? " / VEST" : ""}
            {cycle === "2026P" ? " / HC Clerk" : ""}
          </p>
          {districtField && ["hd","sd","cd","pct"].includes(districtField) && parseInt(cycle) < 2022 && (
            <p className="text-[9px]" style={{ color: "#b0b8c4" }}>
              Boundaries reflect current (post-2022) district lines. State house, senate, congressional, and commissioner districts were redistricted after the 2020 Census.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
