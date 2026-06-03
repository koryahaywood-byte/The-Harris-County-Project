"use client";
import { useState } from "react";

type Rep = {
  name: string;
  district: string;
  chamber: "House" | "Senate";
  party: "D" | "R";
  filed?: number;
  committee?: number;
  passed?: number;
  signed?: number;
};

type Bill = {
  bill_id: number;
  bill_number: string;
  title: string;
  status: number;
  last_action: string;
  last_action_date: string;
  url: string;
};

// Status labels from LegiScan
const STATUS: Record<number, { label: string; color: string }> = {
  1: { label: "Filed", color: "#6b7280" },
  2: { label: "Passed Committee", color: "#2563eb" },
  3: { label: "Passed Chamber", color: "#7c3aed" },
  4: { label: "Signed into Law", color: "#16a34a" },
  5: { label: "Vetoed", color: "#dc2626" },
  6: { label: "Failed", color: "#9ca3af" },
};

const REPS: Rep[] = [
  // Senate
  { name: "Carol Alvarado",         district: "SD-6",   chamber: "Senate", party: "D" },
  { name: "Borris Miles",           district: "SD-13",  chamber: "Senate", party: "D" },
  { name: "Molly Cook",             district: "SD-15",  chamber: "Senate", party: "D" },
  { name: "Paul Bettencourt",       district: "SD-7",   chamber: "Senate", party: "R" },
  // House — Democrats
  { name: "Senfronia Thompson",     district: "HD-141", chamber: "House",  party: "D" },
  { name: "Ann Johnson",            district: "HD-134", chamber: "House",  party: "D" },
  { name: "Ana Hernandez",          district: "HD-143", chamber: "House",  party: "D" },
  { name: "Armando Walle",          district: "HD-140", chamber: "House",  party: "D" },
  { name: "Mary Ann Perez",         district: "HD-144", chamber: "House",  party: "D" },
  { name: "Harold Dutton",          district: "HD-142", chamber: "House",  party: "D" },
  { name: "Gene Wu",                district: "HD-137", chamber: "House",  party: "D" },
  { name: "Jolanda Jones",          district: "HD-147", chamber: "House",  party: "D" },
  { name: "Hubert Vo",              district: "HD-149", chamber: "House",  party: "D" },
  { name: "Lauren Ashley Simmons",  district: "HD-146", chamber: "House",  party: "D" },
  { name: "Alma Allen",             district: "HD-131", chamber: "House",  party: "D" },
  { name: "Christina Morales",      district: "HD-145", chamber: "House",  party: "D" },
  { name: "Charlene Ward Johnson",  district: "HD-139", chamber: "House",  party: "D" },
  { name: "Jon Rosenthal",          district: "HD-135", chamber: "House",  party: "D" },
  // House — Republicans
  { name: "Lacey Hull",             district: "HD-138", chamber: "House",  party: "R" },
  { name: "Tom Oliverson",          district: "HD-130", chamber: "House",  party: "R" },
  { name: "Dennis Paul",            district: "HD-129", chamber: "House",  party: "R" },
  { name: "Greg Bonnen",            district: "HD-24",  chamber: "House",  party: "R" },
  { name: "Mike Schofield",         district: "HD-132", chamber: "House",  party: "R" },
];

const SORT_OPTIONS = [
  { value: "signed", label: "↓ Signed into Law" },
  { value: "passed", label: "↓ Passed Chamber" },
  { value: "committee", label: "↓ Passed Committee" },
  { value: "filed", label: "↓ Bills Filed" },
];

function statusPct(rep: Rep) {
  const f = rep.filed || 0;
  if (!f) return null;
  return {
    committee: Math.round(((rep.committee || 0) / f) * 100),
    passed: Math.round(((rep.passed || 0) / f) * 100),
    signed: Math.round(((rep.signed || 0) / f) * 100),
  };
}

export default function BillTracker() {
  const [sortKey, setSortKey] = useState<"filed" | "committee" | "passed" | "signed">("signed");
  const [chamber, setChamber] = useState<"all" | "House" | "Senate">("all");
  const [party, setParty] = useState<"all" | "D" | "R">("all");
  const [selectedRep, setSelectedRep] = useState<Rep | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiMissing, setApiMissing] = useState(false);
  const [billFilter, setBillFilter] = useState<number>(0);
  const [repCounts, setRepCounts] = useState<Record<string, { filed: number; committee: number; passed: number; signed: number }>>({});

  const filtered = REPS
    .filter(r => chamber === "all" || r.chamber === chamber)
    .filter(r => party === "all" || r.party === party)
    .sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0));

  async function loadBills(rep: Rep) {
    setSelectedRep(rep);
    setBills([]);
    setBillFilter(0);
    setApiMissing(false);
    setLoading(true);
    try {
      const res = await fetch(`/api/bills?action=search&rep=${encodeURIComponent(rep.name)}`);
      const data = await res.json();
      if (data.error?.includes("not set")) { setApiMissing(true); setLoading(false); return; }
      const results: Bill[] = data.searchresult
        ? (Object.values(data.searchresult) as unknown[]).filter(
            (b): b is Bill => typeof b === "object" && b !== null && "bill_id" in b
          )
        : [];
      setBills(results);

      // Tally counts from last_action text
      let committee = 0, passed = 0, signed = 0;
      for (const b of results) {
        const a = (b.last_action || "").toLowerCase();
        if (a.includes("signed") || a.includes("effective") || a.includes("enacted")) signed++;
        else if (a.includes("enrolled") || a.includes("passed") || a.includes("reported enrolled")) passed++;
        else if (a.includes("committee") || a.includes("reported favorably")) committee++;
      }
      setRepCounts(prev => ({
        ...prev,
        [rep.name]: { filed: results.length, committee, passed, signed },
      }));
    } catch {
      setBills([]);
    }
    setLoading(false);
  }

  const filteredBills = bills;

  const rankMedal = (i: number) =>
    i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`;

  return (
    <div style={{ fontFamily: "var(--font-inter), sans-serif" }}>
      {/* Hero */}
      <div className="bg-[var(--accent)] text-white py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-sky-300 text-xs font-semibold uppercase tracking-widest mb-2">Bill Tracker · 89th Texas Legislature</p>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "var(--font-playfair), serif" }}>
            What did your rep actually do?
          </h1>
          <p className="text-white/70 text-sm max-w-xl">
            Bills filed, passed out of committee, passed the chamber, and signed into law — ranked by Harris County rep.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {apiMissing && (
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-6 text-sm text-amber-800">
            <strong>API key not configured.</strong> Add your LegiScan API key to Vercel environment variables as <code className="bg-amber-100 px-1 rounded">LEGISCAN_API_KEY</code> to load live data.{" "}
            <a href="https://legiscan.com/legiscan" target="_blank" className="underline">Get a free key →</a>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          <select
            className="border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-white"
            value={sortKey}
            onChange={e => setSortKey(e.target.value as typeof sortKey)}
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <div className="flex border border-[var(--border)] rounded-lg overflow-hidden text-sm">
            {(["all", "House", "Senate"] as const).map(c => (
              <button
                key={c}
                onClick={() => setChamber(c)}
                className={`px-4 py-2 ${chamber === c ? "bg-[var(--accent)] text-white" : "bg-white text-[var(--muted)] hover:bg-gray-50"}`}
              >
                {c === "all" ? "All" : c}
              </button>
            ))}
          </div>

          <div className="flex border border-[var(--border)] rounded-lg overflow-hidden text-sm">
            {(["all", "D", "R"] as const).map(p => (
              <button
                key={p}
                onClick={() => setParty(p)}
                className={`px-4 py-2 ${
                  party === p
                    ? p === "D" ? "bg-blue-700 text-white"
                    : p === "R" ? "bg-red-700 text-white"
                    : "bg-[var(--accent)] text-white"
                    : "bg-white text-[var(--muted)] hover:bg-gray-50"
                }`}
              >
                {p === "all" ? "All Parties" : p === "D" ? "Dem" : "Rep"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-6 flex-col lg:flex-row">
          {/* Leaderboard */}
          <div className="flex-1">
            <div className="bg-white border border-[var(--border)] rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-[var(--border)] bg-gray-50 flex justify-between items-center">
                <span className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">Leaderboard</span>
                <span className="text-xs text-[var(--muted)]">{filtered.length} reps</span>
              </div>

              {filtered.length === 0 ? (
                <div className="p-8 text-center text-[var(--muted)] text-sm">No results</div>
              ) : (
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="text-xs text-[var(--muted)] uppercase tracking-wider border-b border-[var(--border)]">
                      <th className="px-4 py-2 text-left w-8">#</th>
                      <th className="px-4 py-2 text-left">Rep</th>
                      <th className="px-3 py-2 text-right">Filed</th>
                      <th className="px-3 py-2 text-right">Cmte</th>
                      <th className="px-3 py-2 text-right">Passed</th>
                      <th className="px-3 py-2 text-right">Law</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((rep, i) => {
                      const counts = repCounts[rep.name];
                      const pct = counts
                        ? { committee: Math.round((counts.committee / counts.filed) * 100), passed: Math.round((counts.passed / counts.filed) * 100), signed: Math.round((counts.signed / counts.filed) * 100) }
                        : statusPct(rep);
                      const isSelected = selectedRep?.name === rep.name;
                      return (
                        <tr
                          key={rep.name}
                          onClick={() => loadBills(rep)}
                          className={`border-b border-[var(--border)] cursor-pointer transition-colors ${isSelected ? "bg-blue-50" : "hover:bg-gray-50"}`}
                        >
                          <td className="px-4 py-3 text-[var(--muted)] text-xs font-mono">{rankMedal(i)}</td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-[var(--accent)]">{rep.name}</div>
                            <div className="flex gap-2 mt-1">
                              <span className="text-xs text-[var(--muted)]">{rep.district}</span>
                              <span className={`text-xs font-bold ${rep.party === "D" ? "text-blue-700" : "text-red-700"}`}>{rep.party}</span>
                              <span className="text-xs text-[var(--muted)]">{rep.chamber}</span>
                            </div>
                            {pct && (
                              <div className="mt-2 flex gap-1 h-1">
                                <div className="rounded bg-gray-200 flex-1" title={`${rep.filed} filed`}>
                                  <div className="h-full rounded bg-gray-400" style={{ width: "100%" }} />
                                </div>
                                <div className="rounded bg-blue-100 flex-1">
                                  <div className="h-full rounded bg-blue-500" style={{ width: `${pct.committee}%` }} />
                                </div>
                                <div className="rounded bg-purple-100 flex-1">
                                  <div className="h-full rounded bg-purple-500" style={{ width: `${pct.passed}%` }} />
                                </div>
                                <div className="rounded bg-green-100 flex-1">
                                  <div className="h-full rounded bg-green-500" style={{ width: `${pct.signed}%` }} />
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right font-mono text-[var(--muted)]">{counts ? counts.filed : "—"}</td>
                          <td className="px-3 py-3 text-right font-mono text-blue-600">{counts ? counts.committee : "—"}</td>
                          <td className="px-3 py-3 text-right font-mono text-purple-600">{counts ? counts.passed : "—"}</td>
                          <td className="px-3 py-3 text-right font-mono font-bold text-green-700">{counts ? counts.signed : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {/* Legend */}
              <div className="px-4 py-3 border-t border-[var(--border)] bg-gray-50 flex gap-4 text-xs text-[var(--muted)]">
                <span><span className="inline-block w-2 h-2 rounded bg-gray-400 mr-1" />Filed</span>
                <span><span className="inline-block w-2 h-2 rounded bg-blue-500 mr-1" />Committee</span>
                <span><span className="inline-block w-2 h-2 rounded bg-purple-500 mr-1" />Passed</span>
                <span><span className="inline-block w-2 h-2 rounded bg-green-500 mr-1" />Law</span>
                <span className="ml-auto italic">Click a rep to see their bills</span>
              </div>
            </div>
          </div>

          {/* Bill drill-down */}
          {selectedRep && (
            <div className="w-full lg:w-96 flex-shrink-0">
              <div className="bg-white border border-[var(--border)] rounded-xl overflow-hidden sticky top-4">
                <div className="px-5 py-4 border-b border-[var(--border)] bg-gray-50">
                  <div className="font-bold text-[var(--accent)]">{selectedRep.name}</div>
                  <div className="text-xs text-[var(--muted)] mt-1">{selectedRep.district} · {selectedRep.chamber}</div>

                  {/* Status filter pills */}
                  {bills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      <button
                        onClick={() => setBillFilter(0)}
                        className={`text-xs px-2 py-1 rounded-full border ${billFilter === 0 ? "bg-[var(--accent)] text-white border-[var(--accent)]" : "border-[var(--border)] text-[var(--muted)]"}`}
                      >
                        All ({bills.length})
                      </button>
                      {Object.entries(STATUS).map(([k, v]) => {
                        const count = bills.filter(b => b.status === Number(k)).length;
                        if (!count) return null;
                        return (
                          <button
                            key={k}
                            onClick={() => setBillFilter(Number(k))}
                            className={`text-xs px-2 py-1 rounded-full border ${billFilter === Number(k) ? "text-white border-transparent" : "border-[var(--border)] text-[var(--muted)]"}`}
                            style={billFilter === Number(k) ? { background: v.color } : {}}
                          >
                            {v.label} ({count})
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="overflow-y-auto" style={{ maxHeight: "60vh" }}>
                  {loading && (
                    <div className="p-8 text-center text-[var(--muted)] text-sm">Loading bills…</div>
                  )}
                  {!loading && bills.length === 0 && !apiMissing && (
                    <div className="p-8 text-center text-[var(--muted)] text-sm">
                      No bills found for this rep.
                    </div>
                  )}
                  {filteredBills.map(bill => {
                    const action = (bill.last_action || "").toLowerCase();
                    const s = action.includes("signed") || action.includes("effective") || action.includes("enacted")
                      ? STATUS[4]
                      : action.includes("vetoed") ? STATUS[5]
                      : action.includes("enrolled") || action.includes("passed") ? STATUS[3]
                      : action.includes("committee") ? STATUS[2]
                      : STATUS[1];
                    return (
                      <a
                        key={bill.bill_id}
                        href={bill.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-4 py-3 border-b border-[var(--border)] hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-mono text-xs font-bold text-[var(--accent)]">{bill.bill_number}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: s.color + "20", color: s.color }}>
                            {s.label}
                          </span>
                        </div>
                        <div className="text-xs text-[var(--muted)] mt-1 line-clamp-2">{bill.title}</div>
                        {bill.last_action && (
                          <div className="text-xs text-gray-400 mt-1">{bill.last_action_date} · {bill.last_action}</div>
                        )}
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-[var(--muted)] mt-6">
          Data: LegiScan · 89th Texas Legislature (2025–2026). Click any rep to view their bills. Numbers update when API syncs.
        </p>
      </div>
    </div>
  );
}
