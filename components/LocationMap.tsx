"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

// A small read-only map: a pulsing pin at the user's coordinates, with their voting
// precinct outlined. Leaflet is imported dynamically so it never runs during SSR.
export default function LocationMap({
  lat,
  lng,
  geometry,
}: {
  lat: number;
  lng: number;
  geometry?: GeoJSON.Geometry;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!elRef.current || mapRef.current) return;
    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !elRef.current) return;

      const map = L.map(elRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
        attributionControl: false,
      }).setView([lat, lng], 13);
      mapRef.current = map;

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(map);

      if (geometry) {
        const layer = L.geoJSON(geometry as GeoJSON.GeoJsonObject, {
          style: { color: "#2563a8", weight: 2, fillColor: "#2563a8", fillOpacity: 0.12 },
        }).addTo(map);
        try {
          map.fitBounds(layer.getBounds().pad(0.35));
        } catch {
          /* keep default view if bounds are degenerate */
        }
      }

      const icon = L.divIcon({
        className: "",
        html:
          '<div style="position:relative;width:18px;height:18px">' +
          '<span style="position:absolute;inset:0;border-radius:9999px;background:#2563a8;opacity:0.35;animation:alive-halo 2.4s cubic-bezier(0.4,0,0.6,1) infinite"></span>' +
          '<span style="position:absolute;inset:3px;border-radius:9999px;background:#1a3a5c;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.35)"></span>' +
          "</div>",
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      L.marker([lat, lng], { icon, keyboard: false }).addTo(map);
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [lat, lng, geometry]);

  return (
    <div
      ref={elRef}
      style={{ height: 240, width: "100%", borderRadius: "1rem", overflow: "hidden", zIndex: 0 }}
    />
  );
}
