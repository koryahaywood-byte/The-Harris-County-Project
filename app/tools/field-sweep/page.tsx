"use client";

import { useState, useEffect, useMemo } from "react";

type FieldClass = "surge" | "hold" | "persuasion" | "strongR" | "unknown";

interface SweepPrecinct {
  precinct: string;
  classification: FieldClass;
  label: string;
  avgDPct: number | null;
  dPct2020: number | null;
  dPct2022: number | null;
  dPct2024: number | null;
  reg2024: number | null;
  turnout2024: number | null;
  turnoutDelta: number | null;
  ssvr: number | null;
  primary2026DemBallots: number | null;
  primary2026RepBallots: number | null;
  primary2026DemEdge: number | null;
}

const CLASS_META: Record<FieldClass, { color: string; bg: string; text: string }> = {
  surge:      { color: "#1d4ed8", bg: "#dbeafe", text: "GOTV" },
  hold:       { color: "#15803d", bg: "#dcfce7", text: "Hold" },
  persuasion: { color: "#b45309", bg: "#fef3c7", text: "Persuade" },
  strongR:    { color: "#b91c1c", bg: "#fee2e2", text: "R Base" },
  unknown:    { color: "#6b7280", bg: "#f3f4f6", text: "Unknown" },
};

type SortKey = "precinct" | "avgDPct" | "dPct2024" | "turnoutDelta" | "reg2024" | "turnout2024" | "ssvr" | "primary2026DemEdge";

export default function FieldSweepPage() {
  const [data, setData] = useState<SweepPrecinct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FieldClass | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("avgDPct");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/districts/precinct-sweep")
      .then(r => r.json())
      .then(d => { setData(d.precincts ?? []); setLoading(false); })
      .catch(e => { setError(String(e)); setLoading(false); });
  }, []);

  const counts = useMemo(() => {
    const c: Record<FieldClass, number> = { surge: 0, hold: 0, persuasion: 0, strongR: 0, unknown: 0 };
    for (const p of data) c[p.classification]++;
    return c;
  }, [data]);

  const sorted = useMemo(() => {
    let rows = filter === "all" ? data : data.filter(p => p.classification === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(p => p.precinct.toLowerCase().includes(q));
    }
    return [...rows].sort((a, b) => {
      const av = a[sortKey] ?? (sortDir === "asc" ? Infinity : -Infinity);
      const bv = b[sortKey] ?? (sortDir === "asc" ? Infinity : -Infinity);
      if (typeof av === "string") return sortDir === "asc" ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
      return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
  }, [data, filter, sortKey, sortDir, search]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  function exportCsv() {
    const header = ["Precinct","Classification","Label","Avg D%","D% 2024","D% 2022","D% 2020","Reg 2024","Turnout 2024","Turnout Delta (24-20)","SSVR","2026 Dem Ballots","2026 Rep Ballots","2026 Dem Edge"];
    const rows = sorted.map(p => [
      p.precinct, p.classification, p.label,
      p.avgDPct ?? "", p.dPct2024 ?? "", p.dPct2022 ?? "", p.dPct2020 ?? "",
      p.reg2024 ?? "", p.turnout2024 ?? "", p.turnoutDelta ?? "", p.ssvr ?? "",
      p.primary2026DemBallots ?? "", p.primary2026RepBallots ?? "", p.primary2026DemEdge ?? "",
    ]);
    const csv = [header, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "harris-county-precinct-sweep.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const SortHdr = ({ label, k }: { label: string; k: SortKey }) => (
    <th
      onClick={() => toggleSort(k)}
      className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide cursor-pointer hover:text-gray-900 whitespace-nowrap"
    >
      {label} {sortKey === k ? (sortDir === "asc" ? "↑" : "↓") : ""}
    </th>
  );

  if (loading) return <div className="p-8 text-gray-500">Loading precinct data…</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Field Sweep: Harris County Precincts</h1>
        <p className="text-sm text-gray-500 mt-1">
          All {data.length} precincts classified by GOTV opportunity. Based on top-of-ticket D% across 2020/2022/2024 generals.
        </p>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(["all", "surge", "hold", "persuasion", "strongR"] as const).map(cls => {
          const meta = cls === "all" ? null : CLASS_META[cls];
          const count = cls === "all" ? data.length : counts[cls];
          const active = filter === cls;
          return (
            <button
              key={cls}
              onClick={() => setFilter(cls)}
              className="px-3 py-1.5 rounded-full text-sm font-medium border transition-all"
              style={active && meta ? { background: meta.bg, color: meta.color, borderColor: meta.color } : { background: "#f9fafb", color: "#374151", borderColor: "#d1d5db" }}
            >
              {cls === "all" ? "All" : meta!.text} <span className="font-bold">{count}</span>
            </button>
          );
        })}
        <div className="flex-1" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filter by precinct #"
          className="px-3 py-1.5 border rounded-lg text-sm w-40"
        />
        <button
          onClick={exportCsv}
          className="px-3 py-1.5 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-700"
        >
          Export CSV
        </button>
      </div>

      {/* Key for field directors */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {(["surge","hold","persuasion","strongR"] as FieldClass[]).map(cls => {
          const m = CLASS_META[cls];
          return (
            <div key={cls} className="rounded-lg p-3 text-sm" style={{ background: m.bg }}>
              <div className="font-semibold" style={{ color: m.color }}>{m.text} ({counts[cls]})</div>
              <div className="text-xs text-gray-600 mt-0.5">
                {cls === "surge" && "D ≥65%: pure turnout play"}
                {cls === "hold" && "D 55-65%. Protect margin + GOTV"}
                {cls === "persuasion" && "D 44-55%. Battleground, persuasion mail"}
                {cls === "strongR" && "D <44%. R base, minimal investment"}
              </div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <SortHdr label="Precinct" k="precinct" />
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Type</th>
              <SortHdr label="Avg D%" k="avgDPct" />
              <SortHdr label="2024 D%" k="dPct2024" />
              <SortHdr label="2022 D%" k="avgDPct" />
              <SortHdr label="2020 D%" k="avgDPct" />
              <SortHdr label="Reg 2024" k="reg2024" />
              <SortHdr label="Turnout 2024" k="turnout2024" />
              <SortHdr label="Δ Turnout" k="turnoutDelta" />
              <SortHdr label="SSVR" k="ssvr" />
              <SortHdr label="2026 D Ballots" k="primary2026DemEdge" />
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">2026 R Ballots</th>
              <SortHdr label="2026 Edge" k="primary2026DemEdge" />
            </tr>
          </thead>
          <tbody>
            {sorted.slice(0, 500).map((p, i) => {
              const m = CLASS_META[p.classification];
              return (
                <tr key={p.precinct} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-3 py-2 font-mono font-semibold text-gray-900">{p.precinct}</td>
                  <td className="px-3 py-2">
                    <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: m.bg, color: m.color }}>
                      {m.text}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-semibold" style={{ color: m.color }}>
                    {p.avgDPct !== null ? `${p.avgDPct}%` : "–"}
                  </td>
                  <td className="px-3 py-2 text-gray-700">{p.dPct2024 !== null ? `${p.dPct2024}%` : "–"}</td>
                  <td className="px-3 py-2 text-gray-500">{p.dPct2022 !== null ? `${p.dPct2022}%` : "–"}</td>
                  <td className="px-3 py-2 text-gray-500">{p.dPct2020 !== null ? `${p.dPct2020}%` : "–"}</td>
                  <td className="px-3 py-2 text-gray-700">{p.reg2024?.toLocaleString() ?? "–"}</td>
                  <td className="px-3 py-2 text-gray-700">{p.turnout2024?.toLocaleString() ?? "–"}</td>
                  <td className="px-3 py-2 font-medium" style={{ color: (p.turnoutDelta ?? 0) > 0 ? "#15803d" : "#b91c1c" }}>
                    {p.turnoutDelta !== null ? (p.turnoutDelta > 0 ? `+${p.turnoutDelta.toLocaleString()}` : p.turnoutDelta.toLocaleString()) : "–"}
                  </td>
                  <td className="px-3 py-2 text-gray-700">{p.ssvr?.toLocaleString() ?? "–"}</td>
                  <td className="px-3 py-2 text-blue-700 font-medium">{p.primary2026DemBallots?.toLocaleString() ?? "–"}</td>
                  <td className="px-3 py-2 text-red-700">{p.primary2026RepBallots?.toLocaleString() ?? "–"}</td>
                  <td className="px-3 py-2 font-medium" style={{ color: (p.primary2026DemEdge ?? 0) > 0 ? "#1d4ed8" : "#b91c1c" }}>
                    {p.primary2026DemEdge !== null
                      ? (p.primary2026DemEdge > 0 ? `+${p.primary2026DemEdge.toLocaleString()}` : p.primary2026DemEdge.toLocaleString())
                      : "–"}
                  </td>
                </tr>
              );
            })}
            {sorted.length > 500 && (
              <tr>
                <td colSpan={13} className="px-3 py-2 text-center text-gray-400 text-xs italic">
                  Showing 500 of {sorted.length}. Use filter or Export CSV for full list
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
