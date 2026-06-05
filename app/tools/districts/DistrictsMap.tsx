"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { Feature, GeoJsonObject } from "geojson";

// TIGERweb VTD fields (after normalization in /api/districts/precincts)
export interface PrecinctFeature extends Feature {
  properties: {
    precinct: string;  // 6-digit zero-padded VTD code e.g. "000302"
    name: string;
    [key: string]: unknown;
  };
}

export interface DistrictsMapProps {
  geojson: GeoJsonObject | null;
  onPrecinctClick: (id: string) => void;
  selectedPrecinct: string | null;
}

function precinctColor(id: string, isSelected: boolean): string {
  if (isSelected) return "#f59e0b";
  // Deterministic color based on precinct number — blue/purple/red distribution
  const n = parseInt(id, 10) || 0;
  const h = (n * 97 + 43) % 360;
  // Skew toward blue-purple-red spectrum (180–360° = blue to red)
  const hue = 210 + ((h % 180) - 90) * 0.8;
  return `hsl(${hue}, 60%, 55%)`;
}

function FitBounds({ geojson }: { geojson: GeoJsonObject | null }) {
  const map = useMap();
  useEffect(() => {
    if (!geojson) return;
    try {
      const layer = L.geoJSON(geojson as GeoJsonObject);
      const bounds = layer.getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [8, 8] });
    } catch {
      map.setView([29.7604, -95.3698], 10);
    }
  }, [geojson, map]);
  return null;
}

// Fix Leaflet default icon in Next.js
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

export default function DistrictsMap({ geojson, onPrecinctClick, selectedPrecinct }: DistrictsMapProps) {
  if (!geojson) {
    return (
      <div className="flex items-center justify-center rounded-2xl animate-pulse"
        style={{ height: 480, background: "#f0f4f8", border: "1px solid rgba(26,58,92,0.08)" }}>
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
      style={{ height: 480, width: "100%", borderRadius: 16 }}
      scrollWheelZoom={true}
      zoomControl={true}
    >
      <FixLeafletIcon />
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      <FitBounds geojson={geojson} />
      <GeoJSON
        key={selectedPrecinct ?? "none"}
        data={geojson}
        style={(feature) => {
          const id = (feature as PrecinctFeature).properties.precinct ?? "";
          const selected = id === selectedPrecinct;
          return {
            fillColor: precinctColor(id, selected),
            fillOpacity: selected ? 0.82 : 0.48,
            color: selected ? "#f59e0b" : "rgba(255,255,255,0.6)",
            weight: selected ? 2.5 : 0.6,
          };
        }}
        onEachFeature={(feature, layer) => {
          const id = (feature as PrecinctFeature).properties.precinct ?? "";
          const displayId = parseInt(id, 10).toString(); // "000302" → "302"

          layer.bindTooltip(
            `<div style="font-family:sans-serif;font-size:12px;font-weight:700;color:#1a3a5c;padding:2px 4px">
              Precinct ${displayId}
            </div>`,
            { sticky: true }
          );

          layer.on({
            click: () => onPrecinctClick(id),
            mouseover: (e) => (e.target as L.Path).setStyle({ weight: 2, fillOpacity: 0.72 }),
            mouseout: (e) => {
              (e.target as L.Path).setStyle({
                weight: id === selectedPrecinct ? 2.5 : 0.6,
                fillOpacity: id === selectedPrecinct ? 0.82 : 0.48,
              });
            },
          });
        }}
      />
    </MapContainer>
  );
}
