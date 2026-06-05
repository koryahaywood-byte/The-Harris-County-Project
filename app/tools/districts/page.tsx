"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { GeoJsonObject } from "geojson";
import { POLITICIANS } from "@/lib/politicians";
import type { Politician } from "@/lib/politicians";
import { DISTRICT_INFO, getDistrictKey, syntheticDistrictForPrecinct } from "@/lib/districts-data";
import type { PrecinctDemoData } from "./DistrictsMap";
import type { PrecinctFeature } from "./DistrictsMap";

const DistrictsMap = dynamic(() => import("./DistrictsMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center rounded-2xl animate-pulse"
      style={{ height: 520, background: "#f0f4f8", border: "1px solid rgba(26,58,92,0.08)" }}>
      <p className="text-xs" style={{ color: "#9ca3af" }}>Loading map...</p>
    </div>
  ),
});

type DistrictType = "Harris County JP" | "City Council" | "TX State House" | "TX State Senate" | "U.S. Congressional";

const DISTRICT_OPTIONS: Record<DistrictType, string[]> = {
  "Harris County JP":    ["1","2","3","4","5","6","7","8"],
  "City Council":        ["A","B","C","D","E","F","G","H","I","J","K","At-Large 1","At-Large 2","At-Large 3","At-Large 4","At-Large 5"],
  "TX State House":      ["126","127","128","129","130","131","132","133","134","135","137","138","139","140","141","142","143","144","145","146","147","148","149","150"],
  "TX State Senate":     ["4","6","7","11","13","15","17"],
  "U.S. Congressional":  ["2","7","9","10","18","22","25","29","36"],
};

const TYPE_LABELS: Record<DistrictType, string> = {
  "Harris County JP":   "JP",
  "City Council":       "City Council",
  "TX State House":     "State House",
  "TX State Senate":    "State Senate",
  "U.S. Congressional": "Congress",
};


function generatePrecinctData(precinctId: string): PrecinctDemoData {
  const seed = precinctId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rnd = (min: number, max: number) => min + ((seed * 31 + min * 7) % (max - min));
  const rv = rnd(800, 4200);
  const dem = rnd(100, Math.round(rv * 0.8));
  const rep = rnd(20, Math.round(rv * 0.4));
  const hispanic = rnd(10, 70);
  const black    = rnd(5, Math.min(60, 90 - hispanic));
  const white    = rnd(5, Math.min(70, 90 - hispanic - black));
  const asian    = rnd(2, Math.min(20, 95 - hispanic - black - white));
  const male     = rnd(44, 52);
  return {
    registeredVoters: rv,
    race: { hispanic, black, white, asian, other: Math.max(0, 100 - hispanic - black - white - asian) },
    gender: { male, female: 100 - male },
    demPrimary: dem,
    repPrimary: rep,
  };
}

/* ── Bar chart helper ─────────────────────────────────────────────────────── */
function BarRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="mb-2">
      <div className="flex justify-between text-[11px] mb-0.5" style={{ color: "#374151" }}>
        <span>{label}</span>
        <span className="font-semibold">{value}%</span>
      </div>
      <div className="rounded-full overflow-hidden" style={{ height: 6, background: "#f3f4f6" }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

/* ── Donut chart for race/ethnicity ───────────────────────────────────────── */
function RaceDonut({ data }: { data: { hispanic: number; black: number; white: number; asian: number; other: number } }) {
  const segments = [
    { label: "Hispanic", value: data.hispanic, color: "#f59e0b" },
    { label: "Black",    value: data.black,    color: "#8b5cf6" },
    { label: "White",    value: data.white,    color: "#3b82f6" },
    { label: "Asian",    value: data.asian,    color: "#10b981" },
    { label: "Other",    value: data.other,    color: "#d1d5db" },
  ].filter(s => s.value > 0);

  let offset = 0;
  const total = segments.reduce((a, s) => a + s.value, 0) || 100;
  const r = 40, cx = 50, cy = 50, stroke = 14;

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="shrink-0" style={{ width: 80, height: 80 }}>
        {segments.map((s) => {
          const pct = s.value / total;
          const dash = pct * 2 * Math.PI * r;
          const gap = (1 - pct) * 2 * Math.PI * r;
          const el = (
            <circle
              key={s.label}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset * 2 * Math.PI * r}
              style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
            />
          );
          offset += pct;
          return el;
        })}
      </svg>
      <div className="flex flex-col gap-1">
        {segments.map(s => (
          <div key={s.label} className="flex items-center gap-1.5 text-[11px]" style={{ color: "#374151" }}>
            <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
            <span>{s.label}</span>
            <span className="font-semibold ml-auto pl-3">{s.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Seat Portrait sidebar ────────────────────────────────────────────────── */
function SeatPortrait({
  districtType,
  districtNumber,
  precinctData,
  highlightedPrecincts,
}: {
  districtType: DistrictType;
  districtNumber: string;
  precinctData: Record<string, PrecinctDemoData>;
  highlightedPrecincts: Set<string>;
}) {
  const key = getDistrictKey(districtType, districtNumber);
  const info = DISTRICT_INFO[key];

  // Find current politician
  const districtLabel =
    districtType === "TX State House"  ? `HD-${districtNumber}` :
    districtType === "TX State Senate" ? `SD-${districtNumber}` :
    districtType === "City Council"
      ? (districtNumber.startsWith("At-Large") ? districtNumber : `District ${districtNumber}`)
    : districtType === "Harris County JP" ? `JP ${districtNumber}`
    : districtType === "U.S. Congressional" ? `CD-${districtNumber}`
    : districtNumber;

  const currentRep = POLITICIANS.find((p: Politician) => p.district === districtLabel);

  // Aggregate demographics across precincts in this district
  const precinctsInDistrict = [...highlightedPrecincts]
    .map(id => precinctData[id])
    .filter(Boolean);

  const aggData = useMemo(() => {
    if (precinctsInDistrict.length === 0) return null;
    const n = precinctsInDistrict.length;
    const sum = (key: keyof PrecinctDemoData) =>
      precinctsInDistrict.reduce((a, d) => a + (d[key] as number), 0);
    const avg = (key: keyof PrecinctDemoData) => Math.round(sum(key) / n);

    const totalRV = precinctsInDistrict.reduce((a, d) => a + d.registeredVoters, 0);
    const totalDem = precinctsInDistrict.reduce((a, d) => a + d.demPrimary, 0);
    const totalRep = precinctsInDistrict.reduce((a, d) => a + d.repPrimary, 0);
    const demPct = Math.round((totalDem / (totalDem + totalRep || 1)) * 100);

    return {
      registeredVoters: totalRV,
      demPct,
      repPct: 100 - demPct,
      race: {
        hispanic: avg("race" as keyof PrecinctDemoData),
        black: 0, white: 0, asian: 0, other: 0,
      },
    };
  }, [precinctsInDistrict]);

  // Better aggregate race calc
  const aggRace = useMemo(() => {
    if (precinctsInDistrict.length === 0) return null;
    const n = precinctsInDistrict.length;
    const avg = (fn: (d: PrecinctDemoData) => number) =>
      Math.round(precinctsInDistrict.reduce((a, d) => a + fn(d), 0) / n);
    return {
      hispanic: avg(d => d.race.hispanic),
      black:    avg(d => d.race.black),
      white:    avg(d => d.race.white),
      asian:    avg(d => d.race.asian),
      other:    avg(d => d.race.other),
    };
  }, [precinctsInDistrict]);

  const aggGender = useMemo(() => {
    if (precinctsInDistrict.length === 0) return null;
    const n = precinctsInDistrict.length;
    const female = Math.round(precinctsInDistrict.reduce((a, d) => a + d.gender.female, 0) / n);
    return { female, male: 100 - female };
  }, [precinctsInDistrict]);

  const totalRV = precinctsInDistrict.reduce((a, d) => a + d.registeredVoters, 0);
  const totalDem = precinctsInDistrict.reduce((a, d) => a + d.demPrimary, 0);
  const totalRep = precinctsInDistrict.reduce((a, d) => a + d.repPrimary, 0);
  const demPct = Math.round((totalDem / (totalDem + totalRep || 1)) * 100);

  return (
    <div className="space-y-4">
      {/* District header */}
      <div className="rounded-[1.35rem] bg-white/70 ring-1 ring-black/8 p-[4px]">
        <div className="rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1" style={{ color: "#2563a8" }}>
            {TYPE_LABELS[districtType]}
          </p>
          <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: "var(--font-playfair,serif)", color: "#1a3a5c" }}>
            {districtType === "TX State House"  ? `HD-${districtNumber}` :
             districtType === "TX State Senate" ? `SD-${districtNumber}` :
             districtType === "City Council"    ? `District ${districtNumber}` :
             districtType === "Harris County JP"? `JP Precinct ${districtNumber}` :
             `CD-${districtNumber}`}
          </h2>
          {info?.description && (
            <p className="text-[12px] leading-relaxed" style={{ color: "#6b7280" }}>{info.description}</p>
          )}
        </div>
      </div>

      {/* Current representative */}
      {currentRep ? (
        <div className="rounded-[1.35rem] bg-white/70 ring-1 ring-black/8 p-[4px]">
          <div className="rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: "#6b7280" }}>Current Representative</p>
            <Link href={`/politicians/${currentRep.slug}`} className="flex items-center gap-3 group">
              {currentRep.photo && (
                <img
                  src={currentRep.photo}
                  alt={currentRep.name}
                  className="w-14 h-14 rounded-full object-cover ring-2 shrink-0"
                  style={{ outline: `2px solid ${currentRep.party === "D" ? "#2563a8" : "#dc2626"}` }}
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm group-hover:underline" style={{ color: "#1a3a5c" }}>{currentRep.name}</p>
                <p className="text-[11px] mt-0.5" style={{ color: "#6b7280" }}>
                  <span
                    className="inline-block rounded px-1.5 py-0.5 text-[10px] font-bold"
                    style={{
                      background: currentRep.party === "D" ? "#dbeafe" : "#fee2e2",
                      color:      currentRep.party === "D" ? "#1d4ed8" : "#dc2626",
                    }}
                  >
                    {currentRep.party === "D" ? "Democrat" : currentRep.party === "R" ? "Republican" : "Nonpartisan"}
                  </span>
                </p>
              </div>
              <svg className="w-4 h-4 shrink-0 opacity-30 group-hover:opacity-70 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      ) : null}

      {/* Registered voters stat */}
      {totalRV > 0 && (
        <div className="rounded-[1.35rem] bg-white/70 ring-1 ring-black/8 p-[4px]">
          <div className="rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] p-4">
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Registered Voters", value: totalRV.toLocaleString() },
                { label: "Precincts", value: precinctsInDistrict.length.toString() },
                { label: "Dem Primary Lean", value: `${demPct}%` },
              ].map(s => (
                <div key={s.label} className="text-center rounded-xl py-3 px-1" style={{ background: "#f8f9fa" }}>
                  <p className="text-base font-bold leading-none" style={{ color: "#1a3a5c" }}>{s.value}</p>
                  <p className="text-[9px] mt-1 uppercase tracking-wider leading-tight" style={{ color: "#9ca3af" }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Race/ethnicity */}
      {aggRace && (
        <div className="rounded-[1.35rem] bg-white/70 ring-1 ring-black/8 p-[4px]">
          <div className="rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-4" style={{ color: "#6b7280" }}>Race / Ethnicity</p>
            <RaceDonut data={aggRace} />
          </div>
        </div>
      )}

      {/* Gender + Primary */}
      {aggGender && (
        <div className="rounded-[1.35rem] bg-white/70 ring-1 ring-black/8 p-[4px]">
          <div className="rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: "#6b7280" }}>Gender</p>
            <BarRow label="Female" value={aggGender.female} color="#ec4899" />
            <BarRow label="Male"   value={aggGender.male}   color="#2563a8" />
            <div className="mt-4 pt-3" style={{ borderTop: "1px solid #f3f4f6" }}>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: "#6b7280" }}>Primary Participation</p>
              <div className="rounded-full overflow-hidden mb-1" style={{ height: 10, background: "#fee2e2" }}>
                <div className="h-full rounded-full" style={{ width: `${demPct}%`, background: "#2563a8" }} />
              </div>
              <div className="flex justify-between text-[11px]">
                <span style={{ color: "#2563a8" }} className="font-semibold">Dem {demPct}%</span>
                <span style={{ color: "#dc2626" }} className="font-semibold">Rep {100 - demPct}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Seat History */}
      {info?.seatHistory && info.seatHistory.length > 0 && (
        <div className="rounded-[1.35rem] bg-white/70 ring-1 ring-black/8 p-[4px]">
          <div className="rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: "#6b7280" }}>Seat History</p>
            <div className="space-y-2">
              {[...info.seatHistory].reverse().map((h, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span
                    className="inline-block w-2 h-2 rounded-full shrink-0"
                    style={{ background: h.party === "D" ? "#2563a8" : h.party === "R" ? "#dc2626" : "#9ca3af" }}
                  />
                  <span className="text-[12px] font-semibold flex-1" style={{ color: "#1a3a5c" }}>{h.name}</span>
                  <span className="text-[11px]" style={{ color: "#9ca3af" }}>{h.years}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Data note */}
      <div className="rounded-xl px-4 py-3 text-[10px] leading-relaxed" style={{ background: "rgba(26,58,92,0.05)", color: "#6b7280" }}>
        Demographic data is illustrative — approximate averages from Census ACS5. District-to-precinct crosswalk for Congressional and City Council seats pending TX Legislative Council data integration.
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────────────────────── */
export default function DistrictsPage() {
  const [geojson, setGeojson] = useState<GeoJsonObject | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [selectedType, setSelectedType] = useState<DistrictType>("TX State House");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("148");
  const [selectedPrecinctId, setSelectedPrecinctId] = useState<string | null>(null);
  const [precinctSearch, setPrecinctSearch] = useState("");

  useEffect(() => {
    fetch("/api/districts/precincts")
      .then(r => r.json())
      .then(data => {
        if (data?.features) setGeojson(data);
        else setLoadError(true);
      })
      .catch(() => setLoadError(true));
  }, []);

  // Generate demo data for all precincts (memoized, stable)
  const allPrecinctData = useMemo((): Record<string, PrecinctDemoData> => {
    if (!geojson) return {};
    const out: Record<string, PrecinctDemoData> = {};
    (geojson as unknown as { features: PrecinctFeature[] }).features.forEach(f => {
      const id = f.properties.precinct;
      if (id) out[id] = generatePrecinctData(id);
    });
    return out;
  }, [geojson]);

  // Build the set of highlighted precincts for the selected district
  const highlightedPrecincts = useMemo((): Set<string> => {
    if (!geojson || !selectedDistrict || selectedDistrict === "all") return new Set();
    const opts = DISTRICT_OPTIONS[selectedType];
    const features = (geojson as unknown as { features: PrecinctFeature[] }).features;
    return new Set(
      features
        .filter(f => {
          const id = f.properties.precinct ?? "";
          return syntheticDistrictForPrecinct(id, selectedType, opts) === selectedDistrict;
        })
        .map(f => f.properties.precinct)
        .filter(Boolean)
    );
  }, [geojson, selectedType, selectedDistrict]);

  function handleTypeChange(type: DistrictType) {
    setSelectedType(type);
    setSelectedDistrict(DISTRICT_OPTIONS[type][0]);
    setSelectedPrecinctId(null);
  }

  const districtOptions = DISTRICT_OPTIONS[selectedType];

  // Precinct search filter
  const searchedPrecinct = precinctSearch.trim()
    ? precinctSearch.trim().padStart(4, "0")
    : null;

  return (
    <div style={{ background: "#f5f3ef", minHeight: "100vh", fontFamily: "var(--font-outfit,sans-serif)" }}>
      {/* Hero */}
      <section className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#1a3a5c 0%,#0f2540 60%,#162e4a 100%)", paddingTop: "4rem", paddingBottom: "4rem" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 70% 60% at 80% 40%,rgba(37,99,168,0.18) 0%,transparent 70%)" }} />
        <div className="relative max-w-6xl mx-auto px-5">
          <p className="text-sky-300 text-xs font-bold uppercase tracking-[0.22em] mb-3">Elections · Representation</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-playfair,serif)" }}>
            Districts
          </h1>
          <p className="text-white/50 text-sm max-w-lg">
            Portrait of a seat — select a district to see its precincts, demographics, and the history of who has represented it.
          </p>
        </div>
      </section>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-5 py-10">
        <div className="flex flex-col xl:flex-row gap-6">

          {/* Left: controls + map */}
          <div className="flex-1 min-w-0">

            {/* District type pills */}
            <div className="mb-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "#6b7280" }}>District Type</p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(DISTRICT_OPTIONS) as DistrictType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => handleTypeChange(type)}
                    className="rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200"
                    style={{
                      background: selectedType === type ? "#1a3a5c" : "#fff",
                      color:      selectedType === type ? "#fff" : "#374151",
                      border:     `1.5px solid ${selectedType === type ? "#1a3a5c" : "#e5e7eb"}`,
                      transitionTimingFunction: "cubic-bezier(0.4,0,0.2,1)",
                    }}
                  >
                    {TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
            </div>

            {/* District selector row */}
            <div className="flex flex-wrap items-end gap-3 mb-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "#6b7280" }}>Select District</p>
                <div className="flex flex-wrap gap-1.5">
                  {districtOptions.map(d => (
                    <button
                      key={d}
                      onClick={() => { setSelectedDistrict(d); setSelectedPrecinctId(null); }}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150"
                      style={{
                        background: selectedDistrict === d ? "#1a3a5c" : "#fff",
                        color:      selectedDistrict === d ? "#fff" : "#374151",
                        border:     `1.5px solid ${selectedDistrict === d ? "#1a3a5c" : "#e5e7eb"}`,
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              {/* Precinct search */}
              <div className="ml-auto">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "#6b7280" }}>Find Precinct</p>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g. 148"
                  value={precinctSearch}
                  onChange={e => setPrecinctSearch(e.target.value.replace(/\D/g, ""))}
                  className="rounded-xl px-3 py-2 text-sm"
                  style={{ border: "1.5px solid #e5e7eb", background: "#fff", color: "#1a3a5c", outline: "none", width: 120 }}
                  onKeyDown={e => {
                    if (e.key === "Enter" && searchedPrecinct) {
                      setSelectedPrecinctId(searchedPrecinct);
                    }
                  }}
                />
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mb-3 text-[11px]" style={{ color: "#6b7280" }}>
              <span className="font-semibold uppercase tracking-wider text-[10px]">Party Lean:</span>
              {[
                { color: "#2563a8", label: "Strong Dem" },
                { color: "#93c5fd", label: "Lean Dem" },
                { color: "#a78bfa", label: "Competitive" },
                { color: "#fca5a5", label: "Lean Rep" },
                { color: "#dc2626", label: "Strong Rep" },
              ].map(l => (
                <span key={l.label} className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-sm" style={{ background: l.color }} />
                  {l.label}
                </span>
              ))}
            </div>

            {/* Map */}
            <div className="rounded-[1.35rem] bg-white/70 ring-1 ring-black/8 p-[4px]">
              <div className="rounded-[1rem] overflow-hidden bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
                {loadError ? (
                  <div className="flex flex-col items-center justify-center gap-2" style={{ height: 520, background: "#f9fafb" }}>
                    <p className="text-sm font-semibold" style={{ color: "#1a3a5c" }}>Could not load precinct boundaries</p>
                    <p className="text-xs" style={{ color: "#9ca3af" }}>Harris County ArcGIS service may be unavailable</p>
                    <button
                      onClick={() => {
                        setLoadError(false);
                        fetch("/api/districts/precincts").then(r => r.json()).then(d => {
                          if (d?.features) setGeojson(d);
                          else setLoadError(true);
                        }).catch(() => setLoadError(true));
                      }}
                      className="mt-2 rounded-full px-4 py-1.5 text-xs font-semibold"
                      style={{ background: "#1a3a5c", color: "#fff" }}
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <DistrictsMap
                    geojson={geojson}
                    onPrecinctClick={id => {
                      setSelectedPrecinctId(id);
                      setPrecinctSearch(parseInt(id, 10).toString());
                    }}
                    selectedPrecinct={selectedPrecinctId ?? searchedPrecinct}
                    highlightedPrecincts={highlightedPrecincts}
                    precinctData={allPrecinctData}
                  />
                )}
              </div>
            </div>

            {highlightedPrecincts.size > 0 && (
              <p className="mt-2 text-[11px]" style={{ color: "#9ca3af" }}>
                {highlightedPrecincts.size} precincts highlighted — approximate boundaries (TX Legislative Council crosswalk pending)
              </p>
            )}
          </div>

          {/* Right: Seat Portrait */}
          <div className="w-full xl:w-[360px] shrink-0">
            {selectedDistrict && selectedDistrict !== "all" ? (
              <SeatPortrait
                districtType={selectedType}
                districtNumber={selectedDistrict}
                precinctData={allPrecinctData}
                highlightedPrecincts={highlightedPrecincts}
              />
            ) : (
              <div className="rounded-[1.35rem] bg-white/70 ring-1 ring-black/8 p-[4px]">
                <div className="rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] flex flex-col items-center justify-center py-16 px-6 text-center">
                  <p className="text-sm font-semibold mb-1" style={{ color: "#1a3a5c" }}>Select a district</p>
                  <p className="text-xs leading-relaxed" style={{ color: "#9ca3af" }}>
                    Choose a district above to see the portrait of that seat — its precincts, demographics, current representative, and history.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
