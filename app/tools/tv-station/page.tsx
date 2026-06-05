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
  description: string;
}

const STREAMS: Stream[] = [
  {
    id: "hc-court",
    name: "Commissioners Court",
    body: "Harris County",
    embedUrl: "https://www.youtube.com/embed/live_stream?channel=UCmFqNWQaAU0rGpSRIHhO7LA&autoplay=1",
    livePageUrl: "https://www.youtube.com/@HarrisCountyTX/streams",
    scheduleUrl: "https://harriscountytx.gov/commissioners-court",
    schedule: "1st & 3rd Tuesday · 10 AM",
    description: "Budget, contracts, and county policy decisions",
    category: "County",
  },
  {
    id: "hcphd",
    name: "Public Health Advisory",
    body: "Harris County",
    embedUrl: "https://www.youtube.com/embed/live_stream?channel=UCJ3gT_bDDjT6eE5k4bD3Vtw&autoplay=1",
    livePageUrl: "https://www.youtube.com/@HarrisCountyPublicHealth/streams",
    scheduleUrl: "https://publichealth.harriscountytx.gov",
    schedule: "Monthly · check schedule",
    description: "Public health policy and advisory board sessions",
    category: "County",
  },
  {
    id: "houston-council",
    name: "City Council",
    body: "City of Houston",
    embedUrl: "https://www.youtube.com/embed/live_stream?channel=UCkE7l3FRhvnvQVQSnPJlqjQ&autoplay=1",
    livePageUrl: "https://www.youtube.com/@CityofHouston/streams",
    scheduleUrl: "https://www.houstontx.gov/citysec/council.html",
    schedule: "Every Wednesday · 9 AM",
    description: "Houston city ordinances, budgets, and resolutions",
    category: "City",
  },
  {
    id: "hisd-board",
    name: "Board of Managers",
    body: "Houston ISD",
    embedUrl: "https://www.youtube.com/embed/live_stream?channel=UCCZYnGWGDmOqm2SCMKS3fgg&autoplay=1",
    livePageUrl: "https://www.youtube.com/@HoustonISD/streams",
    scheduleUrl: "https://www.houstonisd.org/boardmeeting",
    schedule: "2nd Thursday · 5 PM",
    description: "HISD governance, policy, and superintendent oversight",
    category: "HISD",
  },
  {
    id: "tx-house",
    name: "Texas House",
    body: "TX Legislature",
    embedUrl: "https://tlchouse.granicus.com/MediaPlayer.php?camera_id=1",
    livePageUrl: "https://house.texas.gov/video/",
    scheduleUrl: "https://capitol.texas.gov/tlodocs/",
    schedule: "Session: Jan–Jun odd years",
    description: "House floor proceedings and committee hearings",
    category: "State",
  },
  {
    id: "tx-senate",
    name: "Texas Senate",
    body: "TX Legislature",
    embedUrl: "https://tlcsenate.granicus.com/MediaPlayer.php?camera_id=1",
    livePageUrl: "https://senate.texas.gov/video.php",
    scheduleUrl: "https://capitol.texas.gov/tlodocs/",
    schedule: "Session: Jan–Jun odd years",
    description: "Senate floor proceedings and committee hearings",
    category: "State",
  },
  {
    id: "us-house",
    name: "U.S. House",
    body: "119th Congress",
    embedUrl: "",
    livePageUrl: "https://live.house.gov",
    scheduleUrl: "https://www.house.gov/legislative-activity",
    schedule: "When Congress is in session",
    description: "House floor proceedings — opens on live.house.gov",
    category: "Federal",
  },
  {
    id: "us-senate",
    name: "U.S. Senate",
    body: "119th Congress",
    embedUrl: "",
    livePageUrl: "https://www.senate.gov/general/streaming.htm",
    scheduleUrl: "https://www.senate.gov/legislative/LIS/floor_activity/CurrentActivity.htm",
    schedule: "When Congress is in session",
    description: "Senate floor proceedings — opens on senate.gov",
    category: "Federal",
  },
];

const CAT_ACCENT: Record<string, string> = {
  County:  "#f59e0b",
  City:    "#10b981",
  HISD:    "#f43f5e",
  State:   "#8b5cf6",
  Federal: "#38bdf8",
};

const CATEGORY_ORDER = ["County", "City", "HISD", "State", "Federal"] as const;

export default function TVStation() {
  const [active, setActive] = useState<string>(STREAMS[0].id);
  const activeStream = STREAMS.find((s) => s.id === active) ?? STREAMS[0];
  const accent = CAT_ACCENT[activeStream.category] ?? "#fff";
  const noEmbed = !activeStream.embedUrl;

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ height: "calc(100dvh - 41px)", background: "#0a0a0a", color: "#fff" }}
    >
      <style>{`
        @keyframes atv-focus { from { box-shadow: 0 0 0 0 var(--ac); } to { box-shadow: 0 0 0 3px var(--ac); } }
        .ch-row { scrollbar-width: none; }
        .ch-row::-webkit-scrollbar { display: none; }
      `}</style>

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-6 py-3 gap-4"
        style={{
          background: "rgba(10,10,10,0.85)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div className="flex items-center gap-3">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.28em] opacity-40">Media</p>
            <h1 className="text-base font-bold leading-tight" style={{ fontFamily: "var(--font-playfair), serif" }}>
              TV Station
            </h1>
          </div>
          <span className="hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold"
            style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
            <span className="relative flex h-1.5 w-1.5">
              <span className="alive-halo absolute inline-flex h-full w-full rounded-full bg-red-400"/>
              <span className="alive-pulse relative inline-flex h-1.5 w-1.5 rounded-full bg-red-400"/>
            </span>
            Public meeting streams
          </span>
        </div>

        {/* Now playing label */}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: accent }}/>
          <span className="text-xs font-semibold opacity-70 truncate max-w-[200px]">{activeStream.body} · {activeStream.name}</span>
        </div>
      </div>

      {/* ── Video viewport ──────────────────────────────────────────────── */}
      <div className="flex-shrink-0 relative" style={{ height: "52vh", background: "#000" }}>
        {noEmbed ? (
          /* Federal streams — can't embed, open externally */
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-8 text-center"
            style={{ background: `radial-gradient(ellipse 70% 60% at 50% 50%, ${accent}18, #000)` }}>
            <div className="w-16 h-16 rounded-[1.25rem] flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.08)", boxShadow: `0 0 0 1px ${accent}40` }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.5">
                <rect x="2" y="7" width="20" height="14" rx="2"/>
                <path d="M16 3l-4 4-4-4"/>
                <circle cx="12" cy="14" r="2"/>
              </svg>
            </div>
            <div>
              <p className="text-white/40 text-[11px] font-bold uppercase tracking-[0.2em] mb-1">{activeStream.body}</p>
              <h2 className="text-white font-bold text-2xl mb-1" style={{ fontFamily: "var(--font-playfair), serif" }}>
                {activeStream.name}
              </h2>
              <p className="text-white/40 text-sm">{activeStream.description}</p>
              <p className="text-white/25 text-xs mt-1">{activeStream.schedule}</p>
            </div>
            <div className="flex gap-3 flex-wrap justify-center">
              <a href={activeStream.livePageUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-bold rounded-full px-6 py-2.5 text-sm transition-all duration-500 hover:opacity-90 active:scale-[0.97]"
                style={{ background: accent, color: "#000" }}>
                Watch Live
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
                </svg>
              </a>
              <a href={activeStream.scheduleUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-500 hover:opacity-80"
                style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)" }}>
                View Schedule
              </a>
            </div>
          </div>
        ) : (
          <>
            <iframe
              key={activeStream.id}
              src={activeStream.embedUrl}
              className="absolute inset-0 w-full h-full border-0"
              title={activeStream.name}
              allowFullScreen
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            />
            {/* Cinematic vignette overlay */}
            <div className="pointer-events-none absolute inset-0"
              style={{ boxShadow: "inset 0 0 80px rgba(0,0,0,0.5), inset 0 -40px 60px rgba(10,10,10,0.8)" }}/>
          </>
        )}

        {/* Corner info badge */}
        {!noEmbed && (
          <div className="absolute top-3 left-3 pointer-events-none flex items-center gap-2 rounded-full px-3 py-1.5"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)" }}>
            <span className="relative flex h-1.5 w-1.5">
              <span className="alive-halo absolute inline-flex h-full w-full rounded-full" style={{ background: accent }}/>
              <span className="alive-pulse relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: accent }}/>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: accent }}>
              {activeStream.body}
            </span>
            <span className="text-[10px] text-white/50 font-medium">{activeStream.name}</span>
          </div>
        )}
      </div>

      {/* ── Channel rows (Apple TV style) ───────────────────────────────── */}
      <div className="flex-1 overflow-y-auto py-4"
        style={{ background: "linear-gradient(to bottom, #0a0a0a 0%, #111 100%)" }}>
        {CATEGORY_ORDER.map((cat) => {
          const catStreams = STREAMS.filter((s) => s.category === cat);
          if (!catStreams.length) return null;
          const catAccent = CAT_ACCENT[cat];
          return (
            <div key={cat} className="mb-5">
              {/* Row label */}
              <div className="flex items-center gap-2 px-6 mb-2.5">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: catAccent }}/>
                <span className="text-[10px] font-bold uppercase tracking-[0.22em]"
                  style={{ color: "rgba(255,255,255,0.45)" }}>
                  {cat}
                </span>
              </div>

              {/* Horizontal scroll row */}
              <div className="ch-row flex gap-3 px-6 overflow-x-auto pb-1">
                {catStreams.map((stream) => {
                  const isActive = active === stream.id;
                  return (
                    <button
                      key={stream.id}
                      onClick={() => setActive(stream.id)}
                      className="flex-shrink-0 w-56 text-left rounded-2xl p-4 transition-all duration-400 ease-[cubic-bezier(0.32,0.72,0,1)]"
                      style={{
                        background: isActive
                          ? `linear-gradient(135deg, ${catAccent}22, ${catAccent}10)`
                          : "rgba(255,255,255,0.05)",
                        boxShadow: isActive
                          ? `0 0 0 1.5px ${catAccent}, 0 8px 24px ${catAccent}22`
                          : "0 0 0 1px rgba(255,255,255,0.08)",
                        transform: isActive ? "scale(1.02)" : "scale(1)",
                      }}
                    >
                      {/* Channel icon + name */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: isActive ? `${catAccent}30` : "rgba(255,255,255,0.07)" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                            stroke={isActive ? catAccent : "rgba(255,255,255,0.5)"} strokeWidth="1.8">
                            <rect x="2" y="7" width="20" height="14" rx="2"/>
                            <path d="M16 3l-4 4-4-4"/>
                          </svg>
                        </div>
                        {isActive && (
                          <span className="relative flex h-1.5 w-1.5 mt-1 flex-shrink-0">
                            <span className="alive-halo absolute inline-flex h-full w-full rounded-full" style={{ background: catAccent }}/>
                            <span className="alive-pulse relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: catAccent }}/>
                          </span>
                        )}
                      </div>

                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-0.5"
                        style={{ color: isActive ? catAccent : "rgba(255,255,255,0.35)" }}>
                        {stream.body}
                      </p>
                      <p className="font-bold text-sm leading-snug text-white"
                        style={{ fontFamily: "var(--font-playfair), serif" }}>
                        {stream.name}
                      </p>
                      <p className="text-[11px] mt-1.5 leading-snug"
                        style={{ color: "rgba(255,255,255,0.35)" }}>
                        {stream.schedule}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Footer */}
        <p className="text-center text-[10px] px-6 pb-4 mt-2"
          style={{ color: "rgba(255,255,255,0.18)" }}>
          Streams are live during public meetings. YouTube embeds require an active broadcast.
        </p>
      </div>
    </div>
  );
}
