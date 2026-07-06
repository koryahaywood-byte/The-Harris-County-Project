"use client";

// 2K-style 2D player render: the official's headshot on a cel-shaded suit
// bust with party team colors and an arena glow, cropped at the chest like a
// MyTEAM card. Pure SVG, no dependencies. The 3D figure (PlayerFigure3D)
// stays on profile pages; this is the fast, grid-friendly render.

import { useId, useState } from "react";

const THEMES = {
  D:  { suit: "#1e4066", suitDark: "#132c48", lapel: "#16334f", tie: "#3b82f6", tieDark: "#2563c4", accent: "#60a5fa", glow: "#2563a8", arena: "#0a1626" },
  R:  { suit: "#5c1a1a", suitDark: "#3d0f0f", lapel: "#451212", tie: "#ef4444", tieDark: "#c22525", accent: "#f87171", glow: "#a82525", arena: "#1c0a0a" },
  NP: { suit: "#33404d", suitDark: "#222b35", lapel: "#28323d", tie: "#94a3b8", tieDark: "#7a8aa0", accent: "#cbd5e1", glow: "#64748b", arena: "#0e141b" },
};

// Deterministic per-official variation so a roster grid doesn't look cloned.
function hashOf(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export default function PlayerModel2D({
  slug,
  name,
  photo,
  party,
  size = 160,
  backdrop = "arena",
  className,
}: {
  slug: string;
  name: string;
  photo?: string;
  party: string;
  size?: number;          // rendered width in px; SVG scales
  backdrop?: "arena" | "none";
  className?: string;
}) {
  const uid = useId().replace(/[:]/g, "");
  const [photoFailed, setPhotoFailed] = useState(false);
  const th = THEMES[(party === "D" || party === "R" ? party : "NP") as keyof typeof THEMES];

  const h = hashOf(slug);
  const tilt = [-3, -1.5, 0, 1.5, 3][h % 5];                 // whole-figure lean
  const tieW = 14 + (h % 3) * 2;                              // tie blade width
  const pocketSquare = h % 4 === 0;                           // some get one
  const haloRotate = (h % 8) * 45;                            // ring dash offset

  const initials = name.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  const showPhoto = photo && !photoFailed;

  return (
    <svg
      /* Cropped in from the 320x360 drawing plane so the bust dominates the
         frame edge-to-edge, 2K-render style, instead of floating in arena. */
      viewBox="28 42 264 318"
      width={size}
      height={size * (318 / 264)}
      className={className}
      role="img"
      aria-label={`${name} player card render`}
      style={{ display: "block" }}
    >
      <defs>
        {/* Posterize the photo slightly: cel/toon look without losing the face */}
        <filter id={`${uid}-cel`} x="-8%" y="-8%" width="116%" height="116%">
          <feComponentTransfer>
            <feFuncR type="discrete" tableValues="0.10 0.28 0.46 0.62 0.78 0.92" />
            <feFuncG type="discrete" tableValues="0.10 0.28 0.46 0.62 0.78 0.92" />
            <feFuncB type="discrete" tableValues="0.10 0.28 0.46 0.62 0.78 0.92" />
          </feComponentTransfer>
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        <clipPath id={`${uid}-head`}>
          {/* Squircle head window: forgiving of every headshot crop we have */}
          <rect x="98" y="66" width="124" height="150" rx="58" ry="64" />
        </clipPath>
        <radialGradient id={`${uid}-glow`} cx="50%" cy="42%" r="62%">
          <stop offset="0%" stopColor={th.glow} stopOpacity="0.55" />
          <stop offset="55%" stopColor={th.glow} stopOpacity="0.18" />
          <stop offset="100%" stopColor={th.glow} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}-suit`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={th.suit} />
          <stop offset="62%" stopColor={th.suit} />
          <stop offset="62.01%" stopColor={th.suitDark} />
          <stop offset="100%" stopColor={th.suitDark} />
        </linearGradient>
      </defs>

      {backdrop === "arena" && (
        <g>
          <rect x="0" y="0" width="320" height="360" rx="18" fill={th.arena} />
          <rect x="0" y="0" width="320" height="360" rx="18" fill={`url(#${uid}-glow)`} />
          {/* Halo ring behind the figure, 2K-render style */}
          <g transform={`rotate(${haloRotate} 160 170)`}>
            <circle cx="160" cy="170" r="118" fill="none" stroke={th.accent} strokeOpacity="0.34"
              strokeWidth="3" strokeDasharray="500 240" strokeLinecap="round" />
          </g>
          <circle cx="160" cy="170" r="132" fill="none" stroke={th.accent} strokeOpacity="0.10" strokeWidth="10" />
          {/* Floor shadow */}
          <ellipse cx="160" cy="348" rx="118" ry="14" fill="#000" opacity="0.42" />
        </g>
      )}

      <g transform={`rotate(${tilt} 160 250)`}>
        {/* ── Suit bust, cel-shaded in two flat tones via hard-stop gradient ── */}
        <path
          d="M34,360 L34,320 C36,286 64,262 96,251 C120,243 138,239 160,239 C182,239 200,243 224,251 C256,262 284,286 286,320 L286,360 Z"
          fill={`url(#${uid}-suit)`}
        />
        {/* Shoulder highlight sliver (light side) */}
        <path d="M40,318 C44,290 66,268 96,256 C88,272 82,292 80,318 L80,360 L40,360 Z"
          fill="#ffffff" opacity="0.06" />
        {/* Shirt V */}
        <path d="M132,241 L160,304 L188,241 C179,236 169,234 160,234 C151,234 141,236 132,241 Z" fill="#f2f1ec" />
        {/* Collar points */}
        <path d="M132,241 L146,262 L136,272 L124,248 Z" fill="#ffffff" />
        <path d="M188,241 L174,262 L184,272 L196,248 Z" fill="#e8e6df" />
        {/* Lapels */}
        <path d="M124,246 L146,268 L120,318 C106,300 104,270 110,252 Z" fill={th.lapel} />
        <path d="M196,246 L174,268 L200,318 C214,300 216,270 210,252 Z" fill={th.suitDark} />
        {/* Tie knot + blade */}
        <path d={`M160,258 L${160 - 11},270 L160,282 L${160 + 11},270 Z`} fill={th.tie} />
        <path d={`M${160 - tieW / 2},280 L${160 + tieW / 2},280 L${160 + tieW / 2 + 3},340 L160,356 L${160 - tieW / 2 - 3},340 Z`} fill={th.tie} />
        <path d={`M160,280 L${160 + tieW / 2},280 L${160 + tieW / 2 + 3},340 L160,356 Z`} fill={th.tieDark} />
        {pocketSquare && <path d="M92,296 L112,290 L110,306 L94,310 Z" fill="#f2f1ec" opacity="0.9" />}

        {/* ── Head: photo in squircle window, oversized 2K-bobble proportion ── */}
        <g>
          {/* Backboard so odd crops/transparent PNGs read as intentional */}
          <rect x="98" y="66" width="124" height="150" rx="58" ry="64" fill={th.suitDark} />
          {showPhoto ? (
            /* Face-biased zoom: oversize the image ~1.35x and bias toward the
               upper-center, where the face sits in tight headshots AND wide
               environmental shots alike. The squircle clip does the cropping. */
            <image
              href={photo}
              x={160 - (132 * 1.35) / 2}
              y={66 - 164 * 0.06}
              width={132 * 1.35}
              height={164 * 1.35}
              preserveAspectRatio="xMidYMin slice"
              clipPath={`url(#${uid}-head)`}
              filter={`url(#${uid}-cel)`}
              onError={() => setPhotoFailed(true)}
            />
          ) : (
            <g>
              <rect x="98" y="66" width="124" height="150" rx="58" ry="64" fill={th.lapel} />
              <text x="160" y="156" textAnchor="middle" fontSize="44" fontWeight="700"
                fill={th.accent} style={{ fontFamily: "var(--font-playfair), serif" }}>
                {initials}
              </text>
            </g>
          )}
          {/* Party rim light on the head window */}
          <rect x="98" y="66" width="124" height="150" rx="58" ry="64" fill="none"
            stroke={th.accent} strokeOpacity="0.55" strokeWidth="2.5" />
        </g>
      </g>
    </svg>
  );
}
