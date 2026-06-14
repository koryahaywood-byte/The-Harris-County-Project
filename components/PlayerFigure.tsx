"use client";

// PlayerFigure — the official's character model. A stylized, cel-shaded
// game-character body (tailored suit, hands in pockets, heroic stance)
// that stands on the profile's character-select arena. The photo head
// floats above the SVG with the liquid-glass ring, at exactly the same
// coordinates as the previous figure so the overlay math is unchanged.
// Party-themed: navy (D), oxblood (R), charcoal (NP). Idle breathe + sway.

const THEMES = {
  D:  { base: "#1a3a5c", mid: "#27496e", lite: "#37618c", dark: "#0d1f30", accent: "#3b82f6", ring: "#60a5fa", tie: "#2f6bbf", tieD: "#1d4a8a" },
  R:  { base: "#5f1717", mid: "#7a2020", lite: "#94302c", dark: "#330b0b", accent: "#ef4444", ring: "#f87171", tie: "#b32626", tieD: "#7e1414" },
  NP: { base: "#2f3a46", mid: "#3e4c5b", lite: "#516274", dark: "#1a2129", accent: "#94a3b8", ring: "#cbd5e1", tie: "#64748b", tieD: "#475569" },
} as const;

export default function PlayerFigure({ slug, photo, party, name }: {
  slug: string; photo?: string; party: string; name: string;
}) {
  const t = THEMES[(party === "D" || party === "R" ? party : "NP") as keyof typeof THEMES];
  const id = (s: string) => `pf-${s}-${slug}`;

  return (
    <div className="relative select-none" style={{ width: "100%", aspectRatio: "560/600" }}>
      <style>{`
        @keyframes pf-breathe { 0%,100% { transform: translateY(0) }   50% { transform: translateY(-4px) } }
        @keyframes pf-sway    { 0%,100% { transform: rotate(0deg) }    50% { transform: rotate(0.7deg) } }
        @keyframes pf-photo   { 0%,100% { transform: translateY(0) scale(1) } 50% { transform: translateY(-5px) scale(1.012) } }
        .pf-body  { animation: pf-breathe 4.6s ease-in-out infinite; transform-origin: 280px 560px; }
        .pf-sway  { animation: pf-sway 7s ease-in-out infinite; transform-origin: 280px 420px; }
        .pf-photo { animation: pf-photo 5.2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .pf-body, .pf-sway, .pf-photo { animation: none } }
      `}</style>

      <svg viewBox="0 0 560 600" className="w-full h-full" aria-hidden="true">
        <defs>
          {/* jacket: lit from upper-left, cel-style hard-ish falloff */}
          <linearGradient id={id("jkt")} x1="0" y1="0" x2="1" y2="0.25">
            <stop offset="0%" stopColor={t.lite} />
            <stop offset="38%" stopColor={t.base} />
            <stop offset="100%" stopColor={t.dark} />
          </linearGradient>
          <linearGradient id={id("slv")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={t.mid} />
            <stop offset="100%" stopColor={t.dark} />
          </linearGradient>
          <linearGradient id={id("trs")} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={t.mid} />
            <stop offset="55%" stopColor={t.base} />
            <stop offset="100%" stopColor={t.dark} />
          </linearGradient>
          <linearGradient id={id("tie")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={t.tie} />
            <stop offset="100%" stopColor={t.tieD} />
          </linearGradient>
        </defs>

        <g className="pf-body">
          <g className="pf-sway">

            {/* ── shadow anchor under feet ── */}
            <ellipse cx="280" cy="576" rx="98" ry="11" fill={t.dark} opacity="0.22" />

            {/* ── trousers ── */}
            {/* left leg */}
            <path d="M 232 398
                     C 228 450 224 505 228 552
                     L 268 554
                     C 270 505 271 452 272 408 Z"
              fill={`url(#${id("trs")})`} stroke={t.dark} strokeWidth="2" strokeLinejoin="round" />
            {/* right leg */}
            <path d="M 288 408
                     C 289 452 290 505 292 554
                     L 332 552
                     C 336 505 332 450 328 398 Z"
              fill={`url(#${id("trs")})`} stroke={t.dark} strokeWidth="2" strokeLinejoin="round" />
            {/* crease highlights */}
            <path d="M 248 410 C 246 460 245 510 247 550" stroke={t.lite} strokeWidth="2.5" fill="none" opacity="0.5" strokeLinecap="round" />
            <path d="M 310 410 C 312 460 313 510 311 550" stroke={t.lite} strokeWidth="2.5" fill="none" opacity="0.35" strokeLinecap="round" />

            {/* ── shoes ── */}
            <path d="M 226 552 L 268 554 L 269 566 C 269 572 264 575 256 575 L 228 575 C 219 575 215 570 217 563 Z"
              fill={t.dark} stroke={t.dark} strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M 292 554 L 334 552 L 343 563 C 345 570 341 575 332 575 L 304 575 C 296 575 291 572 291 566 Z"
              fill={t.dark} stroke={t.dark} strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M 224 561 L 266 562 M 294 562 L 336 561" stroke={t.lite} strokeWidth="1.4" opacity="0.4" strokeLinecap="round" />

            {/* ── shirt + tie (behind jacket) ── */}
            <path d="M 252 212 L 308 212 L 300 290 L 260 290 Z" fill="#f3f4f6" stroke="#d6d3cd" strokeWidth="1.5" />
            {/* collar */}
            <path d="M 252 212 L 280 238 L 308 212 L 296 206 L 280 224 L 264 206 Z" fill="#ffffff" stroke="#d6d3cd" strokeWidth="1.5" strokeLinejoin="round" />
            {/* tie knot + blade */}
            <path d="M 271 226 L 289 226 L 284 240 L 276 240 Z" fill={`url(#${id("tie")})`} stroke={t.tieD} strokeWidth="1" />
            <path d="M 276 240 L 284 240 L 291 330 L 280 348 L 269 330 Z" fill={`url(#${id("tie")})`} stroke={t.tieD} strokeWidth="1" strokeLinejoin="round" />
            <path d="M 279 244 L 282 244 L 286 326" stroke="#ffffff" strokeWidth="1.2" opacity="0.18" fill="none" />

            {/* ── neck ── */}
            <path d="M 263 184 L 297 184 L 295 214 L 265 214 Z" fill="#e8c39e" stroke="#c9a07a" strokeWidth="1.5" />

            {/* ── jacket torso ── */}
            <path d="M 280 405
                     C 245 408 222 404 216 396
                     C 208 350 200 290 206 252
                     C 210 234 224 224 244 218
                     L 264 210
                     C 268 232 273 244 280 252
                     C 287 244 292 232 296 210
                     L 316 218
                     C 336 224 350 234 354 252
                     C 360 290 352 350 344 396
                     C 338 404 315 408 280 405 Z"
              fill={`url(#${id("jkt")})`} stroke={t.dark} strokeWidth="2.5" strokeLinejoin="round" />

            {/* lapels */}
            <path d="M 264 210 L 244 218 C 250 250 262 274 280 290 C 277 270 272 240 264 210 Z"
              fill={t.mid} stroke={t.dark} strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M 296 210 L 316 218 C 310 250 298 274 280 290 C 283 270 288 240 296 210 Z"
              fill={t.dark} stroke={t.dark} strokeWidth="1.8" strokeLinejoin="round" />
            {/* jacket closure + buttons */}
            <path d="M 280 290 C 279 326 279 362 280 402" stroke={t.dark} strokeWidth="2" fill="none" />
            <circle cx="285" cy="318" r="3.2" fill={t.accent} />
            <circle cx="285" cy="348" r="3.2" fill={t.accent} opacity="0.85" />
            {/* chest pocket square */}
            <path d="M 240 300 L 258 298 L 256 306 L 246 308 Z" fill="#ffffff" opacity="0.9" />
            {/* left-side cel highlight */}
            <path d="M 214 262 C 212 300 216 348 222 386" stroke="#ffffff" strokeWidth="3" opacity="0.14" fill="none" strokeLinecap="round" />

            {/* ── sleeves: hands in pockets ── */}
            {/* left arm */}
            <path d="M 208 250
                     C 192 268 184 300 184 330
                     C 184 356 192 378 208 392
                     L 238 396
                     C 230 378 224 352 222 322
                     C 221 296 218 270 224 252 Z"
              fill={`url(#${id("slv")})`} stroke={t.dark} strokeWidth="2.5" strokeLinejoin="round" />
            {/* right arm */}
            <path d="M 352 250
                     C 368 268 376 300 376 330
                     C 376 356 368 378 352 392
                     L 322 396
                     C 330 378 336 352 338 322
                     C 339 296 342 270 336 252 Z"
              fill={`url(#${id("slv")})`} stroke={t.dark} strokeWidth="2.5" strokeLinejoin="round" />
            {/* sleeve cel highlights */}
            <path d="M 196 280 C 190 306 190 340 198 368" stroke="#ffffff" strokeWidth="2.5" opacity="0.13" fill="none" strokeLinecap="round" />
            <path d="M 364 280 C 370 306 370 340 362 368" stroke="#ffffff" strokeWidth="2.5" opacity="0.10" fill="none" strokeLinecap="round" />
            {/* pocket flaps where the hands disappear */}
            <path d="M 212 390 L 242 394" stroke={t.dark} strokeWidth="3" strokeLinecap="round" />
            <path d="M 348 390 L 318 394" stroke={t.dark} strokeWidth="3" strokeLinecap="round" />

            {/* jacket hem over trousers */}
            <path d="M 218 394 C 240 406 320 406 342 394 L 344 402 C 320 412 240 412 216 402 Z"
              fill={t.dark} opacity="0.9" />

            {/* accent pin on lapel */}
            <circle cx="252" cy="252" r="4" fill={t.accent}>
              <animate attributeName="opacity" values="0.7;1;0.7" dur="3s" repeatCount="indefinite" />
            </circle>
          </g>
        </g>

        {/* head placeholder disc behind the photo (shows if photo missing) */}
        <circle cx="280" cy="135" r="63" fill={t.mid} stroke={t.dark} strokeWidth="2.5" />
        {!photo && (
          <text x="280" y="150" textAnchor="middle" fontSize="42" fontWeight="700" fill="#ffffff" opacity="0.85"
            fontFamily="var(--font-outfit), sans-serif">
            {name.split(" ").map(w => w[0]).slice(0, 2).join("")}
          </text>
        )}
      </svg>

      {/* ── Photo head — same coordinates/frame as before ── */}
      {photo && (
        <div className="pf-photo absolute pointer-events-none"
          style={{ left: "calc(50% - 14%)", top: "calc(22.5% - 14%)", width: "28%", aspectRatio: "1" }}>
          <div className="w-full h-full rounded-full overflow-hidden"
            style={{
              boxShadow: `0 0 0 3px ${t.ring}, 0 0 0 6px rgba(255,255,255,0.55), 0 12px 32px rgba(26,58,92,0.28)`,
              backdropFilter: "blur(2px)",
            }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt={name} className="w-full h-full object-cover object-center" style={{ display: "block", filter: "url('#hcp-cel')" }} />
          </div>
        </div>
      )}
    </div>
  );
}
