"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
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

// district-races.json types
interface DistRace { label: string; candidates: HistCandidate[]; votes: Record<string, number[]> }
interface DistrictRaces {
  hd: Record<string, Record<string, Record<string, DistRace>>>;
  sd: Record<string, Record<string, Record<string, DistRace>>>;
  cd: Record<string, Record<string, Record<string, DistRace>>>;
  jp: Record<string, Record<string, Record<string, DistRace>>>;
  pct: Record<string, Record<string, Record<string, DistRace>>>;
  county: Record<string, Record<string, DistRace>>;
}

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

function computeFromRace(
  raceData: HistRace
): Record<string, { pct: number | null; d: number; r: number; total: number }> {
  const result: Record<string, { pct: number | null; d: number; r: number; total: number }> = {};
  const dIdx = raceData.candidates.findIndex(c => c.party === "D");
  const rIdx = raceData.candidates.findIndex(c => c.party === "R");
  if (dIdx === -1 || rIdx === -1) return {};
  for (const [prec, votes] of Object.entries(raceData.votes)) {
    const d = votes[dIdx] ?? 0, r = votes[rIdx] ?? 0, total = d + r;
    result[prec] = { pct: total ? d / total : null, d, r, total };
  }
  return result;
}

export default function DistrictHeatMap({ districtField, districtValue, districtLabel }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const geoLayerRef = useRef<L.GeoJSON | null>(null);

  const [history, setHistory] = useState<PrecinctHistory | null>(null);
  const [districtRaces, setDistrictRaces] = useState<DistrictRaces | null>(null);
  const [geojson, setGeojson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [cycle, setCycle] = useState("2024G");
  // race key: "hist:president" | "dist:state_rep_134" | "county:harris_da"
  const [raceKey, setRaceKey] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/data/precinct-history.json").then(r => r.json()),
      fetch("/data/harris-precincts.geojson").then(r => r.json()),
      fetch("/data/district-races.json").then(r => r.json()),
    ]).then(([h, g, dr]) => { setHistory(h); setGeojson(g); setDistrictRaces(dr); })
      .catch(console.error);
  }, []);

  // Build available race options for current cycle + district
  // County slugs that are already covered by precinct-history (avoid dupe in dropdown)
  const HIST_COVERED = new Set(["president", "u_s_senate", "governor"]);

  const availableRaces = useMemo<Array<{ key: string; label: string; group: string }>>(() => {
    const races: Array<{ key: string; label: string; group: string }> = [];

    // 1. District-specific races (e.g., State Rep 134 in HD 134)
    if (districtRaces && districtField && districtValue && districtField !== "council") {
      const field = districtField as keyof Omit<DistrictRaces, "county">;
      const distCycles = districtRaces[field]?.[districtValue];
      if (distCycles?.[cycle]) {
        for (const [slug, r] of Object.entries(distCycles[cycle])) {
          races.push({ key: `dist:${slug}`, label: r.label, group: "This District" });
        }
      }
    }

    // 2. County-wide statewide races from precinct-history
    if (history) {
      const cd = history.cycles[cycle];
      if (cd?.races) {
        for (const [k, r] of Object.entries(cd.races)) {
          races.push({ key: `hist:${k}`, label: r.label, group: "Statewide" });
        }
      }
      if (cd?.primary) {
        races.push({ key: "primary", label: "Primary Ballots", group: "Statewide" });
      }
    }

    // 3. County offices + courts from district-races.json
    if (districtRaces && !cycle.endsWith("P")) {
      const OFFICE_ORDER = ["harris_da","harris_sheriff","harris_co_attorney","harris_tax_a_c","rr_comm_1","sup_ct_pl2"];
      for (const slug of OFFICE_ORDER) {
        if (HIST_COVERED.has(slug)) continue;
        const r = districtRaces.county?.[slug]?.[cycle];
        if (r) races.push({ key: `county:${slug}`, label: r.label, group: "Harris Offices" });
      }
      // Courts (district judges, county criminal courts)
      for (const [slug, cycles] of Object.entries(districtRaces.county ?? {})) {
        if (HIST_COVERED.has(slug) || OFFICE_ORDER.includes(slug)) continue;
        const r = cycles[cycle];
        if (r) races.push({ key: `county:${slug}`, label: r.label, group: "Courts" });
      }
    }

    return races;
  }, [districtRaces, history, cycle, districtField, districtValue]); // eslint-disable-line

  // Auto-select best race when cycle or district changes
  useEffect(() => {
    if (availableRaces.length === 0) return;
    // Prefer district-specific race
    const distRace = availableRaces.find(r => r.key.startsWith("dist:"));
    setRaceKey(distRace?.key ?? availableRaces[0].key);
  }, [cycle, districtField, districtValue, availableRaces.map(r => r.key).join(",")]); // eslint-disable-line

  // Resolve the selected race's raw data
  const resolvedRace = useMemo<HistRace | null>(() => {
    if (!raceKey) return null;

    if (raceKey === "primary") return null; // handled separately

    if (raceKey.startsWith("dist:") && districtRaces && districtField && districtValue && districtField !== "council") {
      const slug = raceKey.slice(5);
      const field = districtField as keyof Omit<DistrictRaces, "county">;
      return districtRaces[field]?.[districtValue]?.[cycle]?.[slug] ?? null;
    }

    if (raceKey.startsWith("county:") && districtRaces) {
      const slug = raceKey.slice(7);
      return districtRaces.county?.[slug]?.[cycle] ?? null;
    }

    if (raceKey.startsWith("hist:") && history) {
      const key = raceKey.slice(5);
      return history.cycles[cycle]?.races?.[key] ?? null;
    }

    return null;
  }, [raceKey, cycle, history, districtRaces, districtField, districtValue]);

  // Compute precinct data
  const lookup = useMemo(() => {
    if (raceKey === "primary" && history) {
      const cd = history.cycles[cycle];
      if (!cd?.primary) return {};
      const result: Record<string, { pct: number | null; d: number; r: number; total: number }> = {};
      for (const [prec, v] of Object.entries(cd.primary)) {
        const d = v.dem, r = v.rep, total = d + r;
        result[prec] = { pct: total ? d / total : null, d, r, total };
      }
      return result;
    }
    return resolvedRace ? computeFromRace(resolvedRace) : {};
  }, [resolvedRace, raceKey, history, cycle]);

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
        const districtFeatures = (geojson.features as unknown as Array<{ properties: { PREC: string }; geometry: object }>)
          .filter(f => inDistrict(f.properties.PREC));
        if (districtFeatures.length > 0) {
          const districtGeo = L.geoJSON({ type: "FeatureCollection", features: districtFeatures } as GeoJSON.GeoJsonObject);
          const bounds = districtGeo.getBounds();
          if (bounds.isValid()) leafletMap.current!.fitBounds(bounds, { padding: [16, 16] });
        }
      }
    });
  }, [geojson, lookup, districtPrecs]); // eslint-disable-line

  const districtData = useMemo(() => {
    const entries = Object.entries(lookup).filter(([prec]) => inDistrict(prec));
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
  const isDistrict = raceKey?.startsWith("dist:");

  // D% trend across general elections
  const GENERAL_CYCLES_TREND = ["2024G", "2022G", "2020G", "2018G", "2016G"];
  const trendData = useMemo(() => {
    if (!history) return [];
    return GENERAL_CYCLES_TREND.map(cy => {
      const cd = history.cycles[cy];
      if (!cd?.races) return null;
      const baseRace = raceKey?.startsWith("hist:") ? raceKey.replace("hist:", "") : null;
      const actualRaceKey = baseRace && cd.races[baseRace] ? baseRace : Object.keys(cd.races)[0];
      const race = cd.races[actualRaceKey];
      if (!race) return null;
      const lk = computeFromRace(race);
      const entries = Object.entries(lk).filter(([p]) => inDistrict(p));
      const valid = entries.filter(([, d]) => d.pct != null);
      if (valid.length < 3) return null;
      const tv = valid.reduce((s, [, d]) => s + d.total, 0);
      const dv = valid.reduce((s, [, d]) => s + d.d, 0);
      return { year: cy.replace("G", ""), dPct: tv ? Math.round(dv / tv * 100) : null };
    }).filter((x): x is { year: string; dPct: number } => x != null && x.dPct != null).reverse();
  }, [history, raceKey, districtPrecs]); // eslint-disable-line

  return (
    <div className="rounded-[1.35rem] bg-white/70 ring-1 ring-black/8 p-[4px] mt-4">
      <div className="rounded-[1rem] overflow-hidden bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">

        {/* Header */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-black/8"
          style={{ background: "rgba(255,255,255,0.8)" }}>
          <div className="mr-auto">
            <div className="flex items-center gap-2">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: "#6b7280" }}>
                {districtData.total > 0
                  ? `${districtLabel} · ${districtData.dPct}% D: ${cycleLabel}`
                  : "Partisan History"}
              </p>
              <Link href="/tools/heat-check" className="text-[9px] font-semibold hover:underline" style={{ color: "#2563a8" }}>
                Countywide map →
              </Link>
            </div>
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
              value={raceKey ?? ""}
              onChange={e => setRaceKey(e.target.value || null)}
              className="rounded-lg border border-black/10 px-2 py-1 text-[11px] font-semibold bg-white"
              style={{ color: "#374151" }}>
              {/* Group by group field */}
              {(() => {
                const groups = [...new Set(availableRaces.map(r => r.group))];
                return groups.map(g => (
                  <optgroup key={g} label={g}>
                    {availableRaces.filter(r => r.group === g).map(r => (
                      <option key={r.key} value={r.key}>{r.label}</option>
                    ))}
                  </optgroup>
                ));
              })()}
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

        {/* D% trend sparkline */}
        {trendData.length >= 2 && (
          <div className="px-4 pt-3 pb-1 border-t border-black/8">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] mb-2" style={{ color: "#9ca3af" }}>D%: General Elections</p>
            <div className="flex items-end gap-1.5">
              {trendData.map(t => {
                const isD = t.dPct >= 50;
                const barH = Math.max(8, Math.round(t.dPct * 0.48));
                return (
                  <div key={t.year} className="flex flex-col items-center gap-0.5">
                    <span className="text-[8px] font-bold tabular-nums" style={{ color: isD ? "#2563a8" : "#dc2626" }}>{t.dPct}%</span>
                    <div style={{ height: 48, width: 22, background: "#f3f4f6", borderRadius: 3, display: "flex", alignItems: "flex-end", overflow: "hidden" }}>
                      <div style={{ width: "100%", height: barH, background: isD ? "#2563a8" : "#dc2626", borderRadius: 3 }} />
                    </div>
                    <span className="text-[8px] font-semibold" style={{ color: "#9ca3af" }}>{t.year}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-2 border-t border-black/8 space-y-0.5">
          <p className="text-[9px]" style={{ color: "#9ca3af" }}>
            {cycleLabel}
            {isDistrict ? " · Actual race results" : cycle.endsWith("P") ? " · D/R primary ballots" : " · D vs R two-party share"}
            {" · Source: TLC TED API"}
            {cycle === "2016G" && !isDistrict ? " / VEST" : ""}
            {cycle === "2026P" ? " / HC Clerk" : ""}
          </p>
          {districtField === "cd" && (
            <p className="text-[9px]" style={{ color: "#d97706" }}>
              ⚠ CD boundaries changed under the 2025 PLANC2333 redistricting. Precinct assignments on this map use the 2022 plan. 2026 results will reflect the new lines.
            </p>
          )}
          {districtField && ["hd","sd","pct"].includes(districtField) && parseInt(cycle) < 2022 && (
            <p className="text-[9px]" style={{ color: "#b0b8c4" }}>
              Boundaries reflect current (post-2022) district lines. State house, senate, and commissioner districts were redistricted after the 2020 Census.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
