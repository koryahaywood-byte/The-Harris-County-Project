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
    embedUrl: "https://www.youtube.com/embed/live_stream?channel=UCb-kH-7h4pEDgAeNSs7bONw&autoplay=1",
    livePageUrl: "https://live.house.gov",
    scheduleUrl: "https://www.house.gov/legislative-activity",
    schedule: "When in session",
    description: "C-SPAN live feed: U.S. House floor proceedings",
    category: "Federal",
  },
  {
    id: "us-senate",
    name: "U.S. Senate",
    body: "119th Congress",
    embedUrl: "https://www.youtube.com/embed/live_stream?channel=UClME1qOSbRR8u09W0AqfEVw&autoplay=1",
    livePageUrl: "https://www.senate.gov/general/streaming.htm",
    scheduleUrl: "https://www.senate.gov/legislative/LIS/floor_activity/CurrentActivity.htm",
    schedule: "When in session",
    description: "C-SPAN 2 live feed: U.S. Senate floor proceedings",
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

const CAT_LABEL: Record<string, string> = {
  County: "CTY", City: "HTX", HISD: "ISD", State: "TX", Federal: "FED",
};

/* ─── TV silhouette with embedded screen ───────────────────────────────── */
function TVSilhouette({ stream, chNum }: { stream: Stream; chNum: number }) {
  const accent = CAT_COLOR[stream.category] ?? "#2563a8";

  return (
    <div className="relative mx-auto select-none" style={{ maxWidth: 860, fontFamily: "var(--font-outfit), sans-serif" }}>
      {/* Antennas */}
      <svg
        viewBox="0 0 240 72" fill="none"
        className="absolute left-1/2 -translate-x-1/2"
        style={{ bottom: "calc(100% - 4px)", width: "42%", pointerEvents: "none" }}
      >
        <line x1="82" y1="72" x2="24" y2="4" stroke="#1a3a5c" strokeWidth="5" strokeLinecap="round"/>
        <circle cx="24" cy="4" r="5" fill="#1a3a5c"/>
        <line x1="158" y1="72" x2="216" y2="4" stroke="#1a3a5c" strokeWidth="5" strokeLinecap="round"/>
        <circle cx="216" cy="4" r="5" fill="#1a3a5c"/>
      </svg>

      {/* Chassis */}
      <div
        className="flex items-stretch gap-0 rounded-[1.75rem] overflow-hidden"
        style={{
          background: "#1a3a5c",
          boxShadow: "0 24px 64px rgba(26,58,92,0.28), 0 2px 0 rgba(255,255,255,0.06) inset, 0 -2px 0 rgba(0,0,0,0.2) inset",
          padding: "18px 14px 22px",
        }}
      >
        {/* Left panel */}
        <div className="w-6 flex-shrink-0 rounded-lg mr-3 self-stretch"
          style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.09), rgba(255,255,255,0.04))", border: "1px solid rgba(255,255,255,0.1)" }} />

        {/* Screen bezel */}
        <div className="flex-1 rounded-xl overflow-hidden"
          style={{ background: "#000", border: "3px solid rgba(255,255,255,0.10)", boxShadow: "inset 0 0 40px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.04)" }}>
          <div className="relative" style={{ aspectRatio: "16/9" }}>
            <iframe
              key={stream.id}
              src={stream.embedUrl}
              className="absolute inset-0 w-full h-full border-0"
              title={stream.name}
              allowFullScreen
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            />
            {/* CRT vignette */}
            <div className="pointer-events-none absolute inset-0"
              style={{ boxShadow: "inset 0 0 60px rgba(0,0,0,0.5), inset 0 -30px 50px rgba(0,0,0,0.7)" }} />
            {/* Now playing badge */}
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-full px-2.5 py-1"
              style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)" }}>
              <span className="relative flex h-1.5 w-1.5">
                <span className="alive-halo absolute inset-0 rounded-full" style={{ background: accent }}/>
                <span className="alive-pulse relative h-1.5 w-1.5 rounded-full" style={{ background: accent }}/>
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.8)" }}>
                CH {chNum} · {stream.name}
              </span>
            </div>
          </div>
        </div>

        {/* Right control panel */}
        <div className="flex-shrink-0 w-14 ml-3 flex flex-col items-center justify-center gap-4">
          {/* Channel knob */}
          <div className="w-10 h-10 rounded-full flex items-center justify-center cursor-default"
            style={{ background: "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.18), rgba(255,255,255,0.06))", border: "2px solid rgba(255,255,255,0.18)", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.1)" }}>
            <div className="w-0.5 h-4 rounded-full" style={{ background: "rgba(255,255,255,0.55)" }}/>
          </div>
          {/* Volume knob */}
          <div className="w-7 h-7 rounded-full cursor-default"
            style={{ background: "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.12), rgba(255,255,255,0.04))", border: "1.5px solid rgba(255,255,255,0.13)", boxShadow: "inset 0 2px 3px rgba(0,0,0,0.3)" }} />
          {/* Power LED */}
          <div className="alive-pulse w-2.5 h-2.5 rounded-full"
            style={{ background: accent, boxShadow: `0 0 6px ${accent}80` }} />
          {/* CH display */}
          <div className="text-[7px] font-bold uppercase tracking-[0.15em] text-center leading-tight"
            style={{ color: "rgba(255,255,255,0.25)" }}>
            CH<br/>{chNum}
          </div>
        </div>
      </div>

      {/* Brand strip */}
      <div className="flex items-center justify-center gap-3 mt-2">
        <div className="h-px flex-1 max-w-[80px]" style={{ background: "rgba(26,58,92,0.2)" }}/>
        <p className="text-[9px] font-bold uppercase tracking-[0.45em]"
          style={{ color: "rgba(26,58,92,0.35)", fontFamily: "var(--font-playfair), serif" }}>
          Harris County
        </p>
        <div className="h-px flex-1 max-w-[80px]" style={{ background: "rgba(26,58,92,0.2)" }}/>
      </div>

      {/* Legs */}
      <div className="flex justify-between" style={{ padding: "0 22%" }}>
        {[0, 1].map(i => (
          <div key={i} style={{ width: 22, height: 36, background: "#1a3a5c", borderRadius: "0 0 4px 4px", clipPath: "polygon(15% 0, 85% 0, 100% 100%, 0% 100%)" }} />
        ))}
      </div>
    </div>
  );
}

/* ─── Remote Control ────────────────────────────────────────────────────── */
function RemoteControl({
  streams,
  activeId,
  onSelect,
}: {
  streams: Stream[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const activeIdx = streams.findIndex(s => s.id === activeId);
  const active    = streams[activeIdx] ?? streams[0];
  const accent    = CAT_COLOR[active.category] ?? "#2563a8";

  function chUp()   { onSelect(streams[(activeIdx - 1 + streams.length) % streams.length].id); }
  function chDown() { onSelect(streams[(activeIdx + 1) % streams.length].id); }
  function chNum(n: number) { if (n >= 1 && n <= streams.length) onSelect(streams[n - 1].id); }

  const btnStyle = (pressed?: boolean) => ({
    background: pressed
      ? "radial-gradient(circle at 50% 60%, #0d1f35, #1a3a5c)"
      : "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.18), #1e3a5c)",
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: pressed
      ? "inset 0 2px 6px rgba(0,0,0,0.6)"
      : "inset 0 1px 0 rgba(255,255,255,0.18), 0 3px 6px rgba(0,0,0,0.4)",
    borderRadius: 8,
    cursor: "pointer",
    transition: "all 0.1s",
    color: "rgba(255,255,255,0.85)",
    fontWeight: 700,
    fontSize: 11,
    letterSpacing: "0.05em",
  });

  return (
    <div className="flex gap-5 items-start flex-wrap md:flex-nowrap">

      {/* Remote device */}
      <div
        className="flex-shrink-0 mx-auto"
        style={{
          width: 200,
          background: "linear-gradient(170deg, #1a2a3a 0%, #0d1825 100%)",
          borderRadius: 32,
          padding: "20px 16px 28px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08), 4px 4px 0 rgba(0,0,0,0.2)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Brand top */}
        <div className="flex items-center justify-between mb-4 px-1">
          <p className="text-[8px] font-black uppercase tracking-[0.3em]" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-playfair), serif" }}>
            HCTV
          </p>
          {/* Power button */}
          <button
            onClick={() => onSelect(streams[0].id)}
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "#dc2626", boxShadow: "0 0 8px rgba(220,38,38,0.5), inset 0 1px 0 rgba(255,255,255,0.2)", border: "none", cursor: "pointer" }}
            title="Back to CH 1"
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
              <path d="M12 2v10M4.93 4.93A10 10 0 1 0 19.07 4.93"/>
            </svg>
          </button>
        </div>

        {/* CH display screen */}
        <div
          className="rounded-xl mb-4 flex flex-col items-center justify-center py-3"
          style={{ background: "#000d1a", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "inset 0 2px 6px rgba(0,0,0,0.6)" }}
        >
          <p className="text-[8px] font-bold uppercase tracking-[0.2em] mb-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>
            Channel
          </p>
          <p className="font-black text-2xl leading-none" style={{ color: accent, fontFamily: "var(--font-outfit), sans-serif", textShadow: `0 0 12px ${accent}80` }}>
            {String(activeIdx + 1).padStart(2, "0")}
          </p>
          <p className="text-[8px] font-bold mt-0.5 px-2 text-center leading-tight" style={{ color: "rgba(255,255,255,0.4)" }}>
            {active.name}
          </p>
        </div>

        {/* CH UP / CH DOWN */}
        <div className="flex gap-2 mb-3">
          <button onClick={chUp} className="flex-1 py-2.5 flex flex-col items-center gap-0.5" style={btnStyle()} title="Previous channel">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M18 15l-6-6-6 6"/>
            </svg>
            <span style={{ fontSize: 8, letterSpacing: "0.1em", color: "rgba(255,255,255,0.5)" }}>CH</span>
          </button>
          <button onClick={chDown} className="flex-1 py-2.5 flex flex-col items-center gap-0.5" style={btnStyle()} title="Next channel">
            <span style={{ fontSize: 8, letterSpacing: "0.1em", color: "rgba(255,255,255,0.5)" }}>CH</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>
        </div>

        {/* Number pad */}
        <div className="grid grid-cols-3 gap-1.5 mb-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(n => {
            const s = streams[n - 1];
            const isActive = s?.id === activeId;
            return (
              <button
                key={n}
                onClick={() => chNum(n)}
                disabled={!s}
                className="py-2.5 flex flex-col items-center gap-0.5"
                style={{
                  ...btnStyle(),
                  ...(isActive ? { background: `radial-gradient(circle at 35% 35%, ${accent}50, ${accent}22)`, border: `1px solid ${accent}70`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.1), 0 0 8px ${accent}40` } : {}),
                  opacity: s ? 1 : 0.35,
                }}
                title={s?.name ?? ""}
              >
                <span style={{ fontSize: 13, color: isActive ? accent : "rgba(255,255,255,0.8)" }}>{n}</span>
                {s && (
                  <span style={{ fontSize: 7, letterSpacing: "0.05em", color: isActive ? accent : "rgba(255,255,255,0.3)" }}>
                    {CAT_LABEL[s.category]}
                  </span>
                )}
              </button>
            );
          })}
          {/* 0 / last channel */}
          <button
            onClick={() => onSelect(streams[streams.length - 1].id)}
            className="py-2.5 flex flex-col items-center gap-0.5"
            style={btnStyle()}
          >
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>0</span>
          </button>
        </div>

        {/* Category color buttons */}
        <div className="flex gap-1.5 mt-3">
          {(["County", "City", "State", "Federal"] as const).map(cat => (
            <button
              key={cat}
              onClick={() => {
                const first = streams.find(s => s.category === cat);
                if (first) onSelect(first.id);
              }}
              className="flex-1 h-3 rounded-sm"
              style={{ background: CAT_COLOR[cat], boxShadow: `0 0 4px ${CAT_COLOR[cat]}60`, border: "none", cursor: "pointer" }}
              title={cat}
            />
          ))}
        </div>
      </div>

      {/* Channel info panel */}
      <div className="flex-1 min-w-0 max-md:min-w-[280px]">
        {/* Active channel hero */}
        <div
          className="rounded-2xl p-5 mb-3"
          style={{ background: "#1a3a5c", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full"
                  style={{ background: `${accent}25`, color: accent }}
                >
                  {active.category}
                </span>
                <span className="text-[9px] font-bold" style={{ color: "rgba(255,255,255,0.35)" }}>
                  CH {activeIdx + 1}
                </span>
              </div>
              <h3 className="font-bold text-white text-lg leading-tight" style={{ fontFamily: "var(--font-playfair), serif" }}>
                {active.name}
              </h3>
              <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{active.body}</p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="relative flex h-1.5 w-1.5">
                <span className="alive-halo absolute inset-0 rounded-full" style={{ background: accent }}/>
                <span className="alive-pulse relative h-1.5 w-1.5 rounded-full" style={{ background: accent }}/>
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.15em]" style={{ color: accent }}>On Air</span>
            </div>
          </div>
          <p className="text-sm mb-3 leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{active.description}</p>
          <div className="flex items-center gap-2 text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
            </svg>
            {active.schedule}
            <a href={active.scheduleUrl} target="_blank" rel="noopener noreferrer"
              className="ml-auto text-[10px] font-semibold hover:underline" style={{ color: accent }}>
              Full Schedule →
            </a>
          </div>
        </div>

        {/* Channel list: compact rows */}
        <div className="space-y-1.5">
          {streams.map((s, i) => {
            const col = CAT_COLOR[s.category];
            const isActive = s.id === activeId;
            return (
              <button
                key={s.id}
                onClick={() => onSelect(s.id)}
                className="w-full text-left rounded-xl px-4 py-3 flex items-center gap-3 transition-all duration-200"
                style={
                  isActive
                    ? { background: "#1a3a5c", boxShadow: `0 0 0 1px ${col}50` }
                    : { background: "rgba(26,58,92,0.05)", border: "1px solid rgba(26,58,92,0.1)" }
                }
              >
                {/* CH number */}
                <span
                  className="font-black text-sm w-7 flex-shrink-0"
                  style={{ color: isActive ? col : "rgba(26,58,92,0.4)", fontFamily: "var(--font-outfit), sans-serif" }}
                >
                  {i + 1}
                </span>
                {/* Cat dot */}
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: col }} />
                {/* Names */}
                <span className="flex-1 min-w-0">
                  <span className="font-semibold text-sm" style={{ color: isActive ? "#fff" : "#1a3a5c" }}>{s.name}</span>
                  <span className="text-[11px] ml-2" style={{ color: isActive ? "rgba(255,255,255,0.4)" : "#9ca3af" }}>{s.body}</span>
                </span>
                {/* Schedule */}
                <span className="text-[10px] hidden sm:block flex-shrink-0" style={{ color: isActive ? "rgba(255,255,255,0.3)" : "#9ca3af" }}>
                  {s.schedule}
                </span>
                {isActive && (
                  <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                    <span className="alive-halo absolute inset-0 rounded-full" style={{ background: col }}/>
                    <span className="alive-pulse relative h-1.5 w-1.5 rounded-full" style={{ background: col }}/>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */
export default function TVStation() {
  const [activeId, setActiveId] = useState<string>(STREAMS[0].id);
  const activeIdx   = STREAMS.findIndex(s => s.id === activeId);
  const activeStream = STREAMS[activeIdx] ?? STREAMS[0];

  return (
    <div style={{ background: "var(--bg, #f2f5f9)", minHeight: "100vh", fontFamily: "var(--font-outfit), sans-serif" }}>

      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1a3a5c 0%, #0f2540 60%, #162e4a 100%)", paddingTop: "3rem", paddingBottom: "3rem" }}
      >
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 70% 60% at 80% 40%, rgba(37,99,168,0.18) 0%, transparent 70%)" }} />
        <div className="relative max-w-5xl mx-auto px-5">
          <p className="text-sky-300 text-xs font-bold uppercase tracking-[0.22em] mb-3">Media</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-playfair), serif" }}>
            TV Station
          </h1>
          <p className="text-white/50 text-sm">Live public meeting streams. Harris County, Houston, HISD, Austin, and D.C.</p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-5 py-10 space-y-10">
        {/* TV */}
        <TVSilhouette stream={activeStream} chNum={activeIdx + 1} />

        {/* Remote + channel list */}
        <RemoteControl streams={STREAMS} activeId={activeId} onSelect={setActiveId} />

        <p className="text-center text-[10px] mt-2" style={{ color: "#b0bec8" }}>
          Streams are live during public meetings only · YouTube embeds require an active broadcast · Federal channels via C-SPAN
        </p>
      </div>
    </div>
  );
}
