"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { Feature, GeoJsonObject } from "geojson";

/* Heat Check visual language: continuous precinct fills over a Carto light
   basemap, thin white borders, out-of-district precincts dimmed to warm gray.
   No cutouts — every precinct always renders. */

export interface PrecinctFeature extends Feature {
  properties: { PREC: string; [key: string]: unknown };
}

export interface PrecinctTurnout { dem: number; rep: number }

export interface ResultsUpload {
  candidates: string[];
  byPrecinct: Record<string, number[]>; // votes per candidate, candidate order
}

export type MapLayer = "population" | "votes" | "results";

export interface DistrictsMapProps {
  geojson: GeoJsonObject | null;
  crosswalk: Record<string, { hd?: string; sd?: string; cd?: string; jp?: string; council?: string }>;
  districtField: "hd" | "sd" | "cd" | "jp" | "council" | null; // null = countywide
  districtValue: string | null;
  layer: MapLayer;
  turnout: Record<string, PrecinctTurnout>;
  results: ResultsUpload | null;
  selectedPrecinct: string | null;
  onPrecinctClick: (id: string) => void;
}

const GREY_OUT = "#c8c4be";          // matches Heat Check out-of-scope precincts
const CAND_COLORS = ["#1d4ed8", "#dc2626", "#16a34a", "#7c3aed", "#ea580c", "#0891b2", "#be185d", "#b45309"];

function demShareColor(dem: number, rep: number): string {
  const total = dem + rep;
  if (total < 10) return "#d6d3cd";
  const share = dem / total;
  if (share > 0.80) return "#1e3a8a";
  if (share > 0.65) return "#2563a8";
  if (share > 0.52) return "#7ea8d8";
  if (share > 0.48) return "#a78bfa";
  if (share > 0.35) return "#e58f8f";
  if (share > 0.20) return "#dc2626";
  return "#991b1b";
}

function resultsColor(votes: number[]): { color: string; opacity: number } {
  const total = votes.reduce((a, b) => a + b, 0);
  if (total === 0) return { color: "#d6d3cd", opacity: 0.4 };
  let lead = 0;
  for (let i = 1; i < votes.length; i++) if (votes[i] > votes[lead]) lead = i;
  const margin = votes[lead] / total;
  return { color: CAND_COLORS[lead % CAND_COLORS.length], opacity: 0.35 + Math.min(0.55, margin * 0.7) };
}

function FitBounds({ bounds, fitKey }: { bounds: L.LatLngBounds | null; fitKey: string }) {
  const map = useMap();
  const last = useRef("");
  useEffect(() => {
    if (!bounds?.isValid() || fitKey === last.current) return;
    last.current = fitKey;
    map.fitBounds(bounds, { padding: [24, 24], maxZoom: 13 });
  }, [bounds, fitKey, map]);
  return null;
}

export default function DistrictsMap({
  geojson, crosswalk, districtField, districtValue, layer,
  turnout, results, selectedPrecinct, onPrecinctClick,
}: DistrictsMapProps) {

  if (!geojson) {
    return (
      <div className="flex items-center justify-center animate-pulse"
        style={{ height: 540, background: "#f0f4f8" }}>
        <p className="text-xs" style={{ color: "#9ca3af" }}>Loading precinct map…</p>
      </div>
    );
  }

  const inDistrict = (prec: string): boolean => {
    if (!districtField || !districtValue) return true; // countywide — everything active
    return crosswalk[prec]?.[districtField] === districtValue;
  };

  // bounds of the active district
  let bounds: L.LatLngBounds | null = null;
  const fitKey = `${districtField}-${districtValue}`;
  try {
    const active = {
      type: "FeatureCollection" as const,
      features: (geojson as unknown as { features: PrecinctFeature[] }).features.filter(
        f => inDistrict(f.properties.PREC)
      ),
    };
    if (active.features.length > 0) {
      const b = L.geoJSON(active as GeoJsonObject).getBounds();
      if (b.isValid()) bounds = b;
    }
  } catch { /* ignore */ }

  return (
    <MapContainer
      center={[29.76, -95.37]}
      zoom={10}
      style={{ height: 540, width: "100%" }}
      scrollWheelZoom={true}
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      <FitBounds bounds={bounds} fitKey={fitKey} />

      <GeoJSON
        key={`${fitKey}_${layer}_${selectedPrecinct}_${results ? results.candidates.join("|") : ""}`}
        data={geojson}
        style={(feature) => {
          const prec = (feature as PrecinctFeature).properties.PREC ?? "";
          const active = inDistrict(prec);
          const isSelected = prec === selectedPrecinct;

          if (isSelected) {
            return { fillColor: "#f59e0b", fillOpacity: 0.9, color: "#b45309", weight: 2 };
          }
          if (!active) {
            // continuous, dimmed — Heat Check treatment
            return { fillColor: GREY_OUT, fillOpacity: 0.35, color: "rgba(255,255,255,0.7)", weight: 0.4 };
          }

          if (layer === "votes") {
            const t = turnout[prec];
            return {
              fillColor: t ? demShareColor(t.dem, t.rep) : "#d6d3cd",
              fillOpacity: 0.72,
              color: "rgba(255,255,255,0.85)",
              weight: 0.6,
            };
          }
          if (layer === "results" && results) {
            const votes = results.byPrecinct[prec];
            if (votes) {
              const { color, opacity } = resultsColor(votes);
              return { fillColor: color, fillOpacity: opacity, color: "rgba(255,255,255,0.85)", weight: 0.6 };
            }
            return { fillColor: "#d6d3cd", fillOpacity: 0.3, color: "rgba(255,255,255,0.85)", weight: 0.5 };
          }
          // population layer — no demographic data wired yet; neutral active fill
          return { fillColor: "#7ea8d8", fillOpacity: 0.35, color: "rgba(255,255,255,0.85)", weight: 0.6 };
        }}
        onEachFeature={(feature, lyr) => {
          const prec = (feature as PrecinctFeature).properties.PREC ?? "";
          const cw = crosswalk[prec] ?? {};
          const t = turnout[prec];
          const active = inDistrict(prec);

          const rows: string[] = [];
          rows.push(`<div style="font-weight:700;font-size:13px;margin-bottom:5px;border-bottom:1px solid rgba(26,58,92,0.12);padding-bottom:4px">Precinct ${parseInt(prec, 10) || prec}</div>`);
          const tag = (label: string, val?: string) => val
            ? `<span style="background:rgba(26,58,92,0.06);border-radius:4px;padding:1px 6px;font-size:10px;font-weight:600;color:#1a3a5c">${label} ${val}</span>` : "";
          rows.push(`<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px">${tag("CD", cw.cd)}${tag("SD", cw.sd)}${tag("HD", cw.hd)}${tag("JP", cw.jp)}${cw.council ? tag("Council", cw.council) : ""}</div>`);

          if (layer === "results" && results?.byPrecinct[prec]) {
            const votes = results.byPrecinct[prec];
            rows.push(`<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;margin-bottom:2px">Uploaded Results</div>`);
            results.candidates.forEach((c, i) => {
              rows.push(`<div style="display:flex;justify-content:space-between;font-size:11px;gap:12px"><span style="color:${CAND_COLORS[i % CAND_COLORS.length]};font-weight:600">${c}</span><span>${(votes[i] ?? 0).toLocaleString()}</span></div>`);
            });
          } else if (t) {
            const total = t.dem + t.rep;
            const demPct = total ? Math.round((t.dem / total) * 100) : 0;
            rows.push(`<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:#6b7280">2026 Primary Ballots</div>`);
            rows.push(`<div style="font-size:13px;font-weight:700;margin-bottom:3px">${total.toLocaleString()}</div>`);
            rows.push(`<div style="height:6px;border-radius:3px;background:#fecaca;overflow:hidden"><div style="height:100%;width:${demPct}%;background:#2563a8"></div></div>`);
            rows.push(`<div style="display:flex;justify-content:space-between;font-size:10px;margin-top:2px"><span style="color:#2563a8;font-weight:600">Dem ${t.dem.toLocaleString()}</span><span style="color:#dc2626;font-weight:600">Rep ${t.rep.toLocaleString()}</span></div>`);
          }

          lyr.bindTooltip(
            `<div style="font-family:system-ui,sans-serif;font-size:12px;color:#1a3a5c;min-width:170px">${rows.join("")}</div>`,
            { sticky: true, offset: [12, 0] }
          );

          lyr.on({
            click: () => onPrecinctClick(prec),
            mouseover: (e) => { if (active) (e.target as L.Path).setStyle({ weight: 1.8, fillOpacity: 0.88 }); },
            mouseout:  (e) => {
              const sel = prec === selectedPrecinct;
              (e.target as L.Path).setStyle({
                weight: sel ? 2 : active ? 0.6 : 0.4,
                fillOpacity: sel ? 0.9 : active ? (layer === "population" ? 0.35 : 0.72) : 0.35,
              });
            },
          });
        }}
      />
    </MapContainer>
  );
}
