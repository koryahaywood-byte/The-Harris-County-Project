"use client";

export type SourceType = "news" | "government" | "api" | "court" | "law";

export interface Source {
  label: string;          // e.g. "Houston Chronicle"
  detail?: string;        // e.g. "May 14, 2026 · John Lomax V"
  type: SourceType;
  url?: string;
}

const TYPE_CONFIG: Record<SourceType, { icon: string; color: string; bg: string }> = {
  news:       { icon: "N", color: "#1a3a5c", bg: "#e0eaf4" },
  government: { icon: "G", color: "#1a5c3a", bg: "#e0f4ea" },
  api:        { icon: "A", color: "#5c3a1a", bg: "#f4ede0" },
  court:      { icon: "C", color: "#5c1a3a", bg: "#f4e0ea" },
  law:        { icon: "L", color: "#3a1a5c", bg: "#eae0f4" },
};

/* ── Inline pill badge — use on individual beats/cards ──────────────────── */
export function SourceBadge({ source }: { source: Source }) {
  const cfg = TYPE_CONFIG[source.type];
  const content = (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 ring-1 ring-black/8 text-[9px] font-bold uppercase tracking-widest cursor-default"
      style={{ background: cfg.bg, color: cfg.color }}
      title={source.detail}
    >
      <span
        className="inline-flex items-center justify-center w-3 h-3 rounded-full text-[7px] font-black"
        style={{ background: cfg.color, color: "#fff" }}
      >
        {cfg.icon}
      </span>
      {source.label}
      {source.detail && <span className="opacity-60 normal-case font-medium tracking-normal">· {source.detail}</span>}
    </span>
  );
  if (source.url) {
    return (
      <a href={source.url} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
        {content}
      </a>
    );
  }
  return content;
}

/* ── Full evidence panel — use at the bottom of story tabs ──────────────── */
export function EvidencePanel({ sources, className }: { sources: Source[]; className?: string }) {
  return (
    <div className={`rounded-[1.75rem] bg-white/60 ring-1 ring-black/8 p-[5px] ${className ?? ""}`}>
      <div className="rounded-[1.35rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[var(--accent)]">Verified Sources</p>
        </div>
        <div className="space-y-2">
          {sources.map((s, i) => (
            <div key={i} className="flex items-start gap-3">
              <span
                className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-black mt-0.5"
                style={{ background: TYPE_CONFIG[s.type].color, color: "#fff" }}
              >
                {TYPE_CONFIG[s.type].icon}
              </span>
              <div className="min-w-0">
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-[var(--accent-light)] hover:underline underline-offset-2 leading-snug">
                    {s.label}
                  </a>
                ) : (
                  <p className="text-[11px] font-semibold text-[var(--foreground)] leading-snug">{s.label}</p>
                )}
                {s.detail && (
                  <p className="text-[10px] text-[var(--muted)] leading-snug">{s.detail}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
