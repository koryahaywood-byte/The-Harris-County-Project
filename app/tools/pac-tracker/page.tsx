"use client";

import { useState, useEffect, useMemo } from "react";
import type { PACResponse, PACRollup } from "@/app/api/finance/pac/route";
import { SkeletonRows } from "@/components/Skeleton";

const fmt = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n.toLocaleString()}`;
};

function SupportBadge({ support }: { support: "S" | "O" }) {
  return (
    <span
      className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
      style={support === "S"
        ? { background: "#dbeafe", color: "#1d4ed8" }
        : { background: "#fee2e2", color: "#b91c1c" }}
    >
      {support === "S" ? "For" : "Against"}
    </span>
  );
}

function MoneyBar({ for: forAmt, against }: { for: number; against: number }) {
  const total = forAmt + against;
  if (total === 0) return null;
  const forPct = Math.round((forAmt / total) * 100);
  return (
    <div className="flex h-1.5 rounded-full overflow-hidden w-full mt-1.5" style={{ background: "#fee2e2" }}>
      <div style={{ width: `${forPct}%`, background: "#3b82f6" }} />
    </div>
  );
}

export default function PACTracker() {
  const [data, setData] = useState<PACResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterSupport, setFilterSupport] = useState<"all" | "S" | "O">("all");

  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    setLoading(true); setError("");
    fetch("/api/finance/pac")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(String(e)); setLoading(false); });
  }, [retryKey]);

  const visible: PACRollup[] = useMemo(() => {
    if (!data) return [];
    let rows = data.rollups;
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(r =>
        r.committee.toLowerCase().includes(q) ||
        r.targets.some(t => t.candidate.toLowerCase().includes(q))
      );
    }
    if (filterSupport === "S") rows = rows.filter(r => r.totalFor > 0);
    if (filterSupport === "O") rows = rows.filter(r => r.totalAgainst > 0);
    return rows;
  }, [data, search, filterSupport]);

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-8"><SkeletonRows n={6} rowClassName="h-16 rounded-2xl" /></div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;

  const unavailable = data?.source === "unavailable";
  const totalSpend = data?.totalExternalSpend ?? 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Outside Money: Texas 2026</h1>
            <p className="text-sm text-gray-500 mt-1">
              Independent expenditures by PACs, Super PACs, and outside groups in Texas 2026 federal races.
              Data from FEC Schedule E filings.
            </p>
          </div>
          {!unavailable && (
            <div className="text-right shrink-0">
              <div className="text-2xl font-bold text-gray-900">{fmt(totalSpend)}</div>
              <div className="text-xs text-gray-400">total external spend</div>
            </div>
          )}
        </div>

        {unavailable && (
          <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
            <div className="font-semibold text-amber-800 text-sm">FEC data temporarily unavailable</div>
            <p className="text-xs text-amber-700 mt-1">
              The FEC API requires a key for full access. Set <code className="bg-amber-100 px-1 rounded">FEC_API_KEY</code> in Vercel to enable live outside-money tracking.
              In the meantime, check <a href="https://www.fec.gov/data/independent-expenditures/?state=TX&cycle=2026" target="_blank" rel="noopener noreferrer" className="underline">FEC.gov directly</a>.
            </p>
            <button
              onClick={() => setRetryKey(k => k + 1)}
              className="mt-2 text-xs font-semibold text-amber-800 border border-amber-300 rounded-lg px-3 py-1 hover:bg-amber-100 transition-colors">
              Retry
            </button>
          </div>
        )}
      </div>

      {!unavailable && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-5 items-center">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search PAC or candidate…"
              className="px-3 py-1.5 border rounded-lg text-sm w-56"
            />
            {(["all", "S", "O"] as const).map(v => (
              <button
                key={v}
                onClick={() => setFilterSupport(v)}
                className="px-3 py-1.5 rounded-full text-sm font-medium border transition-all"
                style={filterSupport === v
                  ? { background: "#1e3a5f", color: "#fff", borderColor: "#1e3a5f" }
                  : { background: "#f9fafb", color: "#374151", borderColor: "#d1d5db" }}
              >
                {v === "all" ? "All" : v === "S" ? "For candidates" : "Against candidates"}
              </button>
            ))}
            <span className="text-xs text-gray-400 ml-auto">{visible.length} PACs</span>
          </div>

          {/* Summary chips */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
              <div className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Pro-D spending</div>
              <div className="text-xl font-bold text-blue-800 mt-1">
                {fmt(data?.rollups.reduce((s, r) => s + r.targets.filter(t => t.support === "S" && isBlueName(t.candidate)).reduce((a, t) => a + t.amount, 0), 0) ?? 0)}
              </div>
            </div>
            <div className="rounded-xl bg-red-50 border border-red-100 p-3">
              <div className="text-xs text-red-600 font-semibold uppercase tracking-wide">Pro-R spending</div>
              <div className="text-xl font-bold text-red-800 mt-1">
                {fmt(data?.rollups.reduce((s, r) => s + r.targets.filter(t => t.support === "S" && !isBlueName(t.candidate)).reduce((a, t) => a + t.amount, 0), 0) ?? 0)}
              </div>
            </div>
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Unique PACs</div>
              <div className="text-xl font-bold text-gray-800 mt-1">{data?.rollups.length ?? 0}</div>
            </div>
          </div>

          {/* PAC list */}
          <div className="space-y-2">
            {visible.length === 0 && (
              <div className="text-gray-400 text-sm text-center py-12 italic">No PAC data found for these filters.</div>
            )}
            {visible.map(r => {
              const total = r.totalFor + r.totalAgainst;
              const isOpen = expanded === r.committee;
              return (
                <div key={r.committee} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                  <button
                    onClick={() => setExpanded(isOpen ? null : r.committee)}
                    className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-900 truncate">{r.committee}</div>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {r.targets.slice(0, 3).map((t, i) => (
                          <span key={i} className="flex items-center gap-1 text-[10px] text-gray-500">
                            <SupportBadge support={t.support} />
                            {t.candidate.split(", ").reverse().join(" ")}
                          </span>
                        ))}
                        {r.targets.length > 3 && (
                          <span className="text-[10px] text-gray-400">+{r.targets.length - 3} more</span>
                        )}
                      </div>
                      <MoneyBar for={r.totalFor} against={r.totalAgainst} />
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-gray-900">{fmt(total)}</div>
                      <div className="text-[10px] text-gray-400">
                        {r.lastActivity ? new Date(r.lastActivity).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                      </div>
                    </div>
                    <svg
                      width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#9ca3af" strokeWidth="1.5"
                      className={`transition-transform ${isOpen ? "rotate-90" : ""}`}
                    >
                      <path d="M4 2l4 4-4 4" />
                    </svg>
                  </button>

                  {isOpen && (
                    <div className="border-t border-gray-100 px-4 py-3">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Spending breakdown</div>
                      <div className="space-y-1.5">
                        {[...r.targets].sort((a, b) => b.amount - a.amount).map((t, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <SupportBadge support={t.support} />
                              <span className="text-gray-700">{t.candidate.split(", ").reverse().join(" ")}</span>
                            </span>
                            <span className="font-semibold text-gray-900">{fmt(t.amount)}</span>
                          </div>
                        ))}
                      </div>
                      {r.committeeId && (
                        <a
                          href={`https://www.fec.gov/data/committee/${r.committeeId}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline mt-3 block"
                        >
                          View FEC filing → {r.committeeId}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-xs text-gray-400 mt-6 text-center">
            Source: FEC Schedule E independent expenditure filings. Updates every 6 hours.
            Includes only federal (Senate + House) races; state PAC spending tracked separately via TEC.
          </p>
        </>
      )}

      {/* Static context: always shown */}
      <div className="mt-8 rounded-xl bg-gray-50 border border-gray-200 p-4">
        <div className="text-sm font-semibold text-gray-700 mb-2">Key PACs to Watch: Texas 2026</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-600">
          {[
            { name: "DCCC (Democratic Congressional Campaign Committee)", side: "D", focus: "Competitive House races. TX-07, TX-38" },
            { name: "NRCC (National Republican Congressional Committee)", side: "R", focus: "Defending House seats. TX-02, TX-08, TX-22, TX-36" },
            { name: "DSCC (Democratic Senatorial Campaign Committee)", side: "D", focus: "TX Senate race. Talarico vs Paxton" },
            { name: "NRSC (National Republican Senatorial Committee)", side: "R", focus: "TX Senate race. Paxton vs Talarico" },
            { name: "Club for Growth Action", side: "R", focus: "Primary spending, conservative challengers" },
            { name: "Senate Majority PAC", side: "D", focus: "Super PAC. Dem Senate majority play" },
            { name: "Congressional Leadership Fund", side: "R", focus: "Super PAC. House majority defense" },
            { name: "House Majority PAC", side: "D", focus: "Super PAC. House competitive races" },
          ].map(p => (
            <div key={p.name} className="flex gap-2">
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded h-fit mt-0.5"
                style={p.side === "D"
                  ? { background: "#dbeafe", color: "#1d4ed8" }
                  : { background: "#fee2e2", color: "#b91c1c" }}
              >
                {p.side}
              </span>
              <div>
                <div className="font-medium text-gray-800">{p.name}</div>
                <div className="text-gray-500">{p.focus}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          TEC-registered state PAC activity (for state legislative races) is tracked separately: check{" "}
          <a href="https://www.ethics.state.tx.us/search/cf/" target="_blank" rel="noopener noreferrer" className="underline">ethics.state.tx.us</a>.
        </p>
      </div>
    </div>
  );
}

// Very rough heuristic: does the candidate name sound like a Dem we track?
// In practice the FEC data has partisan context from their candidate file.
function isBlueName(candidateName: string): boolean {
  const blue = ["crockett", "fletcher", "garcia", "menefee", "green", "gutierrez", "mcdonough", "finnie", "hart"];
  return blue.some(n => candidateName.toLowerCase().includes(n));
}
