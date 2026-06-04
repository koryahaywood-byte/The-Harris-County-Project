"use client";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { POLITICIANS } from "@/lib/politicians";
import Link from "next/link";

type Bill = {
  bill_id: number;
  bill_number: string;
  title: string;
  last_action: string;
  last_action_date: string;
  url: string;
};

type BillStatus = "law" | "passed" | "committee" | "filed";

function getBillStatus(a: string): BillStatus {
  const s = (a || "").toLowerCase();
  if (s.includes("effective") || s.includes("signed by governor") || s.includes("enacted")) return "law";
  if (s.includes("enrolled") || s.includes("passed by") || s.includes("passed senate") || s.includes("passed house")) return "passed";
  if (s.includes("reported favorably") || s.includes("left pending") || s.includes("committee report")) return "committee";
  return "filed";
}

const STATUS_STYLES: Record<BillStatus, { label: string; bg: string; text: string }> = {
  law:       { label: "Signed into Law",  bg: "#dcfce7", text: "#16a34a" },
  passed:    { label: "Passed Chamber",   bg: "#ede9fe", text: "#7c3aed" },
  committee: { label: "Passed Committee", bg: "#dbeafe", text: "#2563eb" },
  filed:     { label: "Filed",            bg: "#f3f4f6", text: "#6b7280" },
};

type NewsArticle = { title: string; link: string; pubDate: string; source: string };

/* ─── Elegant Portrait ─────────────────────────────────────────────────────── */
function PoliticianPortrait({ slug, photo, party, name }: {
  slug: string; photo?: string; party: string; name: string;
}) {
  const isD    = party === "D";
  const ring   = isD ? "#3b82f6" : "#ef4444";
  const glow   = isD ? "rgba(59,130,246,0.18)" : "rgba(239,68,68,0.18)";
  const dim    = isD ? "#1a3a5c" : "#6b1a1a";

  return (
    <>
      <style>{`
        @keyframes port-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes port-glow { 0%,100%{opacity:0.6} 50%{opacity:1} }
        .port-ring { animation: port-spin 90s linear infinite; transform-origin: 200px 200px; }
        .port-glow { animation: port-glow 5s ease-in-out infinite; }
      `}</style>

      <div className="relative flex items-center justify-center" style={{ width: 220, height: 220 }}>
        {/* Decorative geometry — purely background */}
        <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full" aria-hidden="true">
          {/* Outer soft circle */}
          <circle cx="200" cy="200" r="190" fill="none" stroke={dim} strokeWidth="0.6" strokeOpacity="0.08" strokeDasharray="3 8"/>
          {/* Rotating tick ring */}
          <g className="port-ring">
            {Array.from({ length: 60 }, (_, i) => {
              const a = (i * 6 - 90) * Math.PI / 180;
              const big = i % 5 === 0;
              const r1 = 190, r2 = big ? 178 : 185;
              return (
                <line key={i}
                  x1={200 + r1 * Math.cos(a)} y1={200 + r1 * Math.sin(a)}
                  x2={200 + r2 * Math.cos(a)} y2={200 + r2 * Math.sin(a)}
                  stroke={dim} strokeOpacity={big ? 0.22 : 0.09}
                  strokeWidth={big ? 1.4 : 0.7}
                />
              );
            })}
          </g>
          {/* Inner guide circle */}
          <circle cx="200" cy="200" r="156" fill="none" stroke={dim} strokeWidth="0.5" strokeOpacity="0.06"/>
          {/* Crosshair lines */}
          <line x1="10" y1="200" x2="390" y2="200" stroke={dim} strokeWidth="0.5" strokeOpacity="0.05"/>
          <line x1="200" y1="10"  x2="200" y2="390" stroke={dim} strokeWidth="0.5" strokeOpacity="0.05"/>
          {/* Diagonal square (rotated 45) */}
          <rect x="55" y="55" width="290" height="290" fill="none" stroke={dim} strokeWidth="0.5" strokeOpacity="0.05" transform="rotate(45 200 200)"/>
          {/* Party color glow ring */}
          <circle cx="200" cy="200" r="118" fill={glow} className="port-glow"/>
        </svg>

        {/* Photo or initial */}
        <div className="relative z-10 rounded-full overflow-hidden"
          style={{
            width: 200, height: 200,
            boxShadow: `0 0 0 4px ${ring}, 0 12px 40px rgba(0,0,0,0.18)`,
          }}>
          {photo ? (
            <img
              src={photo}
              alt={name}
              className="w-full h-full object-cover object-top"
              style={{ display: "block" }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-white"
              style={{ background: dim }}>
              {name.split(" ").map(w => w[0]).slice(0, 2).join("")}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── Main Profile Page ─────────────────────────────────────────────────────── */
type Tab = "bills" | "money" | "news";

export default function PoliticianProfile() {
  const { slug } = useParams<{ slug: string }>();
  const pol = POLITICIANS.find(p => p.slug === slug);
  const [tab, setTab] = useState<Tab>("bills");
  const [bills, setBills] = useState<Bill[]>([]);
  const [billTotal, setBillTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<BillStatus | "all">("all");
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);

  useEffect(() => {
    if (!pol?.legiscanName) return;
    setLoading(true);
    fetch(`/api/bills?action=search&rep=${encodeURIComponent(pol.name)}`)
      .then(r => r.json())
      .then(d => { setBills(d.bills ?? []); setBillTotal(d.total ?? 0); })
      .finally(() => setLoading(false));
  }, [pol]);

  useEffect(() => {
    if (!pol || tab !== "news") return;
    if (news.length > 0) return;
    setNewsLoading(true);
    fetch(`/api/news?name=${encodeURIComponent(pol.name)}`)
      .then(r => r.json())
      .then(d => setNews(d.articles ?? []))
      .finally(() => setNewsLoading(false));
  }, [pol, tab]);

  if (!pol) return (
    <div className="max-w-2xl mx-auto px-6 py-24 text-center">
      <h1 className="text-2xl font-bold text-[var(--accent)] mb-4" style={{ fontFamily: "var(--font-playfair), serif" }}>
        Politician not found
      </h1>
      <Link href="/politicians" className="text-[var(--accent-light)] underline text-sm">← Back to all officials</Link>
    </div>
  );

  const isD = pol.party === "D";
  const lawBills    = bills.filter(b => getBillStatus(b.last_action) === "law");
  const passedBills = bills.filter(b => getBillStatus(b.last_action) === "passed");
  const cmteBills   = bills.filter(b => getBillStatus(b.last_action) === "committee");
  const pct = billTotal > 0 ? Math.round((lawBills.length / billTotal) * 100) : 0;
  const displayBills = statusFilter === "all" ? bills : bills.filter(b => getBillStatus(b.last_action) === statusFilter);

  const tabs: { id: Tab; label: string }[] = [
    ...(pol.legiscanName ? [{ id: "bills" as Tab, label: "Bills" }] : []),
    { id: "money", label: "Money" },
    { id: "news",  label: "News" },
  ];

  return (
    <div className="bg-[var(--background)]">

      {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
      <div className="px-6 pt-5 pb-0 max-w-5xl mx-auto">
        <Link href="/politicians"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          All Officials
        </Link>
      </div>

      {/* ── Hero: portrait + name ─────────────────────────────────────── */}
      <div className="pt-8 pb-2 flex flex-col items-center text-center px-6">
        <PoliticianPortrait
          slug={pol.slug}
          photo={pol.photo}
          party={pol.party}
          name={pol.name}
        />

        {/* Party badge */}
        <span className="mt-5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.18em] text-white"
          style={{ background: isD ? "#1d4ed8" : "#dc2626" }}>
          {pol.party === "D" ? "Democrat" : pol.party === "R" ? "Republican" : pol.party}
        </span>

        <h1 className="mt-3 text-4xl md:text-5xl font-bold text-[var(--accent)] leading-tight"
          style={{ fontFamily: "var(--font-playfair), serif" }}>
          {pol.name}
        </h1>
        <p className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">{pol.office}</p>

        {/* Quick stats row */}
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <div className="rounded-[1.35rem] bg-white/70 ring-1 ring-black/8 p-[4px]">
            <div className="rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] px-5 py-3 text-center">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] mb-0.5">District</p>
              <p className="text-xl font-bold text-[var(--accent)]" style={{ fontFamily: "var(--font-playfair), serif" }}>
                {pol.district}
              </p>
              <p className="text-[10px] text-[var(--muted)]">{pol.chamber}</p>
            </div>
          </div>
          {pol.salary && (
            <div className="rounded-[1.35rem] bg-white/70 ring-1 ring-black/8 p-[4px]">
              <div className="rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] px-5 py-3 text-center">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] mb-0.5">Salary / yr</p>
                <p className="text-xl font-bold text-[var(--accent)]" style={{ fontFamily: "var(--font-playfair), serif" }}>
                  ${pol.salary.toLocaleString()}
                </p>
              </div>
            </div>
          )}
          {pol.legiscanName && (
            <div className="rounded-[1.35rem] bg-white/70 ring-1 ring-black/8 p-[4px]">
              <div className="rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] px-5 py-3 text-center">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] mb-0.5">Into Law</p>
                <p className={`text-xl font-bold ${isD ? "text-blue-700" : "text-red-700"}`}
                  style={{ fontFamily: "var(--font-playfair), serif" }}>
                  {loading ? "…" : lawBills.length}
                </p>
                {billTotal > 0 && (
                  <p className="text-[10px] text-[var(--muted)]">of {billTotal} filed</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Social / links row */}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {pol.website && (
            <a href={pol.website} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--accent)] text-white text-xs font-semibold hover:bg-[var(--accent-light)] transition-colors">
              Official Website
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
              </svg>
            </a>
          )}
          {pol.twitter && (
            <a href={`https://twitter.com/${pol.twitter}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white ring-1 ring-[var(--border)] text-[var(--accent)] text-xs font-semibold hover:ring-[var(--accent)] transition-colors">
              X / Twitter
            </a>
          )}
          {pol.instagram && (
            <a href={`https://instagram.com/${pol.instagram}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white ring-1 ring-[var(--border)] text-[var(--accent)] text-xs font-semibold hover:ring-[var(--accent)] transition-colors">
              Instagram
            </a>
          )}
          {pol.email && (
            <a href={`mailto:${pol.email}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white ring-1 ring-[var(--border)] text-[var(--accent)] text-xs font-semibold hover:ring-[var(--accent)] transition-colors">
              Email
            </a>
          )}
        </div>
      </div>

      {/* ── Tabs + Content ─────────────────────────────────────────────── */}
      <div className="mt-8 border-t border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex gap-1 border-b border-[var(--border)]">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-5 py-3.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                  tab === t.id ? "border-[var(--accent)] text-[var(--accent)]" : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8">

          {/* ── BILLS TAB ── */}
          {tab === "bills" && pol.legiscanName && (
            <div>
              {loading ? (
                <div className="text-center py-16 text-[var(--muted)] text-sm animate-pulse">Loading bills…</div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    {[
                      { label: "Total Filed",       val: billTotal,         color: "" },
                      { label: "Passed Committee",  val: cmteBills.length,  color: "text-blue-600" },
                      { label: "Passed Chamber",    val: passedBills.length, color: "text-violet-600" },
                      { label: "Signed into Law",   val: lawBills.length,   color: "text-green-600" },
                    ].map(({ label, val, color }) => (
                      <div key={label} className="rounded-[1.35rem] bg-white/60 ring-1 ring-black/8 p-[4px]">
                        <div className="rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] p-4 text-center">
                          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--muted)] mb-1">{label}</p>
                          <p className={`text-2xl font-bold ${color || "text-[var(--accent)]"}`}
                            style={{ fontFamily: "var(--font-playfair), serif" }}>{val}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {billTotal > 0 && (
                    <div className="mb-6">
                      <div className="flex justify-between text-xs text-[var(--muted)] mb-1">
                        <span>Pass rate</span>
                        <span className="font-bold text-green-600">{pct}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full transition-all duration-700"
                          style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                      <p className="text-[11px] text-[var(--muted)] mt-1">89th Texas Legislature · Bills into law ÷ total filed</p>
                    </div>
                  )}

                  {bills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      <button onClick={() => setStatusFilter("all")}
                        style={{ transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)" }}
                        className={`text-xs px-3 py-1.5 rounded-full border font-semibold ${statusFilter === "all" ? "bg-[var(--accent)] text-white border-[var(--accent)]" : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)]/40"}`}>
                        All ({bills.length})
                      </button>
                      {(["law","passed","committee","filed"] as BillStatus[]).map(s => {
                        const count = bills.filter(b => getBillStatus(b.last_action) === s).length;
                        if (!count) return null;
                        const st = STATUS_STYLES[s];
                        return (
                          <button key={s} onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
                            style={{ transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)", ...(statusFilter === s ? { background: st.text, color: "#fff", borderColor: st.text } : { background: st.bg, color: st.text, borderColor: st.bg }) }}
                            className="text-xs px-3 py-1.5 rounded-full border font-semibold">
                            {st.label} ({count})
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="bg-white border border-[var(--border)] rounded-xl overflow-hidden">
                    {displayBills.length === 0
                      ? <p className="p-8 text-center text-[var(--muted)] text-sm">No bills found.</p>
                      : displayBills.map(bill => {
                        const s = getBillStatus(bill.last_action);
                        const st = STATUS_STYLES[s];
                        return (
                          <a key={bill.bill_id} href={bill.url} target="_blank" rel="noopener noreferrer"
                            className="block px-5 py-4 border-b border-[var(--border)] last:border-0 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start justify-between gap-3">
                              <span className="font-mono text-xs font-bold text-[var(--accent)]">{bill.bill_number}</span>
                              <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium"
                                style={{ background: st.bg, color: st.text }}>{st.label}</span>
                            </div>
                            <p className="text-sm text-[var(--foreground)] mt-1 leading-relaxed">{bill.title}</p>
                            {bill.last_action_date && (
                              <p className="text-xs text-gray-400 mt-1">{bill.last_action_date} · {bill.last_action}</p>
                            )}
                          </a>
                        );
                      })
                    }
                  </div>
                  <p className="text-xs text-[var(--muted)] mt-4">Data: LegiScan · 89th Texas Legislature.</p>
                </>
              )}
            </div>
          )}

          {/* ── MONEY TAB ── */}
          {tab === "money" && (
            <div className="py-4 text-center max-w-sm mx-auto">
              <div className="rounded-[1.75rem] bg-white/60 ring-1 ring-black/8 p-[6px]">
                <div className="rounded-[1.35rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] p-10 flex flex-col items-center gap-3">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v2m0 8v2M9 9h4.5a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3H15"/>
                  </svg>
                  <h3 className="font-bold text-[var(--accent)] text-lg" style={{ fontFamily: "var(--font-playfair), serif" }}>
                    Campaign Finance Coming Soon
                  </h3>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">
                    Donor lists, spending breakdown, and PAC money will connect here once the Where Is the Dough data is wired to profiles.
                  </p>
                  <Link href="/tools/where-is-the-dough"
                    className="mt-2 text-xs font-semibold text-[var(--accent-light)] hover:underline">
                    See campaign finance tool →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* ── NEWS TAB ── */}
          {tab === "news" && (
            <div>
              {newsLoading ? (
                <div className="text-center py-16 text-[var(--muted)] text-sm animate-pulse">Loading news…</div>
              ) : news.length === 0 ? (
                <div className="text-center py-16 text-[var(--muted)] text-sm">
                  <p className="font-semibold mb-1">No recent articles found.</p>
                  <p className="text-xs">Try searching directly on Google News.</p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-[var(--muted)] mb-5 font-semibold uppercase tracking-[0.18em]">
                    Recent Coverage — {pol.name}
                  </p>
                  <div className="space-y-3">
                    {news.map((article, i) => {
                      const date = article.pubDate
                        ? new Date(article.pubDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        : "";
                      return (
                        <a key={i} href={article.link} target="_blank" rel="noopener noreferrer"
                          className="block rounded-[1.35rem] bg-white/70 ring-1 ring-black/7 p-[4px] hover:ring-[var(--accent)]/30 transition-all duration-300 group">
                          <div className="rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] px-5 py-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-[var(--foreground)] leading-snug group-hover:text-[var(--accent)] transition-colors line-clamp-2">
                                  {article.title}
                                </p>
                                <div className="mt-1.5 flex items-center gap-2 text-[10px] text-[var(--muted)]">
                                  {article.source && (
                                    <span className="font-bold text-[var(--accent-light)]">{article.source}</span>
                                  )}
                                  {date && article.source && <span>·</span>}
                                  {date && <span>{date}</span>}
                                </div>
                              </div>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors mt-0.5">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
                              </svg>
                            </div>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                  <p className="text-xs text-[var(--muted)] mt-5">Source: Google News · Results for &ldquo;{pol.name}&rdquo; Harris County Texas.</p>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
