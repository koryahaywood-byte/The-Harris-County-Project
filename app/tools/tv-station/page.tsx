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
    schedule: "1st & 3rd Tue · 10 AM",
    description: "Budget, contracts, and county policy",
    category: "County",
  },
  {
    id: "hcphd",
    name: "Public Health Advisory",
    body: "Harris County",
    embedUrl: "https://www.youtube.com/embed/live_stream?channel=UCJ3gT_bDDjT6eE5k4bD3Vtw&autoplay=1",
    livePageUrl: "https://www.youtube.com/@HarrisCountyPublicHealth/streams",
    scheduleUrl: "https://publichealth.harriscountytx.gov",
    schedule: "Monthly",
    description: "Public health policy and advisory sessions",
    category: "County",
  },
  {
    id: "houston-council",
    name: "City Council",
    body: "City of Houston",
    embedUrl: "https://www.youtube.com/embed/live_stream?channel=UCkE7l3FRhvnvQVQSnPJlqjQ&autoplay=1",
    livePageUrl: "https://www.youtube.com/@CityofHouston/streams",
    scheduleUrl: "https://www.houstontx.gov/citysec/council.html",
    schedule: "Every Wed · 9 AM",
    description: "Houston ordinances, budgets, and resolutions",
    category: "City",
  },
  {
    id: "hisd-board",
    name: "Board of Managers",
    body: "Houston ISD",
    embedUrl: "https://www.youtube.com/embed/live_stream?channel=UCCZYnGWGDmOqm2SCMKS3fgg&autoplay=1",
    livePageUrl: "https://www.youtube.com/@HoustonISD/streams",
    scheduleUrl: "https://www.houstonisd.org/boardmeeting",
    schedule: "2nd Thu · 5 PM",
    description: "HISD governance and superintendent oversight",
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
    schedule: "When in session",
    description: "House floor — opens on live.house.gov",
    category: "Federal",
  },
  {
    id: "us-senate",
    name: "U.S. Senate",
    body: "119th Congress",
    embedUrl: "",
    livePageUrl: "https://www.senate.gov/general/streaming.htm",
    scheduleUrl: "https://www.senate.gov/legislative/LIS/floor_activity/CurrentActivity.htm",
    schedule: "When in session",
    description: "Senate floor — opens on senate.gov",
    category: "Federal",
  },
];

const CAT_COLOR: Record<string, string> = {
  County:  "#2563a8",
  City:    "#0d9488",
  HISD:    "#dc2626",
  State:   "#7c3aed",
  Federal: "#1d4ed8",
};

const CATEGORY_ORDER = ["County", "City", "HISD", "State", "Federal"] as const;

/* ─── Midcentury TV silhouette ─────────────────────────────────────────────── */
function TVSilhouette({ stream }: { stream: Stream }) {
  const noEmbed = !stream.embedUrl;
  const accent = CAT_COLOR[stream.category] ?? "#2563a8";

  return (
    <div className="relative mx-auto select-none" style={{ maxWidth: 820, fontFamily: "var(--font-outfit), sans-serif" }}>

      {/* Antennas */}
      <svg
        viewBox="0 0 240 72"
        fill="none"
        className="absolute left-1/2 -translate-x-1/2"
        style={{ bottom: "calc(100% - 4px)", width: "42%", pointerEvents: "none" }}
      >
        {/* Left antenna */}
        <line x1="82" y1="72" x2="24" y2="4" stroke="#1a3a5c" strokeWidth="5" strokeLinecap="round"/>
        <circle cx="24" cy="4" r="5" fill="#1a3a5c"/>
        {/* Right antenna */}
        <line x1="158" y1="72" x2="216" y2="4" stroke="#1a3a5c" strokeWidth="5" strokeLinecap="round"/>
        <circle cx="216" cy="4" r="5" fill="#1a3a5c"/>
      </svg>

      {/* TV chassis */}
      <div
        className="flex items-stretch gap-0 rounded-[1.75rem] overflow-hidden"
        style={{
          background: "#1a3a5c",
          boxShadow: "0 24px 64px rgba(26,58,92,0.28), 0 2px 0 rgba(255,255,255,0.06) inset, 0 -2px 0 rgba(0,0,0,0.2) inset",
          padding: "18px 14px 22px",
        }}
      >
        {/* Left decorative side panel */}
        <div
          className="w-6 flex-shrink-0 rounded-lg mr-3 self-stretch"
          style={{
            background: "linear-gradient(to bottom, rgba(255,255,255,0.09), rgba(255,255,255,0.04))",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        />

        {/* Screen bezel + screen */}
        <div
          className="flex-1 rounded-xl overflow-hidden"
          style={{
            background: "#000",
            border: "3px solid rgba(255,255,255,0.10)",
            boxShadow: "inset 0 0 40px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.04)",
          }}
        >
          <div className="relative" style={{ aspectRatio: "16/9" }}>
            {noEmbed ? (
              /* Federal / no-embed state */
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center"
                style={{ background: `radial-gradient(ellipse 80% 70% at 50% 50%, ${accent}20, #000)` }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.5">
                  <rect x="2" y="7" width="20" height="14" rx="2"/>
                  <path d="M16 3l-4 4-4-4"/>
                </svg>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] mb-1" style={{ color: accent }}>
                    {stream.body}
                  </p>
                  <h2 className="text-white font-bold text-xl mb-1" style={{ fontFamily: "var(--font-playfair), serif" }}>
                    {stream.name}
                  </h2>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{stream.description}</p>
                </div>
                <div className="flex gap-3 flex-wrap justify-center">
                  <a
                    href={stream.livePageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2 rounded-full text-xs font-bold"
                    style={{ background: accent, color: "#fff" }}
                  >
                    Watch Live
                  </a>
                  <a
                    href={stream.scheduleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2 rounded-full text-xs font-semibold"
                    style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
                  >
                    Schedule
                  </a>
                </div>
              </div>
            ) : (
              <>
                <iframe
                  key={stream.id}
                  src={stream.embedUrl}
                  className="absolute inset-0 w-full h-full border-0"
                  title={stream.name}
                  allowFullScreen
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                />
                {/* CRT scan-line vignette */}
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{ boxShadow: "inset 0 0 60px rgba(0,0,0,0.5), inset 0 -30px 50px rgba(0,0,0,0.7)" }}
                />
                {/* Now playing badge */}
                <div
                  className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-full px-2.5 py-1"
                  style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)" }}
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="alive-halo absolute inset-0 rounded-full" style={{ background: accent }}/>
                    <span className="alive-pulse relative h-1.5 w-1.5 rounded-full" style={{ background: accent }}/>
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.8)" }}>
                    {stream.name}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right control panel */}
        <div className="flex-shrink-0 w-14 ml-3 flex flex-col items-center justify-center gap-5">
          {/* Channel knob */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.18), rgba(255,255,255,0.06))",
              border: "2px solid rgba(255,255,255,0.18)",
              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.1)",
            }}
          >
            {/* Knob indicator line */}
            <div className="w-0.5 h-4 rounded-full" style={{ background: "rgba(255,255,255,0.55)" }}/>
          </div>

          {/* Volume knob */}
          <div
            className="w-7 h-7 rounded-full"
            style={{
              background: "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.12), rgba(255,255,255,0.04))",
              border: "1.5px solid rgba(255,255,255,0.13)",
              boxShadow: "inset 0 2px 3px rgba(0,0,0,0.3)",
            }}
          />

          {/* Power LED */}
          <div
            className="alive-pulse w-2.5 h-2.5 rounded-full"
            style={{ background: accent, boxShadow: `0 0 6px ${accent}80` }}
          />

          {/* UHF/VHF label */}
          <div className="text-[7px] font-bold uppercase tracking-[0.15em] text-center leading-tight"
            style={{ color: "rgba(255,255,255,0.25)" }}>
            CH<br/>{STREAMS.findIndex(s => s.id === stream.id) + 1}
          </div>
        </div>
      </div>

      {/* TV brand strip */}
      <div className="flex items-center justify-center gap-3 mt-2">
        <div className="h-px flex-1 max-w-[80px]" style={{ background: "rgba(26,58,92,0.2)" }}/>
        <p
          className="text-[9px] font-bold uppercase tracking-[0.45em]"
          style={{ color: "rgba(26,58,92,0.35)", fontFamily: "var(--font-playfair), serif" }}
        >
          Harris County
        </p>
        <div className="h-px flex-1 max-w-[80px]" style={{ background: "rgba(26,58,92,0.2)" }}/>
      </div>

      {/* Legs */}
      <div className="flex justify-between" style={{ padding: "0 22%" }}>
        <div
          style={{
            width: 22,
            height: 36,
            background: "#1a3a5c",
            borderRadius: "0 0 4px 4px",
            clipPath: "polygon(15% 0, 85% 0, 100% 100%, 0% 100%)",
          }}
        />
        <div
          style={{
            width: 22,
            height: 36,
            background: "#1a3a5c",
            borderRadius: "0 0 4px 4px",
            clipPath: "polygon(15% 0, 85% 0, 100% 100%, 0% 100%)",
          }}
        />
      </div>
    </div>
  );
}

/* ─── Channel card ─────────────────────────────────────────────────────────── */
function ChannelCard({
  stream,
  active,
  onClick,
  num,
}: {
  stream: Stream;
  active: boolean;
  onClick: () => void;
  num: number;
}) {
  const accent = CAT_COLOR[stream.category] ?? "#2563a8";
  return (
    <button
      onClick={onClick}
      className="card-lift text-left rounded-2xl p-4 ring-1 transition-all duration-300"
      style={
        active
          ? { background: "#1a3a5c", color: "#fff" }
          : { background: "#fff", boxShadow: "0 1px 4px rgba(26,58,92,0.06)", color: "#1a3a5c" }
      }
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        {/* CH number */}
        <span
          className="text-[9px] font-black uppercase tracking-[0.2em]"
          style={{ color: active ? "rgba(255,255,255,0.4)" : "#9ca3af" }}
        >
          CH {num}
        </span>
        {/* Category dot */}
        <span
          className="text-[9px] font-bold uppercase tracking-[0.15em] px-1.5 py-0.5 rounded-full"
          style={{ background: active ? `${accent}30` : `${accent}12`, color: accent }}
        >
          {stream.category}
        </span>
      </div>

      <p
        className="font-bold text-sm leading-snug mb-0.5"
        style={{ fontFamily: "var(--font-playfair), serif", color: active ? "#fff" : "#1a3a5c" }}
      >
        {stream.name}
      </p>
      <p className="text-[11px] font-medium mb-2" style={{ color: active ? "rgba(255,255,255,0.55)" : "#6b7280" }}>
        {stream.body}
      </p>
      <p className="text-[10px]" style={{ color: active ? "rgba(255,255,255,0.35)" : "#9ca3af" }}>
        {stream.schedule}
      </p>

      {active && (
        <div className="flex items-center gap-1.5 mt-3">
          <span className="relative flex h-1.5 w-1.5">
            <span className="alive-halo absolute inset-0 rounded-full" style={{ background: accent }}/>
            <span className="alive-pulse relative h-1.5 w-1.5 rounded-full" style={{ background: accent }}/>
          </span>
          <span className="text-[9px] font-bold uppercase tracking-[0.15em]" style={{ color: accent }}>
            On Air
          </span>
        </div>
      )}
    </button>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────────────── */
export default function TVStation() {
  const [active, setActive] = useState<string>(STREAMS[0].id);
  const [catFilter, setCatFilter] = useState<string>("all");

  const activeStream = STREAMS.find((s) => s.id === active) ?? STREAMS[0];
  const displayedStreams =
    catFilter === "all" ? STREAMS : STREAMS.filter((s) => s.category === catFilter);

  return (
    <div
      style={{
        background: "var(--bg, #f5f3ef)",
        minHeight: "100vh",
        fontFamily: "var(--font-outfit), sans-serif",
      }}
    >
      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #1a3a5c 0%, #0f2540 60%, #162e4a 100%)",
          paddingTop: "3rem",
          paddingBottom: "3rem",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 70% 60% at 80% 40%, rgba(37,99,168,0.18) 0%, transparent 70%)",
          }}
        />
        <div className="relative max-w-5xl mx-auto px-5">
          <p className="text-sky-300 text-xs font-bold uppercase tracking-[0.22em] mb-3">Media</p>
          <h1
            className="text-3xl md:text-4xl font-bold text-white mb-2"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            TV Station
          </h1>
          <p className="text-white/50 text-sm">
            Live public meeting streams — Harris County, Houston, HISD, Austin, and D.C.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-5 py-10">
        {/* TV silhouette */}
        <TVSilhouette stream={activeStream} />

        {/* Channel guide */}
        <div className="mt-10">
          {/* Category filter */}
          <div className="flex flex-wrap gap-2 mb-5">
            <button
              onClick={() => setCatFilter("all")}
              className="px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200"
              style={
                catFilter === "all"
                  ? { background: "#1a3a5c", color: "#fff" }
                  : { background: "rgba(26,58,92,0.08)", color: "#1a3a5c", border: "1px solid rgba(26,58,92,0.15)" }
              }
            >
              All Channels
            </button>
            {CATEGORY_ORDER.map((cat) => (
              <button
                key={cat}
                onClick={() => setCatFilter(cat)}
                className="px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200"
                style={
                  catFilter === cat
                    ? { background: CAT_COLOR[cat], color: "#fff" }
                    : { background: `${CAT_COLOR[cat]}12`, color: CAT_COLOR[cat], border: `1px solid ${CAT_COLOR[cat]}30` }
                }
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Channel grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {displayedStreams.map((stream) => (
              <ChannelCard
                key={stream.id}
                stream={stream}
                active={active === stream.id}
                onClick={() => setActive(stream.id)}
                num={STREAMS.indexOf(stream) + 1}
              />
            ))}
          </div>

          <p className="text-center text-[10px] mt-6" style={{ color: "#b0bec8" }}>
            Streams are live during public meetings only · YouTube embeds require an active broadcast
          </p>
        </div>
      </div>
    </div>
  );
}
