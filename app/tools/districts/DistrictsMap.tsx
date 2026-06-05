"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { Feature, GeoJsonObject } from "geojson";

export interface PrecinctFeature extends Feature {
  properties: {
    PRECINCT_N?: string;
    PCT_CODE?: string;
    CONG_DIST?: string | number;
    SNDIST?: string | number;
    HDDIST?: string | number;
    JP_PRECINCT?: string | number;
    CITY_COUNCIL?: string;
    [key: string]: unknown;
  };
}

interface DistrictsMapProps {
  geojson: GeoJsonObject | null;
  selectedType: string;
  selectedDistrict: string;
  onPrecinctClick: (props: PrecinctFeature["properties"]) => void;
  selectedPrecinct: string | null;
}

// Choropleth colors by party lean (will vary slightly per precinct number for demo)
function precinctColor(props: PrecinctFeature["properties"], isSelected: boolean, isFiltered: boolean): string {
  if (isSelected) return "#f59e0b"; // amber for selected
  if (!isFiltered) return "#d1d5db"; // gray when filtered out
  const pct = parseInt(props.PRECINCT_N ?? props.PCT_CODE ?? "0") || 0;
  // Simple deterministic party lean based on precinct number for demo coloring
  const lean = (pct * 17 + pct * 3) % 100;
  if (lean < 40) return "#3b82f6"; // blue - Dem lean
  if (lean > 60) return "#ef4444"; // red - Rep lean
  return "#a78bfa"; // purple - competitive
}

function getPrecinctId(props: PrecinctFeature["properties"]): string {
  return String(props.PRECINCT_N ?? props.PCT_CODE ?? "");
}

function matchesDistrict(props: PrecinctFeature["properties"], type: string, district: string): boolean {
  if (!district || district === "all") return true;
  switch (type) {
    case "Harris County JP":
      return String(props.JP_PRECINCT ?? "") === district;
    case "City Council":
      return String(props.CITY_COUNCIL ?? "").toUpperCase() === district.toUpperCase();
    case "TX State House":
      return String(props.HDDIST ?? "") === district;
    case "TX State Senate":
      return String(props.SNDIST ?? "") === district;
    case "U.S. Congressional":
      return String(props.CONG_DIST ?? "") === district;
    default:
      return true;
  }
}

// Component to fit map bounds when geojson loads
function FitBounds({ geojson }: { geojson: GeoJsonObject | null }) {
  const map = useMap();
  useEffect(() => {
    if (!geojson) return;
    try {
      const layer = L.geoJSON(geojson as GeoJsonObject);
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [10, 10] });
      }
    } catch {
      // fallback to Harris County center
      map.setView([29.7604, -95.3698], 10);
    }
  }, [geojson, map]);
  return null;
}

export default function DistrictsMap({
  geojson,
  selectedType,
  selectedDistrict,
  onPrecinctClick,
  selectedPrecinct,
}: DistrictsMapProps) {
  const keyRef = useRef(0);

  // Force GeoJSON layer remount when selection changes
  keyRef.current = (keyRef.current + 1) % 1000;

  if (!geojson) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl animate-pulse"
        style={{ height: 460, background: "#f0f4f8", border: "1px solid rgba(26,58,92,0.08)" }}
      >
        <p className="text-xs" style={{ color: "#9ca3af" }}>Loading precinct map...</p>
      </div>
    );
  }

  return (
    <MapContainer
      center={[29.7604, -95.3698]}
      zoom={10}
      style={{ height: 460, width: "100%", borderRadius: 16 }}
      scrollWheelZoom={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      <FitBounds geojson={geojson} />
      <GeoJSON
        key={`${selectedType}-${selectedDistrict}-${selectedPrecinct}-${keyRef.current}`}
        data={geojson}
        style={(feature) => {
          const props = (feature as PrecinctFeature).properties;
          const id = getPrecinctId(props);
          const isSelected = id === selectedPrecinct;
          const isFiltered = matchesDistrict(props, selectedType, selectedDistrict);
          return {
            fillColor: precinctColor(props, isSelected, isFiltered),
            fillOpacity: isSelected ? 0.85 : isFiltered ? 0.55 : 0.18,
            color: isSelected ? "#f59e0b" : isFiltered ? "#6b7280" : "#d1d5db",
            weight: isSelected ? 2.5 : 0.8,
          };
        }}
        onEachFeature={(feature, layer) => {
          const props = (feature as PrecinctFeature).properties;
          const id = getPrecinctId(props);
          const distLabel = selectedType && selectedDistrict
            ? ` | ${selectedType} ${selectedDistrict}`
            : "";

          layer.bindTooltip(
            `<div style="font-family:sans-serif;font-size:12px;font-weight:600;color:#1a3a5c">
              Precinct ${id}${distLabel}
            </div>`,
            { sticky: true, className: "districts-tooltip" }
          );

          layer.on({
            click: () => onPrecinctClick(props),
            mouseover: (e) => {
              (e.target as L.Path).setStyle({ weight: 2, fillOpacity: 0.75 });
            },
            mouseout: (e) => {
              const isFiltered = matchesDistrict(props, selectedType, selectedDistrict);
              (e.target as L.Path).setStyle({
                weight: id === selectedPrecinct ? 2.5 : 0.8,
                fillOpacity: id === selectedPrecinct ? 0.85 : isFiltered ? 0.55 : 0.18,
              });
            },
          });
        }}
      />
    </MapContainer>
  );
}
