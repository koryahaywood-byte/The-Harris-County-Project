import Link from "next/link";
import { getDashboardData } from "@/lib/dashboard-data";
import type { DashboardData, NewsStory, BallotRace } from "@/lib/dashboard-data";

const CAT_COLOR: Record<string, string> = {
  Elections:    "#2563a8",
  Legislature:  "#7c3aed",
  Courts:       "#d97706",
  "City Council":"#0d9488",
  HISD:         "#dc2626",
  Civic:        "#16a34a",
};

const TIER_META = {
  local:   { label: "Houston",  color: "#0d9488", desc: "What's moving at City Hall & Harris County" },
  state:   { label: "Texas",    color: "#7c3aed", desc: "Austin & the statehouse" },
  federal: { label: "D.C.",     color: "#2563a8", desc: "Congress & the White House" },
};

function timeAgo(pubDate: string): string {
  if (!pubDate) return "";
  const diff = Date.now() - new Date(pubDate).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (h < 1)  return "Just now";
  if (h < 24) return `${h}h ago`;
  if (d === 1) return "Yesterday";
  return `${d}d ago`;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Morning briefing header ──────────────────────────────────────────────────
function MorningHeader() {
  const now    = new Date();
  const hour   = now.getHours();
  const greeting =
    hour < 12 ? "Morning briefing" :
    hour < 17 ? "Afternoon update" :
                "Evening roundup";
  const dateLabel = now.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1 mb-8">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] mb-1"
          style={{ color: "var(--accent)", opacity: 0.45 }}>
          Harris County · Political Intelligence
        </p>
        <h2 className="text-2xl md:text-3xl font-bold text-[var(--accent)]"
          style={{ fontFamily: "var(--font-playfair), serif" }}>
          {greeting}
        </h2>
      </div>
      <p className="text-sm text-[var(--muted)] sm:text-right">{dateLabel}</p>
    </div>
  );
}

// ── News card ────────────────────────────────────────────────────────────────
function NewsCard({ story, tier }: { story: NewsStory | null; tier: keyof typeof TIER_META }) {
  const meta = TIER_META[tier];

  return (
    <div className="group flex flex-col rounded-[1.5rem] overflow-hidden bg-white ring-1 ring-black/8"
      style={{ boxShadow: "0 2px 12px rgba(26,58,92,0.06)" }}>

      {/* Color bar + tier label */}
      <div className="flex items-center gap-2 px-5 pt-4 pb-3"
        style={{ borderBottom: "1px solid #f0ede8" }}>
        <span className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: meta.color }} />
        <span className="text-[10px] font-bold uppercase tracking-[0.22em]"
          style={{ color: meta.color }}>
          {meta.label}
        </span>
        <span className="text-[10px] text-[var(--muted)] ml-1">{meta.desc}</span>
      </div>

      {/* Photo */}
      {story?.image && (
        <div className="w-full overflow-hidden" style={{ height: 140 }}>
          <img
            src={story.image} alt="" loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>
      )}
      {!story?.image && (
        <div className="w-full flex items-center justify-center"
          style={{ height: 140, background: `${meta.color}12` }}>
          <span className="text-3xl opacity-20">📰</span>
        </div>
      )}

      {/* Content */}
      <div className="flex flex-col flex-1 px-5 py-4 gap-3">
        {story ? (
          <>
            {!story.isToday && (
              <span className="self-start text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ background: "#fef3c7", color: "#b45309" }}>
                Recent
              </span>
            )}
            <a href={story.link} target="_blank" rel="noopener noreferrer" className="group/link">
              <h3 className="text-[15px] font-bold leading-snug line-clamp-3 group-hover/link:underline"
                style={{ color: "var(--accent)", fontFamily: "var(--font-playfair), serif" }}>
                {story.title}
              </h3>
            </a>
            <div className="mt-auto flex items-center justify-between gap-2 pt-2"
              style={{ borderTop: "1px solid #f0ede8" }}>
              <span className="text-[11px] font-semibold text-[var(--muted)] truncate">{story.source}</span>
              <span className="text-[11px] text-[var(--muted)]/60 flex-shrink-0">{timeAgo(story.pubDate)}</span>
            </div>
          </>
        ) : (
          <p className="text-sm text-[var(--muted)] py-4 text-center">
            Checking {meta.label} sources…
          </p>
        )}
      </div>
    </div>
  );
}

// ── Election countdown ───────────────────────────────────────────────────────
function CountdownCard({ nextElection }: { nextElection: DashboardData["nextElection"] }) {
  return (
    <div className="rounded-[1.5rem] text-white flex flex-col justify-between p-5 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg,#1a3a5c 0%,#0f2540 100%)", minHeight: 160 }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 60% at 80% 20%,rgba(125,211,252,0.12),transparent)" }} />

      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40 relative z-10">
        Next Election
      </p>

      {nextElection ? (
        <div className="relative z-10">
          <p className="text-[3.5rem] font-bold leading-none text-white"
            style={{ fontFamily: "var(--font-playfair), serif" }}>
            {nextElection.daysAway}
          </p>
          <p className="text-sm text-white/50 mt-0.5">days away</p>
          <p className="text-sm font-semibold text-white/80 mt-2 leading-snug">
            {nextElection.title}
          </p>
          <p className="text-[11px] text-white/35 mt-1">{formatDate(nextElection.date)}</p>
        </div>
      ) : (
        <p className="text-sm text-white/50 relative z-10">No election data</p>
      )}

      <Link href="/tools/civic-calendar"
        className="relative z-10 self-start mt-3 text-[11px] font-semibold text-sky-300 hover:underline">
        Full calendar →
      </Link>
    </div>
  );
}

// ── Today's agenda ───────────────────────────────────────────────────────────
function AgendaCard({ todayEvents, upcomingEvent }: {
  todayEvents: DashboardData["todayEvents"];
  upcomingEvent: DashboardData["upcomingEvent"];
}) {
  return (
    <div className="rounded-[1.5rem] bg-white ring-1 ring-black/8 p-5 flex flex-col gap-1"
      style={{ boxShadow: "0 2px 12px rgba(26,58,92,0.06)" }}>
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] mb-2">
        Today&apos;s Agenda
      </p>

      {todayEvents.length > 0 ? (
        <ul className="flex flex-col gap-2.5">
          {todayEvents.slice(0, 4).map((e, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: CAT_COLOR[e.category] ?? "#1a3a5c" }} />
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-[var(--accent)] leading-snug">{e.title}</p>
                <p className="text-[10px] text-[var(--muted)] mt-0.5 leading-snug line-clamp-1">{e.description}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div>
          <p className="text-[13px] font-semibold text-[var(--accent)]">Nothing scheduled today</p>
          {upcomingEvent && (
            <p className="text-[11px] text-[var(--muted)] mt-1.5 leading-snug">
              Next up in <span className="font-semibold text-[var(--accent)]">{upcomingEvent.daysAway}d</span>
              {" "}— {upcomingEvent.title}
            </p>
          )}
        </div>
      )}

      <Link href="/tools/civic-calendar"
        className="mt-auto pt-3 text-[11px] font-semibold text-[var(--accent-light)] hover:underline">
        Full calendar →
      </Link>
    </div>
  );
}

// ── On the ballot ────────────────────────────────────────────────────────────
const COMPETITIVE_COLOR: Record<string, { bg: string; text: string }> = {
  "Safe D":  { bg: "#dbeafe", text: "#1d4ed8" },
  "Lean D":  { bg: "#eff6ff", text: "#2563eb" },
  "Toss-up": { bg: "#fef9c3", text: "#a16207" },
  "Lean R":  { bg: "#fff1f2", text: "#be123c" },
  "Safe R":  { bg: "#ffe4e6", text: "#dc2626" },
};

const COMPETITIVE_EXPLAIN: Record<string, string> = {
  "Safe D":  "Likely Democratic hold",
  "Lean D":  "Favors Democrat",
  "Toss-up": "Could go either way",
  "Lean R":  "Favors Republican",
  "Safe R":  "Likely Republican hold",
};

function BallotCard({ races, nextElection }: { races: BallotRace[]; nextElection: DashboardData["nextElection"] }) {
  const electionDay  = new Date("2026-11-03");
  const daysAway     = Math.ceil((electionDay.getTime() - Date.now()) / 86400000);

  return (
    <div className="rounded-[1.5rem] bg-white ring-1 ring-black/8 p-5 flex flex-col"
      style={{ boxShadow: "0 2px 12px rgba(26,58,92,0.06)" }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
          On the Ballot · Nov 2026
        </p>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: "#fef3c7", color: "#b45309" }}>
          {daysAway}d away
        </span>
      </div>

      <ul className="flex flex-col divide-y divide-gray-100">
        {races.map((race) => {
          const chip    = COMPETITIVE_COLOR[race.competitive] ?? COMPETITIVE_COLOR["Toss-up"];
          const explain = COMPETITIVE_EXPLAIN[race.competitive] ?? "";
          return (
            <li key={race.office}>
              <Link href={race.href}
                className="flex items-center justify-between gap-2 py-2.5 group">
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-[var(--accent)] truncate group-hover:underline leading-tight">
                    {race.office}
                  </p>
                  <p className="text-[10px] text-[var(--muted)] truncate">{race.incumbent}</p>
                </div>
                <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                    style={{ background: chip.bg, color: chip.text }}>
                    {race.competitive}
                  </span>
                  <span className="text-[9px] text-[var(--muted)]/60 text-right">{explain}</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      <Link href="/tools/heat-check"
        className="mt-3 text-[11px] font-semibold text-[var(--accent-light)] hover:underline">
        Precinct-level race analysis →
      </Link>
    </div>
  );
}

// ── Main widget ──────────────────────────────────────────────────────────────
export default async function DashboardWidget() {
  let data: DashboardData | null = null;
  try { data = await getDashboardData(); } catch { /* silently degrade */ }

  return (
    <section style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}
      className="py-14 md:py-20 px-6">
      <div className="max-w-7xl mx-auto">

        <MorningHeader />

        {/* ── Row 1: Three news tiers ─────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <NewsCard story={data?.local   ?? null} tier="local"   />
          <NewsCard story={data?.state   ?? null} tier="state"   />
          <NewsCard story={data?.federal ?? null} tier="federal" />
        </div>

        {/* ── Row 2: Countdown · Agenda · Ballot ──────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <CountdownCard nextElection={data?.nextElection ?? null} />
          <AgendaCard
            todayEvents={data?.todayEvents ?? []}
            upcomingEvent={data?.upcomingEvent ?? null}
          />
          <BallotCard
            races={data?.ballot ?? []}
            nextElection={data?.nextElection ?? null}
          />
        </div>

        {/* ── Consultant note ─────────────────────────────────────────── */}
        <p className="mt-6 text-[11px] text-[var(--muted)]/50 text-center leading-relaxed max-w-2xl mx-auto">
          News sources: Houston Chronicle · Texas Tribune · Austin American-Statesman · Texas Monthly ·
          NY Times · Washington Post · Wall Street Journal · AP.
          Stories refresh every 30 minutes. Race ratings are editorial — not projections.
        </p>

      </div>
    </section>
  );
}
