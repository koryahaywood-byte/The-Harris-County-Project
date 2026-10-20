"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type L from "leaflet";
import type { Feature, FeatureCollection } from "geojson";
import { BASEMAP } from "@/lib/basemap";
import { isCoarsePointer } from "@/lib/touch";

import { EDGE_STEPS, GAP_STEPS, TURNOUT_RAMP, gapOf, turnoutBreaks, type Metric, type PrecinctRow } from "./scale";

const MIN_BALLOTS = 25;   // below this a precinct's mix is noise; shown neutral

function colorFor(r: PrecinctRow | undefined, metric: Metric, breaks: number[]) {
  if (!r || r[0] === 0) return "#F1F2EE";
  if (metric === "gap") {
    const g = gapOf(r);
    return g == null ? "#F1F2EE" : GAP_STEPS.find(s => g < s.max)!.color;
  }
  if (metric === "edge") {
    if (r[0] < MIN_BALLOTS) return "#F1F2EE";
    const e = ((r[1] - r[2]) / r[0]) * 100;
    return EDGE_STEPS.find(s => e < s.max)!.color;
  }
  if (r[6] < 50) return "#F1F2EE";
  const t = r[0] / r[6];
  const i = breaks.findIndex(b => t < b);
  return TURNOUT_RAMP[i < 0 ? TURNOUT_RAMP.length - 1 : i];
}

function tip(prec: string, r: PrecinctRow | undefined) {
  const n = Number(prec);
  if (!r || r[0] === 0) return `<b>Precinct ${n}</b><br/>No early ballots yet`;
  const p = (x: number) => `${((x / r[0]) * 100).toFixed(0)}%`;
  return `<div style="font:12.5px/1.45 var(--font-overpass),system-ui;color:#121714;min-width:180px">
    <div style="font-weight:700;font-size:13px;margin-bottom:3px">Precinct ${n}</div>
    <div><b>${r[0].toLocaleString()}</b> ballots · ${r[4].toLocaleString()} in person, ${r[5].toLocaleString()} mail</div>
    ${r[6] ? `<div style="color:#5B635E">${((r[0] / r[6]) * 100).toFixed(1)}% of 2024 registered voters</div>` : ""}
    <div style="margin-top:4px">Last primary: Dem <b>${p(r[1])}</b> · Rep <b>${p(r[2])}</b> · none <b>${p(r[3])}</b></div>
    ${r[7] && r[8] ? `<div>March voters who voted: Dem <b>${((r[9] / r[7]) * 100).toFixed(1)}%</b> · Rep <b>${((r[10] / r[8]) * 100).toFixed(1)}%</b></div>` : ""}
    ${r[0] < MIN_BALLOTS ? `<div style="color:#8A918C;margin-top:2px">Too few ballots to read a lean</div>` : ""}
  </div>`;
}

export default function EarlyVoteMap({ precincts, metric }: { precincts: Record<string, PrecinctRow>; metric: Metric }) {
  const [geo, setGeo] = useState<FeatureCollection | null>(null);
  useEffect(() => { fetch("/data/harris-precincts.geojson").then(r => r.json()).then(setGeo).catch(() => {}); }, []);
  const breaks = useMemo(() => turnoutBreaks(Object.values(precincts)), [precincts]);
  const key = (f: Feature) => String(Number((f.properties as { PREC?: string })?.PREC ?? 0)).padStart(4, "0");

  if (!geo) return <div className="flex items-center justify-center text-[13px]" style={{ height: 520, color: "#6B726D" }}>Loading precincts…</div>;
  return (
    <MapContainer center={[29.83, -95.4]} zoom={10} zoomSnap={0.5} scrollWheelZoom={false} dragging={!isCoarsePointer()}
      style={{ height: 520, width: "100%", background: "#F1F2EE" }}>
      <TileLayer url={BASEMAP.base} attribution={BASEMAP.attribution} maxNativeZoom={BASEMAP.maxNativeZoom} maxZoom={19} />
      <GeoJSON key={metric} data={geo}
        style={(f) => ({ fillColor: colorFor(precincts[key(f as Feature)], metric, breaks), fillOpacity: 0.85, color: "#fff", weight: 0.5 })}
        onEachFeature={(f, layer) => {
          layer.bindTooltip(tip(key(f), precincts[key(f)]), { sticky: true, offset: [12, 0] });
          if (!isCoarsePointer()) layer.on({
            mouseover: (e) => (e.target as L.Path).setStyle({ weight: 2, color: "#121714" }),
            mouseout: (e) => (e.target as L.Path).setStyle({ weight: 0.5, color: "#fff" }),
          });
        }} />
      <TileLayer url={BASEMAP.labels} maxNativeZoom={BASEMAP.maxNativeZoom} maxZoom={19} />
    </MapContainer>
  );
}
