"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { Feature, GeoJsonObject } from "geojson";

export interface PrecinctFeature extends Feature {
  properties: {
    precinct: string;
    name: string;
    sldlst?: string | null;   // TX State House district (Census TIGER SLDLST, zero-padded 3 chars)
    sldust?: string | null;   // TX State Senate district (Census TIGER SLDUST, zero-padded 3 chars)
    [key: string]: unknown;
  };
}

export interface PrecinctDemoData {
  registeredVoters: number;
  race: { hispanic: number; black: number; white: number; asian: number; other: number };
  gender: { male: number; female: number };
  demPrimary: number;
  repPrimary: number;
}

export interface DistrictsMapProps {
  geojson: GeoJsonObject | null;
  onPrecinctClick: (id: string) => void;
  selectedPrecinct: string | null;
  highlightedPrecincts: Set<string>;   // precincts in the selected district
  precinctData: Record<string, PrecinctDemoData>;
  // Real district boundary overlay
  districtType: "TX State House" | "TX State Senate" | "U.S. Congressional" | null;
  districtNum: string | null;
}

function raceColor(data: PrecinctDemoData): string {
  const { hispanic, black, white, asian } = data.race;
  const max = Math.max(hispanic, black, white, asian);
  if (max === hispanic) return "#f59e0b";
  if (max === black)    return "#8b5cf6";
  if (max === white)    return "#3b82f6";
  if (max === asian)    return "#10b981";
  return "#9ca3af";
}

function demRepColor(data: PrecinctDemoData): string {
  const total = data.demPrimary + data.repPrimary;
  if (total === 0) return "#9ca3af";
  const demPct = data.demPrimary / total;
  if (demPct > 0.65) return "#2563a8";
  if (demPct > 0.52) return "#93c5fd";
  if (demPct < 0.35) return "#dc2626";
  if (demPct < 0.48) return "#fca5a5";
  return "#a78bfa";
}

function buildTooltip(precinctId: string, data: PrecinctDemoData): string {
  const { race, gender, registeredVoters, demPrimary, repPrimary } = data;
  const total = demPrimary + repPrimary || 1;
  const demPct = Math.round((demPrimary / total) * 100);

  const bar = (pct: number, color: string) =>
    `<div style="height:5px;border-radius:3px;background:#f3f4f6;overflow:hidden;margin-top:2px">
      <div style="height:100%;width:${pct}%;background:${color};border-radius:3px"></div>
    </div>`;

  return `
    <div style="font-family:system-ui,sans-serif;font-size:12px;color:#1a3a5c;min-width:180px">
      <div style="font-weight:700;font-size:13px;margin-bottom:6px;border-bottom:1px solid rgba(26,58,92,0.12);padding-bottom:4px">
        Precinct ${parseInt(precinctId, 10)}
      </div>
      <div style="margin-bottom:5px">
        <span style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:#6b7280">Registered Voters</span>
        <div style="font-size:14px;font-weight:700">${registeredVoters.toLocaleString()}</div>
      </div>
      <div style="margin-bottom:5px">
        <span style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:#6b7280">Race / Ethnicity</span>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:3px">
          ${[
            { label: "Hisp", val: race.hispanic, color: "#f59e0b" },
            { label: "Black", val: race.black, color: "#8b5cf6" },
            { label: "White", val: race.white, color: "#3b82f6" },
            { label: "Asian", val: race.asian, color: "#10b981" },
          ].map(r =>
            `<span style="background:${r.color}18;border:1px solid ${r.color}44;border-radius:4px;padding:1px 5px;font-size:10px;color:${r.color};font-weight:600">${r.val}% ${r.label}</span>`
          ).join("")}
        </div>
      </div>
      <div style="margin-bottom:4px">
        <span style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:#6b7280">Gender</span>
        <div style="display:flex;gap:8px;margin-top:2px;font-size:11px">
          <span style="color:#ec4899;font-weight:600">${gender.female}% F</span>
          <span style="color:#2563a8;font-weight:600">${gender.male}% M</span>
        </div>
      </div>
      <div>
        <span style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:#6b7280">Primary Lean</span>
        ${bar(demPct, "#2563a8")}
        <div style="display:flex;justify-content:space-between;font-size:10px;margin-top:2px">
          <span style="color:#2563a8;font-weight:600">Dem ${demPct}%</span>
          <span style="color:#dc2626;font-weight:600">Rep ${100 - demPct}%</span>
        </div>
      </div>
    </div>
  `;
}

function FitBounds({ bounds }: { bounds: L.LatLngBounds | null }) {
  const map = useMap();
  const lastBounds = useRef<string>("");
  useEffect(() => {
    if (!bounds?.isValid()) return;
    const key = bounds.toBBoxString();
    if (key === lastBounds.current) return;
    lastBounds.current = key;
    map.fitBounds(bounds, { padding: [24, 24], maxZoom: 14 });
  }, [bounds, map]);
  return null;
}

function FixLeafletIcon() {
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);
  return null;
}

export default function DistrictsMap({
  geojson,
  onPrecinctClick,
  selectedPrecinct,
  highlightedPrecincts,
  precinctData,
  districtType,
  districtNum,
}: DistrictsMapProps) {
  const hasDistrict = highlightedPrecincts.size > 0;

  // Fetch real district boundary polygon
  const [boundaryGeo, setBoundaryGeo] = useState<GeoJsonObject | null>(null);
  const lastBoundaryKey = useRef("");
  useEffect(() => {
    if (!districtType || !districtNum) { setBoundaryGeo(null); return; }
    const typeMap: Record<string, string> = {
      "TX State House":     "house",
      "TX State Senate":    "senate",
      "U.S. Congressional": "congressional",
    };
    const type = typeMap[districtType];
    if (!type) { setBoundaryGeo(null); return; }
    const key = `${type}-${districtNum}`;
    if (key === lastBoundaryKey.current) return;
    lastBoundaryKey.current = key;
    setBoundaryGeo(null);
    fetch(`/api/districts/boundary?type=${type}&district=${districtNum}`)
      .then(r => r.json())
      .then(d => { if (d?.features?.length) setBoundaryGeo(d); })
      .catch(() => {});
  }, [districtType, districtNum]);

  // Compute bounds for the highlighted district
  const districtBounds = useRef<L.LatLngBounds | null>(null);

  if (!geojson) {
    return (
      <div className="flex items-center justify-center rounded-2xl animate-pulse"
        style={{ height: 520, background: "#f0f4f8", border: "1px solid rgba(26,58,92,0.08)" }}>
        <div className="text-center">
          <span className="relative flex h-3 w-3 mx-auto mb-2">
            <span className="alive-halo absolute inset-0 rounded-full bg-sky-400"/>
            <span className="alive-pulse relative h-3 w-3 rounded-full bg-sky-400"/>
          </span>
          <p className="text-xs" style={{ color: "#9ca3af" }}>Loading precinct map…</p>
        </div>
      </div>
    );
  }

  // Compute bounds for highlighted precincts to pass to FitBounds
  if (hasDistrict && geojson) {
    try {
      const filtered = {
        type: "FeatureCollection" as const,
        features: (geojson as unknown as { features: PrecinctFeature[] }).features.filter(
          f => highlightedPrecincts.has(f.properties.precinct ?? "")
        ),
      };
      if (filtered.features.length > 0) {
        const layer = L.geoJSON(filtered as GeoJsonObject);
        const b = layer.getBounds();
        if (b.isValid()) districtBounds.current = b;
      }
    } catch { /* ignore */ }
  }

  const boundsKey = hasDistrict ? `${[...highlightedPrecincts].sort().join(",")}` : null;

  return (
    <MapContainer
      center={[29.7604, -95.3698]}
      zoom={10}
      style={{ height: 520, width: "100%", borderRadius: 16 }}
      scrollWheelZoom={true}
      zoomControl={true}
    >
      <FixLeafletIcon />
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      {/* Fit to real boundary when available, else fall back to synthetic precinct bounds */}
      {boundaryGeo && (() => {
        try {
          const b = L.geoJSON(boundaryGeo).getBounds();
          if (b.isValid()) return <FitBounds bounds={b} key={`bound-${districtType}-${districtNum}`} />;
        } catch { /* ignore */ }
        return null;
      })()}
      {!boundaryGeo && boundsKey && districtBounds.current && (
        <FitBounds bounds={districtBounds.current} key={boundsKey} />
      )}
      {!hasDistrict && !boundaryGeo && (
        <FitBounds bounds={null} key="init" />
      )}
      {/* Real district boundary outline — drawn on top of precincts */}
      {boundaryGeo && (
        <GeoJSON
          key={`boundary-${districtType}-${districtNum}`}
          data={boundaryGeo}
          style={() => ({
            fillColor: "transparent",
            fillOpacity: 0,
            color: "#1a3a5c",
            weight: 3,
            dashArray: "6 3",
            opacity: 0.85,
          })}
          interactive={false}
        />
      )}

      <GeoJSON
        key={`${[...highlightedPrecincts].join(",")}_${selectedPrecinct}_${!!boundaryGeo}`}
        data={geojson}
        style={(feature) => {
          const id = (feature as PrecinctFeature).properties.precinct ?? "";
          const isSelected = id === selectedPrecinct;
          const demo = precinctData[id];

          if (isSelected) {
            return { fillColor: "#f59e0b", fillOpacity: 0.9, color: "#d97706", weight: 2.5 };
          }

          // When we have a real Census boundary, grey everything out — the outline tells the story
          if (boundaryGeo) {
            return { fillColor: "#d1d5db", fillOpacity: 0.15, color: "rgba(200,200,200,0.3)", weight: 0.4 };
          }

          const inDistrict = !hasDistrict || highlightedPrecincts.has(id);
          if (!inDistrict) {
            return { fillColor: "#d1d5db", fillOpacity: 0.18, color: "rgba(200,200,200,0.4)", weight: 0.4 };
          }

          const color = demo ? demRepColor(demo) : "#9ca3af";
          return {
            fillColor: color,
            fillOpacity: hasDistrict ? 0.65 : 0.42,
            color: hasDistrict ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.5)",
            weight: hasDistrict ? 0.8 : 0.5,
          };
        }}
        onEachFeature={(feature, layer) => {
          const id = (feature as PrecinctFeature).properties.precinct ?? "";
          const demo = precinctData[id];
          const inDistrict = boundaryGeo ? false : (!hasDistrict || highlightedPrecincts.has(id));

          if (demo && inDistrict) {
            layer.bindTooltip(buildTooltip(id, demo), {
              sticky: true,
              className: "districts-tooltip",
              offset: [12, 0],
            });
          } else {
            layer.bindTooltip(
              `<span style="font-family:system-ui;font-size:12px;font-weight:700;color:#1a3a5c">Precinct ${parseInt(id, 10)}</span>`,
              { sticky: true }
            );
          }

          layer.on({
            click: () => {
              if (inDistrict) onPrecinctClick(id);
            },
            mouseover: (e) => {
              if (inDistrict) (e.target as L.Path).setStyle({ weight: 2, fillOpacity: 0.82 });
            },
            mouseout: (e) => {
              const selected = id === selectedPrecinct;
              (e.target as L.Path).setStyle({
                weight: selected ? 2.5 : (hasDistrict && inDistrict ? 0.8 : 0.4),
                fillOpacity: selected ? 0.9 : (inDistrict ? (hasDistrict ? 0.65 : 0.42) : 0.18),
              });
            },
          });
        }}
      />
    </MapContainer>
  );
}
