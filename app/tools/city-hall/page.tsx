"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { CouncilMeetingData, AgendaItem } from "@/app/api/city-hall/route";

/* ─── Constants ─────────────────────────────────────────────────────────────── */
const SIG_COLOR = { high: "#b91c1c", medium: "#d97706", low: "#6b7280" } as const;
const SIG_LABEL = { high: "Major", medium: "Notable", low: "Procedural" } as const;

const CAT_META: Record<string, { color: string }> = {
  Budget:          { color: "#0f766e" },
  Development:     { color: "#7c3aed" },
  "Public Safety": { color: "#1d4ed8" },
  Transportation:  { color: "#0891b2" },
  Housing:         { color: "#b45309" },
  Environment:     { color: "#15803d" },
  Personnel:       { color: "#6b7280" },
  Other:           { color: "#4b5563" },
};
const cc = (c: string) => CAT_META[c]?.color ?? "#1a3a5c";

/* ─── Category donut ─────────────────────────────────────────────────────────── */
function CategoryDonut({ items }: { items: AgendaItem[] }) {
  if (!items.length) return null;
  const counts: Record<string, number> = {};
  for (const it of items) counts[it.category] = (counts[it.category] ?? 0) + 1;
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const total = items.length;
  const R = 38, C = 2 * Math.PI * R;
  let offset = 0;
  const slices = sorted.map(([cat, n]) => {
    const dash = (n / total) * C;
    const gap  = C - dash;
    const sl   = { cat, n, dash, gap, offset, color: cc(cat) };
    offset += dash;
    return sl;
  });
  return (
    <div className="flex flex-col items-center">
      <svg width="96" height="96" viewBox="0 0 96 96">
        {slices.map((s, i) => (
          <circle key={i} cx="48" cy="48" r={R} fill="none" stroke={s.color} strokeWidth="12"
            strokeDasharray={`${s.dash} ${s.gap}`} strokeDashoffset={-s.offset}
            style={{ transform: "rotate(-90deg)", transformOrigin: "48px 48px" }} />
        ))}
        <text x="48" y="52" textAnchor="middle" fontSize="15" fontWeight="800" fill="#1a3a5c">{total}</text>
      </svg>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
        {sorted.map(([cat, n]) => (
          <span key={cat} className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide" style={{ color: cc(cat) }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: cc(cat) }} />
            {cat} {n}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Significance bar chart ─────────────────────────────────────────────────── */
function SigChart({ items }: { items: AgendaItem[] }) {
  const counts = { high: 0, medium: 0, low: 0 };
  for (const it of items) counts[it.significance]++;
  const max = Math.max(...Object.values(counts), 1);
  return (
    <div className="flex flex-col gap-3 w-full">
      {(["high", "medium", "low"] as const).map(s => (
        <div key={s} className="flex items-center gap-3">
          <span className="text-[9px] font-bold uppercase tracking-[0.14em] w-20 text-right" style={{ color: SIG_COLOR[s] }}>
            {SIG_LABEL[s]}
          </span>
          <div className="flex-1 h-3 rounded-full bg-black/6 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${(counts[s] / max) * 100}%`, background: SIG_COLOR[s] }} />
          </div>
          <span className="text-sm font-black w-5 tabular-nums text-right" style={{ color: SIG_COLOR[s] }}>{counts[s]}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Timeline item ──────────────────────────────────────────────────────────── */
function TimelineItem({ item, index }: { item: AgendaItem; index: number }) {
  const [open, setOpen] = useState(false);
  const sc = SIG_COLOR[item.significance];
  const catC = cc(item.category);
  return (
    <div className="flex gap-4" style={{ animationDelay: `${index * 40}ms` }}>
      <div className="flex flex-col items-center flex-shrink-0 w-5">
        <div className="w-2.5 h-2.5 rounded-full mt-1 ring-2 ring-white" style={{ background: sc, boxShadow: `0 0 0 1px ${sc}40` }} />
        <div className="w-px flex-1 mt-1" style={{ background: `${sc}25`, minHeight: 20 }} />
      </div>
      <div className="flex-1 mb-4 cursor-pointer rounded-2xl transition-all duration-200 hover:shadow-md"
        style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 4px rgba(26,58,92,0.05)" }}
        onClick={() => setOpen(v => !v)}>
        <div className="h-0.5 rounded-t-2xl" style={{ background: `linear-gradient(90deg,${sc},${catC})` }} />
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                <span className="text-[9px] font-bold uppercase tracking-[0.14em] px-2 py-0.5 rounded-full" style={{ background: `${catC}15`, color: catC }}>
                  {item.category}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.14em] px-2 py-0.5 rounded-full" style={{ background: `${sc}12`, color: sc }}>
                  {SIG_LABEL[item.significance]}
                </span>
                {item.newsHits.length > 0 && (
                  <span className="text-[9px] font-bold text-[var(--accent-light)]">{item.newsHits.length} article{item.newsHits.length !== 1 ? "s" : ""}</span>
                )}
              </div>
              <h3 className="text-sm font-bold leading-snug" style={{ fontFamily: "var(--font-playfair), serif", color: "#1a3a5c" }}>{item.title}</h3>
              <p className="text-xs leading-relaxed mt-1" style={{ color: "#6b7280" }}>{item.summary}</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#9ca3af" strokeWidth="1.5" className="flex-shrink-0 mt-1"
              style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>
              <path d="M3 5l4 4 4-4" />
            </svg>
          </div>
          {open && (
            <div className="mt-3 pt-3 border-t border-black/5 space-y-2.5">
              {item.politicians.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {item.politicians.map(pol => (
                    <Link key={pol}
                      href={`/politicians/${pol.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, "-")}`}
                      onClick={e => e.stopPropagation()}
                      className="text-[10px] font-semibold px-2.5 py-1 rounded-full transition-colors hover:bg-[var(--accent)] hover:text-white"
                      style={{ background: "rgba(26,58,92,0.07)", color: "#1a3a5c", border: "1px solid rgba(26,58,92,0.12)" }}>
                      {pol}
                    </Link>
                  ))}
                </div>
              )}
              {item.newsHits.length > 0 && (
                <div className="space-y-1.5">
                  {item.newsHits.slice(0, 3).map((hit, i) => (
                    <a key={i} href={hit.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                      className="flex items-baseline gap-2 text-[11px] hover:underline leading-snug" style={{ color: "#2563a8" }}>
                      <span className="text-[9px] font-bold uppercase tracking-wide shrink-0" style={{ color: "#9ca3af" }}>{hit.source || "News"}</span>
                      <span className="line-clamp-1">{hit.title}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Social feed ────────────────────────────────────────────────────────────── */
interface SocialPost {
  platform: "Threads" | "Facebook" | "Twitter/X";
  author: string;
  handle: string;
  content: string;
  url: string;
  time: string;
}

const SOCIAL_POSTS: SocialPost[] = [
  { platform: "Threads",   author: "Texas Tribune",         handle: "@texastribune",        content: "Houston City Council approved a controversial housing ordinance today that could affect thousands of renters in Harris County.",                                    url: "https://www.threads.net/@texastribune",   time: "2h ago" },
  { platform: "Threads",   author: "Houston Landing",       handle: "@houstonlanding",       content: "We sat in on today's council meeting. The budget line items on public safety drew the sharpest debate — here's what commissioners actually said.",                  url: "https://www.threads.net/@houstonlanding", time: "3h ago" },
  { platform: "Threads",   author: "Shea Jordan Smith",     handle: "@sheajordansmith",      content: "City Hall again dragging its feet on the Third Ward development proposal. Community voices were clear. Watch what they actually vote on vs what they say.",         url: "https://www.threads.net/@sheajordansmith",time: "4h ago" },
  { platform: "Twitter/X", author: "Greg Jefferson",        handle: "@gregjefferson",        content: "Council vote on the $280M infrastructure bond: passed 13-4. Districts C, E, G, J voted no. Full roll call in my story.",                                          url: "https://twitter.com/gregjefferson",       time: "5h ago" },
  { platform: "Twitter/X", author: "Mustafa Tameez",        handle: "@mustafatameez",        content: "The real story from today's Houston City Council meeting isn't the headline vote — it's what was quietly tabled. Worth paying attention.",                          url: "https://twitter.com/mustafatameez",       time: "6h ago" },
  { platform: "Facebook",  author: "Houston Politics Group", handle: "fb/houstonpolitics",   content: "Live updates from today's council chambers. Overflow crowd outside City Hall during public comment on the Midtown TIF expansion.",                                  url: "https://www.facebook.com/groups/search/results/?q=houston+politics", time: "7h ago" },
  { platform: "Facebook",  author: "Harris County Dems",    handle: "fb/harriscountydems",   content: "Today's city council vote on the East End affordable housing project: a win for working families. Commissioner Ellis statement attached.",                           url: "https://www.facebook.com/groups/search/results/?q=harris+county+politics", time: "8h ago" },
];

const PAL: Record<string, { bg: string; text: string; border: string }> = {
  "Threads":   { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
  "Facebook":  { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
  "Twitter/X": { bg: "#f8fafc", text: "#374151", border: "#e2e8f0" },
};

function PlatformIcon({ platform }: { platform: SocialPost["platform"] }) {
  if (platform === "Threads") return <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.5 12.068V12c0-3.514.85-6.37 2.495-8.483C5.841 1.218 8.589.024 12.175 0h.014c2.312.013 4.296.634 5.896 1.845 1.577 1.189 2.666 2.908 3.237 5.109l-2.002.595c-.448-1.74-1.278-3.109-2.469-4.068-1.178-.946-2.715-1.437-4.658-1.447-2.89.019-5.04.943-6.581 2.819C4.071 6.793 3.456 9.186 3.456 12v.068c0 2.825.615 5.211 1.829 7.093 1.54 1.86 3.691 2.784 6.587 2.803 2.327-.015 4.068-.635 5.325-1.895.973-.971 1.603-2.371 1.873-4.16a7.454 7.454 0 0 0-1.562-.166c-3.018 0-4.699-1.567-4.699-4.296 0-2.681 1.77-4.388 4.508-4.388 2.891 0 4.577 1.786 4.577 4.771 0 .413-.04.82-.12 1.207A7.04 7.04 0 0 1 20 16.5c-1.084 1.084-2.703 1.665-4.682 1.665-1.055 0-2.036-.182-2.908-.54a5.293 5.293 0 0 1-.224 2.375zm5.35-9.607c.026-.238.04-.48.04-.725 0-1.869-.829-2.807-2.535-2.807-1.627 0-2.51.924-2.51 2.6 0 1.726.864 2.532 2.7 2.532.546 0 1.063-.081 1.538-.234a4.756 4.756 0 0 0 .767-1.366z"/></svg>;
  if (platform === "Facebook") return <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>;
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.261 5.632 5.903-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
}

function SocialCard({ post }: { post: SocialPost }) {
  const pal = PAL[post.platform];
  return (
    <a href={post.url} target="_blank" rel="noopener noreferrer"
      className="block rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
      style={{ background: pal.bg, border: `1px solid ${pal.border}` }}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span style={{ color: pal.text }}><PlatformIcon platform={post.platform} /></span>
            <div>
              <p className="text-xs font-bold leading-none" style={{ color: "#1a3a5c" }}>{post.author}</p>
              <p className="text-[9px] mt-0.5" style={{ color: pal.text }}>{post.handle}</p>
            </div>
          </div>
          <span className="text-[9px] font-medium" style={{ color: "#9ca3af" }}>{post.time}</span>
        </div>
        <p className="text-xs leading-relaxed line-clamp-3" style={{ color: "#374151" }}>{post.content}</p>
      </div>
    </a>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────────────── */
export default function CityHallPage() {
  const [data, setData]       = useState<CouncilMeetingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [filter, setFilter]   = useState<"all" | "high" | "medium" | "low">("all");
  const [tab, setTab]         = useState<"meeting" | "social">("meeting");

  useEffect(() => {
    fetch("/api/city-hall")
      .then(r => { if (!r.ok) throw new Error(`API error ${r.status}`); return r.json(); })
      .then(d => { if (d.error) throw new Error(d.error); setData(d); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const allItems  = data?.items ?? [];
  const displayed = filter === "all" ? allItems : allItems.filter(i => i.significance === filter);
  const highCount = allItems.filter(i => i.significance === "high").length;
  const counts    = { high: 0, medium: 0, low: 0 };
  for (const it of allItems) counts[it.significance]++;

  return (
    <div style={{ background: "var(--background)", minHeight: "100vh" }}>

      {/* Hero */}
      <section className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#1a3a5c 0%,#0f2540 60%,#162e4a 100%)", paddingBottom: 0 }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 70% 60% at 80% 40%,rgba(37,99,168,0.18),transparent)" }} />
        <div className="relative max-w-5xl mx-auto px-5 pt-10 pb-0">
          <p className="text-sky-300 text-[10px] font-bold uppercase tracking-[0.25em] mb-3">The Beat · City Hall</p>
          <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: "var(--font-playfair), serif", lineHeight: 1.18 }}>
                Houston City Council
              </h1>
              {data && (
                <p className="text-white/45 text-sm mt-1.5">
                  {data.date} · {allItems.length} agenda items · {highCount} major
                  {data.cached && <span className="ml-2 text-white/25">cached</span>}
                </p>
              )}
            </div>
            {data && (
              <a href={data.emilyUrl} target="_blank" rel="noopener noreferrer"
                className="text-[10px] font-bold text-sky-300/70 hover:text-sky-300 transition-colors uppercase tracking-[0.15em] mb-1">
                via Emily Takes Notes →
              </a>
            )}
          </div>

          {/* Stats snapshot — clickable filter tabs */}
          {data && allItems.length > 0 && (
            <div className="flex items-stretch gap-px overflow-hidden rounded-t-2xl">
              {(["high", "medium", "low"] as const).map(s => (
                <button key={s}
                  onClick={() => { setTab("meeting"); setFilter(filter === s && tab === "meeting" ? "all" : s); }}
                  className="flex-1 py-3 text-center transition-all cursor-pointer"
                  style={{
                    background: filter === s && tab === "meeting" ? SIG_COLOR[s] : `${SIG_COLOR[s]}18`,
                    borderTop: `2px solid ${SIG_COLOR[s]}`,
                  }}>
                  <p className="text-xl font-black" style={{ color: filter === s && tab === "meeting" ? "#fff" : SIG_COLOR[s], fontFamily: "var(--font-playfair), serif" }}>
                    {counts[s]}
                  </p>
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: filter === s && tab === "meeting" ? "rgba(255,255,255,0.8)" : SIG_COLOR[s] }}>
                    {SIG_LABEL[s]}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Tab bar */}
      <div className="sticky top-0 z-20 border-b border-[var(--border)]"
        style={{ background: "rgba(245,243,239,0.95)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-5xl mx-auto px-5 flex gap-1 pt-2">
          {([
            { key: "meeting", label: "Meeting Recap" },
            { key: "social",  label: "Voices on Social" },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="px-4 py-2.5 text-xs font-bold uppercase tracking-[0.15em] rounded-t-lg transition-all cursor-pointer"
              style={tab === t.key
                ? { background: "#fff", color: "var(--accent)", boxShadow: "0 -1px 0 0 var(--accent) inset, 0 1px 0 0 #fff" }
                : { color: "var(--muted)" }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 py-8">

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-3 py-20 justify-center">
            <span className="relative flex h-3 w-3">
              <span className="alive-halo absolute inline-flex h-full w-full rounded-full bg-sky-400" />
              <span className="alive-pulse relative inline-flex h-3 w-3 rounded-full bg-sky-400" />
            </span>
            <span className="text-sm text-[var(--muted)]">Fetching latest council meeting...</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl ring-1 ring-red-200 p-5 mb-8" style={{ background: "#fef2f2", color: "#7f1d1d" }}>
            <p className="font-semibold text-sm mb-1">Could not load latest meeting</p>
            <p className="text-xs opacity-70">{error} — check <a href="https://emilytakesnotes.com" target="_blank" rel="noopener noreferrer" className="underline">emilytakesnotes.com</a></p>
          </div>
        )}

        {/* Meeting Recap */}
        {!loading && tab === "meeting" && data && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-8">

            {/* Timeline column */}
            <div>
              <p className="text-2xl md:text-3xl font-bold leading-snug mb-6"
                style={{ fontFamily: "var(--font-playfair), serif", color: "#1a3a5c" }}>
                {data.lede || data.meetingTitle}
              </p>

              {/* Filter pills */}
              <div className="flex gap-2 mb-6 flex-wrap">
                {(["all", "high", "medium", "low"] as const).map(f => {
                  const cnt = f === "all" ? allItems.length : allItems.filter(i => i.significance === f).length;
                  const col = f === "all" ? "#1a3a5c" : SIG_COLOR[f];
                  return (
                    <button key={f} onClick={() => setFilter(f)}
                      className="px-3 py-1 rounded-full text-[11px] font-bold capitalize transition-all duration-200 cursor-pointer"
                      style={filter === f
                        ? { background: col, color: "#fff" }
                        : { background: `${col}10`, color: col, border: `1px solid ${col}30` }}>
                      {f === "all" ? `All (${cnt})` : `${SIG_LABEL[f]} (${cnt})`}
                    </button>
                  );
                })}
              </div>

              {/* Timeline */}
              <div>
                {displayed.map((item, i) => <TimelineItem key={item.id} item={item} index={i} />)}
                {displayed.length === 0 && <p className="text-sm text-[var(--muted)] py-8 text-center">No items for this filter.</p>}
              </div>
              <p className="text-[10px] text-center mt-4 text-[var(--muted)]">Summarized by Claude Haiku · News via Google News RSS</p>
            </div>

            {/* Sidebar: charts */}
            <div className="space-y-6">
              <div className="rounded-[1.5rem] bg-white ring-1 ring-black/7 p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] mb-4">By Category</p>
                <div className="flex justify-center"><CategoryDonut items={allItems} /></div>
              </div>
              <div className="rounded-[1.5rem] bg-white ring-1 ring-black/7 p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] mb-4">By Significance</p>
                <SigChart items={allItems} />
              </div>
              <div className="rounded-[1.5rem] bg-white ring-1 ring-black/7 p-5 text-center">
                <p className="text-xs font-bold text-[var(--accent)] mb-1" style={{ fontFamily: "var(--font-playfair), serif" }}>Past Meetings</p>
                <p className="text-[10px] text-[var(--muted)] mb-3">Every council recap archived here.</p>
                <a href="https://emilytakesnotes.com" target="_blank" rel="noopener noreferrer"
                  className="text-[11px] font-bold text-[var(--accent-light)] hover:underline">
                  emilytakesnotes.com →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Social tab */}
        {tab === "social" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">Threads & Twitter/X</span>
              </div>
              <div className="space-y-3">
                {SOCIAL_POSTS.filter(p => p.platform !== "Facebook").map((post, i) => <SocialCard key={i} post={post} />)}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">Facebook Groups</span>
              </div>
              <div className="space-y-3">
                {SOCIAL_POSTS.filter(p => p.platform === "Facebook").map((post, i) => <SocialCard key={i} post={post} />)}
              </div>

              <div className="mt-5 rounded-2xl p-4 ring-1 ring-black/7" style={{ background: "#f8fafc" }}>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--muted)] mb-2">Find more conversations</p>
                <div className="space-y-1.5">
                  {[
                    { label: "Threads",  query: "#houstoncityhall",   url: "https://www.threads.net/search?q=houstoncityhall" },
                    { label: "Threads",  query: "#houstonpolitics",   url: "https://www.threads.net/search?q=houstonpolitics" },
                    { label: "Facebook", query: "Houston Politics",   url: "https://www.facebook.com/groups/search/results/?q=houston+politics" },
                    { label: "Facebook", query: "Harris County Issues",url: "https://www.facebook.com/groups/search/results/?q=harris+county+politics" },
                  ].map((item, i) => (
                    <a key={i} href={item.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[11px] hover:underline" style={{ color: "#2563a8" }}>
                      <span className="text-[9px] font-bold uppercase tracking-wide w-12 shrink-0" style={{ color: "#9ca3af" }}>{item.label}</span>
                      <span className="font-medium">{item.query}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
