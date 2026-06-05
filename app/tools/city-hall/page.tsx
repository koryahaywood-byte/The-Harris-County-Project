"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import ScrollReveal from "@/components/ScrollReveal";
import type { CouncilMeetingData, AgendaItem } from "@/app/api/city-hall/route";

/* ─── Design tokens ────────────────────────────────────────────────────────── */
const SIG_COLOR  = { high: "#b91c1c", medium: "#d97706", low: "#6b7280" } as const;
const SIG_ICON   = { high: "!", medium: "~", low: "·" } as const;
const SIG_LABEL  = { high: "Major", medium: "Notable", low: "Procedural" } as const;

const CAT_META: Record<string, { color: string; icon: string }> = {
  Budget:          { color: "#0f766e", icon: "$" },
  Development:     { color: "#7c3aed", icon: "D" },
  "Public Safety": { color: "#1d4ed8", icon: "S" },
  Transportation:  { color: "#0891b2", icon: "T" },
  Housing:         { color: "#b45309", icon: "H" },
  Environment:     { color: "#15803d", icon: "E" },
  Personnel:       { color: "#6b7280", icon: "P" },
  Other:           { color: "#4b5563", icon: "O" },
};
const catColor = (c: string) => CAT_META[c]?.color ?? "#1a3a5c";
const catIcon  = (c: string) => CAT_META[c]?.icon  ?? "?";

/* ─── Category breakdown bar ───────────────────────────────────────────────── */
function BreakdownBar({ items }: { items: AgendaItem[] }) {
  if (!items.length) return null;
  const counts: Record<string, number> = {};
  for (const it of items) counts[it.category] = (counts[it.category] ?? 0) + 1;
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const total  = items.length;
  return (
    <div className="mb-8">
      {/* Segmented bar */}
      <div className="flex h-2 rounded-full overflow-hidden gap-px mb-3">
        {sorted.map(([cat, n]) => (
          <div
            key={cat}
            title={`${cat}: ${n}`}
            style={{
              width: `${(n / total) * 100}%`,
              background: catColor(cat),
              transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
            }}
          />
        ))}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {sorted.map(([cat, n]) => (
          <span key={cat} className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: "#6b7280" }}>
            <span className="inline-block w-2 h-2 rounded-sm" style={{ background: catColor(cat) }} />
            {cat} <span className="font-bold" style={{ color: catColor(cat) }}>{n}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Significance heat row ─────────────────────────────────────────────────── */
function HeatRow({ items }: { items: AgendaItem[] }) {
  const counts = { high: 0, medium: 0, low: 0 };
  for (const it of items) counts[it.significance]++;
  return (
    <div className="flex gap-3 mb-8">
      {(["high", "medium", "low"] as const).map((s) => (
        <div
          key={s}
          className="flex-1 rounded-xl p-3 text-center ring-1 ring-black/6"
          style={{ background: `${SIG_COLOR[s]}09` }}
        >
          <p className="text-2xl font-bold mb-0.5" style={{ color: SIG_COLOR[s], fontFamily: "var(--font-playfair), serif" }}>
            {counts[s]}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: SIG_COLOR[s] }}>
            {SIG_LABEL[s]}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ─── Item card ─────────────────────────────────────────────────────────────── */
function ItemCard({ item, index }: { item: AgendaItem; index: number }) {
  const [open, setOpen] = useState(false);
  const cc = catColor(item.category);
  const sc = SIG_COLOR[item.significance];

  return (
    <div
      className="card-lift rounded-2xl overflow-hidden ring-1 ring-black/7 cursor-pointer"
      style={{
        background: "#fff",
        boxShadow: "0 1px 4px rgba(26,58,92,0.05), inset 0 1px 0 rgba(255,255,255,0.9)",
        animationDelay: `${index * 60}ms`,
      }}
      onClick={() => setOpen((v) => !v)}
    >
      {/* Top accent bar: significance color */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${sc}, ${cc})` }} />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-3">
          {/* Category icon badge */}
          <div
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black"
            style={{ background: `${cc}15`, color: cc }}
          >
            {catIcon(item.category)}
          </div>

          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3
              className="text-sm font-bold leading-snug mb-1"
              style={{ fontFamily: "var(--font-playfair), serif", color: "#1a3a5c" }}
            >
              {item.title}
            </h3>
            {/* One-line summary */}
            <p className="text-xs leading-relaxed" style={{ color: "#6b7280" }}>
              {item.summary}
            </p>
          </div>

          {/* Significance dot + expand chevron */}
          <div className="shrink-0 flex flex-col items-center gap-1.5 pt-0.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: sc }}
              title={SIG_LABEL[item.significance]}
            />
            <svg
              width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#9ca3af" strokeWidth="1.5"
              style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}
            >
              <path d="M2 3.5l3 3 3-3" />
            </svg>
          </div>
        </div>

        {/* Expandable: politicians + news */}
        {open && (
          <div className="mt-3 pt-3 border-t border-black/5 space-y-2">
            {/* Politicians */}
            {item.politicians.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {item.politicians.map((pol) => (
                  <Link
                    key={pol}
                    href={`/politicians/${pol.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, "-")}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors duration-150"
                    style={{ background: "rgba(26,58,92,0.07)", color: "#1a3a5c", border: "1px solid rgba(26,58,92,0.13)" }}
                  >
                    {pol}
                  </Link>
                ))}
              </div>
            )}
            {/* News hits */}
            {item.newsHits.length > 0 && (
              <div className="space-y-1">
                {item.newsHits.slice(0, 3).map((hit, i) => (
                  <a
                    key={i}
                    href={hit.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-baseline gap-1.5 text-[11px] hover:underline leading-snug"
                    style={{ color: "#2563a8" }}
                  >
                    <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide" style={{ color: "#9ca3af" }}>
                      {hit.source || "News"}
                    </span>
                    <span className="line-clamp-1">{hit.title}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer badges row (always visible) */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span
            className="text-[9px] font-bold uppercase tracking-[0.15em] px-1.5 py-0.5 rounded"
            style={{ background: `${cc}12`, color: cc }}
          >
            {item.category}
          </span>
          {item.politicians.length > 0 && (
            <span className="text-[10px]" style={{ color: "#9ca3af" }}>
              {item.politicians.length} official{item.politicians.length !== 1 ? "s" : ""}
            </span>
          )}
          {item.newsHits.length > 0 && (
            <span className="ml-auto text-[10px] font-semibold flex items-center gap-1" style={{ color: "#2563a8" }}>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="1" y="2" width="10" height="8" rx="1"/><path d="M4 5h4M4 7h2"/>
              </svg>
              {item.newsHits.length} article{item.newsHits.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────────────── */
export default function CityHallPage() {
  const [data, setData]     = useState<CouncilMeetingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">("all");

  useEffect(() => {
    fetch("/api/city-hall")
      .then((r) => { if (!r.ok) throw new Error(`API error ${r.status}`); return r.json(); })
      .then((d) => { if (d.error) throw new Error(d.error); setData(d); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const allItems      = data?.items ?? [];
  const displayed     = filter === "all" ? allItems : allItems.filter((i) => i.significance === filter);
  const highCount     = allItems.filter((i) => i.significance === "high").length;

  return (
    <div style={{ background: "var(--bg, #f5f3ef)", minHeight: "100vh", fontFamily: "var(--font-outfit), sans-serif" }}>
      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #1a3a5c 0%, #0f2540 60%, #162e4a 100%)",
          paddingTop: "3.5rem",
          paddingBottom: "3rem",
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 70% 60% at 80% 40%, rgba(37,99,168,0.18) 0%, transparent 70%)",
        }} />
        <div className="relative max-w-4xl mx-auto px-5">
          <p className="text-sky-300 text-xs font-bold uppercase tracking-[0.22em] mb-3">City Hall Story Engine</p>
          <h1
            className="text-3xl md:text-4xl font-bold text-white mb-3"
            style={{ fontFamily: "var(--font-playfair), serif", lineHeight: 1.18 }}
          >
            What Happened at<br />Houston City Council
          </h1>
          <p className="text-white/45 text-sm max-w-sm">
            Tuesday meetings. Wednesday coverage. Structured here.
          </p>
          {data && (
            <p className="text-sky-200/60 text-xs font-medium mt-3">
              {data.date} · {allItems.length} items · {highCount} major
              {data.cached && <span className="ml-2 text-white/25">cached</span>}
            </p>
          )}
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-5 py-8">
        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-3 py-16 justify-center">
            <span className="relative flex h-3 w-3">
              <span className="alive-halo absolute inline-flex h-full w-full rounded-full bg-sky-400" />
              <span className="alive-pulse relative inline-flex h-3 w-3 rounded-full bg-sky-400" />
            </span>
            <span className="text-sm" style={{ color: "#7a8ba0" }}>Fetching latest council meeting...</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl ring-1 ring-red-200 p-5 mb-8" style={{ background: "#fef2f2", color: "#7f1d1d" }}>
            <p className="font-semibold text-sm mb-1">Could not load latest meeting</p>
            <p className="text-xs opacity-70">{error} — check <a href="https://emilytakesnotes.com" target="_blank" rel="noopener noreferrer" className="underline">emilytakesnotes.com</a></p>
          </div>
        )}

        {data && (
          <ScrollReveal>
            {/* Story lede */}
            <div className="mb-8">
              <p
                className="text-2xl md:text-3xl font-bold leading-snug mb-3"
                style={{ fontFamily: "var(--font-playfair), serif", color: "#1a3a5c" }}
              >
                {data.lede || data.meetingTitle}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: "#9ca3af" }}>
                  via{" "}
                  <a
                    href={data.emilyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold hover:underline"
                    style={{ color: "#2563a8" }}
                  >
                    Emily Takes Notes
                  </a>
                  {" "}· {data.date}
                </span>
              </div>
            </div>

            {/* Visual breakdown */}
            {allItems.length > 0 && (
              <>
                <HeatRow items={allItems} />
                <BreakdownBar items={allItems} />

                {/* Filter pills */}
                <div className="flex gap-2 mb-5 flex-wrap items-center">
                  {(["all", "high", "medium", "low"] as const).map((f) => {
                    const count = f === "all" ? allItems.length : allItems.filter((i) => i.significance === f).length;
                    const col = f === "all" ? "#1a3a5c" : SIG_COLOR[f];
                    return (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className="px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 capitalize"
                        style={
                          filter === f
                            ? { background: col, color: "#fff" }
                            : { background: `${col}10`, color: col, border: `1px solid ${col}30` }
                        }
                      >
                        {f === "all" ? `All (${count})` : `${SIG_LABEL[f]} (${count})`}
                      </button>
                    );
                  })}
                  <span className="ml-auto text-[10px]" style={{ color: "#9ca3af" }}>
                    tap card to expand
                  </span>
                </div>

                {/* Cards grid */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {displayed.map((item, i) => (
                    <ItemCard key={item.id} item={item} index={i} />
                  ))}
                </div>

                <p className="text-[10px] text-center mt-6" style={{ color: "#b0bec8" }}>
                  Summarized by Claude Haiku · News via Google News RSS
                </p>
              </>
            )}
          </ScrollReveal>
        )}
      </div>
    </div>
  );
}
