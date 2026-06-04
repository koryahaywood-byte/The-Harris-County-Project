"use client";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { POLITICIANS, type Politician } from "@/lib/politicians";
import Link from "next/link";

type Tab = "overview" | "bills" | "money";

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

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-[1.35rem] bg-white/60 ring-1 ring-black/8 p-[5px]">
      <div className="rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] p-4">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)] mb-1">{label}</div>
        <div className="text-2xl font-bold text-[var(--accent)]" style={{ fontFamily: "var(--font-playfair), serif" }}>{value}</div>
        {sub && <div className="text-xs text-[var(--muted)] mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

export default function PoliticianProfile() {
  const { slug } = useParams<{ slug: string }>();
  const pol = POLITICIANS.find(p => p.slug === slug);
  const [tab, setTab] = useState<Tab>("overview");
  const [bills, setBills] = useState<Bill[]>([]);
  const [billTotal, setBillTotal] = useState(0);
  const [billsLoading, setBillsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<BillStatus | "all">("all");

  useEffect(() => {
    if (!pol?.legiscanName) return;
    setBillsLoading(true);
    fetch(`/api/bills?action=search&rep=${encodeURIComponent(pol.name)}`)
      .then(r => r.json())
      .then(data => {
        setBills(data.bills ?? []);
        setBillTotal(data.total ?? 0);
      })
      .finally(() => setBillsLoading(false));
  }, [pol]);

  if (!pol) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <h1 className="text-2xl font-bold text-[var(--accent)] mb-4" style={{ fontFamily: "var(--font-playfair), serif" }}>
          Politician not found
        </h1>
        <Link href="/politicians" className="text-[var(--accent-light)] underline text-sm">← Back to all officials</Link>
      </div>
    );
  }

  const lawBills   = bills.filter(b => getBillStatus(b.last_action) === "law");
  const passedBills = bills.filter(b => getBillStatus(b.last_action) === "passed");
  const cmteBills  = bills.filter(b => getBillStatus(b.last_action) === "committee");
  const pct = billTotal > 0 ? Math.round((lawBills.length / billTotal) * 100) : 0;

  const displayBills = statusFilter === "all" ? bills
    : bills.filter(b => getBillStatus(b.last_action) === statusFilter);

  const partyColor = pol.party === "D" ? "text-blue-700" : pol.party === "R" ? "text-red-700" : "text-gray-500";
  const partyLabel = pol.party === "D" ? "Democrat" : pol.party === "R" ? "Republican" : pol.party;

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    ...(pol.legiscanName ? [{ key: "bills" as Tab, label: "Bills" }] : []),
    { key: "money", label: "Money" },
  ];

  return (
    <div>
      {/* Hero */}
      <div className="bg-[var(--accent)] text-white px-6 pt-10 pb-0 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_80%_50%,rgba(37,99,168,0.4),transparent)]" />
        <div className="max-w-5xl mx-auto relative z-10">
          <Link href="/politicians" className="text-sky-300/70 hover:text-sky-300 text-xs transition-colors mb-6 inline-block">
            ← All Officials
          </Link>

          <div className="flex items-end gap-6 pb-0">
            {/* Avatar */}
            <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl bg-white/20 flex items-center justify-center text-3xl md:text-4xl font-bold text-white flex-shrink-0 overflow-hidden ring-2 ring-white/20 mb-6">
              {pol.photo
                ? <img src={pol.photo} alt={pol.name} className="w-full h-full object-cover" />
                : <span style={{ fontFamily: "var(--font-playfair), serif" }}>{pol.name.split(" ").map(n => n[0]).slice(0,2).join("")}</span>
              }
            </div>

            <div className="pb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pol.party === "D" ? "bg-blue-700/40 text-blue-200" : pol.party === "R" ? "bg-red-700/40 text-red-200" : "bg-white/20 text-white/70"}`}>
                  {partyLabel}
                </span>
                <span className="text-sky-300/70 text-xs">{pol.district}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold leading-tight" style={{ fontFamily: "var(--font-playfair), serif" }}>
                {pol.name}
              </h1>
              <p className="text-white/70 text-sm mt-1">{pol.office}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 -mx-6 px-6 border-t border-white/10">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-4 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                  tab === t.key ? "border-sky-300 text-sky-300" : "border-transparent text-white/50 hover:text-white/80"
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div className="space-y-8">
            {/* Key stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Annual Salary" value={pol.salary ? `$${pol.salary.toLocaleString()}` : "—"} sub="Texas Legislature" />
              <StatCard label="District" value={pol.district} />
              <StatCard label="Party" value={partyLabel} />
              {pol.legiscanName && <StatCard label="Bills Into Law" value={billsLoading ? "…" : lawBills.length} sub={billTotal > 0 ? `of ${billTotal} filed` : undefined} />}
            </div>

            {/* Links */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="block w-6 h-px bg-[var(--muted)]/40" />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">Links & Contact</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {pol.website && (
                  <a href={pol.website} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent)] text-white text-xs font-semibold hover:bg-[var(--accent-light)] transition-colors">
                    Official Website →
                  </a>
                )}
                {pol.twitter && (
                  <a href={`https://twitter.com/${pol.twitter}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white ring-1 ring-[var(--border)] text-[var(--accent)] text-xs font-semibold hover:ring-[var(--accent)] transition-colors">
                    X / Twitter
                  </a>
                )}
                {pol.instagram && (
                  <a href={`https://instagram.com/${pol.instagram}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white ring-1 ring-[var(--border)] text-[var(--accent)] text-xs font-semibold hover:ring-[var(--accent)] transition-colors">
                    Instagram
                  </a>
                )}
                {pol.email && (
                  <a href={`mailto:${pol.email}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white ring-1 ring-[var(--border)] text-[var(--accent)] text-xs font-semibold hover:ring-[var(--accent)] transition-colors">
                    Email
                  </a>
                )}
              </div>
            </div>

            {/* Quick bill summary if available */}
            {pol.legiscanName && !billsLoading && bills.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="block w-6 h-px bg-[var(--muted)]/40" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">Legislative Summary</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <StatCard label="Total Filed" value={billTotal} />
                  <StatCard label="Passed Committee" value={cmteBills.length} />
                  <StatCard label="Passed Chamber" value={passedBills.length} />
                  <StatCard label="Signed into Law" value={lawBills.length} sub={`${pct}% pass rate`} />
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
                <p className="text-xs text-[var(--muted)] mt-2">{pct}% of filed bills became law · 89th Texas Legislature</p>
                <button onClick={() => setTab("bills")}
                  className="mt-4 text-xs font-semibold text-[var(--accent-light)] hover:underline">
                  View all bills →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── BILLS ── */}
        {tab === "bills" && pol.legiscanName && (
          <div>
            {billsLoading ? (
              <div className="text-center py-12 text-[var(--muted)]">Loading bills…</div>
            ) : (
              <>
                {/* Summary bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  <StatCard label="Total Filed" value={billTotal} />
                  <StatCard label="Passed Cmte" value={cmteBills.length} />
                  <StatCard label="Passed Chamber" value={passedBills.length} />
                  <StatCard label="Into Law" value={lawBills.length} sub={`${pct}% rate`} />
                </div>

                {/* Filter pills */}
                <div className="flex flex-wrap gap-2 mb-5">
                  <button onClick={() => setStatusFilter("all")}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors font-semibold ${statusFilter === "all" ? "bg-[var(--accent)] text-white border-[var(--accent)]" : "border-[var(--border)] text-[var(--muted)]"}`}>
                    All ({bills.length})
                  </button>
                  {(["law","passed","committee","filed"] as BillStatus[]).map(s => {
                    const count = bills.filter(b => getBillStatus(b.last_action) === s).length;
                    if (!count) return null;
                    const st = STATUS_STYLES[s];
                    return (
                      <button key={s} onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
                        className="text-xs px-3 py-1.5 rounded-full border transition-colors font-semibold"
                        style={statusFilter === s ? { background: st.text, color: "#fff", borderColor: st.text } : { background: st.bg, color: st.text, borderColor: st.bg }}>
                        {st.label} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* Bill list */}
                <div className="bg-white border border-[var(--border)] rounded-xl overflow-hidden">
                  {displayBills.map(bill => {
                    const s = getBillStatus(bill.last_action);
                    const st = STATUS_STYLES[s];
                    return (
                      <a key={bill.bill_id} href={bill.url} target="_blank" rel="noopener noreferrer"
                        className="block px-5 py-4 border-b border-[var(--border)] hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <span className="font-mono text-xs font-bold text-[var(--accent)]">{bill.bill_number}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium"
                            style={{ background: st.bg, color: st.text }}>{st.label}</span>
                        </div>
                        <div className="text-sm text-[var(--foreground)] mt-1 leading-relaxed">{bill.title}</div>
                        {bill.last_action_date && (
                          <div className="text-xs text-gray-400 mt-1">{bill.last_action_date} · {bill.last_action}</div>
                        )}
                      </a>
                    );
                  })}
                </div>
                <p className="text-xs text-[var(--muted)] mt-4">
                  Data: LegiScan · 89th Texas Legislature. Search by last name may include co-sponsorships.
                </p>
              </>
            )}
          </div>
        )}

        {/* ── MONEY ── */}
        {tab === "money" && (
          <div className="py-8 text-center">
            <div className="rounded-[1.75rem] bg-white/60 ring-1 ring-black/8 p-[6px] max-w-sm mx-auto">
              <div className="rounded-[1.35rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] p-10 flex flex-col items-center gap-3">
                <div className="text-3xl">💰</div>
                <h3 className="font-bold text-[var(--accent)]" style={{ fontFamily: "var(--font-playfair), serif" }}>
                  Campaign Finance Coming Soon
                </h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">
                  Donor lists, spending breakdown, and PAC money will be available once the Where Is the Dough data is connected to profiles.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
