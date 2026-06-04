"use client";
import { useState, useRef, useCallback } from "react";
import { toPng } from "html-to-image";

export interface ShareStat {
  label: string;
  value: string;
}

interface ShareButtonProps {
  toolName: string;
  section: string;    // e.g. "Money", "Elections", "Legislative"
  description: string;
  stats?: ShareStat[]; // up to 3
}

export default function ShareButton({ toolName, section, description, stats }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const capture = useCallback(async () => {
    if (!cardRef.current) return;
    setCapturing(true);
    try {
      // ensure fonts are loaded
      await document.fonts.ready;
      const url = await toPng(cardRef.current, {
        pixelRatio: 2,
        width: 1200,
        height: 630,
        style: { display: "flex" },
      });
      setDataUrl(url);
    } catch (e) {
      console.error("Share capture failed:", e);
    }
    setCapturing(false);
  }, []);

  function openModal() {
    setOpen(true);
    setDataUrl(null);
    // slight delay so modal is mounted before capture
    setTimeout(capture, 80);
  }

  function download() {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.download = `harris-county-${toolName.toLowerCase().replace(/\s+/g, "-")}.png`;
    a.href = dataUrl;
    a.click();
  }

  async function shareNative() {
    if (!dataUrl) return;
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `${toolName}.png`, { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `${toolName} · The Harris County Project`,
          text: description,
          files: [file],
        });
        return;
      }
    } catch {}
    download();
  }

  function tweetUrl() {
    const text = encodeURIComponent(`${toolName} — check this out via @HarrisCountyProj\n\nThe Harris County Project: civic data for Houston & Harris County.`);
    const url = encodeURIComponent("https://the-harris-county-project.vercel.app");
    return `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
  }

  // ── Card that gets screenshotted (off-screen while open) ──────────────────
  const CardEl = (
    <div
      ref={cardRef}
      style={{
        width: 1200,
        height: 630,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "linear-gradient(135deg, #1a3a5c 0%, #0f2540 55%, #1a3a5c 100%)",
        fontFamily: "'Outfit', system-ui, sans-serif",
        padding: "56px 72px",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* radial glow */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 70% 80% at 80% 50%, rgba(37,99,168,0.45), transparent)",
      }} />
      {/* subtle grid lines */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "repeating-linear-gradient(0deg,rgba(255,255,255,0.03) 0px,rgba(255,255,255,0.03) 1px,transparent 1px,transparent 60px), repeating-linear-gradient(90deg,rgba(255,255,255,0.03) 0px,rgba(255,255,255,0.03) 1px,transparent 1px,transparent 60px)",
      }} />

      {/* Top: eyebrow + site brand */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase",
          color: "rgba(147,210,255,0.7)",
        }}>
          The Harris County Project · {section}
        </div>
        <div style={{
          fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
          color: "rgba(255,255,255,0.3)",
        }}>
          the-harris-county-project.vercel.app
        </div>
      </div>

      {/* Center: tool name + description */}
      <div style={{ position: "relative" }}>
        <div style={{
          fontSize: 64, fontWeight: 700, color: "#ffffff",
          fontFamily: "'Playfair Display', Georgia, serif",
          lineHeight: 1.1, marginBottom: 20,
          letterSpacing: "-0.01em",
        }}>
          {toolName}
        </div>
        <div style={{
          fontSize: 20, color: "rgba(255,255,255,0.65)", maxWidth: 680,
          lineHeight: 1.55, fontWeight: 400,
        }}>
          {description}
        </div>

        {/* Stats chips */}
        {stats && stats.length > 0 && (
          <div style={{ display: "flex", gap: 16, marginTop: 36 }}>
            {stats.map((s) => (
              <div key={s.label} style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: 12, padding: "14px 22px",
              }}>
                <div style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: "0.14em",
                  textTransform: "uppercase", color: "rgba(147,210,255,0.7)",
                  marginBottom: 4,
                }}>
                  {s.label}
                </div>
                <div style={{
                  fontSize: 28, fontWeight: 700, color: "#fff",
                  fontFamily: "'Playfair Display', Georgia, serif",
                }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom: "Civic data for Houston & Harris County" */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        position: "relative",
        borderTop: "1px solid rgba(255,255,255,0.1)",
        paddingTop: 20,
      }}>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>
          Civic data for Houston & Harris County
        </div>
        <div style={{
          fontSize: 13, fontWeight: 700, color: "rgba(147,210,255,0.6)",
          letterSpacing: "0.06em", textTransform: "uppercase",
        }}>
          Free · Open · Independent
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Trigger button ── */}
      <button
        onClick={openModal}
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold
          border border-white/25 bg-white/10 text-white/80
          hover:bg-white/20 hover:text-white hover:border-white/40
          transition-all duration-200 mt-4"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
          <polyline points="16 6 12 2 8 6"/>
          <line x1="12" y1="2" x2="12" y2="15"/>
        </svg>
        Share
      </button>

      {/* ── Off-screen card for capture ── */}
      {open && (
        <div style={{
          position: "fixed", left: -9999, top: -9999,
          width: 1200, height: 630, zIndex: -1, pointerEvents: "none",
        }}>
          {CardEl}
        </div>
      )}

      {/* ── Modal ── */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(10,20,35,0.75)", backdropFilter: "blur(6px)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-[#f5f3ef] rounded-2xl overflow-hidden shadow-2xl max-w-2xl w-full"
            style={{ border: "1px solid rgba(26,58,92,0.15)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* inner bezel */}
            <div className="m-2 rounded-xl overflow-hidden" style={{ boxShadow: "inset 0 1px 4px rgba(0,0,0,0.08)" }}>

              {/* Preview */}
              <div className="bg-[#1a3a5c]/10 flex items-center justify-center" style={{ minHeight: 240 }}>
                {capturing && (
                  <div className="flex flex-col items-center gap-3 py-12">
                    <div className="w-8 h-8 border-2 border-[#1a3a5c] border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-[#1a3a5c]/60 font-medium uppercase tracking-wider">Generating card…</p>
                  </div>
                )}
                {!capturing && dataUrl && (
                  <img
                    src={dataUrl}
                    alt="Share card preview"
                    className="w-full rounded-lg"
                    style={{ display: "block" }}
                  />
                )}
              </div>

              {/* Actions */}
              <div className="bg-white px-5 py-4 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-semibold text-[#1a3a5c]" style={{ fontFamily: "var(--font-playfair), serif" }}>
                    {toolName}
                  </p>
                  <p className="text-xs text-[#1a3a5c]/50 mt-0.5">The Harris County Project</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={download}
                    disabled={!dataUrl}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold
                      border border-[#1a3a5c]/20 text-[#1a3a5c] bg-white
                      hover:bg-[#1a3a5c]/5 disabled:opacity-40 transition-colors"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Download
                  </button>
                  <button
                    onClick={shareNative}
                    disabled={!dataUrl}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold
                      bg-[#1a3a5c] text-white
                      hover:bg-[#2563a8] disabled:opacity-40 transition-colors"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                    </svg>
                    Share
                  </button>
                  <a
                    href={tweetUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold
                      bg-black text-white hover:bg-gray-800 transition-colors"
                    style={{ opacity: dataUrl ? 1 : 0.4, pointerEvents: dataUrl ? "auto" : "none" }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    Post
                  </a>
                </div>
              </div>
            </div>

            {/* Close */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 text-white flex items-center justify-center hover:bg-black/40 transition-colors text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
