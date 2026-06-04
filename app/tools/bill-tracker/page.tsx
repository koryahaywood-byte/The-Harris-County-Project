"use client";
import { useState, useEffect } from "react";

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
  law:       { label: "Signed into Law",  bg: "#dcfce7", text: "#16a34a" },
  passed:    { label: "Passed Chamber",   bg: "#ede9fe", text: "#7c3aed" },
  committee: { label: "Passed Committee", bg: "#dbeafe", text: "#2563eb" },
  filed:     { label: "Filed",            bg: "#f3f4f6", text: "#6b7280" },
};

type Counts = { total: number; committee: number; passed: number; law: number };

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

async function fetchRepCounts(rep: Rep): Promise<Counts> {
  const res = await fetch(`/api/bills?action=summary&rep=${encodeURIComponent(rep.name)}`);
  const data = await res.json();
  const bills: Bill[] = data.bills ?? [];
  const counts: Counts = { total: data.total ?? bills.length, committee: 0, passed: 0, law: 0 };
  for (const b of bills) {
    const s = getBillStatus(b.last_action);
    if (s === "law") counts.law++;
    else if (s === "passed") counts.passed++;
    else if (s === "committee") counts.committee++;
  }
  return counts;
}

type SortKey = "law" | "passed" | "committee" | "total" | "pct";

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
  const [preloading, setPreloading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    async function preload() {
      const BATCH = 5;
      for (let i = 0; i < REPS.length; i += BATCH) {
        const batch = REPS.slice(i, i + BATCH);
        const results = await Promise.allSettled(batch.map(r => fetchRepCounts(r)));
        setRepCounts(prev => {
          const next = { ...prev };
          results.forEach((r, idx) => {
            if (r.status === "fulfilled") next[batch[idx].name] = r.value;
          });
          return next;
        });
      }
      setPreloading(false);
    }
    preload();
  }, []);

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
        const pa = ca.total ? ca.law / ca.total : 0;
        const pb = cb.total ? cb.law / cb.total : 0;
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
    setSheetOpen(true);
    try {
      const res = await fetch(`/api/bills?action=search&rep=${encodeURIComponent(rep.name)}`);
      const data = await res.json();
      if (data.error?.includes("not set")) { setApiMissing(true); setLoading(false); return; }
      const results: Bill[] = data.bills ?? [];
      setAllBills(results);
      const counts: Counts = { total: data.total ?? results.length, committee: 0, passed: 0, law: 0 };
      for (const b of results) {
        const s = getBillStatus(b.last_action);
        if (s === "law") counts.law++;
        else if (s === "passed") counts.passed++;
        else if (s === "committee") counts.committee++;
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

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: "law",       label: "Into Law" },
    { key: "passed",    label: "Passed Chamber" },
    { key: "committee", label: "Passed Committee" },
    { key: "total",     label: "Total Filed" },
    { key: "pct",       label: "Pass Rate %" },
  ];

  const DrillDown = () => (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-[var(--border)] bg-gray-50 flex-shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-bold text-[var(--accent)]" style={{ fontFamily: "var(--font-playfair), serif" }}>
              {selectedRep?.name}
            </div>
            <div className="text-xs text-[var(--muted)] mt-0.5">{selectedRep?.district} · {selectedRep?.chamber}</div>
          </div>
          <button
            onClick={() => setSheetOpen(false)}
            className="text-[var(--muted)] hover:text-[var(--accent)] text-lg leading-none p-1 lg:hidden"
          >
            ✕
          </button>
        </div>
        {!loading && allBills.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            <button onClick={() => setStatusFilter("all")}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${statusFilter === "all" ? "bg-[var(--accent)] text-white border-[var(--accent)]" : "border-[var(--border)] text-[var(--muted)]"}`}>
              All ({allBills.length})
            </button>
            {(["law", "passed", "committee", "filed"] as BillStatus[]).map(s => {
              const count = allBills.filter(b => getBillStatus(b.last_action) === s).length;
              if (!count) return null;
              const st = STATUS_STYLES[s];
              return (
                <button key={s} onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
                  className="text-xs px-2.5 py-1 rounded-full border transition-colors"
                  style={statusFilter === s
                    ? { background: st.text, color: "#fff", borderColor: st.text }
                    : { background: st.bg, color: st.text, borderColor: st.bg }}>
                  {st.label} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div className="overflow-y-auto flex-1">
        {loading && <div className="p-8 text-center text-[var(--muted)] text-sm">Loading bills…</div>}
        {!loading && allBills.length === 0 && <div className="p-8 text-center text-[var(--muted)] text-sm">No bills found.</div>}
        {!loading && displayBills.map(bill => {
          const s = getBillStatus(bill.last_action);
          const st = STATUS_STYLES[s];
          return (
            <a key={bill.bill_id} href={bill.url} target="_blank" rel="noopener noreferrer"
              className="block px-4 py-3 border-b border-[var(--border)] hover:bg-gray-50 transition-colors active:bg-gray-100">
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-xs font-bold text-[var(--accent)]">{bill.bill_number}</span>
                <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium"
                  style={{ background: st.bg, color: st.text }}>{st.label}</span>
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
  );

  return (
    <div>
      {/* Hero */}
      <div className="bg-[var(--accent)] text-white px-6 py-10 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_80%_50%,rgba(37,99,168,0.4),transparent)]" />
        <div className="max-w-6xl mx-auto relative z-10">
          <p className="text-sky-300/80 text-[11px] font-bold uppercase tracking-[0.25em] mb-3">Legislative</p>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-2" style={{ fontFamily: "var(--font-playfair), serif" }}>
            Bill Tracker
          </h1>
          <p className="text-white/70 text-sm max-w-xl">
            Bills filed, passed committee, passed chamber, and signed into law — for every Harris County state rep. 89th Texas Legislature.
          </p>
          {preloading && <p className="text-sky-300/60 text-xs mt-3 animate-pulse">Loading counts for all reps…</p>}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {apiMissing && (
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-6 text-sm text-amber-800">
            <strong>API key not configured.</strong> Add <code className="bg-amber-100 px-1 rounded">LEGISCAN_API_KEY</code> to Vercel.{" "}
            <a href="https://legiscan.com/legiscan" target="_blank" className="underline">Get a free key →</a>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-5">
          <div className="flex flex-wrap gap-1 items-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mr-1">Sort</span>
            {sortOptions.map(({ key, label }) => (
              <button key={key} onClick={() => setSortKey(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  sortKey === key ? "bg-[var(--accent)] text-white border-[var(--accent)]" : "bg-white text-[var(--muted)] border-[var(--border)]"
                }`}>{label}</button>
            ))}
          </div>
          <div className="flex gap-1 items-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mr-1">Chamber</span>
            {(["all", "House", "Senate"] as const).map(c => (
              <button key={c} onClick={() => setChamber(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  chamber === c ? "bg-[var(--accent)] text-white border-[var(--accent)]" : "bg-white text-[var(--muted)] border-[var(--border)]"
                }`}>{c === "all" ? "All" : c}</button>
            ))}
          </div>
          <div className="flex gap-1 items-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mr-1">Party</span>
            {(["all", "D", "R"] as const).map(p => (
              <button key={p} onClick={() => setParty(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  party === p
                    ? p === "D" ? "bg-blue-700 text-white border-blue-700"
                    : p === "R" ? "bg-red-700 text-white border-red-700"
                    : "bg-[var(--accent)] text-white border-[var(--accent)]"
                    : "bg-white text-[var(--muted)] border-[var(--border)]"
                }`}>{p === "all" ? "All" : p === "D" ? "Dem" : "Rep"}</button>
            ))}
          </div>
        </div>

        {/* Desktop: side-by-side | Mobile: list + bottom sheet */}
        <div className="flex gap-6 flex-col lg:flex-row">
          {/* Leaderboard */}
          <div className="flex-1 min-w-0">
            <div className="bg-white border border-[var(--border)] rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-[var(--border)] bg-gray-50 flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">Leaderboard</span>
                <span className="text-xs text-[var(--muted)]">{filtered.length} reps · tap to see bills</span>
              </div>

              {/* Mobile card list */}
              <div className="lg:hidden divide-y divide-[var(--border)]">
                {filtered.map((rep, i) => {
                  const c = repCounts[rep.name];
                  const pct = c && c.total > 0 ? Math.round((c.law / c.total) * 100) : null;
                  const isSelected = selectedRep?.name === rep.name;
                  return (
                    <button key={rep.name} onClick={() => loadBills(rep)} className={`w-full text-left px-4 py-4 transition-colors active:bg-gray-100 ${isSelected ? "bg-blue-50" : ""}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs text-[var(--muted)] font-mono w-5 text-center flex-shrink-0">{i + 1}</span>
                          <div className="min-w-0">
                            <div className="font-semibold text-[var(--accent)] text-sm truncate">{rep.name}</div>
                            <div className="flex gap-2 mt-0.5">
                              <span className="text-xs text-[var(--muted)]">{rep.district}</span>
                              <span className={`text-xs font-bold ${rep.party === "D" ? "text-blue-700" : "text-red-700"}`}>{rep.party}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-3 flex-shrink-0 text-right">
                          <div>
                            <div className="text-xs font-bold text-green-700">{c ? c.law : <span className="text-gray-300">…</span>}</div>
                            <div className="text-[10px] text-[var(--muted)]">law</div>
                          </div>
                          <div>
                            <div className="text-xs font-mono text-[var(--muted)]">{pct !== null ? `${pct}%` : <span className="text-gray-300">…</span>}</div>
                            <div className="text-[10px] text-[var(--muted)]">rate</div>
                          </div>
                          <span className="text-[var(--muted)] text-sm self-center">›</span>
                        </div>
                      </div>
                      {c && (
                        <div className="mt-2 w-full bg-gray-100 rounded-full h-1">
                          <div className="bg-green-500 h-1 rounded-full" style={{ width: `${Math.min(pct ?? 0, 100)}%` }} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Desktop table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm border-collapse min-w-[500px]">
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
                      const pct = c && c.total > 0 ? Math.round((c.law / c.total) * 100) : null;
                      const isSelected = selectedRep?.name === rep.name;
                      return (
                        <tr key={rep.name} onClick={() => loadBills(rep)}
                          className={`border-b border-[var(--border)] cursor-pointer transition-colors ${isSelected ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                          <td className="px-4 py-3 text-[var(--muted)] text-xs font-mono w-8">
                            {i + 1}
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
                                <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${Math.min(pct ?? 0, 100)}%` }} />
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right font-mono text-xs text-[var(--muted)]">{c ? c.total : <span className="text-gray-300 animate-pulse">…</span>}</td>
                          <td className="px-3 py-3 text-right font-mono text-xs text-blue-600">{c ? c.committee : <span className="text-gray-300 animate-pulse">…</span>}</td>
                          <td className="px-3 py-3 text-right font-mono text-xs text-purple-600">{c ? c.passed : <span className="text-gray-300 animate-pulse">…</span>}</td>
                          <td className="px-3 py-3 text-right font-mono text-xs font-bold text-green-700">{c ? c.law : <span className="text-gray-300 animate-pulse">…</span>}</td>
                          <td className="px-3 py-3 text-right font-mono text-xs text-[var(--muted)]">{pct !== null ? `${pct}%` : <span className="text-gray-300 animate-pulse">…</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="px-4 py-3 border-t border-[var(--border)] bg-gray-50 flex gap-3 text-xs text-[var(--muted)] flex-wrap">
                <span><span className="inline-block w-2 h-2 rounded bg-gray-400 mr-1" />Filed = total</span>
                <span><span className="inline-block w-2 h-2 rounded bg-blue-500 mr-1" />Cmte</span>
                <span><span className="inline-block w-2 h-2 rounded bg-purple-500 mr-1" />Chamber</span>
                <span><span className="inline-block w-2 h-2 rounded bg-green-500 mr-1" />Law</span>
                <span><span className="inline-block w-2 h-2 rounded bg-green-400 mr-1" />Rate = Law ÷ Filed</span>
              </div>
            </div>
          </div>

          {/* Desktop drill-down panel */}
          {selectedRep && (
            <div className="hidden lg:block w-96 flex-shrink-0">
              <div className="bg-white border border-[var(--border)] rounded-xl overflow-hidden sticky top-4" style={{ maxHeight: "80vh" }}>
                {DrillDown()}
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-[var(--muted)] mt-5">
          Data: LegiScan · 89th Texas Legislature (2025–2026). Search by last name may include co-sponsorships.
        </p>
      </div>

      {/* Mobile bottom sheet */}
      {sheetOpen && selectedRep && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSheetOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white rounded-t-2xl shadow-2xl flex flex-col" style={{ maxHeight: "80dvh" }}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-1 flex-shrink-0" />
            {DrillDown()}
          </div>
        </>
      )}
    </div>
  );
}
