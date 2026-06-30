"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import RelatedTools from "@/components/RelatedTools";

/* ── Types ───────────────────────────────────────────────────────────────── */
interface Dropoff {
  label: string;
  dist_d: number;
  dist_r: number;
  top_d: number;
  top_r: number;
  dropoff_d: number;
  dropoff_r: number;
}

interface CycleStat {
  reg: number;
  turnout: number;
  turnout_rate: number | null;
  d: number;
  r: number;
  d_pct: number | null;
  opportunity: number | null;
  dropoff?: Dropoff;
}

type DistrictData = Record<string, Record<string, CycleStat>>;
type OpportunityData = { hd: DistrictData; sd: DistrictData; cd: DistrictData };

type Field = "hd" | "sd" | "cd";
type SortKey = "opportunity" | "turnout_rate" | "dropoff_d";
type Cycle = "2024G" | "2022G" | "2020G";

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const FIELD_LABELS: Record<Field, string> = { hd: "State House", sd: "State Senate", cd: "Congress" };
const CYCLE_LABELS: Record<Cycle, string> = { "2024G": "2024", "2022G": "2022", "2020G": "2020" };

function lean(d_pct: number | null): { label: string; color: string; bg: string } {
  if (d_pct === null) return { label: "—", color: "#6b7280", bg: "#f3f4f6" };
  if (d_pct >= 0.65) return { label: "Strong D", color: "#fff", bg: "#1e3a8a" };
  if (d_pct >= 0.55) return { label: "Lean D",   color: "#fff", bg: "#2563eb" };
  if (d_pct >= 0.45) return { label: "Purple",   color: "#fff", bg: "#7c3aed" };
  if (d_pct >= 0.35) return { label: "Lean R",   color: "#fff", bg: "#dc2626" };
  return                     { label: "Strong R", color: "#fff", bg: "#7f1d1d" };
}

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

function pct(n: number | null): string {
  if (n === null) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

function distLabel(field: Field, dist: string): string {
  if (field === "hd") return `HD ${dist}`;
  if (field === "sd") return `SD ${dist}`;
  return `CD ${dist}`;
}

/* ── District row ────────────────────────────────────────────────────────── */
function DistrictRow({
  field, dist, stat, rank,
}: {
  field: Field; dist: string; stat: CycleStat; rank: number;
}) {
  const l = lean(stat.d_pct);
  const turnoutPct = stat.turnout_rate ?? 0;
  const undervote = stat.reg - stat.turnout;
  const doff = stat.dropoff;

  // Only show candidate drop-off if it's meaningful (>500 D voters)
  const showDropoff = doff && doff.dropoff_d > 500;

  return (
    <div className="bg-white rounded-xl border border-black/6 p-4 hover:shadow-sm transition-shadow">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-bold text-[#9ca3af] w-5 shrink-0">#{rank}</span>
          <Link
            href={`/tools/districts?type=${field}&district=${dist}`}
            className="text-sm font-bold hover:underline"
            style={{ color: "#1a3a5c" }}
          >
            {distLabel(field, dist)}
          </Link>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
            style={{ background: l.bg, color: l.color }}
          >
            {l.label}
          </span>
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg font-black" style={{ color: "#1a3a5c" }}>
            {stat.opportunity !== null ? fmt(stat.opportunity) : "—"}
          </div>
          <div className="text-[10px] text-[#9ca3af] font-medium">est. D undervotes</div>
        </div>
      </div>

      {/* Turnout bar */}
      <div className="mb-3">
        <div className="flex justify-between text-[11px] text-[#6b7280] mb-1">
          <span>{fmt(stat.turnout)} voted of {fmt(stat.reg)} registered</span>
          <span className="font-bold" style={{ color: turnoutPct < 0.5 ? "#dc2626" : "#374151" }}>
            {pct(stat.turnout_rate)} turnout
          </span>
        </div>
        <div className="h-2 rounded-full bg-[#f3f4f6] overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(100, turnoutPct * 100).toFixed(1)}%`,
              background: turnoutPct < 0.5 ? "#dc2626" : turnoutPct < 0.6 ? "#f59e0b" : "#16a34a",
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-[#9ca3af] mt-1">
          <span>{fmt(undervote)} didn&apos;t vote</span>
          <span>D% of votes cast: {pct(stat.d_pct)}</span>
        </div>
      </div>

      {/* Candidate drop-off */}
      {showDropoff && doff && (
        <div className="rounded-lg p-3 text-[11px]" style={{ background: "#fef3c7", borderLeft: "3px solid #f59e0b" }}>
          <div className="font-bold mb-1" style={{ color: "#92400e" }}>
            {doff.label} — candidate drop-off vs. top of ticket
          </div>
          <div className="flex gap-4">
            <span>
              <span className="font-bold" style={{ color: "#1e40af" }}>D: −{fmt(doff.dropoff_d)}</span>
              {" "}({fmt(doff.dist_d)} vs {fmt(doff.top_d)} pres)
            </span>
            {doff.dropoff_r > 0 && (
              <span style={{ color: "#6b7280" }}>
                R: −{fmt(doff.dropoff_r)} ({fmt(doff.dist_r)} vs {fmt(doff.top_r)})
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function OpportunityMapPage() {
  const [data, setData] = useState<OpportunityData | null>(null);
  const [field, setField] = useState<Field>("hd");
  const [cycle, setCycle] = useState<Cycle>("2024G");
  const [sort, setSort] = useState<SortKey>("opportunity");
  const [leanFilter, setLeanFilter] = useState<"all" | "D" | "purple" | "R">("all");

  useEffect(() => {
    fetch("/data/opportunity-map.json").then(r => r.json()).then(setData).catch(console.error);
  }, []);

  const rows = useMemo(() => {
    if (!data) return [];
    const fieldData = data[field] ?? {};
    return Object.entries(fieldData)
      .map(([dist, cycles]) => ({ dist, stat: cycles[cycle] }))
      .filter(({ stat }) => stat && stat.reg > 1000)
      .filter(({ stat }) => {
        if (leanFilter === "all") return true;
        const d = stat.d_pct ?? 0.5;
        if (leanFilter === "D") return d >= 0.55;
        if (leanFilter === "R") return d < 0.45;
        if (leanFilter === "purple") return d >= 0.45 && d < 0.55;
        return true;
      })
      .sort((a, b) => {
        if (sort === "opportunity") return (b.stat.opportunity ?? 0) - (a.stat.opportunity ?? 0);
        if (sort === "turnout_rate") return (a.stat.turnout_rate ?? 1) - (b.stat.turnout_rate ?? 1);
        if (sort === "dropoff_d") {
          const bd = b.stat.dropoff?.dropoff_d ?? 0;
          const ad = a.stat.dropoff?.dropoff_d ?? 0;
          return bd - ad;
        }
        return 0;
      });
  }, [data, field, cycle, sort, leanFilter]);

  // Summary stats
  const totalUndervote = useMemo(() =>
    rows.reduce((s, r) => s + (r.stat.opportunity ?? 0), 0),
  [rows]);

  const lowestTurnout = rows[sort === "turnout_rate" ? 0 : -1] ?? rows.find(r => (r.stat.turnout_rate ?? 1) < 0.5);

  const PILL = "px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors cursor-pointer";
  const active = { background: "#1a3a5c", color: "#fff", borderColor: "#1a3a5c" };
  const inactive = { background: "#fff", color: "#374151", borderColor: "#e5e7eb" };

  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg,#1a3a5c 0%,#4c1d95 100%)" }} className="px-6 pt-12 pb-10">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="text-[11px] font-bold uppercase tracking-widest mb-4 block" style={{ color: "rgba(255,255,255,0.5)" }}>
            ← Harris County Project
          </Link>
          <h1 className="text-3xl font-black text-white mb-2">Opportunity Map</h1>
          <p className="text-[15px]" style={{ color: "rgba(255,255,255,0.75)" }}>
            Registered voters vs. actual turnout by district — where D votes are being left on the table.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Controls */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Field */}
          <div className="flex gap-1.5 bg-white rounded-full p-1 border border-black/6">
            {(["hd", "sd", "cd"] as Field[]).map(f => (
              <button key={f} className={PILL} style={field === f ? active : inactive}
                onClick={() => setField(f)}>
                {FIELD_LABELS[f]}
              </button>
            ))}
          </div>

          {/* Cycle */}
          <div className="flex gap-1.5 bg-white rounded-full p-1 border border-black/6">
            {(["2024G", "2022G", "2020G"] as Cycle[]).map(c => (
              <button key={c} className={PILL} style={cycle === c ? active : inactive}
                onClick={() => setCycle(c)}>
                {CYCLE_LABELS[c]}
              </button>
            ))}
          </div>

          {/* Lean filter */}
          <div className="flex gap-1.5 bg-white rounded-full p-1 border border-black/6">
            {(["all", "D", "purple", "R"] as const).map(l => (
              <button key={l} className={PILL}
                style={leanFilter === l ? active : inactive}
                onClick={() => setLeanFilter(l)}>
                {l === "all" ? "All" : l === "D" ? "D ≥55%" : l === "purple" ? "Purple" : "R ≥55%"}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            className="text-[11px] font-bold px-3 py-1.5 rounded-full border border-black/8 bg-white"
            style={{ color: "#374151" }}
            value={sort}
            onChange={e => setSort(e.target.value as SortKey)}
          >
            <option value="opportunity">Sort: D undervotes (most)</option>
            <option value="turnout_rate">Sort: Turnout % (lowest)</option>
            <option value="dropoff_d">Sort: Candidate drop-off (worst)</option>
          </select>
        </div>

        {/* Summary bar */}
        {data && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white rounded-xl border border-black/6 p-4 text-center">
              <div className="text-2xl font-black" style={{ color: "#1a3a5c" }}>{rows.length}</div>
              <div className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider mt-0.5">Districts</div>
            </div>
            <div className="bg-white rounded-xl border border-black/6 p-4 text-center">
              <div className="text-2xl font-black" style={{ color: "#dc2626" }}>{fmt(totalUndervote)}</div>
              <div className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider mt-0.5">Est. D undervotes</div>
            </div>
            <div className="bg-white rounded-xl border border-black/6 p-4 text-center">
              <div className="text-2xl font-black" style={{ color: "#f59e0b" }}>
                {rows.filter(r => (r.stat.turnout_rate ?? 1) < 0.5).length}
              </div>
              <div className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider mt-0.5">{`Districts < 50% turnout`}</div>
            </div>
          </div>
        )}

        {/* District list */}
        {!data && (
          <div className="text-center py-20 text-[#9ca3af]">Loading…</div>
        )}
        <div className="flex flex-col gap-3">
          {rows.map(({ dist, stat }, i) => (
            <DistrictRow key={dist} field={field} dist={dist} stat={stat} rank={i + 1} />
          ))}
        </div>

        {/* Methodology note */}
        <p className="text-[11px] mt-8 leading-relaxed" style={{ color: "#9ca3af" }}>
          <strong>Methodology:</strong> Registered voters and turnout from Harris County Clerk certified canvass.
          D undervotes estimated as (registered − turnout) × D% of votes cast.
          Candidate drop-off compares presidential vote in a district vs. the district-level race (State House, State Senate, or Congress).
          Source: HC Clerk, TLC TED API.
        </p>

        <RelatedTools current="/tools/opportunity-map" className="mt-8 pt-6 border-t border-black/8" />
      </div>
    </div>
  );
}
