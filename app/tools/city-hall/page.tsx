"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import ScrollReveal from "@/components/ScrollReveal";
import type { CouncilMeetingData, AgendaItem } from "@/app/api/city-hall/route";

/* ─── Helpers ──────────────────────────────────────────────────────────────── */
function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="h-px flex-1" style={{ background: "rgba(26,58,92,0.15)" }} />
      <span className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: "var(--muted, #7a8ba0)" }}>
        {label}
      </span>
      <div className="h-px flex-1" style={{ background: "rgba(26,58,92,0.15)" }} />
    </div>
  );
}

const SIGNIFICANCE_COLOR = { high: "#b91c1c", medium: "#1a3a5c", low: "#6b7280" };
const SIGNIFICANCE_LABEL = { high: "Major", medium: "Notable", low: "Procedural" };

const CATEGORY_COLORS: Record<string, string> = {
  Budget: "#0f766e",
  Development: "#7c3aed",
  "Public Safety": "#1d4ed8",
  Transportation: "#0891b2",
  Housing: "#b45309",
  Environment: "#15803d",
  Personnel: "#6b7280",
  Other: "#4b5563",
};

function categoryColor(cat: string) {
  return CATEGORY_COLORS[cat] ?? "#1a3a5c";
}

function ItemCard({ item }: { item: AgendaItem }) {
  const sigColor = SIGNIFICANCE_COLOR[item.significance];
  const catColor = categoryColor(item.category);
  return (
    <div
      className="card-lift rounded-xl ring-1 ring-black/8 p-0 overflow-hidden"
      style={{ background: "#fff", boxShadow: "0 1px 4px rgba(26,58,92,0.06), inset 0 1px 0 rgba(255,255,255,0.8)" }}
    >
      {/* Significance stripe */}
      <div style={{ height: 3, background: sigColor }} />
      <div className="p-5">
        {/* Meta row */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span
            className="text-[10px] font-bold uppercase tracking-[0.18em] px-2 py-0.5 rounded-full"
            style={{ background: `${sigColor}14`, color: sigColor }}
          >
            {SIGNIFICANCE_LABEL[item.significance]}
          </span>
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.15em] px-2 py-0.5 rounded-full"
            style={{ background: `${catColor}12`, color: catColor }}
          >
            {item.category}
          </span>
        </div>
        {/* Title */}
        <h3
          className="text-base font-bold mb-2 leading-snug"
          style={{ fontFamily: "var(--font-playfair), serif", color: "#1a3a5c" }}
        >
          {item.title}
        </h3>
        {/* Summary */}
        <p className="text-sm leading-relaxed mb-3" style={{ color: "#4a5568" }}>
          {item.summary}
        </p>
        {/* Politicians */}
        {item.politicians.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {item.politicians.map((pol) => {
              const slug = pol
                .toLowerCase()
                .replace(/[^a-z0-9 ]/g, "")
                .replace(/\s+/g, "-");
              return (
                <Link
                  key={pol}
                  href={`/politicians/${slug}`}
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-full transition-colors duration-200"
                  style={{
                    background: "rgba(26,58,92,0.07)",
                    color: "#1a3a5c",
                    border: "1px solid rgba(26,58,92,0.15)",
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLElement).style.background = "rgba(26,58,92,0.14)";
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.background = "rgba(26,58,92,0.07)";
                  }}
                >
                  {pol}
                </Link>
              );
            })}
          </div>
        )}
        {/* News hits */}
        {item.newsHits.length > 0 && (
          <div className="border-t border-black/6 pt-3 mt-1 space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "#7a8ba0" }}>
              In the news
            </p>
            {item.newsHits.slice(0, 3).map((hit, i) => (
              <a
                key={i}
                href={hit.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs leading-snug hover:underline"
                style={{ color: "#2563a8" }}
              >
                {hit.title}
                {hit.source && (
                  <span className="ml-1 text-[10px]" style={{ color: "#7a8ba0" }}>
                    — {hit.source}
                  </span>
                )}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CityHallPage() {
  const [data, setData] = useState<CouncilMeetingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"timeline" | "all">("timeline");

  useEffect(() => {
    fetch("/api/city-hall")
      .then((r) => {
        if (!r.ok) throw new Error(`API error ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const highItems = data?.items.filter((i) => i.significance === "high") ?? [];
  const allItems = data?.items ?? [];
  const displayed = activeTab === "timeline" ? highItems.length ? highItems : allItems : allItems;

  return (
    <div style={{ background: "var(--bg, #f5f3ef)", minHeight: "100vh", fontFamily: "var(--font-outfit), sans-serif" }}>
      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #1a3a5c 0%, #0f2540 60%, #162e4a 100%)",
          paddingTop: "4rem",
          paddingBottom: "4rem",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 70% 60% at 80% 40%, rgba(37,99,168,0.18) 0%, transparent 70%)",
          }}
        />
        <div className="relative max-w-4xl mx-auto px-5">
          <p className="text-sky-300 text-xs font-bold uppercase tracking-[0.22em] mb-3">City Hall Story Engine</p>
          <h1
            className="text-3xl md:text-5xl font-bold text-white mb-4"
            style={{ fontFamily: "var(--font-playfair), serif", lineHeight: 1.18 }}
          >
            What Happened at<br />Houston City Council
          </h1>
          <p className="text-white/55 text-base max-w-xl mb-4">
            Every Tuesday, Houston City Council meets. Every Wednesday, Emily Ramshaw covers it in plain English at
            Emily Takes Notes. This engine turns her reporting into a structured timeline — then cross-references
            each item against local news.
          </p>
          {data && (
            <p className="text-sky-200/70 text-xs font-medium">
              Latest meeting covered: {data.date}
              {data.cached && (
                <span className="ml-2 text-white/30">(cached)</span>
              )}
            </p>
          )}
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-5 py-10">
        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-3 py-12 justify-center">
            <span className="relative flex h-3 w-3">
              <span className="alive-halo absolute inline-flex h-full w-full rounded-full bg-sky-400" />
              <span className="alive-pulse relative inline-flex h-3 w-3 rounded-full bg-sky-400" />
            </span>
            <span className="text-sm" style={{ color: "#7a8ba0" }}>
              Fetching latest council meeting...
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="rounded-xl ring-1 ring-red-200 p-6 mb-8"
            style={{ background: "#fef2f2", color: "#7f1d1d" }}
          >
            <p className="font-semibold text-sm mb-1">Could not load latest meeting</p>
            <p className="text-xs opacity-70">{error}</p>
            <p className="text-xs mt-2 opacity-60">
              Check{" "}
              <a href="https://emilytakesnotes.com" target="_blank" rel="noopener noreferrer" className="underline">
                emilytakesnotes.com
              </a>{" "}
              directly.
            </p>
          </div>
        )}

        {/* Emily's card */}
        {data && (
          <ScrollReveal>
            <SectionLabel label="Source" />
            <div
              className="rounded-2xl ring-1 ring-black/8 mb-10"
              style={{
                background: "#1a3a5c",
                boxShadow: "0 4px 24px rgba(26,58,92,0.14), inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sky-300 text-[10px] font-bold uppercase tracking-[0.2em] mb-2"
                    >
                      Emily Takes Notes — {data.date}
                    </p>
                    <h2
                      className="text-lg font-bold text-white mb-3 leading-snug"
                      style={{ fontFamily: "var(--font-playfair), serif" }}
                    >
                      {data.meetingTitle}
                    </h2>
                    <p className="text-white/55 text-sm leading-relaxed line-clamp-3">
                      {data.emilyExcerpt}
                    </p>
                  </div>
                  <a
                    href={data.emilyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200"
                    style={{
                      background: "rgba(255,255,255,0.10)",
                      color: "#fff",
                      border: "1px solid rgba(255,255,255,0.15)",
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLElement).style.background = "rgba(255,255,255,0.18)";
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLElement).style.background = "rgba(255,255,255,0.10)";
                    }}
                  >
                    Read full post
                  </a>
                </div>
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Timeline */}
        {data && data.items.length > 0 && (
          <ScrollReveal>
            <SectionLabel label="AI-Generated Timeline" />

            {/* Tab pills */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {([["timeline", `Key Items (${highItems.length || allItems.length})`], ["all", `All Items (${allItems.length})`]] as const).map(
                ([tab, label]) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
                    style={
                      activeTab === tab
                        ? { background: "#1a3a5c", color: "#fff" }
                        : { background: "rgba(26,58,92,0.08)", color: "#1a3a5c", border: "1px solid rgba(26,58,92,0.15)" }
                    }
                  >
                    {label}
                  </button>
                )
              )}
              <span className="ml-auto text-[10px] font-medium self-center" style={{ color: "#7a8ba0" }}>
                Summarized by Claude · Cross-referenced via Google News
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {displayed.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          </ScrollReveal>
        )}

        {/* Archive note */}
        {data && (
          <ScrollReveal>
            <div
              className="mt-10 rounded-xl ring-1 ring-black/6 p-5 flex items-start gap-4"
              style={{ background: "rgba(26,58,92,0.04)" }}
            >
              <div className="shrink-0 mt-0.5">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#2563a8" strokeWidth="1.5">
                  <rect x="2" y="5" width="14" height="11" rx="1.5" />
                  <path d="M1 5h16M6 5V3a1 1 0 011-1h4a1 1 0 011 1v2" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold mb-0.5" style={{ color: "#1a3a5c" }}>
                  History book ethos
                </p>
                <p className="text-xs leading-relaxed" style={{ color: "#7a8ba0" }}>
                  Each meeting summary is archived to{" "}
                  <code className="text-[11px] bg-black/5 px-1 rounded">data/council-meetings/</code> after fetch, so
                  every Tuesday in Houston City Council history is preserved — not just the latest one.
                </p>
              </div>
            </div>
          </ScrollReveal>
        )}
      </div>
    </div>
  );
}
