"use client";

import { useRef, useState, useEffect } from "react";

// Phase timeline (ms from trigger):
//   0    → appear   : box slides up from below
//   750  → shake    : whole box rattles (something inside wants OUT)
//   1450 → bounce   : lid teases — pops up, snaps back
//   1950 → open     : lid SLAMS open with overshoot + settle
//   2100 → burst    : tools fly out in arcs + expanding rings
//   2700 → content  : heading text rises in

type Phase = "idle" | "appear" | "shake" | "bounce" | "open" | "burst" | "content";

export default function ToolboxOpener() {
  const ref        = useRef<HTMLDivElement>(null);
  const wrapRef    = useRef<HTMLDivElement>(null);
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
          t(2700, "content");
        }
      },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Class helpers
  const isOpen    = phase === "open" || phase === "burst" || phase === "content";
  const isBurst   = phase === "burst" || phase === "content";
  const isContent = phase === "content";

  const lidClass =
    phase === "bounce" ? "tb-bouncing" :
    isOpen             ? "tb-opening"  : "";

  return (
    <div ref={ref} className="mb-16 md:mb-24">

      {/* ── SVG Toolbox wrapper — shake applied here ────────────────── */}
      <div
        ref={wrapRef}
        className={[
          "flex justify-center mb-10 md:mb-14",
          phase === "idle"   ? "opacity-0" : "",
          phase === "appear" ? "tb-appear"  : "",
          phase === "shake"  ? "tb-shaking" : "",
        ].join(" ")}
        style={{ minHeight: 190 }}
      >
        {/* SVG container — overflow visible so lid/tools can escape bounds */}
        <div style={{ position: "relative", width: 300, height: 185 }}>
          <svg
            viewBox="0 0 300 185"
            width="300"
            height="185"
            style={{ overflow: "visible" }}
            aria-hidden="true"
          >
            <defs>
              {/* Box drop shadow */}
              <filter id="tb-drop" x="-15%" y="-15%" width="130%" height="160%">
                <feDropShadow dx="0" dy="8" stdDeviation="12"
                  floodColor="#1a3a5c" floodOpacity="0.28"/>
              </filter>
              {/* Lid shadow (lighter so it feels lifted) */}
              <filter id="tb-lid-drop" x="-15%" y="-40%" width="130%" height="200%">
                <feDropShadow dx="0" dy="4" stdDeviation="6"
                  floodColor="#1a3a5c" floodOpacity="0.35"/>
              </filter>
              {/* Interior warm gradient */}
              <radialGradient id="tb-interior" cx="50%" cy="0%" r="100%">
                <stop offset="0%"   stopColor="#fdf8f0"/>
                <stop offset="100%" stopColor="#e8e0d0"/>
              </radialGradient>
              {/* Body gradient — slight top shine */}
              <linearGradient id="tb-body-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#22507a"/>
                <stop offset="100%" stopColor="#1a3a5c"/>
              </linearGradient>
              {/* Lid gradient */}
              <linearGradient id="tb-lid-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#26598a"/>
                <stop offset="100%" stopColor="#1e4876"/>
              </linearGradient>
              {/* Burst ring clip */}
              <clipPath id="tb-box-clip">
                <rect x="10" y="92" width="280" height="88" rx="8"/>
              </clipPath>
            </defs>

            {/* ── BURST RINGS — expand outward from box opening ── */}
            {isBurst && (
              <g transform="translate(150, 92)">
                <ellipse cx="0" cy="0" rx="110" ry="28"
                  fill="none" stroke="#f5f0e8" strokeWidth="3"
                  className="tb-ring-1" opacity="0"/>
                <ellipse cx="0" cy="0" rx="110" ry="28"
                  fill="none" stroke="#d4c9b0" strokeWidth="2"
                  className="tb-ring-2" opacity="0"/>
                <ellipse cx="0" cy="0" rx="110" ry="28"
                  fill="none" stroke="#b8ac94" strokeWidth="1.5"
                  className="tb-ring-3" opacity="0"/>
              </g>
            )}

            {/* ── GLOW from interior ── */}
            <ellipse
              cx="150" cy="96" rx="120" ry="18"
              fill="#f8f2e4"
              style={{ filter: "blur(16px)", transition: "opacity 0.4s ease 0.2s" }}
              className={isOpen ? "tb-glow" : ""}
              opacity="0"
            />

            {/* ── BOX BODY ── */}
            <g filter="url(#tb-drop)">
              {/* Main body */}
              <rect x="10" y="92" width="280" height="88" rx="8"
                fill="url(#tb-body-grad)"/>

              {/* Interior floor — revealed when open */}
              <rect x="12" y="94" width="276" height="26" rx="4"
                fill="url(#tb-interior)"
                style={{ transition: "opacity 0.3s ease 0.3s" }}
                opacity={isOpen ? 1 : 0}/>

              {/* Horizontal shelf line in body */}
              <rect x="10" y="136" width="280" height="2" rx="1"
                fill="rgba(255,255,255,0.07)"/>

              {/* Bottom edge detail */}
              <rect x="10" y="174" width="280" height="6" rx="4"
                fill="rgba(0,0,0,0.15)"/>

              {/* Rivet corners */}
              <circle cx="30"  cy="106" r="5" fill="#2563a8" opacity="0.8"/>
              <circle cx="270" cy="106" r="5" fill="#2563a8" opacity="0.8"/>
              <circle cx="30"  cy="164" r="5" fill="#2563a8" opacity="0.55"/>
              <circle cx="270" cy="164" r="5" fill="#2563a8" opacity="0.55"/>

              {/* Side grip handles */}
              <rect x="0"   y="112" width="12" height="28" rx="6" fill="#2563a8"/>
              <rect x="288" y="112" width="12" height="28" rx="6" fill="#2563a8"/>

              {/* Brand stripe on body front */}
              <rect x="55" y="150" width="190" height="3" rx="1.5"
                fill="rgba(37,99,168,0.4)"/>
            </g>

            {/* ── LATCH / CLASP — sits on the seam ── */}
            <rect x="114" y="78" width="72" height="28" rx="10" fill="#2563a8"/>
            <rect x="126" y="86" width="48" height="12" rx="5"
              fill="#1a3a5c" opacity="0.55"/>
            <circle cx="150" cy="92" r="4.5" fill="#2563a8"/>
            <circle cx="150" cy="92" r="2"   fill="#1a3a5c" opacity="0.5"/>

            {/* ── TOOL SILHOUETTES — fly out when lid opens ── */}
            {/* Bar chart — flies straight up center-left */}
            <g className={isBurst ? "tb-fly-l" : ""} opacity="0"
               style={{ transformOrigin: "90px 100px" }}>
              <rect x="76" y="96" width="7"  height="8"  rx="1.5" fill="#2563a8"/>
              <rect x="86" y="91" width="7"  height="13" rx="1.5" fill="#2563a8" opacity="0.9"/>
              <rect x="96" y="86" width="7"  height="18" rx="1.5" fill="#2563a8"/>
            </g>

            {/* Magnifying glass — center */}
            <g className={isBurst ? "tb-fly-c" : ""} opacity="0"
               style={{ transformOrigin: "148px 100px" }}>
              <circle cx="144" cy="97" r="9"  fill="none" stroke="#2563a8" strokeWidth="3"/>
              <line   x1="151" y1="104" x2="157" y2="112"
                stroke="#2563a8" strokeWidth="3" strokeLinecap="round"/>
            </g>

            {/* Document — flies right */}
            <g className={isBurst ? "tb-fly-r" : ""} opacity="0"
               style={{ transformOrigin: "196px 100px" }}>
              <rect x="188" y="88" width="18" height="22" rx="3"
                fill="none" stroke="#2563a8" strokeWidth="2.5"/>
              <line x1="192" y1="95" x2="202" y2="95"
                stroke="#2563a8" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="192" y1="100" x2="202" y2="100"
                stroke="#2563a8" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="192" y1="105" x2="198" y2="105"
                stroke="#2563a8" strokeWidth="1.8" strokeLinecap="round"/>
            </g>

            {/* Wrench — flies far left */}
            <g className={isBurst ? "tb-fly-fl" : ""} opacity="0"
               style={{ transformOrigin: "48px 100px" }}>
              <path d="M42 88 Q38 92 39 100 L48 110 Q51 113 54 110
                       Q57 107 54 104 L45 94 Q47 87 42 88Z"
                fill="#2563a8" opacity="0.9"/>
              <circle cx="43" cy="89" r="4" fill="none"
                stroke="#2563a8" strokeWidth="2.5"/>
            </g>

            {/* ── LID GROUP — animated ── */}
            <g className={lidClass} filter="url(#tb-lid-drop)">
              {/* Lid body */}
              <rect x="10" y="66" width="280" height="28" rx="8"
                fill="url(#tb-lid-grad)"/>

              {/* Lid top surface highlight */}
              <rect x="10" y="66" width="280" height="8" rx="6"
                fill="rgba(255,255,255,0.09)"/>

              {/* Lid bottom seam */}
              <rect x="10" y="90" width="280" height="3" rx="1"
                fill="rgba(0,0,0,0.12)"/>

              {/* Handle anchor tabs */}
              <rect x="90"  y="66" width="14" height="10" rx="4" fill="#2563a8"/>
              <rect x="196" y="66" width="14" height="10" rx="4" fill="#2563a8"/>

              {/* Handle arch — main stroke */}
              <path d="M 97 66 Q 97 26 150 26 Q 203 26 203 66"
                fill="none" stroke="#2563a8" strokeWidth="11"
                strokeLinecap="round"/>
              {/* Handle top highlight */}
              <path d="M 97 66 Q 97 26 150 26 Q 203 26 203 66"
                fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="5"
                strokeLinecap="round"/>
              {/* Handle inner shadow */}
              <path d="M 102 66 Q 102 32 150 32 Q 198 32 198 66"
                fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="4"
                strokeLinecap="round"/>

              {/* Lid rivets */}
              <circle cx="30"  cy="80" r="5" fill="#2563a8" opacity="0.8"/>
              <circle cx="270" cy="80" r="5" fill="#2563a8" opacity="0.8"/>

              {/* Lid brand line */}
              <rect x="55" y="76" width="190" height="2.5" rx="1.25"
                fill="rgba(255,255,255,0.08)"/>
            </g>

          </svg>
        </div>
      </div>

      {/* ── Section label + heading — cascade in after box opens ─── */}
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
