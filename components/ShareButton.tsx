"use client";
import { useState } from "react";
import { SITE_URL } from "@/lib/site";

export interface ShareStat {
  label: string;
  value: string;
}

interface ShareButtonProps {
  toolName: string;
  section: string;        // e.g. "Money", "Elections", "Legislative"
  description: string;    // static fallback description
  stats?: ShareStat[];    // up to 3, reflect the CURRENT view
  summary?: string;       // dynamic one-line summary of the current view state
  light?: boolean;        // light style for dark hero backgrounds (default true)
  /* Live-data card extras. The OG image renders these as real charts so the
     link preview shows the numbers on screen (see /api/og). */
  bar?: { dLabel: string; dPct: number; rLabel: string; rPct: number };   // D-vs-R result bar
  duel?: { dName: string; dCash: number; rName: string; rCash: number };  // cash duel bar
  badge?: string;                                                          // e.g. "Lean D"
}

/* True dynamic share: no screenshots.
   Shares the current URL (filter state lives in the query string via useUrlState),
   a live text summary of what the user is looking at, and the OG image is
   generated server-side at /api/og from the same view state. */
export default function ShareButton({ toolName, section, description, stats, summary, light = true, bar, duel, badge }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const shareText = () =>
    summary ?? `${toolName}. ${description} via The Harris County Project`;

  const currentUrl = () =>
    typeof window !== "undefined" ? window.location.href : SITE_URL;

  const ogUrl = () => {
    const p = new URLSearchParams();
    p.set("tool", toolName);
    p.set("section", section);
    p.set("desc", summary ?? description);
    if (badge) p.set("badge", badge);
    if (bar) p.set("bar", `${bar.dLabel}|${bar.dPct}|${bar.rLabel}|${bar.rPct}`);
    if (duel) p.set("duel", `${duel.dName}|${duel.dCash}|${duel.rName}|${duel.rCash}`);
    (stats ?? []).slice(0, 3).forEach(s => p.append("s", `${s.label}|${s.value}`));
    return `/api/og?${p.toString()}`;
  };

  async function shareNative() {
    const url = currentUrl();
    const text = shareText();
    if (navigator.share) {
      try {
        await navigator.share({ title: `${toolName} · The Harris County Project`, text, url });
        setOpen(false);
        return;
      } catch { /* user cancelled or unsupported. Fall through */ }
    }
    copyLink();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${shareText()}\n${currentUrl()}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  }

  function tweetUrl() {
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText())}&url=${encodeURIComponent(currentUrl())}`;
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 mt-4 ${
          light
            ? "border border-white/25 bg-white/10 text-white/80 hover:bg-white/20 hover:text-white hover:border-white/40"
            : "border border-[#1a3a5c]/20 bg-white text-[#1a3a5c] hover:bg-[#1a3a5c]/5"
        }`}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
          <polyline points="16 6 12 2 8 6"/>
          <line x1="12" y1="2" x2="12" y2="15"/>
        </svg>
        Share
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(10,20,35,0.75)", backdropFilter: "blur(6px)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="relative bg-white rounded-2xl overflow-hidden shadow-2xl max-w-xl w-full"
            style={{ border: "1px solid rgba(26,58,92,0.15)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Live OG preview. Rendered server-side from current view state */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ogUrl()} alt={`${toolName} share preview`} className="w-full block" style={{ aspectRatio: "1200/630", background: "#0f2540" }} />

            <div className="px-5 py-4">
              <p className="text-sm font-semibold text-[#1a3a5c]" style={{ fontFamily: "var(--font-playfair), serif" }}>
                {toolName}
              </p>
              <p className="text-xs text-[#1a3a5c]/60 mt-1 leading-relaxed">{shareText()}</p>
              <p className="text-[10px] text-[#1a3a5c]/40 mt-1 break-all">{currentUrl()}</p>

              <div className="flex gap-2 mt-4 flex-wrap">
                <button
                  onClick={shareNative}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#1a3a5c] text-white hover:bg-[#2563a8] transition-colors"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                  </svg>
                  Share
                </button>
                <button
                  onClick={copyLink}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-[#1a3a5c]/20 text-[#1a3a5c] bg-white hover:bg-[#1a3a5c]/5 transition-colors"
                >
                  {copied ? "✓ Copied" : "Copy link"}
                </button>
                <a
                  href={tweetUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-black text-white hover:bg-gray-800 transition-colors"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  Post
                </a>
              </div>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition-colors text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
