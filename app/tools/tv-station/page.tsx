"use client";
import { useState } from "react";

interface Stream {
  id: string;
  name: string;
  body: string;
  embedUrl: string;
  livePageUrl: string;
  scheduleUrl: string;
  schedule: string;
  category: "County" | "City" | "HISD" | "State" | "Federal";
  live?: boolean;
}

const STREAMS: Stream[] = [
  {
    id: "hc-court",
    name: "Harris County Commissioners Court",
    body: "Commissioners Court",
    embedUrl: "https://www.youtube.com/embed/live_stream?channel=UCmFqNWQaAU0rGpSRIHhO7LA",
    livePageUrl: "https://www.youtube.com/@HarrisCountyTX/streams",
    scheduleUrl: "https://harriscountytx.gov/commissioners-court",
    schedule: "1st & 3rd Tuesday of each month, 10 AM",
    category: "County",
  },
  {
    id: "houston-council",
    name: "Houston City Council",
    body: "City of Houston",
    embedUrl: "https://www.youtube.com/embed/live_stream?channel=UCkE7l3FRhvnvQVQSnPJlqjQ",
    livePageUrl: "https://www.youtube.com/@CityofHouston/streams",
    scheduleUrl: "https://www.houstontx.gov/citysec/council.html",
    schedule: "Every Wednesday, 9 AM",
    category: "City",
  },
  {
    id: "hisd-board",
    name: "HISD Board of Managers",
    body: "Houston ISD",
    embedUrl: "https://www.youtube.com/embed/live_stream?channel=UCCZYnGWGDmOqm2SCMKS3fgg",
    livePageUrl: "https://www.youtube.com/@HoustonISD/streams",
    scheduleUrl: "https://www.houstonisd.org/boardmeeting",
    schedule: "2nd Thursday of each month, 5 PM",
    category: "HISD",
  },
  {
    id: "tx-house",
    name: "Texas House of Representatives",
    body: "TX Legislature",
    embedUrl: "https://tlchouse.granicus.com/MediaPlayer.php?camera_id=1",
    livePageUrl: "https://house.texas.gov/video/",
    scheduleUrl: "https://capitol.texas.gov/tlodocs/",
    schedule: "When legislature is in session (odd years, Jan–Jun)",
    category: "State",
  },
  {
    id: "tx-senate",
    name: "Texas Senate",
    body: "TX Legislature",
    embedUrl: "https://tlcsenate.granicus.com/MediaPlayer.php?camera_id=1",
    livePageUrl: "https://senate.texas.gov/video.php",
    scheduleUrl: "https://capitol.texas.gov/tlodocs/",
    schedule: "When legislature is in session (odd years, Jan–Jun)",
    category: "State",
  },
  {
    id: "us-house",
    name: "U.S. House of Representatives",
    body: "119th Congress",
    embedUrl: "https://www.youtube.com/embed/live_stream?channel=UCoJFNsHfkjKJHevx6dv_jPQ",
    livePageUrl: "https://live.house.gov",
    scheduleUrl: "https://www.house.gov/legislative-activity",
    schedule: "When Congress is in session — Mon–Fri",
    category: "Federal",
  },
  {
    id: "us-senate",
    name: "U.S. Senate",
    body: "119th Congress",
    embedUrl: "https://www.youtube.com/embed/live_stream?channel=UCddiUEpeqJcYeBxX1IVBKvQ",
    livePageUrl: "https://www.senate.gov/general/streaming.htm",
    scheduleUrl: "https://www.senate.gov/legislative/LIS/floor_activity/CurrentActivity.htm",
    schedule: "When Congress is in session — Mon–Fri",
    category: "Federal",
  },
  {
    id: "hcphd",
    name: "Harris County Public Health",
    body: "HCPH Advisory Board",
    embedUrl: "https://www.youtube.com/embed/live_stream?channel=UCJ3gT_bDDjT6eE5k4bD3Vtw",
    livePageUrl: "https://www.youtube.com/@HarrisCountyPublicHealth/streams",
    scheduleUrl: "https://publichealth.harriscountytx.gov",
    schedule: "Monthly, check schedule",
    category: "County",
  },
];

const CATEGORY_COLOR = {
  County: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
  City:   { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
  HISD:   { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-200" },
  State:  { bg: "bg-violet-100", text: "text-violet-700", border: "border-violet-200" },
  Federal: { bg: "bg-sky-100", text: "text-sky-700", border: "border-sky-200" },
};

const CATEGORIES = ["All", "County", "City", "HISD", "State", "Federal"] as const;
type Category = (typeof CATEGORIES)[number];

export default function TVStation() {
  const [active, setActive] = useState<string>(STREAMS[0].id);
  const [catFilter, setCatFilter] = useState<Category>("All");
  const [embedError, setEmbedError] = useState<Set<string>>(new Set());

  const visible = STREAMS.filter((s) => catFilter === "All" || s.category === catFilter);
  const activeStream = STREAMS.find((s) => s.id === active) ?? STREAMS[0];

  return (
    <div className="flex flex-col" style={{ height: "calc(100dvh - 41px)" }}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="bg-[var(--accent)] text-white px-5 py-3 flex-shrink-0 flex items-center justify-between gap-4 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_120%_at_80%_50%,rgba(37,99,168,0.4),transparent)]" />
        <div className="relative z-10 flex items-center gap-3">
          <div>
            <p className="text-sky-300/80 text-[9px] font-bold uppercase tracking-[0.25em] leading-none">Media</p>
            <h1 className="text-lg font-bold leading-tight" style={{ fontFamily: "var(--font-playfair), serif" }}>
              TV Station
            </h1>
          </div>
          <span className="hidden sm:flex items-center gap-1.5 bg-white/10 ring-1 ring-white/20 rounded-full px-3 py-1 text-[10px] font-semibold text-white/80">
            <span className="relative flex h-1.5 w-1.5"><span className="alive-halo absolute inline-flex h-full w-full rounded-full bg-red-400" /><span className="alive-pulse relative inline-flex h-1.5 w-1.5 rounded-full bg-red-400" /></span>
            Live streams from public meetings
          </span>
        </div>
        {/* Category filter */}
        <div className="relative z-10 flex gap-1.5 overflow-x-auto scrollbar-none">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className={`flex-shrink-0 text-[10px] font-bold uppercase tracking-[0.1em] px-3 py-1.5 rounded-full transition-all duration-500 ${
                catFilter === c
                  ? "bg-white/20 text-white ring-1 ring-white/30"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main layout ──────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Stream list sidebar */}
        <div className="w-72 flex-shrink-0 border-r border-[var(--border)] bg-white overflow-y-auto">
          {visible.map((stream) => {
            const cat = CATEGORY_COLOR[stream.category];
            const isActive = active === stream.id;
            return (
              <button
                key={stream.id}
                onClick={() => { setActive(stream.id); setEmbedError((p) => { const n = new Set(p); n.delete(stream.id); return n; }); }}
                className={`w-full text-left px-4 py-4 border-b border-[var(--border)] transition-all duration-300 ${
                  isActive ? "bg-[var(--accent)]/5 border-l-2 border-l-[var(--accent)]" : "hover:bg-gray-50 border-l-2 border-l-transparent"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className={`font-bold text-sm leading-snug ${isActive ? "text-[var(--accent)]" : "text-[var(--foreground)]"}`} style={{ fontFamily: "var(--font-playfair), serif" }}>
                    {stream.name}
                  </p>
                  <span className={`flex-shrink-0 text-[9px] font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded-full border ${cat.bg} ${cat.text} ${cat.border}`}>
                    {stream.category}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--muted)] leading-snug">{stream.schedule}</p>
              </button>
            );
          })}
        </div>

        {/* Stream viewport */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0d0d0d]">
          {embedError.has(activeStream.id) ? (
            // Fallback when embed is blocked
            <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                  <rect x="2" y="7" width="20" height="14" rx="2"/>
                  <path d="M16 3l-4 4-4-4"/>
                  <circle cx="12" cy="14" r="2"/>
                </svg>
              </div>
              <div>
                <h2 className="text-white font-bold text-xl mb-2" style={{ fontFamily: "var(--font-playfair), serif" }}>
                  {activeStream.name}
                </h2>
                <p className="text-white/50 text-sm mb-1">{activeStream.schedule}</p>
                <p className="text-white/40 text-xs mb-6">
                  This stream can&apos;t be embedded directly. Watch it on the official page.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={activeStream.livePageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-3 bg-white text-[var(--accent)] font-bold rounded-full px-6 py-3 text-sm transition-all duration-500 hover:shadow-lg active:scale-[0.98]"
                >
                  Watch Live
                  <span className="inline-flex w-6 h-6 rounded-full bg-[var(--accent)]/10 items-center justify-center group-hover:translate-x-1 transition-transform duration-500">→</span>
                </a>
                <a
                  href={activeStream.scheduleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-full px-6 py-3 transition-all duration-500"
                >
                  View Schedule
                </a>
              </div>
            </div>
          ) : (
            <>
              <iframe
                key={activeStream.id}
                src={activeStream.embedUrl}
                className="flex-1 w-full border-0"
                title={activeStream.name}
                allowFullScreen
                allow="autoplay; encrypted-media"
                onError={() => setEmbedError((p) => new Set([...p, activeStream.id]))}
              />
              {/* Bottom bar */}
              <div className="flex-shrink-0 bg-[#111] border-t border-white/10 px-5 py-2.5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-white font-semibold text-sm">{activeStream.name}</p>
                  <p className="text-white/40 text-xs">{activeStream.schedule}</p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={activeStream.livePageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-white/60 hover:text-white transition-colors underline underline-offset-2"
                  >
                    Watch Live →
                  </a>
                  <a
                    href={activeStream.scheduleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-white/60 hover:text-white transition-colors underline underline-offset-2 ml-3"
                  >
                    Schedule
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
