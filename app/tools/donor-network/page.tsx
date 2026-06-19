"use client";

import { useState, useEffect, useMemo } from "react";

interface Recipient { official: string; amount: number }
interface Donor { name: string; employer: string | null; total: number; recipients: Recipient[] }
interface Official { name: string; office: string; party: "D" | "R" }
interface NetworkData {
  builtAt: string;
  officials: Official[];
  donors: Donor[];
  sharedCount: number;
}

const PARTY_COLOR = { D: "#1d4ed8", R: "#b91c1c" };

export default function DonorNetworkPage() {
  const [data, setData] = useState<NetworkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [officialFilter, setOfficialFilter] = useState<string>("all");
  const [crossOnly, setCrossOnly] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/data/donor-network.json")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    let rows = data.donors;
    if (crossOnly) rows = rows.filter(d => d.recipients.length >= 2);
    if (officialFilter !== "all") rows = rows.filter(d => d.recipients.some(r => r.official === officialFilter));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(d => d.name.toLowerCase().includes(q) || (d.employer ?? "").toLowerCase().includes(q));
    }
    return rows.sort((a, b) => b.total - a.total).slice(0, 200);
  }, [data, crossOnly, officialFilter, search]);

  function fmt(n: number) {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n.toLocaleString()}`;
  }

  function toggleExpand(name: string) {
    setExpanded(s => {
      const n = new Set(s);
      n.has(name) ? n.delete(name) : n.add(name);
      return n;
    });
  }

  if (loading) return <div className="p-8 text-gray-500">Loading donor network…</div>;
  if (!data) return <div className="p-8 text-red-500">Failed to load donor data.</div>;

  const officialTotals: Record<string, number> = {};
  for (const d of data.donors) {
    for (const r of d.recipients) {
      officialTotals[r.official] = (officialTotals[r.official] ?? 0) + r.amount;
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Donor Network</h1>
        <p className="text-sm text-gray-500 mt-1">
          {data.donors.length.toLocaleString()} donors · {data.sharedCount} cross-official · {data.officials.length} officials tracked ·{" "}
          <span className="text-gray-400">Updated {new Date(data.builtAt).toLocaleDateString()}</span>
        </p>
      </div>

      {/* Official chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setOfficialFilter("all")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${officialFilter === "all" ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-600 border-gray-300"}`}
        >
          All officials
        </button>
        {data.officials.map(o => {
          const active = officialFilter === o.name;
          const color = PARTY_COLOR[o.party];
          return (
            <button
              key={o.name}
              onClick={() => setOfficialFilter(active ? "all" : o.name)}
              className="px-3 py-1.5 rounded-full text-sm font-medium border transition-all"
              style={active ? { background: color, color: "#fff", borderColor: color } : { background: "#fff", color: "#374151", borderColor: "#d1d5db" }}
            >
              {o.name.split(" ").pop()}
            </button>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex gap-3 mb-5 flex-wrap items-center">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search donor or employer…"
          className="px-3 py-2 border rounded-lg text-sm flex-1 min-w-48"
        />
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer whitespace-nowrap">
          <input type="checkbox" checked={crossOnly} onChange={e => setCrossOnly(e.target.checked)} className="w-4 h-4" />
          Cross-official donors only ({data.sharedCount})
        </label>
      </div>

      {/* Official money board */}
      {officialFilter === "all" && !search && !crossOnly && (
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {data.officials
            .filter(o => officialTotals[o.name])
            .sort((a, b) => (officialTotals[b.name] ?? 0) - (officialTotals[a.name] ?? 0))
            .map(o => (
              <button
                key={o.name}
                onClick={() => setOfficialFilter(o.name)}
                className="text-left p-3 rounded-xl border hover:shadow-md transition-all"
                style={{ borderColor: PARTY_COLOR[o.party] + "44", background: PARTY_COLOR[o.party] + "08" }}
              >
                <div className="text-xs font-bold" style={{ color: PARTY_COLOR[o.party] }}>
                  {o.name}
                </div>
                <div className="text-[10px] text-gray-500 leading-tight mt-0.5">{o.office}</div>
                <div className="text-lg font-bold text-gray-800 mt-1">{fmt(officialTotals[o.name] ?? 0)}</div>
                <div className="text-[10px] text-gray-400">itemized total</div>
              </button>
            ))}
        </div>
      )}

      {/* Donor table */}
      <div className="text-xs text-gray-400 mb-2">Showing top {filtered.length} donors by total</div>
      <div className="space-y-1">
        {filtered.map(donor => {
          const open = expanded.has(donor.name);
          return (
            <div key={donor.name} className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleExpand(donor.name)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-base font-bold text-gray-900 flex-1 truncate">{donor.name}</span>
                <span className="flex gap-1.5 flex-shrink-0">
                  {donor.recipients.map(r => {
                    const off = data.officials.find(o => o.name === r.official);
                    return (
                      <span
                        key={r.official}
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                        style={{ background: PARTY_COLOR[off?.party ?? "D"] }}
                        title={`${r.official}: ${fmt(r.amount)}`}
                      >
                        {r.official.split(" ").pop()?.slice(0, 6)}
                      </span>
                    );
                  })}
                </span>
                <span className="text-base font-bold text-gray-800 flex-shrink-0">{fmt(donor.total)}</span>
                <span className="text-gray-400 text-sm">{open ? "▲" : "▼"}</span>
              </button>
              {open && (
                <div className="px-4 pb-3 pt-0 border-t border-gray-100 bg-gray-50">
                  {donor.employer && donor.employer !== donor.name && (
                    <p className="text-xs text-gray-500 mb-2">{donor.employer}</p>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {donor.recipients.sort((a, b) => b.amount - a.amount).map(r => {
                      const off = data.officials.find(o => o.name === r.official);
                      return (
                        <div key={r.official} className="flex items-center justify-between gap-2 rounded-lg px-3 py-2"
                          style={{ background: PARTY_COLOR[off?.party ?? "D"] + "14" }}>
                          <div>
                            <div className="text-xs font-semibold" style={{ color: PARTY_COLOR[off?.party ?? "D"] }}>{r.official}</div>
                            <div className="text-[10px] text-gray-400">{off?.office ?? ""}</div>
                          </div>
                          <div className="text-sm font-bold text-gray-800 flex-shrink-0">{fmt(r.amount)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
