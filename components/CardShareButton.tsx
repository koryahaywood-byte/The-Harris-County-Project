"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  slug: string;
  name: string;
  office: string;
}

export default function CardShareButton({ slug, name, office }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const cardUrl = () =>
    typeof window !== "undefined"
      ? `${window.location.origin}/politicians/${slug}/card`
      : `https://the-harris-county-project.vercel.app/politicians/${slug}/card`;

  const shareText = `${name} · ${office}. Via The Harris County Project`;

  async function shareNative() {
    const url = cardUrl();
    if (navigator.share) {
      try {
        await navigator.share({ title: `${name} · Official Card`, text: shareText, url });
        setOpen(false);
        return;
      } catch { /* cancelled */ }
    }
    copyLink();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(cardUrl());
      setCopied(true);
      setTimeout(() => { setCopied(false); setOpen(false); }, 1800);
    } catch { /* unavailable */ }
  }

  function tweetUrl() {
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(cardUrl())}`;
  }

  // close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="pressable flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-[0.14em] transition-all"
        style={{
          background: "linear-gradient(135deg, rgba(212,175,55,0.22) 0%, rgba(251,191,36,0.12) 100%)",
          color: "#fbbf24",
          border: "1px solid rgba(212,175,55,0.5)",
          boxShadow: open ? "0 0 18px rgba(212,175,55,0.35)" : "0 0 0 rgba(212,175,55,0)",
          transition: "box-shadow 0.2s",
        }}
      >
        {/* card icon */}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <rect x="2" y="3" width="20" height="14" rx="2"/>
          <path d="M8 21h8M12 17v4"/>
          <path d="M7 8h10M7 11h6"/>
        </svg>
        Share Card
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.18s" }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div
          className="absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2 w-64 rounded-2xl overflow-hidden z-50"
          style={{
            background: "rgba(10,22,38,0.96)",
            border: "1px solid rgba(212,175,55,0.25)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
          }}
        >
          {/* header */}
          <div className="px-4 py-3 border-b border-white/8">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">Share This Card</p>
            <p className="text-xs font-semibold text-white/70 mt-0.5 truncate">{name}</p>
          </div>

          <div className="p-3 flex flex-col gap-2">
            {/* Copy link */}
            <button
              onClick={copyLink}
              className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors text-left"
              style={{
                background: copied ? "rgba(212,175,55,0.18)" : "rgba(255,255,255,0.06)",
                color: copied ? "#fbbf24" : "rgba(255,255,255,0.75)",
                border: copied ? "1px solid rgba(212,175,55,0.4)" : "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {copied ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="9" y="9" width="13" height="13" rx="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              )}
              {copied ? "Link copied!" : "Copy card link"}
            </button>

            {/* Native share */}
            <button
              onClick={shareNative}
              className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors text-left"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              Share via...
            </button>

            {/* X / Twitter */}
            <a
              href={tweetUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Post on X
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
