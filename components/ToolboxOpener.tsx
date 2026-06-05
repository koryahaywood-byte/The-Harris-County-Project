"use client";

import { useRef, useState, useEffect } from "react";

type Phase = "idle" | "appear" | "bounce" | "open" | "content";

export default function ToolboxOpener() {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced-motion preference — skip straight to content
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setPhase("content");
      return;
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasTriggered) {
          setHasTriggered(true);
          obs.disconnect();

          // Phase sequence — total ~1 650ms before content appears
          setTimeout(() => setPhase("appear"),  0);
          setTimeout(() => setPhase("bounce"),  500);
          setTimeout(() => setPhase("open"),    950);
          setTimeout(() => setPhase("content"), 1700);
        }
      },
      { threshold: 0.25 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lidClass =
    phase === "bounce" ? "tb-bouncing" :
    phase === "open" || phase === "content" ? "tb-opening" : "";

  const showGlow   = phase === "open" || phase === "content";
  const showTools  = phase === "open" || phase === "content";
  const showContent = phase === "content";

  // Interior tool silhouettes — simple geometric SVG, no emoji
  const toolShapes = [
    // Bar chart — 3 columns
    <g key="chart" style={{ animationDelay: "0ms" }} className={showTools ? "tb-tool-pop" : ""} opacity={showTools ? 1 : 0}>
      <rect x="38" y="77" width="5" height="5" rx="1" fill="#2563a8" opacity="0.7"/>
      <rect x="45" y="74" width="5" height="8" rx="1" fill="#2563a8" opacity="0.85"/>
      <rect x="52" y="71" width="5" height="11" rx="1" fill="#2563a8"/>
    </g>,
    // Magnifying glass
    <g key="search" style={{ animationDelay: "80ms" }} className={showTools ? "tb-tool-pop" : ""} opacity={showTools ? 1 : 0}>
      <circle cx="95" cy="76" r="5.5" fill="none" stroke="#2563a8" strokeWidth="2"/>
      <line x1="99" y1="80" x2="103" y2="84" stroke="#2563a8" strokeWidth="2" strokeLinecap="round"/>
    </g>,
    // Document / clipboard
    <g key="doc" style={{ animationDelay: "160ms" }} className={showTools ? "tb-tool-pop" : ""} opacity={showTools ? 1 : 0}>
      <rect x="130" y="70" width="12" height="14" rx="2" fill="none" stroke="#2563a8" strokeWidth="1.5"/>
      <line x1="132" y1="75" x2="140" y2="75" stroke="#2563a8" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="132" y1="78" x2="140" y2="78" stroke="#2563a8" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="132" y1="81" x2="137" y2="81" stroke="#2563a8" strokeWidth="1.2" strokeLinecap="round"/>
    </g>,
    // Wrench silhouette
    <g key="wrench" style={{ animationDelay: "240ms" }} className={showTools ? "tb-tool-pop" : ""} opacity={showTools ? 1 : 0}>
      <path d="M168 71 Q165 74 166 78 L172 84 Q174 86 176 84 Q178 82 176 80 L170 74 Q171 70 168 71Z"
        fill="#2563a8" opacity="0.8"/>
    </g>,
  ];

  return (
    <div ref={ref} className="mb-16 md:mb-24">

      {/* ── SVG Toolbox ─────────────────────────────────────────────── */}
      <div
        className={`flex justify-center mb-10 md:mb-14 ${phase === "idle" ? "opacity-0" : "tb-appear"}`}
        style={{ minHeight: 160 }}
      >
        <div style={{ position: "relative", width: 240, height: 155 }}>
          <svg
            viewBox="0 0 240 155"
            width="240"
            height="155"
            style={{ overflow: "visible" }}
            aria-hidden="true"
          >
            {/* ── Drop shadow filter ── */}
            <defs>
              <filter id="tb-shadow" x="-20%" y="-20%" width="140%" height="160%">
                <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#1a3a5c" floodOpacity="0.22"/>
              </filter>
              <filter id="tb-glow-filter" x="-30%" y="-80%" width="160%" height="260%">
                <feGaussianBlur stdDeviation="10" result="blur"/>
                <feComposite in="SourceGraphic" in2="blur" operator="over"/>
              </filter>
              <radialGradient id="tb-interior-grad" cx="50%" cy="0%" r="100%">
                <stop offset="0%" stopColor="#f0ece3"/>
                <stop offset="100%" stopColor="#e8e3d8"/>
              </radialGradient>
            </defs>

            {/* ── Glow from interior when open ── */}
            <ellipse
              cx="120" cy="90" rx="90" ry="14"
              fill="#f5f0e8"
              className={showGlow ? "tb-glow" : ""}
              opacity={showGlow ? 1 : 0}
              style={{ filter: "blur(12px)" }}
            />

            {/* ── Box body ── */}
            <g filter="url(#tb-shadow)">
              {/* Main body */}
              <rect x="10" y="82" width="220" height="68" rx="8" fill="#1a3a5c"/>

              {/* Body top stripe / edge highlight */}
              <rect x="10" y="82" width="220" height="10" rx="8" fill="#1f4570" opacity="0.9"/>

              {/* Interior — cream floor revealed when lid opens */}
              <rect
                x="12" y="84" width="216" height="20" rx="3"
                fill="url(#tb-interior-grad)"
                opacity={showGlow ? 1 : 0}
                style={{ transition: "opacity 0.35s ease 0.3s" }}
              />

              {/* Tool silhouettes in interior */}
              {toolShapes}

              {/* Rivet dots on body corners */}
              <circle cx="26"  cy="92" r="4" fill="#2563a8" opacity="0.7"/>
              <circle cx="214" cy="92" r="4" fill="#2563a8" opacity="0.7"/>
              <circle cx="26"  cy="138" r="4" fill="#2563a8" opacity="0.5"/>
              <circle cx="214" cy="138" r="4" fill="#2563a8" opacity="0.5"/>

              {/* Side grip handles */}
              <rect x="2"   y="100" width="10" height="22" rx="5" fill="#2563a8"/>
              <rect x="228" y="100" width="10" height="22" rx="5" fill="#2563a8"/>

              {/* Bottom tray line detail */}
              <rect x="18" y="135" width="204" height="3" rx="1.5" fill="rgba(255,255,255,0.06)"/>
            </g>

            {/* ── Latch / clasp (sits on the seam) ── */}
            <rect x="96" y="71" width="48" height="22" rx="8" fill="#2563a8"/>
            <rect x="106" y="78" width="28" height="8"  rx="3" fill="#1a3a5c" opacity="0.6"/>
            <circle cx="120" cy="82" r="3" fill="#2563a8" opacity="0.9"/>

            {/* ── LID GROUP — the animated part ── */}
            <g className={lidClass}>
              {/* Lid body */}
              <rect x="10" y="58" width="220" height="26" rx="7" fill="#1e4571" filter="url(#tb-shadow)"/>

              {/* Lid top surface highlight */}
              <rect x="10" y="58" width="220" height="7" rx="5" fill="rgba(255,255,255,0.07)"/>

              {/* Lid bottom edge seam */}
              <rect x="10" y="80" width="220" height="3" rx="1" fill="rgba(255,255,255,0.05)"/>

              {/* Handle anchor tabs */}
              <rect x="76" y="58" width="12" height="8" rx="3" fill="#2563a8"/>
              <rect x="152" y="58" width="12" height="8" rx="3" fill="#2563a8"/>

              {/* Handle arch */}
              <path
                d="M 82 58 Q 82 24 120 24 Q 158 24 158 58"
                fill="none"
                stroke="#2563a8"
                strokeWidth="9"
                strokeLinecap="round"
              />
              {/* Handle highlight */}
              <path
                d="M 82 58 Q 82 24 120 24 Q 158 24 158 58"
                fill="none"
                stroke="rgba(255,255,255,0.14)"
                strokeWidth="4"
                strokeLinecap="round"
              />
              {/* Handle inner core */}
              <path
                d="M 86 58 Q 86 30 120 30 Q 154 30 154 58"
                fill="none"
                stroke="#1a3a5c"
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.4"
              />

              {/* Lid rivets */}
              <circle cx="28"  cy="68" r="4" fill="#2563a8" opacity="0.7"/>
              <circle cx="212" cy="68" r="4" fill="#2563a8" opacity="0.7"/>
            </g>

          </svg>
        </div>
      </div>

      {/* ── Section label + heading ─────────────────────────────────── */}
      {/* Section label */}
      <div
        className={showContent ? "tb-content-in delay-0" : "opacity-0"}
        style={{ pointerEvents: showContent ? "auto" : "none" }}
      >
        <div className="flex items-center gap-3 mb-6">
          <span className="block w-8 h-px bg-[var(--accent)]/25" />
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--accent)]/50">
            The Toolbox
          </span>
          <span className="flex-1 h-px bg-[var(--border)]" />
        </div>
      </div>

      {/* Heading row */}
      <div
        className={showContent ? "tb-content-in delay-1" : "opacity-0"}
        style={{ pointerEvents: showContent ? "auto" : "none" }}
      >
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
