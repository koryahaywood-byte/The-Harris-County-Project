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

/* ─── Vitruvian Figure SVG ──────────────────────────────────────────────── */
function VitruvianFigure({
  slug, photo, party, district, chamber, salary, legiscanName, lawCount, totalBills, loading,
}: {
  slug: string; photo?: string; party: string; district: string; chamber: string;
  salary?: number; legiscanName?: string; lawCount: number; totalBills: number; loading: boolean;
}) {
  const isD = party === "D";
  const suit    = isD ? "#1a3a5c" : "#7f1d1d";
  const suitLt  = isD ? "#2563a8" : "#b91c1c";
  const accent  = isD ? "#3b82f6" : "#ef4444";
  const partyLabel = party === "D" ? "DEMOCRAT" : party === "R" ? "REPUBLICAN" : party;

  return (
    <>
      <style>{`
        @keyframes vit-breathe { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2.5px)} }
        @keyframes vit-arm-l   { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(2deg)} }
        @keyframes vit-arm-r   { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-2deg)} }
        @keyframes vit-ticks   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes vit-glow    { 0%,100%{opacity:0.5} 50%{opacity:1} }
        .vit-body  { animation: vit-breathe 3.8s ease-in-out infinite; }
        .vit-arm-l { animation: vit-arm-l 5.2s ease-in-out infinite; transform-origin: 205px 218px; }
        .vit-arm-r { animation: vit-arm-r 5.2s ease-in-out infinite 0.8s; transform-origin: 355px 218px; }
        .vit-ticks { animation: vit-ticks 100s linear infinite; transform-origin: 280px 295px; }
        .vit-glow  { animation: vit-glow 3.8s ease-in-out infinite; }
      `}</style>

      <svg viewBox="0 0 560 580" className="w-full select-none" aria-label="Vitruvian figure">
        <defs>
          <clipPath id={`fc-${slug}`}>
            <circle cx="280" cy="118" r="47"/>
          </clipPath>
          <radialGradient id={`gl-${slug}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.07"/>
            <stop offset="100%" stopColor={accent} stopOpacity="0"/>
          </radialGradient>
          <filter id={`shadow-${slug}`}>
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor={suit} floodOpacity="0.18"/>
          </filter>
        </defs>

        {/* Background pulse */}
        <circle cx="280" cy="295" r="225" fill={`url(#gl-${slug})`} className="vit-glow"/>

        {/* Outer square */}
        <rect x="52" y="68" width="456" height="456" fill="none"
          stroke="rgba(26,58,92,0.07)" strokeWidth="1" strokeDasharray="5 9"/>

        {/* Outer circle */}
        <circle cx="280" cy="295" r="226" fill="none"
          stroke="rgba(26,58,92,0.09)" strokeWidth="0.8" strokeDasharray="2 5"/>

        {/* Slowly rotating tick marks */}
        <g className="vit-ticks">
          {Array.from({ length: 72 }, (_, i) => {
            const a = (i * 5 - 90) * Math.PI / 180;
            const big = i % 9 === 0;
            const mid = i % 3 === 0;
            const r1 = 226, r2 = big ? 210 : mid ? 218 : 222;
            return (
              <line key={i}
                x1={280 + r1 * Math.cos(a)} y1={295 + r1 * Math.sin(a)}
                x2={280 + r2 * Math.cos(a)} y2={295 + r2 * Math.sin(a)}
                stroke={`rgba(26,58,92,${big ? 0.28 : mid ? 0.14 : 0.08})`}
                strokeWidth={big ? 1.5 : 0.8}
              />
            );
          })}
        </g>

        {/* Inner ring */}
        <circle cx="280" cy="295" r="192" fill="none"
          stroke="rgba(26,58,92,0.04)" strokeWidth="0.5"/>

        {/* Axis crosshairs */}
        <line x1="52" y1="295" x2="508" y2="295" stroke="rgba(26,58,92,0.04)" strokeWidth="0.5"/>
        <line x1="280" y1="68" x2="280" y2="524" stroke="rgba(26,58,92,0.04)" strokeWidth="0.5"/>

        {/* ── LEFT ARM ── */}
        <g className="vit-arm-l">
          <path d="M205,222 Q140,244 58,272" stroke={suit} strokeWidth="25" strokeLinecap="round" fill="none"/>
          {/* Cuff detail */}
          <rect x="48" y="261" width="22" height="14" rx="7" fill="white" opacity="0.15"/>
          {/* Hand */}
          <circle cx="52" cy="272" r="15" fill="#d4a87a"/>
          <path d="M43,268 Q40,274 44,279 Q50,283 57,278 Q61,272 57,267 Q52,263 47,266 Z" fill="#c49060"/>
        </g>

        {/* ── RIGHT ARM ── */}
        <g className="vit-arm-r">
          <path d="M355,222 Q420,244 502,272" stroke={suit} strokeWidth="25" strokeLinecap="round" fill="none"/>
          <rect x="490" y="261" width="22" height="14" rx="7" fill="white" opacity="0.15"/>
          <circle cx="508" cy="272" r="15" fill="#d4a87a"/>
          <path d="M517,268 Q520,274 516,279 Q510,283 503,278 Q499,272 503,267 Q508,263 513,266 Z" fill="#c49060"/>
        </g>

        {/* ── BODY (breathes) ── */}
        <g className="vit-body">

          {/* LEFT LEG */}
          <path d="M258,340 L218,496" stroke={suit} strokeWidth="27" strokeLinecap="round"/>
          <path d="M208,490 Q195,497 193,503 Q200,510 222,507 Q232,500 225,492 Z" fill="#111827"/>

          {/* RIGHT LEG */}
          <path d="M302,340 L342,496" stroke={suit} strokeWidth="27" strokeLinecap="round"/>
          <path d="M352,490 Q365,497 367,503 Q360,510 338,507 Q328,500 335,492 Z" fill="#111827"/>

          {/* JACKET BODY */}
          <path d="M207,220 C196,226 184,242 182,268 L176,342 L384,342 L378,268 C376,242 364,226 353,220 Z"
            fill={suit} filter={`url(#shadow-${slug})`}/>

          {/* SHIRT */}
          <path d="M264,172 L280,228 L296,172" fill="white" opacity="0.94"/>

          {/* TIE */}
          <path d="M277,178 L280,226 L283,178 Q281,174 280,173 Q279,174 277,178 Z" fill={accent} opacity="0.9"/>
          {/* Tie knot */}
          <ellipse cx="280" cy="175" rx="5" ry="4" fill={suitLt} opacity="0.8"/>

          {/* LEFT LAPEL */}
          <path d="M264,172 L207,220 L222,262 L274,208 Z" fill={suitLt} opacity="0.28"/>
          {/* RIGHT LAPEL */}
          <path d="M296,172 L353,220 L338,262 L286,208 Z" fill={suitLt} opacity="0.28"/>

          {/* Jacket buttons */}
          <circle cx="280" cy="278" r="3.5" fill="rgba(255,255,255,0.25)"/>
          <circle cx="280" cy="298" r="3.5" fill="rgba(255,255,255,0.25)"/>
          <circle cx="280" cy="318" r="3.5" fill="rgba(255,255,255,0.25)"/>

          {/* Pocket square */}
          <path d="M210,248 L222,246 L222,256 L210,258 Z" fill="white" opacity="0.15"/>

          {/* NECK */}
          <path d="M266,165 L294,165 L293,180 L267,180 Z" fill="#d4a87a" rx="2"/>
          {/* Collar */}
          <path d="M266,174 L280,186 L294,174" fill="white" opacity="0.92"/>

          {/* HEAD */}
          <circle cx="280" cy="118" r="50" fill="#d4a87a"/>

          {/* PHOTO FACE */}
          {photo && (
            <image
              href={photo}
              x="230" y="68"
              width="100" height="100"
              clipPath={`url(#fc-${slug})`}
              preserveAspectRatio="xMidYTop slice"
            />
          )}

          {/* Subtle head outline */}
          <circle cx="280" cy="118" r="47" fill="none" stroke={suit} strokeWidth="1.5" opacity="0.2"/>

          {/* Hair arc */}
          <path d="M240,92 Q280,68 320,92 Q312,74 280,70 Q248,74 240,92 Z" fill="#2d1a10" opacity="0.55"/>

          {/* EARS */}
          <ellipse cx="232" cy="118" rx="7" ry="10" fill="#c49060"/>
          <ellipse cx="328" cy="118" rx="7" ry="10" fill="#c49060"/>
        </g>

        {/* ── FLOATING STATS ── */}

        {/* LEFT — District + Chamber */}
        <g opacity="0.9">
          <text x="24" y="252" fontFamily="system-ui,sans-serif" fontSize="8.5" fontWeight="700"
            letterSpacing="2.5" fill="rgba(26,58,92,0.4)">DISTRICT</text>
          <text x="24" y="274" fontFamily="Georgia,serif" fontSize="24" fontWeight="800" fill="#1a3a5c">
            {district}
          </text>
          <text x="24" y="290" fontFamily="system-ui,sans-serif" fontSize="11" fontWeight="600"
            fill="rgba(26,58,92,0.5)">{chamber}</text>
          <line x1="24" y1="300" x2="82" y2="300"
            stroke="rgba(26,58,92,0.12)" strokeWidth="1" strokeDasharray="2 4"/>
        </g>

        {/* RIGHT — Salary + Bills */}
        <g opacity="0.9">
          {salary && (
            <>
              <text x="536" y="252" fontFamily="system-ui,sans-serif" fontSize="8.5" fontWeight="700"
                letterSpacing="2.5" fill="rgba(26,58,92,0.4)" textAnchor="end">SALARY / YR</text>
              <text x="536" y="274" fontFamily="Georgia,serif" fontSize="20" fontWeight="800"
                fill="#1a3a5c" textAnchor="end">${salary.toLocaleString()}</text>
            </>
          )}
          {legiscanName && (
            <>
              <text x="536" y="308" fontFamily="system-ui,sans-serif" fontSize="8.5" fontWeight="700"
                letterSpacing="2.5" fill="rgba(26,58,92,0.4)" textAnchor="end">INTO LAW</text>
              <text x="536" y="332" fontFamily="Georgia,serif" fontSize="28" fontWeight="800"
                fill={isD ? "#1d4ed8" : "#b91c1c"} textAnchor="end">
                {loading ? "…" : lawCount}
              </text>
              {totalBills > 0 && (
                <text x="536" y="348" fontFamily="system-ui,sans-serif" fontSize="10"
                  fill="rgba(26,58,92,0.4)" textAnchor="end">of {totalBills} filed</text>
              )}
              <line x1="478" y1="332" x2="536" y2="332"
                stroke="rgba(26,58,92,0.12)" strokeWidth="1" strokeDasharray="2 4"/>
            </>
          )}
        </g>

        {/* PARTY BADGE — bottom */}
        <rect x="220" y="518" width="120" height="30" rx="15"
          fill={isD ? "#1d4ed8" : "#dc2626"} opacity="0.88"/>
        <text x="280" y="538" fontFamily="system-ui,sans-serif" fontSize="11" fontWeight="700"
          fill="white" textAnchor="middle" letterSpacing="1.5">{partyLabel}</text>

        {/* Legislature label top */}
        {legiscanName && (
          <text x="280" y="38" fontFamily="system-ui,sans-serif" fontSize="8.5" fontWeight="700"
            fill="rgba(26,58,92,0.3)" textAnchor="middle" letterSpacing="3">
            89TH TEXAS LEGISLATURE
          </text>
        )}
      </svg>
    </>
  );
}

/* ─── Main Profile Page ─────────────────────────────────────────────────── */
type Tab = "bills" | "money";

export default function PoliticianProfile() {
  const { slug } = useParams<{ slug: string }>();
  const pol = POLITICIANS.find(p => p.slug === slug);
  const [tab, setTab] = useState<Tab>("bills");
  const [bills, setBills] = useState<Bill[]>([]);
  const [billTotal, setBillTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<BillStatus | "all">("all");

  useEffect(() => {
    if (!pol?.legiscanName) return;
    setLoading(true);
    fetch(`/api/bills?action=search&rep=${encodeURIComponent(pol.name)}`)
      .then(r => r.json())
      .then(d => { setBills(d.bills ?? []); setBillTotal(d.total ?? 0); })
      .finally(() => setLoading(false));
  }, [pol]);

  if (!pol) return (
    <div className="max-w-2xl mx-auto px-6 py-24 text-center">
      <h1 className="text-2xl font-bold text-[var(--accent)] mb-4" style={{ fontFamily: "var(--font-playfair), serif" }}>
        Politician not found
      </h1>
      <Link href="/politicians" className="text-[var(--accent-light)] underline text-sm">← Back to all officials</Link>
    </div>
  );

  const lawBills    = bills.filter(b => getBillStatus(b.last_action) === "law");
  const passedBills = bills.filter(b => getBillStatus(b.last_action) === "passed");
  const cmteBills   = bills.filter(b => getBillStatus(b.last_action) === "committee");
  const pct = billTotal > 0 ? Math.round((lawBills.length / billTotal) * 100) : 0;
  const displayBills = statusFilter === "all" ? bills : bills.filter(b => getBillStatus(b.last_action) === statusFilter);

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

      {/* ── Name + Office ──────────────────────────────────────────────── */}
      <div className="text-center px-6 pt-6 pb-2 max-w-3xl mx-auto">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--muted)] mb-2">{pol.office}</p>
        <h1 className="text-4xl md:text-5xl font-bold text-[var(--accent)] leading-tight"
          style={{ fontFamily: "var(--font-playfair), serif" }}>
          {pol.name}
        </h1>
      </div>

      {/* ── Vitruvian Figure ───────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4">
        <VitruvianFigure
          slug={pol.slug}
          photo={pol.photo}
          party={pol.party}
          district={pol.district}
          chamber={pol.chamber}
          salary={pol.salary}
          legiscanName={pol.legiscanName}
          lawCount={lawBills.length}
          totalBills={billTotal}
          loading={loading}
        />
      </div>

      {/* ── Social / Links row ─────────────────────────────────────────── */}
      <div className="flex flex-wrap justify-center gap-2 px-6 pb-8 -mt-4">
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

      {/* ── Tabs + Content ─────────────────────────────────────────────── */}
      {(pol.legiscanName || pol.salary) && (
        <div className="border-t border-[var(--border)]">
          <div className="max-w-5xl mx-auto px-6">
            <div className="flex gap-1 border-b border-[var(--border)]">
              {pol.legiscanName && (
                <button onClick={() => setTab("bills")}
                  className={`px-5 py-3.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                    tab === "bills" ? "border-[var(--accent)] text-[var(--accent)]" : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}>
                  Bills
                </button>
              )}
              <button onClick={() => setTab("money")}
                className={`px-5 py-3.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                  tab === "money" ? "border-[var(--accent)] text-[var(--accent)]" : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}>
                Money
              </button>
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
                    {/* Summary cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                      {[
                        { label: "Total Filed",       val: billTotal,        color: "" },
                        { label: "Passed Committee",  val: cmteBills.length, color: "text-blue-600" },
                        { label: "Passed Chamber",    val: passedBills.length,color: "text-violet-600" },
                        { label: "Signed into Law",   val: lawBills.length,  color: "text-green-600" },
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

                    {/* Pass rate bar */}
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

                    {/* Filter pills */}
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

                    {/* Bill list */}
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

          </div>
        </div>
      )}
    </div>
  );
}
