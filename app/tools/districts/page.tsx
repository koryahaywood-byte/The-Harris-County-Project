"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import type { GeoJsonObject } from "geojson";
import type { PrecinctFeature } from "./DistrictsMap";

const DistrictsMap = dynamic(() => import("./DistrictsMap"), {
  ssr: false,
  loading: () => (
    <div
      className="flex items-center justify-center rounded-2xl animate-pulse"
      style={{ height: 460, background: "#f0f4f8", border: "1px solid rgba(26,58,92,0.08)" }}
    >
      <p className="text-xs" style={{ color: "#9ca3af" }}>Loading map...</p>
    </div>
  ),
});

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface PrecinctData {
  registeredVoters: number;
  ballotsCast: number;
  turnout: number;
  demPrimary: number;
  repPrimary: number;
  race: { hispanic: number; black: number; white: number; asian: number; other: number };
  age: { "18-29": number; "30-44": number; "45-64": number; "65+": number };
  gender: { male: number; female: number };
}

type DistrictType = "Harris County JP" | "City Council" | "TX State House" | "TX State Senate" | "U.S. Congressional";

/* ─── Static demo data ───────────────────────────────────────────────────── */
const DEMO_PRECINCT_DATA: Record<string, PrecinctData> = {
  "100": { registeredVoters: 1842, ballotsCast: 743, turnout: 40.3, demPrimary: 612, repPrimary: 131, race: { hispanic: 38, black: 28, white: 22, asian: 8, other: 4 }, age: { "18-29": 22, "30-44": 31, "45-64": 30, "65+": 17 }, gender: { male: 46, female: 54 } },
  "200": { registeredVoters: 2103, ballotsCast: 987, turnout: 46.9, demPrimary: 820, repPrimary: 167, race: { hispanic: 62, black: 15, white: 13, asian: 6, other: 4 }, age: { "18-29": 28, "30-44": 33, "45-64": 27, "65+": 12 }, gender: { male: 48, female: 52 } },
  "300": { registeredVoters: 3421, ballotsCast: 1654, turnout: 48.3, demPrimary: 234, repPrimary: 1420, race: { hispanic: 15, black: 5, white: 68, asian: 8, other: 4 }, age: { "18-29": 12, "30-44": 24, "45-64": 35, "65+": 29 }, gender: { male: 51, female: 49 } },
};

function generateDemoData(precinctId: string): PrecinctData {
  const seed = precinctId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = (min: number, max: number) => min + ((seed * 31 + min * 7) % (max - min));
  const rv = rand(800, 4200);
  const bc = Math.round(rv * (0.28 + (rand(0, 30) / 100)));
  const dem = Math.round(bc * (0.2 + rand(0, 70) / 100));
  const rep = bc - dem;
  const hispanic = rand(10, 70);
  const black = rand(5, Math.min(60, 90 - hispanic));
  const white = rand(5, Math.min(70, 90 - hispanic - black));
  const asian = rand(2, Math.min(20, 95 - hispanic - black - white));
  const other = 100 - hispanic - black - white - asian;
  return {
    registeredVoters: rv, ballotsCast: bc,
    turnout: Math.round((bc / rv) * 1000) / 10,
    demPrimary: dem, repPrimary: rep,
    race: { hispanic, black, white, asian, other: Math.max(0, other) },
    age: { "18-29": rand(10, 28), "30-44": rand(22, 35), "45-64": rand(25, 38), "65+": rand(8, 28) },
    gender: { male: rand(44, 52), female: 100 - rand(44, 52) },
  };
}

/* ─── District config ────────────────────────────────────────────────────── */
const DISTRICT_OPTIONS: Record<DistrictType, string[]> = {
  "Harris County JP": ["1", "2", "3", "4", "5", "6", "7", "8"],
  "City Council": ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "At-Large 1", "At-Large 2", "At-Large 3", "At-Large 4", "At-Large 5"],
  "TX State House": ["126", "127", "128", "129", "130", "131", "132", "133", "134", "135", "137", "138", "139", "140", "141", "142", "143", "144", "145", "146", "147", "148", "149", "150"],
  "TX State Senate": ["4", "6", "7", "11", "13", "15", "17"],
  "U.S. Congressional": ["2", "7", "9", "10", "18", "22", "25", "29", "36"],
};

const DISTRICT_TYPE_LABELS: Record<DistrictType, string> = {
  "Harris County JP": "JP Precinct",
  "City Council": "City Council",
  "TX State House": "State House",
  "TX State Senate": "State Senate",
  "U.S. Congressional": "Congress",
};

/* ─── Bar chart helper ───────────────────────────────────────────────────── */
function BarRow({ label, value, color, max = 100 }: { label: string; value: number; color: string; max?: number }) {
  return (
    <div className="mb-1.5">
      <div className="flex justify-between text-[11px] mb-0.5" style={{ color: "#374151" }}>
        <span>{label}</span>
        <span className="font-semibold">{value}%</span>
      </div>
      <div className="rounded-full overflow-hidden" style={{ height: 6, background: "#f3f4f6" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: color }}
        />
      </div>
    </div>
  );
}

/* ─── Info panel ─────────────────────────────────────────────────────────── */
function PrecinctPanel({ precinctId, data }: { precinctId: string; data: PrecinctData }) {
  const demPct = Math.round((data.demPrimary / (data.demPrimary + data.repPrimary + 1)) * 100);
  const repPct = 100 - demPct;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-[1.35rem] bg-white/70 ring-1 ring-black/8 p-[4px]">
        <div className="rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-0.5" style={{ color: "#2563a8" }}>Selected</p>
          <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-playfair,serif)", color: "#1a3a5c" }}>
            Precinct {precinctId}
          </h2>
        </div>
      </div>

      {/* Election Turnout */}
      <div className="rounded-[1.35rem] bg-white/70 ring-1 ring-black/8 p-[4px]">
        <div className="rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: "#6b7280" }}>Election Turnout</p>
          <div className="grid grid-cols-3 gap-2 mb-1">
            {[
              { label: "Registered", value: data.registeredVoters.toLocaleString() },
              { label: "Ballots Cast", value: data.ballotsCast.toLocaleString() },
              { label: "Turnout", value: `${data.turnout}%` },
            ].map((s) => (
              <div key={s.label} className="text-center rounded-xl py-3 px-1" style={{ background: "#f8f9fa" }}>
                <p className="text-[16px] font-bold leading-none" style={{ color: "#1a3a5c" }}>{s.value}</p>
                <p className="text-[9px] mt-1 uppercase tracking-wider" style={{ color: "#9ca3af" }}>{s.label}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] mt-2" style={{ color: "#9ca3af" }}>2024 General Election (example data)</p>
        </div>
      </div>

      {/* Race/Ethnicity */}
      <div className="rounded-[1.35rem] bg-white/70 ring-1 ring-black/8 p-[4px]">
        <div className="rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: "#6b7280" }}>Race / Ethnicity</p>
          <BarRow label="Hispanic" value={data.race.hispanic} color="#f59e0b" />
          <BarRow label="Black" value={data.race.black} color="#8b5cf6" />
          <BarRow label="White" value={data.race.white} color="#3b82f6" />
          <BarRow label="Asian" value={data.race.asian} color="#10b981" />
          <BarRow label="Other" value={data.race.other} color="#d1d5db" />
        </div>
      </div>

      {/* Age Breakdown */}
      <div className="rounded-[1.35rem] bg-white/70 ring-1 ring-black/8 p-[4px]">
        <div className="rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: "#6b7280" }}>Age Breakdown</p>
          {(Object.entries(data.age) as [string, number][]).map(([group, val]) => (
            <BarRow key={group} label={group} value={val} color="#2563a8" />
          ))}
        </div>
      </div>

      {/* Gender */}
      <div className="rounded-[1.35rem] bg-white/70 ring-1 ring-black/8 p-[4px]">
        <div className="rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: "#6b7280" }}>Gender</p>
          <BarRow label="Female" value={data.gender.female} color="#ec4899" />
          <BarRow label="Male" value={data.gender.male} color="#2563a8" />
        </div>
      </div>

      {/* Party Primary Participation */}
      <div className="rounded-[1.35rem] bg-white/70 ring-1 ring-black/8 p-[4px]">
        <div className="rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: "#6b7280" }}>Party Primary Participation</p>
          <div className="mb-2">
            <div className="flex justify-between text-[11px] mb-1" style={{ color: "#374151" }}>
              <span className="font-semibold" style={{ color: "#3b82f6" }}>Democratic</span>
              <span>{data.demPrimary.toLocaleString()} votes ({demPct}%)</span>
            </div>
            <div className="rounded-full overflow-hidden" style={{ height: 8, background: "#fef2f2" }}>
              <div className="h-full rounded-full" style={{ width: `${demPct}%`, background: "#3b82f6" }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[11px] mb-1" style={{ color: "#374151" }}>
              <span className="font-semibold" style={{ color: "#ef4444" }}>Republican</span>
              <span>{data.repPrimary.toLocaleString()} votes ({repPct}%)</span>
            </div>
            <div className="rounded-full overflow-hidden" style={{ height: 8, background: "#eff6ff" }}>
              <div className="h-full rounded-full" style={{ width: `${repPct}%`, background: "#ef4444" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Data notes */}
      <div className="rounded-xl px-4 py-3 text-[10px] leading-relaxed" style={{ background: "rgba(26,58,92,0.05)", color: "#6b7280" }}>
        Demographic data shown is illustrative. Full precinct-level demographic integration from the Texas Secretary of State and U.S. Census requires a spatial join (future work). Election turnout from Harris County Clerk canvass CSVs — full hookup is forthcoming.
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
export default function DistrictsPage() {
  const [geojson, setGeojson] = useState<GeoJsonObject | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [selectedType, setSelectedType] = useState<DistrictType>("U.S. Congressional");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
  const [selectedPrecinctId, setSelectedPrecinctId] = useState<string | null>(null);
  const [selectedPrecinctProps, setSelectedPrecinctProps] = useState<PrecinctFeature["properties"] | null>(null);

  useEffect(() => {
    fetch("/api/districts/precincts")
      .then((r) => r.json())
      .then((data) => {
        if (data?.features) {
          setGeojson(data);
        } else {
          setLoadError(true);
        }
      })
      .catch(() => setLoadError(true));
  }, []);

  const districtOptions = DISTRICT_OPTIONS[selectedType];

  const precinctData = useMemo((): PrecinctData | null => {
    if (!selectedPrecinctId) return null;
    return DEMO_PRECINCT_DATA[selectedPrecinctId] ?? generateDemoData(selectedPrecinctId);
  }, [selectedPrecinctId]);

  function handlePrecinctClick(props: PrecinctFeature["properties"]) {
    const id = String(props.PRECINCT_N ?? props.PCT_CODE ?? "");
    setSelectedPrecinctId(id);
    setSelectedPrecinctProps(props);
  }

  function handleTypeChange(type: DistrictType) {
    setSelectedType(type);
    setSelectedDistrict("all");
    setSelectedPrecinctId(null);
    setSelectedPrecinctProps(null);
  }

  return (
    <div style={{ background: "#f5f3ef", minHeight: "100vh", fontFamily: "var(--font-outfit,sans-serif)" }}>
      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg,#1a3a5c 0%,#0f2540 60%,#162e4a 100%)",
          paddingTop: "4rem",
          paddingBottom: "4rem",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 70% 60% at 80% 40%,rgba(37,99,168,0.18) 0%,transparent 70%)" }}
        />
        <div className="relative max-w-6xl mx-auto px-5">
          <p className="text-sky-300 text-xs font-bold uppercase tracking-[0.22em] mb-3">Elections · Demographics</p>
          <h1
            className="text-3xl md:text-4xl font-bold text-white mb-2"
            style={{ fontFamily: "var(--font-playfair,serif)" }}
          >
            Districts
          </h1>
          <p className="text-white/50 text-sm max-w-lg">
            Explore Harris County voting precincts by district. Select a district type, filter by number, click any precinct to see turnout, demographics, and party participation.
          </p>
        </div>
      </section>

      {/* ── Body ── */}
      <div className="max-w-6xl mx-auto px-5 py-10">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Left: controls + map ── */}
          <div className="flex-1 min-w-0">
            {/* District type pills */}
            <div className="mb-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "#6b7280" }}>District Type</p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(DISTRICT_OPTIONS) as DistrictType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => handleTypeChange(type)}
                    className="rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200"
                    style={{
                      background: selectedType === type ? "#1a3a5c" : "#fff",
                      color: selectedType === type ? "#fff" : "#374151",
                      border: `1.5px solid ${selectedType === type ? "#1a3a5c" : "#e5e7eb"}`,
                      transitionTimingFunction: "cubic-bezier(0.4,0,0.2,1)",
                    }}
                  >
                    {DISTRICT_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
            </div>

            {/* District number selector */}
            <div className="mb-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "#6b7280" }}>
                Filter by {DISTRICT_TYPE_LABELS[selectedType]}
              </p>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="rounded-xl px-4 py-2 text-sm font-medium"
                style={{
                  border: "1.5px solid #e5e7eb",
                  background: "#fff",
                  color: "#1a3a5c",
                  outline: "none",
                  minWidth: 200,
                }}
              >
                <option value="all">All Precincts</option>
                {districtOptions.map((d) => (
                  <option key={d} value={d}>
                    {DISTRICT_TYPE_LABELS[selectedType]} {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mb-4 text-[11px]" style={{ color: "#6b7280" }}>
              <span className="font-semibold uppercase tracking-wider text-[10px]">Party Lean:</span>
              {[
                { color: "#3b82f6", label: "Dem" },
                { color: "#ef4444", label: "Rep" },
                { color: "#a78bfa", label: "Competitive" },
                { color: "#d1d5db", label: "Filtered out" },
              ].map((l) => (
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
                  <div
                    className="flex flex-col items-center justify-center gap-2"
                    style={{ height: 460, background: "#f9fafb" }}
                  >
                    <p className="text-sm font-semibold" style={{ color: "#1a3a5c" }}>Could not load precinct boundaries</p>
                    <p className="text-xs" style={{ color: "#9ca3af" }}>Harris County ArcGIS service may be unavailable</p>
                    <button
                      onClick={() => { setLoadError(false); fetch("/api/districts/precincts").then(r => r.json()).then(d => { if (d?.features) setGeojson(d); else setLoadError(true); }).catch(() => setLoadError(true)); }}
                      className="mt-2 rounded-full px-4 py-1.5 text-xs font-semibold"
                      style={{ background: "#1a3a5c", color: "#fff" }}
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <DistrictsMap
                    geojson={geojson}
                    selectedType={selectedType}
                    selectedDistrict={selectedDistrict}
                    onPrecinctClick={handlePrecinctClick}
                    selectedPrecinct={selectedPrecinctId}
                  />
                )}
              </div>
            </div>

            {/* Selected precinct info under map (debug) */}
            {selectedPrecinctProps && (
              <div className="mt-3 rounded-xl px-4 py-2 text-[11px]" style={{ background: "rgba(37,99,168,0.07)", color: "#2563a8" }}>
                <span className="font-semibold">Precinct {selectedPrecinctId}</span>
                {selectedPrecinctProps.CONG_DIST && <span className="ml-3">CD-{selectedPrecinctProps.CONG_DIST}</span>}
                {selectedPrecinctProps.SNDIST && <span className="ml-3">SD-{selectedPrecinctProps.SNDIST}</span>}
                {selectedPrecinctProps.HDDIST && <span className="ml-3">HD-{selectedPrecinctProps.HDDIST}</span>}
                {selectedPrecinctProps.JP_PRECINCT && <span className="ml-3">JP-{selectedPrecinctProps.JP_PRECINCT}</span>}
                {selectedPrecinctProps.CITY_COUNCIL && <span className="ml-3">CC-{selectedPrecinctProps.CITY_COUNCIL}</span>}
              </div>
            )}
          </div>

          {/* ── Right: info panel ── */}
          <div className="w-full lg:w-[320px] shrink-0">
            {selectedPrecinctId && precinctData ? (
              <PrecinctPanel precinctId={selectedPrecinctId} data={precinctData} />
            ) : (
              <div className="rounded-[1.35rem] bg-white/70 ring-1 ring-black/8 p-[4px]">
                <div
                  className="rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] flex flex-col items-center justify-center py-16 px-6 text-center"
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: "rgba(26,58,92,0.07)" }}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" fill="#1a3a5c" opacity="0.3"/>
                    </svg>
                  </div>
                  <p className="text-sm font-semibold mb-1" style={{ color: "#1a3a5c" }}>Select a precinct</p>
                  <p className="text-xs leading-relaxed" style={{ color: "#9ca3af" }}>
                    Click any precinct on the map to view turnout, demographics, and party participation data.
                  </p>
                  <div className="mt-6 w-full space-y-2">
                    {["Registered voters", "Ballots cast", "Turnout %", "Race & ethnicity", "Age breakdown", "Party primary"].map((item) => (
                      <div key={item} className="rounded-lg h-8 animate-pulse" style={{ background: "#f3f4f6" }}>
                        <div className="h-full rounded-lg" style={{ width: "60%", background: "#e9ecef" }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
