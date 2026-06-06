"use client";

import { useRef, useState, useEffect } from "react";

// Phase timeline (ms from trigger):
//   0    → appear   : box slides up from below
//   750  → shake    : whole box rattles (something inside wants OUT)
//   1450 → bounce   : lid teases — front edge lifts, snaps back
//   1950 → open     : lid flips back with 3-D perspective overshoot
//   2100 → burst    : 5 tools shoot up and arc down to their shelves
//   2800 → content  : heading rises in; shelf labels fade in

type Phase = "idle" | "appear" | "shake" | "bounce" | "open" | "burst" | "content";

// 5 sections in the browse grid — order matches ROWS in page.tsx
const SHELF = [
  { label: "Money",       icon: "dollar"   },
  { label: "Elections",   icon: "chart"    },
  { label: "Legislation", icon: "scroll"   },
  { label: "The Beat",    icon: "building" },
  { label: "Media",       icon: "screen"   },
] as const;

// x positions for each shelf slot (SVG coords, viewBox 0 0 340 220)
const SHELF_X = [48, 108, 170, 232, 292];
// y at which tools land on the shelf (below box body which ends at y=200)
const SHELF_Y = 216;
// tools all shoot from the box opening center
const ORIGIN_X = 170;
const ORIGIN_Y = 108;

function ShelfIcon({ type, cx, cy }: { type: typeof SHELF[number]["icon"]; cx: number; cy: number }) {
  switch (type) {
    case "building":
      return (
        <g transform={`translate(${cx - 10},${cy - 12})`}>
          <rect x="1" y="6"  width="18" height="14" rx="1" fill="none" stroke="#2563a8" strokeWidth="2"/>
          <rect x="4" y="10" width="3"  height="4"  rx="0.5" fill="#2563a8" opacity="0.7"/>
          <rect x="8.5" y="10" width="3" height="4" rx="0.5" fill="#2563a8" opacity="0.7"/>
          <rect x="13" y="10" width="3" height="4"  rx="0.5" fill="#2563a8" opacity="0.7"/>
          <rect x="7"  y="0"  width="6" height="7"  rx="0.5" fill="none" stroke="#2563a8" strokeWidth="1.8"/>
        </g>
      );
    case "chart":
      return (
        <g transform={`translate(${cx - 9},${cy - 10})`}>
          <rect x="0" y="10" width="5" height="10" rx="1.5" fill="#2563a8"/>
          <rect x="7" y="5"  width="5" height="15" rx="1.5" fill="#2563a8" opacity="0.9"/>
          <rect x="14" y="0" width="5" height="20" rx="1.5" fill="#2563a8"/>
        </g>
      );
    case "dollar":
      return (
        <g transform={`translate(${cx},${cy})`}>
          <circle cx="0" cy="0" r="11" fill="none" stroke="#2563a8" strokeWidth="2"/>
          <text x="0" y="5" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#2563a8">$</text>
        </g>
      );
    case "scroll":
      return (
        <g transform={`translate(${cx - 9},${cy - 11})`}>
          <rect x="1" y="2" width="16" height="20" rx="2.5" fill="none" stroke="#2563a8" strokeWidth="2"/>
          <line x1="4.5" y1="8"  x2="13.5" y2="8"  stroke="#2563a8" strokeWidth="1.8" strokeLinecap="round"/>
          <line x1="4.5" y1="12" x2="13.5" y2="12" stroke="#2563a8" strokeWidth="1.8" strokeLinecap="round"/>
          <line x1="4.5" y1="16" x2="10"   y2="16" stroke="#2563a8" strokeWidth="1.8" strokeLinecap="round"/>
        </g>
      );
    case "screen":
      return (
        <g transform={`translate(${cx - 11},${cy - 10})`}>
          <rect x="0" y="0" width="22" height="16" rx="2" fill="none" stroke="#2563a8" strokeWidth="2"/>
          <line x1="9" y1="16" x2="13" y2="21" stroke="#2563a8" strokeWidth="1.8" strokeLinecap="round"/>
          <line x1="6" y1="21" x2="16" y2="21" stroke="#2563a8" strokeWidth="1.8" strokeLinecap="round"/>
          <rect x="2" y="2" width="18" height="12" rx="1" fill="#2563a8" opacity="0.08"/>
        </g>
      );
  }
}

export default function ToolboxOpener() {
  const ref     = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("content");
      return;
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          obs.disconnect();
          const t = (ms: number, p: Phase) => setTimeout(() => setPhase(p), ms);
          t(0,    "appear");
          t(750,  "shake");
          t(1450, "bounce");
          t(1950, "open");
          t(2100, "burst");
          t(2800, "content");
        }
      },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const isOpen    = phase === "open" || phase === "burst" || phase === "content";
  const isBurst   = phase === "burst" || phase === "content";
  const isContent = phase === "content";

  const lidClass =
    phase === "bounce" ? "tb-lid-bounce3d" :
    isOpen             ? "tb-lid-open3d"   : "";

  return (
    <div ref={ref} className="mb-16 md:mb-24">

      {/* ── SVG Toolbox wrapper ── */}
      <div
        className={[
          "flex justify-center mb-10 md:mb-14",
          phase === "idle"   ? "opacity-0"  : "",
          phase === "appear" ? "tb-appear"  : "",
          phase === "shake"  ? "tb-shaking" : "",
        ].join(" ")}
        style={{ minHeight: 230 }}
      >
        <div style={{ position: "relative", width: 340, height: 248, perspective: "600px", perspectiveOrigin: "170px 120px" }}>
          <svg
            viewBox="0 0 340 248"
            width="340"
            height="248"
            style={{ overflow: "visible", transformStyle: "preserve-3d" }}
            aria-hidden="true"
          >
            <defs>
              <filter id="tb-drop" x="-15%" y="-15%" width="130%" height="160%">
                <feDropShadow dx="0" dy="8" stdDeviation="12"
                  floodColor="#1a3a5c" floodOpacity="0.28"/>
              </filter>
              <filter id="tb-lid-drop" x="-15%" y="-60%" width="130%" height="220%">
                <feDropShadow dx="0" dy="4" stdDeviation="6"
                  floodColor="#1a3a5c" floodOpacity="0.35"/>
              </filter>
              <radialGradient id="tb-interior" cx="50%" cy="0%" r="100%">
                <stop offset="0%"   stopColor="#fdf8f0"/>
                <stop offset="100%" stopColor="#e8e0d0"/>
              </radialGradient>
              <linearGradient id="tb-body-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#22507a"/>
                <stop offset="100%" stopColor="#1a3a5c"/>
              </linearGradient>
              <linearGradient id="tb-lid-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#26598a"/>
                <stop offset="100%" stopColor="#1e4876"/>
              </linearGradient>
              <linearGradient id="tb-panel-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="rgba(255,255,255,0.07)"/>
                <stop offset="100%" stopColor="rgba(0,0,0,0.1)"/>
              </linearGradient>
            </defs>

            {/* ── BURST RINGS from box opening ── */}
            {isBurst && (
              <g transform={`translate(${ORIGIN_X}, ${ORIGIN_Y})`}>
                <ellipse cx="0" cy="0" rx="110" ry="22"
                  fill="none" stroke="#f5f0e8" strokeWidth="3"
                  className="tb-ring-1" opacity="0"/>
                <ellipse cx="0" cy="0" rx="110" ry="22"
                  fill="none" stroke="#d4c9b0" strokeWidth="2"
                  className="tb-ring-2" opacity="0"/>
              </g>
            )}

            {/* ── INTERIOR GLOW ── */}
            <ellipse
              cx={ORIGIN_X} cy={ORIGIN_Y} rx="120" ry="14"
              fill="#f8f2e4"
              style={{ filter: "blur(14px)", transition: "opacity 0.4s ease 0.2s" }}
              className={isOpen ? "tb-glow" : ""}
              opacity="0"
            />

            {/* ── BOX BODY — front face ── */}
            <g filter="url(#tb-drop)">
              {/* Main body */}
              <rect x="30" y="118" width="280" height="82" rx="8"
                fill="url(#tb-body-grad)"/>

              {/* Interior floor — revealed when lid opens */}
              <rect x="32" y="120" width="276" height="22" rx="4"
                fill="url(#tb-interior)"
                style={{ transition: "opacity 0.35s ease 0.25s" }}
                opacity={isOpen ? 1 : 0}/>

              {/* Front panel decorative inset */}
              <rect x="48" y="145" width="244" height="44" rx="5"
                fill="url(#tb-panel-grad)" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>

              {/* Horizontal shelf line */}
              <rect x="30" y="162" width="280" height="2" rx="1"
                fill="rgba(255,255,255,0.06)"/>

              {/* Bottom edge */}
              <rect x="30" y="194" width="280" height="6" rx="4"
                fill="rgba(0,0,0,0.15)"/>

              {/* Corner rivets */}
              <circle cx="50"  cy="132" r="5" fill="#2563a8" opacity="0.8"/>
              <circle cx="290" cy="132" r="5" fill="#2563a8" opacity="0.8"/>
              <circle cx="50"  cy="188" r="5" fill="#2563a8" opacity="0.55"/>
              <circle cx="290" cy="188" r="5" fill="#2563a8" opacity="0.55"/>

              {/* Side grip handles */}
              <rect x="18"  y="138" width="14" height="30" rx="7" fill="#2563a8"/>
              <rect x="308" y="138" width="14" height="30" rx="7" fill="#2563a8"/>

              {/* Brand stripe */}
              <rect x="70" y="175" width="200" height="2.5" rx="1.25"
                fill="rgba(37,99,168,0.4)"/>
            </g>

            {/* ── LATCH / CLASP ── */}
            <rect x="124" y="104" width="92" height="30" rx="10" fill="#2563a8"/>
            <rect x="136" y="112" width="68" height="14" rx="5"
              fill="#1a3a5c" opacity="0.55"/>
            <circle cx="170" cy="119" r="5"   fill="#2563a8"/>
            <circle cx="170" cy="119" r="2.2" fill="#1a3a5c" opacity="0.5"/>

            {/* ── 5 TOOL ICONS — fall to shelf ── */}
            {SHELF.map((s, i) => (
              <g
                key={s.label}
                className={isBurst ? `tb-fall-${i + 1}` : ""}
                opacity="0"
                style={{ transformOrigin: `${ORIGIN_X}px ${ORIGIN_Y}px` }}
              >
                <ShelfIcon type={s.icon} cx={ORIGIN_X} cy={ORIGIN_Y} />
              </g>
            ))}

            {/* ── SHELF LABELS — fade in when tools land (content phase) ── */}
            {SHELF.map((s, i) => (
              <text
                key={`lbl-${s.label}`}
                x={SHELF_X[i]}
                y={SHELF_Y + 22}
                textAnchor="middle"
                fontSize="7.5"
                fontWeight="700"
                letterSpacing="0.06em"
                fill="#2563a8"
                opacity={isContent ? 1 : 0}
                style={{
                  transition: `opacity 0.5s ease ${0.1 * i + 0.2}s`,
                  textTransform: "uppercase",
                  fontFamily: "var(--font-geist-sans, sans-serif)",
                }}
              >
                {s.label}
              </text>
            ))}

            {/* ── LID GROUP — 3-D forward flip ── */}
            <g
              className={lidClass}
              filter="url(#tb-lid-drop)"
              style={{/* transform-origin handled by .tb-lid-open3d CSS class */}}
            >
              {/* Lid body */}
              <rect x="30" y="100" width="280" height="20" rx="8"
                fill="url(#tb-lid-grad)"/>

              {/* Lid top highlight */}
              <rect x="30" y="100" width="280" height="7" rx="6"
                fill="rgba(255,255,255,0.09)"/>

              {/* Lid bottom seam */}
              <rect x="30" y="116" width="280" height="3" rx="1"
                fill="rgba(0,0,0,0.12)"/>

              {/* Handle anchor tabs */}
              <rect x="108" y="100" width="14" height="9" rx="4" fill="#2563a8"/>
              <rect x="218" y="100" width="14" height="9" rx="4" fill="#2563a8"/>

              {/* Handle arch */}
              <path d="M 115 100 Q 115 52 170 52 Q 225 52 225 100"
                fill="none" stroke="#2563a8" strokeWidth="12"
                strokeLinecap="round"/>
              <path d="M 115 100 Q 115 52 170 52 Q 225 52 225 100"
                fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="5"
                strokeLinecap="round"/>
              <path d="M 120 100 Q 120 57 170 57 Q 220 57 220 100"
                fill="none" stroke="rgba(0,0,0,0.22)" strokeWidth="4"
                strokeLinecap="round"/>

              {/* Lid rivets */}
              <circle cx="50"  cy="109" r="5" fill="#2563a8" opacity="0.8"/>
              <circle cx="290" cy="109" r="5" fill="#2563a8" opacity="0.8"/>

              {/* Lid brand line */}
              <rect x="70" y="106" width="200" height="2.5" rx="1.25"
                fill="rgba(255,255,255,0.07)"/>
            </g>

          </svg>
        </div>
      </div>

      {/* ── Section label + heading ── */}
      <div className={isContent ? "tb-content-in d0" : "opacity-0"}
           style={{ pointerEvents: isContent ? "auto" : "none" }}>
        <div className="flex items-center gap-3 mb-6">
          <span className="block w-8 h-px bg-[var(--accent)]/25" />
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--accent)]/50">
            The Toolbox
          </span>
          <span className="flex-1 h-px bg-[var(--border)]" />
        </div>
      </div>

      <div className={isContent ? "tb-content-in d1" : "opacity-0"}
           style={{ pointerEvents: isContent ? "auto" : "none" }}>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <h2
            className="text-4xl md:text-6xl font-bold text-[var(--accent)] leading-[1.05] max-w-xl"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            Civic tools,
            <br />
            all in one place.
          </h2>
          <p className="text-[var(--muted)] max-w-xs leading-relaxed text-sm md:text-base md:text-right md:pb-2">
            Built for Harris County.
            <br />
            Free, always.
            <br />
            All data from public sources.
          </p>
        </div>
      </div>

    </div>
  );
}
