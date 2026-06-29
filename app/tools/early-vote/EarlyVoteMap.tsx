"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { Feature, GeoJsonObject } from "geojson";

interface PrecinctFeature extends Feature {
  properties: { precinct: string; name: string; [key: string]: unknown };
}

interface EVMapProps {
  daysPassed: number;
  selectedRaceId: string;
}

function genEV(precinctId: string, daysPassed: number) {
  const seed = precinctId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rnd = (min: number, max: number) => min + ((seed * 17 + min * 13) % (max - min));
  const evRate = Math.min(0.85, 0.025 * daysPassed + (rnd(0, 20) / 100));
  const demTurnout = Math.min(90, Math.round(evRate * (0.85 + rnd(0, 25) / 100) * 100));
  return demTurnout;
}

function evColor(pct: number): string {
  if (pct >= 60) return "#1e40af";
  if (pct >= 45) return "#2563a8";
  if (pct >= 30) return "#60a5fa";
  if (pct >= 15) return "#bfdbfe";
  return "#dbeafe";
}

function buildTooltip(precinctId: string, demPct: number, repPct: number, daysPassed: number): string {
  const seed = precinctId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rnd = (min: number, max: number) => min + ((seed * 31 + min * 7) % (max - min));
  const rv = rnd(800, 4200);
  const demUni = Math.round(rv * 0.38);
  const repUni = Math.round(rv * 0.26);
  const demVoted = Math.round(demUni * demPct / 100);
  const repVoted = Math.round(repUni * repPct / 100);
  return `
    <div style="font-family:system-ui,sans-serif;font-size:12px;color:#1a3a5c;min-width:170px">
      <div style="font-weight:700;font-size:13px;margin-bottom:5px;border-bottom:1px solid rgba(26,58,92,0.1);padding-bottom:3px">
        Precinct ${parseInt(precinctId, 10)}: Day ${daysPassed}
      </div>
      <div style="margin-bottom:4px">
        <span style="color:#2563a8;font-weight:600">Dem Universe:</span>
        ${demVoted.toLocaleString()} / ${demUni.toLocaleString()} voted
        <span style="font-weight:700;color:#2563a8;margin-left:4px">${demPct}%</span>
      </div>
      <div>
        <span style="color:#dc2626;font-weight:600">Rep Universe:</span>
        ${repVoted.toLocaleString()} / ${repUni.toLocaleString()} voted
        <span style="font-weight:700;color:#dc2626;margin-left:4px">${repPct}%</span>
      </div>
    </div>
  `;
}

export default function EarlyVoteMap({ daysPassed, selectedRaceId }: EVMapProps) {
  const [geojson, setGeojson] = useState<GeoJsonObject | null>(null);

  useEffect(() => {
    fetch("/api/districts/precincts")
      .then(r => r.json())
      .then(d => { if (d?.features) setGeojson(d); })
      .catch(() => {});
  }, []);

  // Fix Leaflet icon
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  const geoKey = useMemo(() => `${daysPassed}_${selectedRaceId}`, [daysPassed, selectedRaceId]);

  if (!geojson) {
    return (
      <div className="flex items-center justify-center" style={{ height: 500 }}>
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

  return (
    <MapContainer
      center={[29.7604, -95.3698]}
      zoom={10}
      style={{ height: 500, width: "100%", borderRadius: 16 }}
      scrollWheelZoom={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; OpenStreetMap contributors &copy; CARTO'
      />
      <GeoJSON
        key={geoKey}
        data={geojson}
        style={(feature) => {
          const id = (feature as PrecinctFeature).properties.precinct ?? "";
          const demPct = genEV(id, daysPassed);
          return {
            fillColor: evColor(demPct),
            fillOpacity: 0.72,
            color: "rgba(255,255,255,0.55)",
            weight: 0.6,
          };
        }}
        onEachFeature={(feature, layer) => {
          const id = (feature as PrecinctFeature).properties.precinct ?? "";
          const demPct = genEV(id, daysPassed);
          const seed = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
          const repPct = Math.min(85, Math.round(
            Math.min(0.85, 0.018 * daysPassed + ((seed * 11) % 20) / 100) *
            (0.7 + ((seed * 7) % 30) / 100) * 100
          ));
          layer.bindTooltip(buildTooltip(id, demPct, repPct, daysPassed), {
            sticky: true,
            offset: [12, 0],
          });
          layer.on({
            mouseover: (e) => (e.target as L.Path).setStyle({ weight: 1.5, fillOpacity: 0.9 }),
            mouseout: (e) => (e.target as L.Path).setStyle({ weight: 0.6, fillOpacity: 0.72 }),
          });
        }}
      />
    </MapContainer>
  );
}
