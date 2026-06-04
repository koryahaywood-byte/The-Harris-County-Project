"use client";
import { useState } from "react";

type Rep = {
  name: string;
  district: string;
  chamber: "House" | "Senate";
  party: "D" | "R";
};

type Bill = {
  bill_id: number;
  bill_number: string;
  title: string;
  last_action: string;
  last_action_date: string;
  url: string;
};

type BillStatus = "law" | "passed" | "committee" | "filed";

function getBillStatus(last_action: string): BillStatus {
  const a = (last_action || "").toLowerCase();
  if (a.includes("effective") || a.includes("signed by governor") || a.includes("enacted")) return "law";
  if (a.includes("enrolled") || a.includes("passed by") || a.includes("passed senate") || a.includes("passed house")) return "passed";
  if (a.includes("reported favorably") || a.includes("left pending") || a.includes("committee report")) return "committee";
  return "filed";
}

const STATUS_STYLES: Record<BillStatus, { label: string; bg: string; text: string }> = {
  law:       { label: "Signed into Law",   bg: "#dcfce7", text: "#16a34a" },
  passed:    { label: "Passed Chamber",    bg: "#ede9fe", text: "#7c3aed" },
  committee: { label: "Passed Committee",  bg: "#dbeafe", text: "#2563eb" },
  filed:     { label: "Filed",             bg: "#f3f4f6", text: "#6b7280" },
};

type Counts = { filed: number; committee: number; passed: number; law: number };

const REPS: Rep[] = [
  { name: "Carol Alvarado",        district: "SD-6",   chamber: "Senate", party: "D" },
  { name: "Borris Miles",          district: "SD-13",  chamber: "Senate", party: "D" },
  { name: "Molly Cook",            district: "SD-15",  chamber: "Senate", party: "D" },
  { name: "Paul Bettencourt",      district: "SD-7",   chamber: "Senate", party: "R" },
  { name: "Senfronia Thompson",    district: "HD-141", chamber: "House",  party: "D" },
  { name: "Ann Johnson",           district: "HD-134", chamber: "House",  party: "D" },
  { name: "Ana Hernandez",         district: "HD-143", chamber: "House",  party: "D" },
  { name: "Armando Walle",         district: "HD-140", chamber: "House",  party: "D" },
  { name: "Mary Ann Perez",        district: "HD-144", chamber: "House",  party: "D" },
  { name: "Harold Dutton",         district: "HD-142", chamber: "House",  party: "D" },
  { name: "Gene Wu",               district: "HD-137", chamber: "House",  party: "D" },
  { name: "Jolanda Jones",         district: "HD-147", chamber: "House",  party: "D" },
  { name: "Hubert Vo",             district: "HD-149", chamber: "House",  party: "D" },
  { name: "Lauren Ashley Simmons", district: "HD-146", chamber: "House",  party: "D" },
  { name: "Alma Allen",            district: "HD-131", chamber: "House",  party: "D" },
  { name: "Christina Morales",     district: "HD-145", chamber: "House",  party: "D" },
  { name: "Charlene Ward Johnson", district: "HD-139", chamber: "House",  party: "D" },
  { name: "Jon Rosenthal",         district: "HD-135", chamber: "House",  party: "D" },
  { name: "Lacey Hull",            district: "HD-138", chamber: "House",  party: "R" },
  { name: "Tom Oliverson",         district: "HD-130", chamber: "House",  party: "R" },
  { name: "Dennis Paul",           district: "HD-129", chamber: "House",  party: "R" },
  { name: "Greg Bonnen",           district: "HD-24",  chamber: "House",  party: "R" },
  { name: "Mike Schofield",        district: "HD-132", chamber: "House",  party: "R" },
];

type SortKey = "law" | "passed" | "committee" | "filed" | "pct";

export default function BillTracker() {
  const [sortKey, setSortKey] = useState<SortKey>("law");
  const [chamber, setChamber] = useState<"all" | "House" | "Senate">("all");
  const [party, setParty] = useState<"all" | "D" | "R">("all");
  const [selectedRep, setSelectedRep] = useState<Rep | null>(null);
  const [allBills, setAllBills] = useState<Bill[]>([]);
  const [statusFilter, setStatusFilter] = useState<BillStatus | "all">("all");
  const [loading, setLoading] = useState(false);
  const [apiMissing, setApiMissing] = useState(false);
  const [repCounts, setRepCounts] = useState<Record<string, Counts>>({});

  // Pre-load all reps on mount
  const filtered = REPS
    .filter(r => chamber === "all" || r.chamber === chamber)
    .filter(r => party === "all" || r.party === party)
    .sort((a, b) => {
      const ca = repCounts[a.name];
      const cb = repCounts[b.name];
      if (!cb && !ca) return 0;
      if (!cb) return -1;
      if (!ca) return 1;
      if (sortKey === "pct") {
        const pa = ca.filed ? ca.law / ca.filed : 0;
        const pb = cb.filed ? cb.law / cb.filed : 0;
        return pb - pa;
      }
      return (cb[sortKey] || 0) - (ca[sortKey] || 0);
    });

  async function loadBills(rep: Rep) {
    setSelectedRep(rep);
    setAllBills([]);
    setStatusFilter("all");
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
      setAllBills(results);

      // Count by status
      const counts: Counts = { filed: 0, committee: 0, passed: 0, law: 0 };
      for (const b of results) {
        const s = getBillStatus(b.last_action);
        if (s === "law") { counts.law++; counts.passed++; counts.committee++; counts.filed++; }
        else if (s === "passed") { counts.passed++; counts.committee++; counts.filed++; }
        else if (s === "committee") { counts.committee++; counts.filed++; }
        else counts.filed++;
      }
      setRepCounts(prev => ({ ...prev, [rep.name]: counts }));
    } catch {
      setAllBills([]);
    }
    setLoading(false);
  }

  const displayBills = statusFilter === "all"
    ? allBills
    : allBills.filter(b => getBillStatus(b.last_action) === statusFilter);

  const sortLabels: Record<SortKey, string> = {
    law: "Signed into Law", passed: "Passed Chamber",
    committee: "Passed Committee", filed: "Total Filed", pct: "Pass Rate %",
  };

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
            Bills filed, passed committee, passed chamber, and signed into law. Click any rep to load their bills — counts populate as you go.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {apiMissing && (
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-6 text-sm text-amber-800">
            <strong>API key not configured.</strong> Add <code className="bg-amber-100 px-1 rounded">LEGISCAN_API_KEY</code> to Vercel environment variables.{" "}
            <a href="https://legiscan.com/legiscan" target="_blank" className="underline">Get a free key →</a>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6 items-center">
          {/* Sort */}
          <div className="flex flex-wrap gap-1">
            {(Object.entries(sortLabels) as [SortKey, string][]).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setSortKey(k)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  sortKey === k
                    ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                    : "bg-white text-[var(--muted)] border-[var(--border)] hover:border-[var(--accent)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-[var(--border)] hidden sm:block" />

          {/* Chamber */}
          <div className="flex gap-1">
            {(["all", "House", "Senate"] as const).map(c => (
              <button key={c} onClick={() => setChamber(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  chamber === c ? "bg-[var(--accent)] text-white border-[var(--accent)]" : "bg-white text-[var(--muted)] border-[var(--border)] hover:border-[var(--accent)]"
                }`}>
                {c === "all" ? "All Chambers" : c}
              </button>
            ))}
          </div>

          {/* Party */}
          <div className="flex gap-1">
            {(["all", "D", "R"] as const).map(p => (
              <button key={p} onClick={() => setParty(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  party === p
                    ? p === "D" ? "bg-blue-700 text-white border-blue-700"
                    : p === "R" ? "bg-red-700 text-white border-red-700"
                    : "bg-[var(--accent)] text-white border-[var(--accent)]"
                    : "bg-white text-[var(--muted)] border-[var(--border)] hover:border-[var(--accent)]"
                }`}>
                {p === "all" ? "All Parties" : p === "D" ? "Dem" : "Rep"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-6 flex-col lg:flex-row">
          {/* Leaderboard */}
          <div className="flex-1 min-w-0">
            <div className="bg-white border border-[var(--border)] rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-[var(--border)] bg-gray-50 flex justify-between items-center">
                <span className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">Leaderboard</span>
                <span className="text-xs text-[var(--muted)]">{filtered.length} reps · click to load bills</span>
              </div>

              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-xs text-[var(--muted)] uppercase tracking-wider border-b border-[var(--border)] bg-gray-50">
                    <th className="px-4 py-2 text-left w-8">#</th>
                    <th className="px-4 py-2 text-left">Rep</th>
                    <th className="px-3 py-2 text-right">Filed</th>
                    <th className="px-3 py-2 text-right">Cmte</th>
                    <th className="px-3 py-2 text-right">Chamber</th>
                    <th className="px-3 py-2 text-right">Law</th>
                    <th className="px-3 py-2 text-right">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((rep, i) => {
                    const c = repCounts[rep.name];
                    const pct = c && c.filed > 0 ? Math.round((c.law / c.filed) * 100) : null;
                    const isSelected = selectedRep?.name === rep.name;
                    return (
                      <tr key={rep.name} onClick={() => loadBills(rep)}
                        className={`border-b border-[var(--border)] cursor-pointer transition-colors ${isSelected ? "bg-blue-50" : "hover:bg-gray-50"}`}
                      >
                        <td className="px-4 py-3 text-[var(--muted)] text-xs font-mono w-8">
                          {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-[var(--accent)] text-sm">{rep.name}</div>
                          <div className="flex gap-2 mt-0.5">
                            <span className="text-xs text-[var(--muted)]">{rep.district}</span>
                            <span className={`text-xs font-bold ${rep.party === "D" ? "text-blue-700" : "text-red-700"}`}>{rep.party}</span>
                            <span className="text-xs text-[var(--muted)]">{rep.chamber}</span>
                          </div>
                          {c && (
                            <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                              <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-xs text-[var(--muted)]">{c ? c.filed : <span className="text-gray-300">—</span>}</td>
                        <td className="px-3 py-3 text-right font-mono text-xs text-blue-600">{c ? c.committee : <span className="text-gray-300">—</span>}</td>
                        <td className="px-3 py-3 text-right font-mono text-xs text-purple-600">{c ? c.passed : <span className="text-gray-300">—</span>}</td>
                        <td className="px-3 py-3 text-right font-mono text-xs font-bold text-green-700">{c ? c.law : <span className="text-gray-300">—</span>}</td>
                        <td className="px-3 py-3 text-right font-mono text-xs text-[var(--muted)]">{pct !== null ? `${pct}%` : <span className="text-gray-300">—</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="px-4 py-3 border-t border-[var(--border)] bg-gray-50 flex gap-4 text-xs text-[var(--muted)] flex-wrap">
                <span><span className="inline-block w-2 h-2 rounded bg-gray-400 mr-1" />Filed = all bills searched by name</span>
                <span><span className="inline-block w-2 h-2 rounded bg-blue-500 mr-1" />Cmte = passed committee</span>
                <span><span className="inline-block w-2 h-2 rounded bg-purple-500 mr-1" />Chamber = passed full chamber</span>
                <span><span className="inline-block w-2 h-2 rounded bg-green-500 mr-1" />Law = signed by Governor</span>
                <span><span className="inline-block w-2 h-2 rounded bg-green-400 mr-1" />Rate = Law ÷ Filed</span>
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
                  {!loading && allBills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      <button onClick={() => setStatusFilter("all")}
                        className={`text-xs px-2 py-1 rounded-full border transition-colors ${statusFilter === "all" ? "bg-[var(--accent)] text-white border-[var(--accent)]" : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)]"}`}>
                        All ({allBills.length})
                      </button>
                      {(["law", "passed", "committee", "filed"] as BillStatus[]).map(s => {
                        const count = allBills.filter(b => getBillStatus(b.last_action) === s).length;
                        if (!count) return null;
                        const st = STATUS_STYLES[s];
                        return (
                          <button key={s} onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
                            className={`text-xs px-2 py-1 rounded-full border transition-colors`}
                            style={statusFilter === s ? { background: st.text, color: "#fff", borderColor: st.text } : { background: st.bg, color: st.text, borderColor: st.bg }}>
                            {st.label} ({count})
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="overflow-y-auto" style={{ maxHeight: "65vh" }}>
                  {loading && (
                    <div className="p-8 text-center text-[var(--muted)] text-sm">Loading bills…</div>
                  )}
                  {!loading && allBills.length === 0 && (
                    <div className="p-8 text-center text-[var(--muted)] text-sm">No bills found.</div>
                  )}
                  {!loading && displayBills.map(bill => {
                    const s = getBillStatus(bill.last_action);
                    const st = STATUS_STYLES[s];
                    return (
                      <a key={bill.bill_id} href={bill.url} target="_blank" rel="noopener noreferrer"
                        className="block px-4 py-3 border-b border-[var(--border)] hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-mono text-xs font-bold text-[var(--accent)]">{bill.bill_number}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium"
                            style={{ background: st.bg, color: st.text }}>
                            {st.label}
                          </span>
                        </div>
                        <div className="text-xs text-[var(--muted)] mt-1 leading-relaxed line-clamp-2">{bill.title}</div>
                        {bill.last_action_date && (
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
          Data: LegiScan · 89th Texas Legislature (2025–2026). Results are searched by rep last name — may include co-sponsorships. Click any rep to load their bills.
        </p>
      </div>
    </div>
  );
}
