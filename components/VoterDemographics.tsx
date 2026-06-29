"use client";

import { useState, useEffect, useMemo } from "react";

type DistrictField = "cd" | "sd" | "hd" | "jp" | "council" | "pct";

interface Segment {
  rank: number;
  label: string;    // "White Women"
  race: string;
  gender: string;
  count: number;
  avg_age: number;
  pct: number;      // percent of electorate this cycle
}

interface CycleData {
  dem?: Segment[];
  rep?: Segment[];
  total?: Segment[];
}

interface VoterDemoData {
  source: string;
  generated: string;
  districts: {
    [field: string]: {
      [value: string]: {
        [cycle: string]: CycleData;
      };
    };
  };
}

interface Props {
  districtField: DistrictField | null;
  districtValue: string | null;
}

const CYCLES_G = ["2024G", "2022G", "2020G", "2018G", "2016G", "2014G", "2012G"];
const CYCLES_P = ["2026P", "2024P", "2022P", "2020P", "2018P", "2016P", "2014P", "2012P"];
const CYCLES_R = ["2024R", "2022R", "2020R", "2018R", "2016R", "2014R", "2012R"];

const ELECTION_TABS = [
  { key: "primary",  label: "Primary",  cycles: CYCLES_P },
  { key: "runoff",   label: "Runoff",   cycles: CYCLES_R },
  { key: "general",  label: "General",  cycles: CYCLES_G },
] as const;

const RACE_COLORS: Record<string, string> = {
  "White":    "#2563a8",
  "Black":    "#7c3aed",
  "Hispanic": "#ea580c",
  "Asian":    "#0891b2",
  "Other":    "#6b7280",
};

function rankBadge(rank: number) {
  const medals = ["🥇", "🥈", "🥉"];
  if (rank <= 3) {
    return (
      <span className="text-base leading-none">{medals[rank - 1]}</span>
    );
  }
  return (
    <span className="text-[10px] font-bold w-5 text-center" style={{ color: "#9ca3af" }}>{rank}</span>
  );
}

function TrendArrow({ curr, prev }: { curr: number; prev: number | undefined }) {
  if (prev === undefined) return null;
  const diff = curr - prev;
  if (Math.abs(diff) < 0.5) return <span className="text-[9px]" style={{ color: "#9ca3af" }}>→</span>;
  return diff > 0
    ? <span className="text-[9px]" style={{ color: "#16a34a" }}>↑{diff.toFixed(1)}pp</span>
    : <span className="text-[9px]" style={{ color: "#dc2626" }}>↓{Math.abs(diff).toFixed(1)}pp</span>;
}

export default function VoterDemographics({ districtField, districtValue }: Props) {
  const [data, setData] = useState<VoterDemoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [electionTab, setElectionTab] = useState<"primary" | "runoff" | "general">("primary");
  const [party, setParty] = useState<"dem" | "rep" | "total">("total");
  const [cycleIdx, setCycleIdx] = useState(0);

  useEffect(() => {
    fetch("/data/voter-demographics.json")
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const districtData = useMemo(() => {
    if (!data || !districtField || !districtValue) return null;
    return data.districts[districtField]?.[districtValue] ?? null;
  }, [data, districtField, districtValue]);

  const activeCycles = ELECTION_TABS.find(t => t.key === electionTab)!.cycles;

  // Find cycles that actually have data for this district
  const availableCycles = useMemo(() => {
    if (!districtData) return activeCycles;
    return activeCycles.filter(c => districtData[c]?.[party]);
  }, [districtData, activeCycles, party]);

  const safeCycleIdx = Math.min(cycleIdx, Math.max(0, availableCycles.length - 1));
  const currentCycle = availableCycles[safeCycleIdx];
  const prevCycle    = availableCycles[safeCycleIdx + 1];

  const segments: Segment[] = useMemo(() => {
    if (!districtData || !currentCycle) return [];
    return districtData[currentCycle]?.[party] ?? [];
  }, [districtData, currentCycle, party]);

  const prevSegments: Segment[] | undefined = useMemo(() => {
    if (!districtData || !prevCycle) return undefined;
    return districtData[prevCycle]?.[party];
  }, [districtData, prevCycle, party]);

  // Total voters this cycle
  const totalVoters = segments.reduce((s, r) => s + r.count, 0);

  return (
    <div className="rounded-[1.35rem] bg-white/70 ring-1 ring-black/8 p-[4px] mt-4">
      <div className="rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] overflow-hidden">

        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-black/8">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] mr-auto" style={{ color: "#6b7280" }}>
              Who Voted Here
            </p>

            {/* Election type tabs */}
            <div className="flex rounded-lg overflow-hidden border border-black/10 text-[10px] font-semibold">
              {ELECTION_TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => { setElectionTab(tab.key); setCycleIdx(0); }}
                  className="px-2.5 py-1 transition-colors"
                  style={{
                    background: electionTab === tab.key ? "#1a3a5c" : "white",
                    color: electionTab === tab.key ? "white" : "#6b7280",
                  }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Party filter. Only shown for primary/runoff */}
            {electionTab !== "general" && (
              <div className="flex rounded-lg overflow-hidden border border-black/10 text-[10px] font-semibold">
                {([["total", "All"], ["dem", "D"], ["rep", "R"]] as const).map(([p, l]) => (
                  <button key={p} onClick={() => setParty(p)}
                    className="px-2.5 py-1 transition-colors"
                    style={{
                      background: party === p ? (p === "dem" ? "#2563a8" : p === "rep" ? "#dc2626" : "#1a3a5c") : "white",
                      color: party === p ? "white" : "#6b7280",
                    }}>{l}</button>
                ))}
              </div>
            )}
          </div>

          {/* Cycle selector */}
          {availableCycles.length > 0 && (
            <div className="flex gap-1.5 mt-2.5 flex-wrap">
              {availableCycles.map((c, i) => (
                <button
                  key={c}
                  onClick={() => setCycleIdx(i)}
                  className="text-[9px] font-semibold px-2 py-0.5 rounded-full border transition-colors"
                  style={{
                    background: i === safeCycleIdx ? "#1a3a5c" : "white",
                    color: i === safeCycleIdx ? "white" : "#6b7280",
                    borderColor: i === safeCycleIdx ? "#1a3a5c" : "#e5e7eb",
                  }}>
                  {c.replace("G", " Gen").replace("P", " Pri").replace("R", " Run")}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          {loading ? (
            <p className="text-[11px] text-center py-6" style={{ color: "#9ca3af" }}>Loading…</p>
          ) : !data || segments.length === 0 ? (
            /* ── Placeholder state when no voter file loaded ── */
            <div className="py-2">
              <p className="text-[11px] font-semibold mb-1" style={{ color: "#374151" }}>
                Voter file not yet connected
              </p>
              <p className="text-[10px] leading-relaxed mb-3" style={{ color: "#9ca3af" }}>
                When connected, this section will show a ranked breakdown like:
              </p>
              <div className="space-y-2 opacity-40 pointer-events-none select-none">
                {[
                  { rank: 1, label: "White Women",    count: 3240, avg_age: 51, pct: 28.1, race: "White",    gender: "F" },
                  { rank: 2, label: "Black Women",    count: 2190, avg_age: 54, pct: 19.0, race: "Black",    gender: "F" },
                  { rank: 3, label: "Hispanic Women", count: 1420, avg_age: 40, pct: 12.3, race: "Hispanic", gender: "F" },
                  { rank: 4, label: "White Men",      count: 1380, avg_age: 52, pct: 12.0, race: "White",    gender: "M" },
                  { rank: 5, label: "Black Men",      count: 1010, avg_age: 49, pct:  8.8, race: "Black",    gender: "M" },
                ].map(seg => (
                  <SegmentRow key={seg.rank} seg={seg} prevPct={undefined} />
                ))}
              </div>
              <p className="text-[9px] mt-4 leading-relaxed" style={{ color: "#9ca3af" }}>
                To connect: obtain the Harris County voter file from harrisvotes.com (Voter Registration Data Request),
                then run <code className="bg-gray-100 px-1 rounded">node scripts/process-voter-file.mjs</code> with
                the CSV paths set as env vars.
              </p>
            </div>
          ) : (
            /* ── Live data ── */
            <div>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-xl font-bold" style={{ fontFamily: "var(--font-playfair,serif)", color: "#1a3a5c" }}>
                  {totalVoters.toLocaleString()}
                </span>
                <span className="text-[10px]" style={{ color: "#9ca3af" }}>
                  {electionTab} voters · {currentCycle}
                  {prevCycle && (
                    <span className="ml-1">(vs {prevCycle})</span>
                  )}
                </span>
              </div>
              <div className="space-y-2">
                {segments.slice(0, 10).map(seg => {
                  const prev = prevSegments?.find(s => s.label === seg.label);
                  return <SegmentRow key={seg.rank} seg={seg} prevPct={prev?.pct} />;
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {data && (
          <p className="px-5 py-2 text-[9px] border-t border-black/8" style={{ color: "#b0b8c4" }}>
            {data.source} · generated {data.generated} · race/ethnicity from voter registration record
          </p>
        )}
      </div>
    </div>
  );
}

function SegmentRow({ seg, prevPct }: { seg: Segment; prevPct: number | undefined }) {
  const color = RACE_COLORS[seg.race] ?? "#6b7280";
  return (
    <div className="flex items-center gap-2">
      <div className="w-5 flex justify-center shrink-0">{rankBadge(seg.rank)}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span className="text-[11px] font-semibold truncate" style={{ color: "#1a3a5c" }}>{seg.label}</span>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[9px]" style={{ color: "#9ca3af" }}>avg {seg.avg_age}</span>
            <span className="text-[10px] font-bold w-10 text-right" style={{ color }}>{seg.pct}%</span>
            <TrendArrow curr={seg.pct} prev={prevPct} />
            <span className="text-[9px] w-14 text-right" style={{ color: "#6b7280" }}>{seg.count.toLocaleString()}</span>
          </div>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#f3f4f6" }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(seg.pct, 100)}%`, background: color }} />
        </div>
      </div>
    </div>
  );
}
