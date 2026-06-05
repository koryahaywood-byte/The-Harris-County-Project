"use client";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

export interface MapEvent {
  id: string;
  title: string;
  address: string;
  lat: number;
  lng: number;
  color: string;
  date: string;
}

function makeIcon(color: string) {
  return L.divIcon({
    html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
    className: "",
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    popupAnchor: [0, -8],
  });
}

export default function CivicMap({ events }: { events: MapEvent[] }) {
  // Fix default icon paths (Next.js asset issue with Leaflet)
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  if (events.length === 0) return (
    <div className="flex items-center justify-center rounded-2xl"
      style={{ height: 240, background: "#f0f4f8", border: "1px solid rgba(26,58,92,0.08)" }}>
      <p className="text-xs" style={{ color: "#9ca3af" }}>No civic events this month</p>
    </div>
  );

  // Center on Houston by default, or average of event coordinates
  const avgLat = events.reduce((s, e) => s + e.lat, 0) / events.length;
  const avgLng = events.reduce((s, e) => s + e.lng, 0) / events.length;

  return (
    <MapContainer
      center={[avgLat, avgLng]}
      zoom={11}
      style={{ height: 240, width: "100%", borderRadius: 16 }}
      zoomControl={false}
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      {events.map(e => (
        <Marker key={e.id} position={[e.lat, e.lng]} icon={makeIcon(e.color)}>
          <Popup>
            <div style={{ fontFamily: "var(--font-outfit, sans-serif)", minWidth: 160 }}>
              <p style={{ fontWeight: 700, fontSize: 12, color: "#1a3a5c", marginBottom: 2 }}>{e.title}</p>
              <p style={{ fontSize: 10, color: "#6b7280" }}>{e.address}</p>
              <p style={{ fontSize: 10, color: e.color, fontWeight: 600, marginTop: 2 }}>
                {new Date(e.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
