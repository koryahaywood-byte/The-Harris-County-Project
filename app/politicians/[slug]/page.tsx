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
function VitruvianFigure({ slug, photo, party, legiscanName }: {
  slug: string; photo?: string; party: string; legiscanName?: string;
}) {
  const isD   = party === "D";
  const suit  = isD ? "#1a3a5c" : "#6b1a1a";
  const suitM = isD ? "#2a4f7a" : "#8b2020";
  const suitL = isD ? "#3b6fa0" : "#b03030";
  const accent= isD ? "#3b82f6" : "#ef4444";

  return (
    <>
      <style>{`
        @keyframes vit-breathe { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
        @keyframes vit-arm-l   { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(1.8deg)} }
        @keyframes vit-arm-r   { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-1.8deg)} }
        @keyframes vit-ticks   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes vit-glow    { 0%,100%{opacity:0.4} 50%{opacity:0.85} }
        .vit-body  { animation: vit-breathe 4s ease-in-out infinite; }
        .vit-arm-l { animation: vit-arm-l 5.5s ease-in-out infinite; transform-origin: 210px 225px; }
        .vit-arm-r { animation: vit-arm-r 5.5s ease-in-out infinite 0.9s; transform-origin: 350px 225px; }
        .vit-ticks { animation: vit-ticks 110s linear infinite; transform-origin: 280px 290px; }
        .vit-glow  { animation: vit-glow 4s ease-in-out infinite; }
      `}</style>

      <svg viewBox="0 0 560 570" className="w-full select-none" aria-hidden="true">
        <defs>
          {/* Face clip — large for prominence */}
          <clipPath id={`fc-${slug}`}>
            <circle cx="280" cy="115" r="62"/>
          </clipPath>

          {/* Suit jacket 3D gradient — light left shoulder, dark right */}
          <linearGradient id={`jkt-${slug}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={suitL} stopOpacity="1"/>
            <stop offset="35%"  stopColor={suit}  stopOpacity="1"/>
            <stop offset="100%" stopColor="#0d1f30" stopOpacity="1"/>
          </linearGradient>

          {/* Arm gradient — cylindrical top-lit */}
          <linearGradient id={`arm-${slug}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor={suitM} stopOpacity="1"/>
            <stop offset="50%"  stopColor={suit}  stopOpacity="1"/>
            <stop offset="100%" stopColor="#0d1f30" stopOpacity="1"/>
          </linearGradient>

          {/* Leg gradient */}
          <linearGradient id={`leg-${slug}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={suitM} stopOpacity="1"/>
            <stop offset="60%"  stopColor={suit}  stopOpacity="1"/>
            <stop offset="100%" stopColor="#0d1f30" stopOpacity="1"/>
          </linearGradient>

          {/* Face sphere shading overlay */}
          <radialGradient id={`face-sh-${slug}`} cx="38%" cy="35%" r="60%">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.18)"/>
            <stop offset="70%"  stopColor="rgba(0,0,0,0)"/>
            <stop offset="100%" stopColor="rgba(0,0,0,0.22)"/>
          </radialGradient>

          {/* Background glow */}
          <radialGradient id={`gl-${slug}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor={accent} stopOpacity="0.08"/>
            <stop offset="100%" stopColor={accent} stopOpacity="0"/>
          </radialGradient>

          {/* Drop shadow filter */}
          <filter id={`fshadow-${slug}`} x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor={suit} floodOpacity="0.3"/>
          </filter>

          {/* Soft body shadow on ground */}
          <filter id={`ground-${slug}`}>
            <feGaussianBlur stdDeviation="6"/>
          </filter>
        </defs>

        {/* Ground shadow ellipse */}
        <ellipse cx="280" cy="528" rx="85" ry="12" fill={suit} opacity="0.12" filter={`url(#ground-${slug})`}/>

        {/* Glow */}
        <circle cx="280" cy="290" r="225" fill={`url(#gl-${slug})`} className="vit-glow"/>

        {/* Outer square */}
        <rect x="50" y="62" width="460" height="460" fill="none"
          stroke="rgba(26,58,92,0.06)" strokeWidth="1" strokeDasharray="5 10"/>

        {/* Outer circle */}
        <circle cx="280" cy="290" r="228" fill="none"
          stroke="rgba(26,58,92,0.08)" strokeWidth="0.8" strokeDasharray="2 5"/>

        {/* Rotating ticks */}
        <g className="vit-ticks">
          {Array.from({ length: 72 }, (_, i) => {
            const a = (i * 5 - 90) * Math.PI / 180;
            const big = i % 9 === 0, mid = i % 3 === 0;
            const r1 = 228, r2 = big ? 212 : mid ? 220 : 224;
            return (
              <line key={i}
                x1={280 + r1 * Math.cos(a)} y1={290 + r1 * Math.sin(a)}
                x2={280 + r2 * Math.cos(a)} y2={290 + r2 * Math.sin(a)}
                stroke={`rgba(26,58,92,${big ? 0.3 : mid ? 0.14 : 0.07})`}
                strokeWidth={big ? 1.5 : 0.8}
              />
            );
          })}
        </g>

        {/* Inner guide ring */}
        <circle cx="280" cy="290" r="190" fill="none"
          stroke="rgba(26,58,92,0.04)" strokeWidth="0.5"/>

        {/* Crosshairs */}
        <line x1="50"  y1="290" x2="510" y2="290" stroke="rgba(26,58,92,0.04)" strokeWidth="0.5"/>
        <line x1="280" y1="62"  x2="280" y2="522" stroke="rgba(26,58,92,0.04)" strokeWidth="0.5"/>

        {/* ── LEFT ARM ── (animates from shoulder) */}
        <g className="vit-arm-l">
          {/* Upper sleeve */}
          <path d="M210,228 Q168,248 128,262" stroke={`url(#arm-${slug})`} strokeWidth="28" strokeLinecap="round" fill="none"/>
          {/* Forearm */}
          <path d="M128,262 Q96,272 68,278" stroke={suit} strokeWidth="24" strokeLinecap="round" fill="none"/>
          {/* Cuff */}
          <rect x="55" y="270" width="26" height="13" rx="6" fill="white" opacity="0.85"/>
          {/* Hand — palm + fingers */}
          <ellipse cx="55" cy="283" rx="13" ry="10" fill="#d4a87a"/>
          <rect x="44" y="278" width="7" height="12" rx="3.5" fill="#c49060" transform="rotate(-10 48 284)"/>
          <rect x="51" y="276" width="7" height="14" rx="3.5" fill="#c9956a" transform="rotate(-3 55 283)"/>
          <rect x="59" y="277" width="7" height="13" rx="3.5" fill="#c49060" transform="rotate(4 63 283)"/>
          <rect x="66" y="280" width="6" height="11" rx="3" fill="#bf8f60" transform="rotate(12 69 286)"/>
          {/* Thumb */}
          <rect x="41" y="284" width="6" height="10" rx="3" fill="#c49060" transform="rotate(-30 44 289)"/>
        </g>

        {/* ── RIGHT ARM ── */}
        <g className="vit-arm-r">
          <path d="M350,228 Q392,248 432,262" stroke={`url(#arm-${slug})`} strokeWidth="28" strokeLinecap="round" fill="none"/>
          <path d="M432,262 Q464,272 492,278" stroke={suit} strokeWidth="24" strokeLinecap="round" fill="none"/>
          <rect x="479" y="270" width="26" height="13" rx="6" fill="white" opacity="0.85"/>
          <ellipse cx="505" cy="283" rx="13" ry="10" fill="#d4a87a"/>
          <rect x="499" y="278" width="7" height="12" rx="3.5" fill="#bf8f60" transform="rotate(10 502 284)"/>
          <rect x="502" y="276" width="7" height="14" rx="3.5" fill="#c9956a" transform="rotate(3 505 283)"/>
          <rect x="494" y="277" width="7" height="13" rx="3.5" fill="#c49060" transform="rotate(-4 497 283)"/>
          <rect x="487" y="280" width="6" height="11" rx="3" fill="#c49060" transform="rotate(-12 490 286)"/>
          <rect x="513" y="284" width="6" height="10" rx="3" fill="#c49060" transform="rotate(30 516 289)"/>
        </g>

        {/* ── BODY (breathes) ── */}
        <g className="vit-body" filter={`url(#fshadow-${slug})`}>

          {/* LEFT LEG — with gradient shading */}
          <path d="M256,340 L214,500" stroke={`url(#leg-${slug})`} strokeWidth="29" strokeLinecap="round"/>
          {/* Left shoe */}
          <ellipse cx="209" cy="506" rx="22" ry="11" fill="#111827"/>
          <ellipse cx="205" cy="504" rx="10" ry="5" fill="#1f2937" opacity="0.6"/>

          {/* RIGHT LEG */}
          <path d="M304,340 L346,500" stroke={`url(#leg-${slug})`} strokeWidth="29" strokeLinecap="round"/>
          <ellipse cx="351" cy="506" rx="22" ry="11" fill="#111827"/>
          <ellipse cx="355" cy="504" rx="10" ry="5" fill="#1f2937" opacity="0.6"/>

          {/* JACKET BODY — 3D gradient */}
          <path d="M208,228 C196,234 182,252 180,278 L174,342 L386,342 L380,278 C378,252 364,234 352,228 Z"
            fill={`url(#jkt-${slug})`}/>

          {/* Left shoulder highlight */}
          <ellipse cx="210" cy="235" rx="22" ry="12" fill={suitL} opacity="0.4" transform="rotate(-15 210 235)"/>
          {/* Right shoulder shadow */}
          <ellipse cx="350" cy="235" rx="22" ry="12" fill="#0a1520" opacity="0.3" transform="rotate(15 350 235)"/>

          {/* Center chest light */}
          <ellipse cx="280" cy="265" rx="30" ry="45" fill={suitM} opacity="0.15"/>

          {/* SHIRT */}
          <path d="M263,175 L280,235 L297,175" fill="white" opacity="0.96"/>
          {/* Shirt shading */}
          <path d="M263,175 L272,235 L280,235 L280,175 Z" fill="rgba(0,0,0,0.06)"/>

          {/* TIE */}
          <path d="M276,181 L280,232 L284,181 Q282,176 280,175 Q278,176 276,181 Z" fill={accent} opacity="0.92"/>
          <path d="M278,181 L280,232 L280,175 Z" fill="rgba(255,255,255,0.15)"/>
          <ellipse cx="280" cy="178" rx="6" ry="5" fill={suitM}/>

          {/* LEFT LAPEL */}
          <path d="M263,175 L208,228 L224,268 L274,212 Z" fill={suitL} opacity="0.22"/>
          <path d="M263,175 L208,228 L215,238 Z" fill={suitL} opacity="0.35"/>
          {/* RIGHT LAPEL */}
          <path d="M297,175 L352,228 L336,268 L286,212 Z" fill="rgba(0,0,0,0.2)"/>
          <path d="M297,175 L352,228 L345,238 Z" fill="rgba(0,0,0,0.3)"/>

          {/* Buttons */}
          <circle cx="280" cy="282" r="4" fill="rgba(255,255,255,0.22)"/>
          <circle cx="280" cy="302" r="4" fill="rgba(255,255,255,0.22)"/>
          <circle cx="280" cy="322" r="4" fill="rgba(255,255,255,0.22)"/>

          {/* Pocket square */}
          <path d="M208,252 L222,249 L223,260 L208,263 Z" fill="white" opacity="0.18"/>

          {/* NECK */}
          <path d="M265,167 L295,167 L294,183 L266,183 Z" fill="#d4a87a"/>
          {/* Neck shadow */}
          <path d="M280,167 L295,167 L294,183 L280,183 Z" fill="rgba(0,0,0,0.1)"/>
          {/* COLLAR */}
          <path d="M266,180 L280,193 L294,180" fill="white" opacity="0.94"/>
          <path d="M266,180 L274,189 L280,193 Z" fill="rgba(0,0,0,0.07)"/>

          {/* EAR LEFT */}
          <ellipse cx="218" cy="115" rx="8" ry="12" fill="#c8946a"/>
          <ellipse cx="219" cy="115" rx="4" ry="7" fill="#bf8a5e" opacity="0.6"/>
          {/* EAR RIGHT */}
          <ellipse cx="342" cy="115" rx="8" ry="12" fill="#c8946a"/>
          <ellipse cx="341" cy="115" rx="4" ry="7" fill="#bf8a5e" opacity="0.6"/>

          {/* HEAD base */}
          <circle cx="280" cy="115" r="63" fill="#d4a87a"/>

          {/* PHOTO — large, prominent */}
          {photo && (
            <image
              href={photo}
              x="215" y="50"
              width="130" height="130"
              clipPath={`url(#fc-${slug})`}
              preserveAspectRatio="xMidYTop slice"
            />
          )}

          {/* Face sphere shading overlay — adds 3D roundness */}
          <circle cx="280" cy="115" r="62" fill={`url(#face-sh-${slug})`}/>

          {/* HAIR */}
          <path d="M236,88 Q256,68 280,64 Q304,68 324,88 Q318,72 280,68 Q242,72 236,88 Z"
            fill="#2a1a0e" opacity="0.7"/>
          {/* Hair side left */}
          <path d="M218,100 Q222,80 236,88 Q228,84 222,96 Z" fill="#2a1a0e" opacity="0.5"/>
          {/* Hair side right */}
          <path d="M342,100 Q338,80 324,88 Q332,84 338,96 Z" fill="#2a1a0e" opacity="0.5"/>

          {/* Subtle head outline for depth */}
          <circle cx="280" cy="115" r="62" fill="none" stroke={suit} strokeWidth="1" opacity="0.15"/>
        </g>

        {/* Party badge bottom */}
        <rect x="220" y="526" width="120" height="28" rx="14"
          fill={isD ? "#1d4ed8" : "#dc2626"} opacity="0.9"/>
        <text x="280" y="545" fontFamily="system-ui,sans-serif" fontSize="10.5" fontWeight="700"
          fill="white" textAnchor="middle" letterSpacing="1.5">
          {party === "D" ? "DEMOCRAT" : party === "R" ? "REPUBLICAN" : party}
        </text>

        {/* Legislature label */}
        {legiscanName && (
          <text x="280" y="36" fontFamily="system-ui,sans-serif" fontSize="8" fontWeight="700"
            fill="rgba(26,58,92,0.28)" textAnchor="middle" letterSpacing="3">
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

      {/* ── Vitruvian Figure + flanking stats ─────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-[200px_1fr_200px] gap-4 items-center">

        {/* LEFT STATS */}
        <div className="flex md:flex-col gap-3 justify-center">
          <div className="rounded-[1.35rem] bg-white/70 ring-1 ring-black/8 p-[4px] flex-1 md:flex-none">
            <div className="rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] px-4 py-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] mb-1">District</p>
              <p className="text-2xl font-bold text-[var(--accent)]" style={{ fontFamily: "var(--font-playfair), serif" }}>
                {pol.district}
              </p>
              <p className="text-xs text-[var(--muted)] mt-0.5">{pol.chamber}</p>
            </div>
          </div>
          <div className="rounded-[1.35rem] bg-white/70 ring-1 ring-black/8 p-[4px] flex-1 md:flex-none">
            <div className="rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] px-4 py-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] mb-1">Party</p>
              <p className={`text-lg font-bold ${pol.party === "D" ? "text-blue-700" : pol.party === "R" ? "text-red-700" : "text-gray-600"}`}
                style={{ fontFamily: "var(--font-playfair), serif" }}>
                {pol.party === "D" ? "Democrat" : pol.party === "R" ? "Republican" : pol.party}
              </p>
            </div>
          </div>
        </div>

        {/* CENTER FIGURE */}
        <div>
          <VitruvianFigure
            slug={pol.slug}
            photo={pol.photo}
            party={pol.party}
            legiscanName={pol.legiscanName}
          />
        </div>

        {/* RIGHT STATS */}
        <div className="flex md:flex-col gap-3 justify-center">
          {pol.salary && (
            <div className="rounded-[1.35rem] bg-white/70 ring-1 ring-black/8 p-[4px] flex-1 md:flex-none">
              <div className="rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] px-4 py-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] mb-1">Salary / yr</p>
                <p className="text-xl font-bold text-[var(--accent)]" style={{ fontFamily: "var(--font-playfair), serif" }}>
                  ${pol.salary.toLocaleString()}
                </p>
              </div>
            </div>
          )}
          {pol.legiscanName && (
            <div className="rounded-[1.35rem] bg-white/70 ring-1 ring-black/8 p-[4px] flex-1 md:flex-none">
              <div className="rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] px-4 py-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] mb-1">Into Law</p>
                <p className={`text-2xl font-bold ${pol.party === "D" ? "text-blue-700" : "text-red-700"}`}
                  style={{ fontFamily: "var(--font-playfair), serif" }}>
                  {loading ? "…" : lawBills.length}
                </p>
                {billTotal > 0 && (
                  <p className="text-[10px] text-[var(--muted)] mt-0.5">of {billTotal} filed</p>
                )}
              </div>
            </div>
          )}
        </div>
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
