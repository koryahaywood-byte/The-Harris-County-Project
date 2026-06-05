"use client";
import { useParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { POLITICIANS } from "@/lib/politicians";
import { getFinanceByName, fmt } from "@/lib/campaign-finance";
import { computeBadges, TIER_STYLES, type Badge } from "@/lib/badges";
import { computeStats, STAT_LABELS } from "@/lib/politician-stats";
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

/* ─── Vitruvian Figure ─────────────────────────────────────────────────────
   Full body SVG. Photo is rendered as an HTML overlay (not inside SVG)
   so the figure stays symbolic and the portrait stays photographic.
────────────────────────────────────────────────────────────────────────── */
function VitruvianFigure({ slug, photo, party, name, legiscanName }: {
  slug: string; photo?: string; party: string; name: string; legiscanName?: string;
}) {
  const isD   = party === "D";
  const suit  = isD ? "#1a3a5c" : "#6b1a1a";
  const suitM = isD ? "#2a4f7a" : "#8b2020";
  const suitL = isD ? "#3b6fa0" : "#b03030";
  const accent= isD ? "#3b82f6" : "#ef4444";
  const ringC = isD ? "#60a5fa" : "#f87171";

  return (
    <div className="relative select-none" style={{ width: "100%", aspectRatio: "560/600" }}>
      <style>{`
        @keyframes vit-breathe { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
        @keyframes vit-arm-l   { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(1.8deg)} }
        @keyframes vit-arm-r   { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-1.8deg)} }
        @keyframes vit-ticks   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes vit-glow    { 0%,100%{opacity:0.4} 50%{opacity:0.85} }
        @keyframes vit-photo-float { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-4px) scale(1.01)} }
        .vit-body  { animation: vit-breathe 4s ease-in-out infinite; }
        .vit-arm-l { animation: vit-arm-l 5.5s ease-in-out infinite; transform-origin: 210px 225px; }
        .vit-arm-r { animation: vit-arm-r 5.5s ease-in-out infinite 0.9s; transform-origin: 350px 225px; }
        .vit-ticks { animation: vit-ticks 110s linear infinite; transform-origin: 280px 290px; }
        .vit-glow  { animation: vit-glow 4s ease-in-out infinite; }
        .vit-photo { animation: vit-photo-float 5s ease-in-out infinite; transform-origin: center; }
      `}</style>

      {/* ── SVG Body ── */}
      <svg viewBox="0 0 560 600" className="w-full h-full" aria-hidden="true">
        <defs>
          <linearGradient id={`jkt-${slug}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={suitL}/>
            <stop offset="35%"  stopColor={suit}/>
            <stop offset="100%" stopColor="#0d1f30"/>
          </linearGradient>
          <linearGradient id={`arm-${slug}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor={suitM}/>
            <stop offset="50%"  stopColor={suit}/>
            <stop offset="100%" stopColor="#0d1f30"/>
          </linearGradient>
          <linearGradient id={`leg-${slug}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={suitM}/>
            <stop offset="60%"  stopColor={suit}/>
            <stop offset="100%" stopColor="#0d1f30"/>
          </linearGradient>
          <radialGradient id={`gl-${slug}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor={accent} stopOpacity="0.08"/>
            <stop offset="100%" stopColor={accent} stopOpacity="0"/>
          </radialGradient>
          <filter id={`fshadow-${slug}`} x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor={suit} floodOpacity="0.3"/>
          </filter>
          <filter id={`ground-${slug}`}>
            <feGaussianBlur stdDeviation="6"/>
          </filter>
        </defs>

        {/* Ground shadow */}
        <ellipse cx="280" cy="558" rx="85" ry="12" fill={suit} opacity="0.12" filter={`url(#ground-${slug})`}/>

        {/* Background glow */}
        <circle cx="280" cy="310" r="225" fill={`url(#gl-${slug})`} className="vit-glow"/>

        {/* Outer square */}
        <rect x="50" y="85" width="460" height="460" fill="none"
          stroke="rgba(26,58,92,0.06)" strokeWidth="1" strokeDasharray="5 10"/>
        {/* Outer circle */}
        <circle cx="280" cy="312" r="228" fill="none"
          stroke="rgba(26,58,92,0.08)" strokeWidth="0.8" strokeDasharray="2 5"/>
        {/* Rotating ticks */}
        <g className="vit-ticks">
          {Array.from({ length: 72 }, (_, i) => {
            const a = (i * 5 - 90) * Math.PI / 180;
            const big = i % 9 === 0, mid = i % 3 === 0;
            const r1 = 228, r2 = big ? 212 : mid ? 220 : 224;
            return (
              <line key={i}
                x1={280 + r1 * Math.cos(a)} y1={312 + r1 * Math.sin(a)}
                x2={280 + r2 * Math.cos(a)} y2={312 + r2 * Math.sin(a)}
                stroke={`rgba(26,58,92,${big ? 0.3 : mid ? 0.14 : 0.07})`}
                strokeWidth={big ? 1.5 : 0.8}
              />
            );
          })}
        </g>
        {/* Inner guide */}
        <circle cx="280" cy="312" r="190" fill="none" stroke="rgba(26,58,92,0.04)" strokeWidth="0.5"/>
        {/* Crosshairs */}
        <line x1="50" y1="312" x2="510" y2="312" stroke="rgba(26,58,92,0.04)" strokeWidth="0.5"/>
        <line x1="280" y1="85"  x2="280" y2="545" stroke="rgba(26,58,92,0.04)" strokeWidth="0.5"/>

        {/* ── LEFT ARM ── */}
        <g className="vit-arm-l">
          <path d="M210,248 Q168,268 128,282" stroke={`url(#arm-${slug})`} strokeWidth="28" strokeLinecap="round" fill="none"/>
          <path d="M128,282 Q96,292 68,298" stroke={suit} strokeWidth="24" strokeLinecap="round" fill="none"/>
          <rect x="55" y="290" width="26" height="13" rx="6" fill="white" opacity="0.85"/>
          <ellipse cx="55" cy="303" rx="13" ry="10" fill="#d4a87a"/>
          <rect x="44" y="298" width="7" height="12" rx="3.5" fill="#c49060" transform="rotate(-10 48 304)"/>
          <rect x="51" y="296" width="7" height="14" rx="3.5" fill="#c9956a" transform="rotate(-3 55 303)"/>
          <rect x="59" y="297" width="7" height="13" rx="3.5" fill="#c49060" transform="rotate(4 63 303)"/>
          <rect x="66" y="300" width="6" height="11" rx="3" fill="#bf8f60" transform="rotate(12 69 306)"/>
          <rect x="41" y="304" width="6" height="10" rx="3" fill="#c49060" transform="rotate(-30 44 309)"/>
        </g>

        {/* ── RIGHT ARM ── */}
        <g className="vit-arm-r">
          <path d="M350,248 Q392,268 432,282" stroke={`url(#arm-${slug})`} strokeWidth="28" strokeLinecap="round" fill="none"/>
          <path d="M432,282 Q464,292 492,298" stroke={suit} strokeWidth="24" strokeLinecap="round" fill="none"/>
          <rect x="479" y="290" width="26" height="13" rx="6" fill="white" opacity="0.85"/>
          <ellipse cx="505" cy="303" rx="13" ry="10" fill="#d4a87a"/>
          <rect x="499" y="298" width="7" height="12" rx="3.5" fill="#bf8f60" transform="rotate(10 502 304)"/>
          <rect x="502" y="296" width="7" height="14" rx="3.5" fill="#c9956a" transform="rotate(3 505 303)"/>
          <rect x="494" y="297" width="7" height="13" rx="3.5" fill="#c49060" transform="rotate(-4 497 303)"/>
          <rect x="487" y="300" width="6" height="11" rx="3" fill="#c49060" transform="rotate(-12 490 306)"/>
          <rect x="513" y="304" width="6" height="10" rx="3" fill="#c49060" transform="rotate(30 516 309)"/>
        </g>

        {/* ── BODY (breathes) ── */}
        <g className="vit-body" filter={`url(#fshadow-${slug})`}>
          {/* LEGS */}
          <path d="M256,362 L214,522" stroke={`url(#leg-${slug})`} strokeWidth="29" strokeLinecap="round"/>
          <ellipse cx="209" cy="528" rx="22" ry="11" fill="#111827"/>
          <ellipse cx="205" cy="526" rx="10" ry="5" fill="#1f2937" opacity="0.6"/>
          <path d="M304,362 L346,522" stroke={`url(#leg-${slug})`} strokeWidth="29" strokeLinecap="round"/>
          <ellipse cx="351" cy="528" rx="22" ry="11" fill="#111827"/>
          <ellipse cx="355" cy="526" rx="10" ry="5" fill="#1f2937" opacity="0.6"/>

          {/* JACKET */}
          <path d="M208,248 C196,254 182,272 180,298 L174,362 L386,362 L380,298 C378,272 364,254 352,248 Z"
            fill={`url(#jkt-${slug})`}/>
          <ellipse cx="210" cy="255" rx="22" ry="12" fill={suitL} opacity="0.4" transform="rotate(-15 210 255)"/>
          <ellipse cx="350" cy="255" rx="22" ry="12" fill="#0a1520" opacity="0.3" transform="rotate(15 350 255)"/>
          <ellipse cx="280" cy="285" rx="30" ry="45" fill={suitM} opacity="0.15"/>

          {/* SHIRT + TIE */}
          <path d="M263,195 L280,255 L297,195" fill="white" opacity="0.96"/>
          <path d="M263,195 L272,255 L280,255 L280,195 Z" fill="rgba(0,0,0,0.06)"/>
          <path d="M276,201 L280,252 L284,201 Q282,196 280,195 Q278,196 276,201 Z" fill={accent} opacity="0.92"/>
          <path d="M278,201 L280,252 L280,195 Z" fill="rgba(255,255,255,0.15)"/>
          <ellipse cx="280" cy="198" rx="6" ry="5" fill={suitM}/>

          {/* LAPELS */}
          <path d="M263,195 L208,248 L224,288 L274,232 Z" fill={suitL} opacity="0.22"/>
          <path d="M263,195 L208,248 L215,258 Z" fill={suitL} opacity="0.35"/>
          <path d="M297,195 L352,248 L336,288 L286,232 Z" fill="rgba(0,0,0,0.2)"/>
          <path d="M297,195 L352,248 L345,258 Z" fill="rgba(0,0,0,0.3)"/>

          {/* Buttons */}
          <circle cx="280" cy="302" r="4" fill="rgba(255,255,255,0.22)"/>
          <circle cx="280" cy="322" r="4" fill="rgba(255,255,255,0.22)"/>
          <circle cx="280" cy="342" r="4" fill="rgba(255,255,255,0.22)"/>

          {/* Pocket square */}
          <path d="M208,272 L222,269 L223,280 L208,283 Z" fill="white" opacity="0.18"/>

          {/* NECK */}
          <path d="M265,187 L295,187 L294,203 L266,203 Z" fill="#d4a87a"/>
          <path d="M280,187 L295,187 L294,203 L280,203 Z" fill="rgba(0,0,0,0.1)"/>

          {/* COLLAR */}
          <path d="M266,200 L280,213 L294,200" fill="white" opacity="0.94"/>
          <path d="M266,200 L274,209 L280,213 Z" fill="rgba(0,0,0,0.07)"/>

          {/* EARS */}
          <ellipse cx="218" cy="135" rx="8" ry="12" fill="#c8946a"/>
          <ellipse cx="219" cy="135" rx="4" ry="7" fill="#bf8a5e" opacity="0.6"/>
          <ellipse cx="342" cy="135" rx="8" ry="12" fill="#c8946a"/>
          <ellipse cx="341" cy="135" rx="4" ry="7" fill="#bf8a5e" opacity="0.6"/>

          {/* HEAD — clean sphere, no photo inside SVG */}
          <circle cx="280" cy="135" r="63" fill="#d4a87a"/>
          {/* Sphere shading for depth */}
          <circle cx="280" cy="135" r="63">
            <animate attributeName="opacity" values="1" dur="0s"/>
          </circle>
          <radialGradient id={`face-sh-${slug}`} cx="38%" cy="35%" r="60%">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.22)"/>
            <stop offset="70%"  stopColor="rgba(0,0,0,0)"/>
            <stop offset="100%" stopColor="rgba(0,0,0,0.25)"/>
          </radialGradient>
          <circle cx="280" cy="135" r="63" fill={`url(#face-sh-${slug})`}/>

          {/* Minimal face features — elegant, not cartoonish */}
          <ellipse cx="262" cy="132" rx="4.5" ry="5.5" fill="rgba(60,35,20,0.55)"/>
          <ellipse cx="298" cy="132" rx="4.5" ry="5.5" fill="rgba(60,35,20,0.55)"/>
          <path d="M268,152 Q280,160 292,152" fill="none" stroke="rgba(60,35,20,0.35)" strokeWidth="2" strokeLinecap="round"/>

          {/* HAIR */}
          {/* Main crown */}
          <path d="M230,112 Q252,86 280,82 Q308,86 330,112 Q322,88 280,84 Q238,88 230,112 Z"
            fill="#2a1a0e" opacity="0.88"/>
          {/* Temple fill left */}
          <path d="M218,128 Q220,108 230,112 Q224,112 220,122 Z" fill="#2a1a0e" opacity="0.72"/>
          {/* Temple fill right */}
          <path d="M342,128 Q340,108 330,112 Q336,112 340,122 Z" fill="#2a1a0e" opacity="0.72"/>
          {/* Hairline softener */}
          <path d="M236,106 Q258,90 280,87 Q302,90 324,106" fill="none"
            stroke="#2a1a0e" strokeWidth="6" strokeLinecap="round" opacity="0.35"/>

          {/* Head outline */}
          <circle cx="280" cy="135" r="63" fill="none" stroke={suit} strokeWidth="1" opacity="0.15"/>
        </g>

        {/* Party badge */}
        <rect x="220" y="556" width="120" height="28" rx="14"
          fill={isD ? "#1d4ed8" : "#dc2626"} opacity="0.9"/>
        <text x="280" y="575" fontFamily="system-ui,sans-serif" fontSize="10.5" fontWeight="700"
          fill="white" textAnchor="middle" letterSpacing="1.5">
          {party === "D" ? "DEMOCRAT" : party === "R" ? "REPUBLICAN" : party}
        </text>

        {/* Legislature label */}
        {legiscanName && (
          <text x="280" y="56" fontFamily="system-ui,sans-serif" fontSize="8" fontWeight="700"
            fill="rgba(26,58,92,0.28)" textAnchor="middle" letterSpacing="3">
            89TH TEXAS LEGISLATURE
          </text>
        )}
      </svg>

      {/* ── Photo overlay — floats above the SVG head, liquid glass frame ── */}
      {photo && (
        <div
          className="vit-photo absolute pointer-events-none"
          style={{
            /* head center: cx=280/560=50%, cy=135/600=22.5%, r=63/560=11.25% */
            left:   "calc(50% - 14%)",
            top:    "calc(22.5% - 14%)",
            width:  "28%",
            aspectRatio: "1",
          }}
        >
          {/* Liquid glass ring */}
          <div
            className="w-full h-full rounded-full overflow-hidden"
            style={{
              boxShadow: `0 0 0 3px ${ringC}, 0 0 0 6px rgba(255,255,255,0.55), 0 12px 32px rgba(26,58,92,0.28)`,
              backdropFilter: "blur(2px)",
            }}
          >
            <img
              src={photo}
              alt={name}
              className="w-full h-full object-cover object-center"
              style={{ display: "block" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Demographics Bar ──────────────────────────────────────────────────── */
function DemographicsBar({ pol }: { pol: import("@/lib/politicians").Politician }) {
  const d = pol.demographics;
  if (!d) return null;

  const segments = [
    { label: "Hispanic",   value: d.hispanic, color: "#f97316" },
    { label: "Black",      value: d.black,    color: "#8b5cf6" },
    { label: "White",      value: d.white,    color: "#60a5fa" },
    { label: "Asian",      value: d.asian,    color: "#34d399" },
    { label: "Other",      value: d.other,    color: "#9ca3af" },
  ].filter(s => s.value > 0);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="px-4 pt-3 pb-2">
        <p className="text-[9px] font-black uppercase tracking-[0.25em] mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
          District Demographics
        </p>
        {/* Stacked bar */}
        <div className="flex rounded-full overflow-hidden h-3 mb-3 gap-px">
          {segments.map(s => (
            <div key={s.label} style={{ width: `${s.value}%`, background: s.color, transition: "width 0.7s cubic-bezier(0.22,1,0.36,1)" }} />
          ))}
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {segments.map(s => (
            <span key={s.label} className="flex items-center gap-1 text-[9px] font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
              {s.label} {s.value}%
            </span>
          ))}
        </div>
        {d.source && (
          <p className="text-[8px] mt-2" style={{ color: "rgba(255,255,255,0.2)" }}>
            Source: {d.source} · VAN precinct data coming soon
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Social Feed (Twitter/X timeline) ──────────────────────────────────── */
function SocialFeed({ handle }: { handle: string }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid rgba(26,58,92,0.1)" }}>
      <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "rgba(26,58,92,0.08)" }}>
        <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "#1a3a5c" }}>
          Social Feed
        </p>
        <a
          href={`https://twitter.com/${handle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-semibold"
          style={{ color: "#2563a8" }}
        >
          @{handle} →
        </a>
      </div>
      <div style={{ maxHeight: 420, overflow: "auto" }}>
        {/* Twitter/X timeline embed — no API key needed */}
        <a
          className="twitter-timeline"
          href={`https://twitter.com/${handle}`}
          data-height="400"
          data-chrome="noheader nofooter noborders transparent"
          data-theme="light"
          data-tweet-limit="5"
        >
          Loading tweets…
        </a>
        <TwitterScript />
      </div>
    </div>
  );
}

function TwitterScript() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).twttr) { (window as any).twttr.widgets.load(); return; }
    const s = document.createElement("script");
    s.src = "https://platform.twitter.com/widgets.js";
    s.async = true;
    document.head.appendChild(s);
  }, []);
  return null;
}

/* ─── Attribute Bar ─────────────────────────────────────────────────────── */
function AttributeBar({ label, value, color, isLoading }: { label: string; value: number; color: string; isLoading?: boolean }) {
  const barRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setWidth(isLoading ? 0 : value), 80);
    return () => clearTimeout(t);
  }, [value, isLoading]);

  const ratingColor = value >= 80 ? "#4ade80" : value >= 60 ? "#facc15" : value >= 40 ? "#fb923c" : "#f87171";

  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-bold uppercase tracking-[0.15em] w-20 flex-shrink-0 text-right"
        style={{ color: "rgba(255,255,255,0.45)" }}>
        {label}
      </span>
      <div ref={barRef} className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${width}%`,
            background: `linear-gradient(90deg, ${color}aa, ${color})`,
            transition: "width 0.9s cubic-bezier(0.22, 1, 0.36, 1)",
            boxShadow: `0 0 8px ${color}50`,
          }}
        />
      </div>
      <span
        className="text-sm font-black w-7 text-right flex-shrink-0"
        style={{ color: ratingColor, fontFamily: "var(--font-outfit), sans-serif" }}
      >
        {isLoading ? "…" : value}
      </span>
    </div>
  );
}

/* ─── Badge Chip ────────────────────────────────────────────────────────── */
function BadgeChip({ badge }: { badge: Badge }) {
  const [hovered, setHovered] = useState(false);
  const s = TIER_STYLES[badge.tier];

  return (
    <div
      className="relative group cursor-default"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Hexagon shape */}
      <div
        className="flex flex-col items-center justify-center transition-transform duration-200"
        style={{
          width: 54,
          height: 62,
          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
          background: `linear-gradient(160deg, ${s.border}55, ${s.bg})`,
          border: "none",
          transform: hovered ? "scale(1.12) translateY(-2px)" : "scale(1)",
          boxShadow: hovered ? `0 0 18px ${s.glow}` : "none",
        }}
      >
        <span className="text-base font-black" style={{ color: s.text }}>{badge.icon}</span>
      </div>
      {/* Badge name */}
      <p className="text-center text-[8px] font-bold uppercase tracking-[0.08em] mt-1 leading-tight max-w-[60px]"
        style={{ color: s.text, opacity: 0.85 }}>
        {badge.name}
      </p>
      {/* Tooltip */}
      {hovered && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 rounded-lg px-3 py-2 z-20 pointer-events-none"
          style={{ background: "#0d1b33", border: `1px solid ${s.border}60`, boxShadow: `0 8px 24px rgba(0,0,0,0.5)` }}
        >
          <p className="text-[9px] font-black uppercase tracking-[0.15em] mb-0.5" style={{ color: s.text }}>
            {s.label} · {badge.name}
          </p>
          <p className="text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
            {badge.description}
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Main Profile Page ─────────────────────────────────────────────────── */

export default function PoliticianProfile() {
  const { slug } = useParams<{ slug: string }>();
  const pol = POLITICIANS.find(p => p.slug === slug);
  const [tab, setTab]               = useState<Tab>("bills");
  const [bills, setBills]           = useState<Bill[]>([]);
  const [billTotal, setBillTotal]   = useState(0);
  const [loading, setLoading]       = useState(false);
  const [statusFilter, setStatusFilter] = useState<BillStatus | "all">("all");
  const [news, setNews]             = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [liveFinance, setLiveFinance] = useState<any | null>(null);
  const [financeLoading, setFinanceLoading] = useState(false);
  const [financeError, setFinanceError] = useState<string | null>(null);

  // Fire finance fetch on mount (needed for OVR + badges in hero)
  useEffect(() => {
    if (!pol) return;
    if (liveFinance) return;
    setFinanceLoading(true);
    setFinanceError(null);
    fetch(`/api/finance/by-name?name=${encodeURIComponent(pol.name)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setLiveFinance(d);
      })
      .catch((e) => setFinanceError(e.message))
      .finally(() => setFinanceLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pol]);

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

  const isD          = pol.party === "D";
  const accentColor  = isD ? "#3b82f6" : "#ef4444";
  const accentDark   = isD ? "#1d4ed8" : "#b91c1c";
  const lawBills     = bills.filter(b => getBillStatus(b.last_action) === "law");
  const passedBills  = bills.filter(b => getBillStatus(b.last_action) === "passed");
  const cmteBills    = bills.filter(b => getBillStatus(b.last_action) === "committee");
  const pct          = billTotal > 0 ? Math.round((lawBills.length / billTotal) * 100) : 0;
  const displayBills = statusFilter === "all" ? bills : bills.filter(b => getBillStatus(b.last_action) === statusFilter);

  const staticFinance = getFinanceByName(pol.name);
  const financeForStats = liveFinance ?? staticFinance;
  const stats = computeStats(pol, financeForStats, billTotal, lawBills.length);
  const badges: Badge[] = computeBadges({ pol, finance: financeForStats, billCount: billTotal, lawCount: lawBills.length });

  type Tab = "bills" | "money" | "news" | "social";
  const tabs: { id: Tab; label: string }[] = [
    ...(pol.legiscanName ? [{ id: "bills" as Tab, label: "Bills" }] : []),
    { id: "money", label: "Money" },
    { id: "news",  label: "News" },
    ...(pol.twitter ? [{ id: "social" as Tab, label: "Social" }] : []),
  ];

  const statOrder = ["warChest", "lawmaker", "influence", "access", "tenure"] as const;

  return (
    <div className="bg-[var(--background)]">

      {/* ── NBA 2K Hero ────────────────────────────────────────────────── */}
      <div
        style={{
          background: `linear-gradient(135deg, #0a1628 0%, #0f1f3a 50%, #0d1b33 100%)`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Radial glow behind figure */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 0, top: 0, width: "50%", height: "100%",
            background: `radial-gradient(ellipse 70% 80% at 30% 60%, ${accentColor}18 0%, transparent 70%)`,
          }}
        />
        {/* Top breadcrumb bar */}
        <div className="relative px-5 pt-5 pb-0 max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/politicians"
            className="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
            style={{ color: "rgba(255,255,255,0.45)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            All Officials
          </Link>
          {/* Party chip */}
          <span
            className="text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full"
            style={{ background: `${accentColor}25`, color: accentColor, border: `1px solid ${accentColor}50` }}
          >
            {pol.party === "D" ? "Democrat" : pol.party === "R" ? "Republican" : pol.party}
          </span>
        </div>

        {/* Main hero grid: figure left, stats right */}
        <div className="relative max-w-6xl mx-auto px-4 pt-2 pb-6 grid grid-cols-1 md:grid-cols-[340px_1fr] gap-0 md:gap-6 items-end">

          {/* Figure column */}
          <div className="relative">
            <VitruvianFigure
              slug={pol.slug}
              photo={pol.photo}
              party={pol.party}
              name={pol.name}
              legiscanName={pol.legiscanName}
            />
          </div>

          {/* Stats column */}
          <div className="pb-4 pt-2 md:pt-8 flex flex-col gap-5">

            {/* OVR + name block */}
            <div className="flex items-start gap-5">
              {/* OVR badge */}
              <div className="flex-shrink-0 text-center" style={{ minWidth: 72 }}>
                <p className="text-[9px] font-black uppercase tracking-[0.25em] mb-0.5" style={{ color: accentColor }}>OVR</p>
                <p
                  className="font-black leading-none"
                  style={{
                    fontSize: "clamp(52px, 8vw, 80px)",
                    color: "#fff",
                    fontFamily: "var(--font-outfit), sans-serif",
                    textShadow: `0 0 40px ${accentColor}60`,
                  }}
                >
                  {loading || financeLoading ? "…" : stats.ovr}
                </p>
              </div>
              {/* Name + office */}
              <div className="min-w-0 pt-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-1.5" style={{ color: accentColor }}>
                  {pol.district} · {pol.chamber}
                </p>
                <h1
                  className="font-bold leading-tight text-white"
                  style={{ fontSize: "clamp(22px, 4vw, 38px)", fontFamily: "var(--font-playfair), serif" }}
                >
                  {pol.name}
                </h1>
                <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>{pol.office}</p>
                {pol.salary && (
                  <p className="text-xs mt-1 font-semibold" style={{ color: "rgba(255,255,255,0.3)" }}>
                    ${pol.salary.toLocaleString()} / yr
                  </p>
                )}
              </div>
            </div>

            {/* Attribute bars */}
            <div className="space-y-2.5">
              {statOrder.map((key) => (
                <AttributeBar
                  key={key}
                  label={STAT_LABELS[key]}
                  value={stats[key]}
                  color={accentColor}
                  isLoading={(key === "warChest" || key === "lawmaker") && (loading || financeLoading)}
                />
              ))}
            </div>

            {/* Demographics */}
            {pol.demographics && <DemographicsBar pol={pol} />}

            {/* Social links */}
            <div className="flex flex-wrap gap-2 pt-1">
              {pol.website && (
                <a href={pol.website} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={{ background: accentColor, color: "#fff" }}>
                  Website
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
                  </svg>
                </a>
              )}
              {pol.twitter && (
                <a href={`https://twitter.com/${pol.twitter}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.15)" }}>
                  X
                </a>
              )}
              {pol.instagram && (
                <a href={`https://instagram.com/${pol.instagram}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.15)" }}>
                  Instagram
                </a>
              )}
              {pol.email && (
                <a href={`mailto:${pol.email}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.15)" }}>
                  Email
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Badges strip */}
        {badges.length > 0 && (
          <div
            className="relative border-t"
            style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.25)" }}
          >
            <div className="max-w-6xl mx-auto px-5 py-4">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>
                Badges
              </p>
              <div className="flex flex-wrap gap-3">
                {badges.map(badge => (
                  <BadgeChip key={badge.id} badge={badge} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Tabs + Content ─────────────────────────────────────────────── */}
      {(pol.legiscanName || pol.salary) && (
        <div className="border-t border-[var(--border)]">
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
                            style={{ width: `${Math.min(pct, 100)}%` }}/>
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
            {tab === "money" && (() => {
              const finance = liveFinance ?? getFinanceByName(pol.name);
              const isLive = liveFinance?.dataSource === "live";

              if (financeLoading) return (
                <div className="py-16 flex flex-col items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="alive-halo absolute inline-flex h-full w-full rounded-full bg-sky-400" />
                    <span className="alive-pulse relative inline-flex h-3 w-3 rounded-full bg-sky-400" />
                  </span>
                  <p className="text-sm text-[var(--muted)]">Loading live finance data...</p>
                </div>
              );

              if (!finance) return (
                <div className="py-4 text-center max-w-sm mx-auto">
                  <div className="rounded-[1.75rem] bg-white/60 ring-1 ring-black/8 p-[6px]">
                    <div className="rounded-[1.35rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] p-10 flex flex-col items-center gap-3">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v2m0 8v2M9 9h4.5a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3H15"/>
                      </svg>
                      <h3 className="font-bold text-[var(--accent)] text-lg" style={{ fontFamily: "var(--font-playfair), serif" }}>
                        No Finance Data
                      </h3>
                      <p className="text-sm text-[var(--muted)] leading-relaxed">
                        Campaign finance data is not yet available for this official.
                      </p>
                      <Link href="/tools/where-is-the-dough"
                        className="mt-2 text-xs font-semibold text-[var(--accent-light)] hover:underline">
                        See full campaign finance tool →
                      </Link>
                    </div>
                  </div>
                </div>
              );
              const partyColor = finance.party === "D" ? "#2563a8" : "#b91c1c";
              const totalCycle = finance.raised ?? finance.cash;
              return (
                <div className="py-4 space-y-4 max-w-2xl mx-auto">
                  {/* Header */}
                  <div className="rounded-[1.75rem] bg-white/60 ring-1 ring-black/8 p-[6px]">
                    <div className="rounded-[1.35rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] p-6">
                      <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: partyColor }}>
                        Campaign Finance · {finance.asOf}
                      </p>
                      <p className="text-xs text-[var(--muted)]">{finance.office}</p>
                      <p className="text-xs text-[var(--muted)] mt-1 flex items-center gap-2">
                        Source: {finance.level === "federal" ? "FEC" : finance.level === "houston" ? "Houston COH" : finance.level === "county" ? "Harris County" : "TEC"} · Data as of {finance.asOf}
                        {isLive && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                            <span className="relative flex h-1.5 w-1.5"><span className="alive-pulse relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" /></span>
                            Live
                          </span>
                        )}
                        {financeError && (
                          <span className="text-[10px] text-amber-600">({financeError} — showing cached data)</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Key stats grid */}
                  <div className={`grid gap-3 ${finance.raised ? "grid-cols-3" : "grid-cols-1 max-w-xs mx-auto"}`}>
                    {/* Cash on hand */}
                    <div className="rounded-[1.75rem] bg-white/60 ring-1 ring-black/8 p-[5px] card-lift">
                      <div className="rounded-[1.35rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] p-5 text-center">
                        <p className="text-xs text-[var(--muted)] uppercase tracking-wider mb-1">Cash on Hand</p>
                        <p className="text-2xl font-bold" style={{ color: partyColor, fontFamily: "var(--font-playfair), serif" }}>
                          {fmt(finance.cash)}
                        </p>
                      </div>
                    </div>
                    {/* Total raised */}
                    {finance.raised && (
                      <div className="rounded-[1.75rem] bg-white/60 ring-1 ring-black/8 p-[5px] card-lift">
                        <div className="rounded-[1.35rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] p-5 text-center">
                          <p className="text-xs text-[var(--muted)] uppercase tracking-wider mb-1">Total Raised</p>
                          <p className="text-2xl font-bold text-[var(--accent)]" style={{ fontFamily: "var(--font-playfair), serif" }}>
                            {fmt(finance.raised)}
                          </p>
                        </div>
                      </div>
                    )}
                    {/* Total spent */}
                    {finance.spent && (
                      <div className="rounded-[1.75rem] bg-white/60 ring-1 ring-black/8 p-[5px] card-lift">
                        <div className="rounded-[1.35rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] p-5 text-center">
                          <p className="text-xs text-[var(--muted)] uppercase tracking-wider mb-1">Total Spent</p>
                          <p className="text-2xl font-bold text-[var(--muted)]" style={{ fontFamily: "var(--font-playfair), serif" }}>
                            {fmt(finance.spent)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Burn rate bar — only if both raised and spent */}
                  {finance.raised && finance.spent && (
                    <div className="rounded-[1.75rem] bg-white/60 ring-1 ring-black/8 p-[5px]">
                      <div className="rounded-[1.35rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] p-5">
                        <p className="text-xs text-[var(--muted)] uppercase tracking-wider mb-3">Spend Rate</p>
                        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${Math.min(100, Math.round((finance.spent / finance.raised) * 100))}%`, background: partyColor }}
                          />
                        </div>
                        <p className="text-xs text-[var(--muted)] mt-2 text-right">
                          {Math.round((finance.spent / finance.raised) * 100)}% of raised spent
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="text-center pt-1 flex flex-col sm:flex-row items-center justify-center gap-3">
                    {finance.filingUrl && (
                      <a href={finance.filingUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs font-semibold text-[var(--accent)] hover:underline">
                        View {finance.level === "federal" ? "FEC" : "TEC"} filing →
                      </a>
                    )}
                    <Link href="/tools/where-is-the-dough"
                      className="text-xs font-semibold text-[var(--accent-light)] hover:underline">
                      Full finance leaderboard →
                    </Link>
                  </div>
                </div>
              );
            })()}

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
                            className="block rounded-[1.35rem] bg-white/70 ring-1 ring-black/7 p-[4px] card-lift group">
                            <div className="rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] px-5 py-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-[var(--foreground)] leading-snug group-hover:text-[var(--accent)] transition-colors line-clamp-2">
                                    {article.title}
                                  </p>
                                  <div className="mt-1.5 flex items-center gap-2 text-[10px] text-[var(--muted)]">
                                    {article.source && <span className="font-bold text-[var(--accent-light)]">{article.source}</span>}
                                    {date && article.source && <span>·</span>}
                                    {date && <span>{date}</span>}
                                  </div>
                                </div>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                  className="flex-shrink-0 text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors mt-0.5">
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

            {/* ── SOCIAL TAB ── */}
            {tab === "social" && pol.twitter && (
              <div className="max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.2em] mb-4 text-[var(--muted)]">
                  Social Feed — @{pol.twitter}
                </p>
                <SocialFeed handle={pol.twitter} />
                <p className="text-xs text-[var(--muted)] mt-3">
                  Timeline from X (Twitter) · Posts by the official
                </p>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
