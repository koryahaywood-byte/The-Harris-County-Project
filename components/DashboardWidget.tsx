import Link from "next/link";
import { getDashboardData } from "@/lib/dashboard-data";
import type { DashboardData, NewsStory, BallotRace } from "@/lib/dashboard-data";

const CAT_COLOR: Record<string, string> = {
  Elections:     "#2563a8",
  Legislature:   "#7c3aed",
  Courts:        "#d97706",
  "City Council":"#0d9488",
  HISD:          "#dc2626",
  Civic:         "#16a34a",
};

function timeAgo(pubDate: string): string {
  if (!pubDate) return "";
  const diff = Date.now() - new Date(pubDate).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (h < 1) return "Just now";
  if (h < 24) return `${h}h ago`;
  if (d === 1) return "Yesterday";
  return `${d}d ago`;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Gradient fallbacks per tier when no photo
const TIER_GRADIENTS = [
  "linear-gradient(135deg, #1a3a5c 0%, #2563a8 100%)",
  "linear-gradient(135deg, #1e3a5f 0%, #0d9488 100%)",
  "linear-gradient(135deg, #1a3a5c 0%, #7c3aed 100%)",
];

function NewsCard({ story, tier }: { story: NewsStory | null; tier: string; label: string; idx: number }) {
  const gradient = TIER_GRADIENTS[["Federal", "Texas", "Local"].indexOf(tier)] ?? TIER_GRADIENTS[0];
  const noStoryToday = story && !story.isToday;
  return (
    <div className="group relative rounded-[1.5rem] overflow-hidden bg-white ring-1 ring-black/8 card-lift flex flex-col min-h-[340px]">
      {/* Photo area — uses CSS background-image so gradient always shows as fallback */}
      <div
        className="relative w-full h-48 flex-shrink-0 overflow-hidden transition-transform duration-700 group-hover:scale-105"
        style={{
          backgroundImage: story?.image
            ? `url(${story.image}), ${gradient}`
            : gradient,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Tier badge */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] bg-white/90 backdrop-blur-sm text-[var(--accent)] px-3 py-1.5 rounded-full shadow-sm">
            {tier}
          </span>
          {noStoryToday && (
            <span className="text-[9px] font-semibold bg-amber-100/90 text-amber-700 px-2 py-1 rounded-full shadow-sm">
              Recent
            </span>
          )}
        </div>
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        {story ? (
          <>
            <h3
              className="text-base font-bold text-[var(--accent)] leading-snug line-clamp-3 group-hover:text-[var(--accent-light)] transition-colors duration-300"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              {story.title}
            </h3>
            <div className="mt-auto flex items-center justify-between gap-2">
              <span className="text-xs text-[var(--muted)] font-medium truncate">{story.source}</span>
              <span className="text-[11px] text-[var(--muted)]/70 flex-shrink-0">{timeAgo(story.pubDate)}</span>
            </div>
            <a
              href={story.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 text-[11px] font-semibold text-[var(--accent-light)] hover:underline flex items-center gap-1"
            >
              Read story <span className="opacity-60">→</span>
            </a>
          </>
        ) : (
          <p className="text-sm text-[var(--muted)]">Loading latest {tier.toLowerCase()} story...</p>
        )}
      </div>
    </div>
  );
}

const COMPETITIVE_COLOR: Record<string, { bg: string; text: string }> = {
  "Safe D":   { bg: "#dbeafe", text: "#1d4ed8" },
  "Lean D":   { bg: "#eff6ff", text: "#2563eb" },
  "Toss-up":  { bg: "#fef9c3", text: "#a16207" },
  "Lean R":   { bg: "#fff1f2", text: "#be123c" },
  "Safe R":   { bg: "#ffe4e6", text: "#dc2626" },
};

function OnTheBallotCard({ races }: { races: BallotRace[] }) {
  const electionDay = new Date("2026-11-03");
  const today = new Date();
  const daysAway = Math.ceil((electionDay.getTime() - today.getTime()) / 86400000);

  return (
    <div className="rounded-2xl bg-white ring-1 ring-black/8 p-5 flex flex-col gap-0">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">On the Ballot · Nov 2026</p>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#fef3c7", color: "#b45309" }}>
          {daysAway}d away
        </span>
      </div>
      <ul className="flex flex-col divide-y divide-gray-100">
        {races.map((race) => {
          const chip = COMPETITIVE_COLOR[race.competitive] ?? COMPETITIVE_COLOR["Toss-up"];
          return (
            <li key={race.office}>
              <Link
                href={race.href}
                className="flex items-center justify-between gap-2 py-2 group"
              >
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-[var(--accent)] truncate group-hover:underline leading-tight">
                    {race.office}
                  </p>
                  <p className="text-[10px] text-[var(--muted)] truncate">{race.incumbent}</p>
                </div>
                <span
                  className="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 uppercase tracking-wide"
                  style={{ background: chip.bg, color: chip.text }}
                >
                  {race.competitive}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <Link
        href="/tools/heat-check"
        className="mt-3 text-[11px] font-semibold text-[var(--accent-light)] hover:underline"
      >
        Full race analysis →
      </Link>
    </div>
  );
}

export default async function DashboardWidget() {
  let data: DashboardData | null = null;
  try {
    data = await getDashboardData();
  } catch {
    // silently degrade
  }

  const today = new Date();
  const dateLabel = today.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  return (
    <section className="bg-[var(--bg)] border-b border-[var(--border)] py-16 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-10">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--accent)]/50 mb-1">
              Harris County Today
            </p>
            <h2
              className="text-2xl md:text-3xl font-bold text-[var(--accent)]"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              What&apos;s happening right now
            </h2>
          </div>
          <p className="text-sm text-[var(--muted)]">{dateLabel}</p>
        </div>

        {/* News row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {(["Federal", "Texas", "Local"] as const).map((tier, idx) => {
            const story = tier === "Federal" ? data?.federal
              : tier === "Texas" ? data?.state
              : data?.local;
            return (
              <NewsCard
                key={tier}
                story={story ?? null}
                tier={tier}
                label={tier}
                idx={idx}
              />
            );
          })}
        </div>

        {/* Bottom stats strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          {/* Today's events */}
          <div className="rounded-2xl bg-white ring-1 ring-black/8 p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] mb-3">Today&apos;s Civic Events</p>
            {data?.todayEvents && data.todayEvents.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {data.todayEvents.slice(0, 3).map((e, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span
                      className="mt-1 w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: CAT_COLOR[e.category] ?? "#1a3a5c" }}
                    />
                    <span className="text-sm text-[var(--accent)] font-medium leading-snug">{e.title}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div>
                <p className="text-sm font-semibold text-[var(--accent)]">No civic events today</p>
                {data?.upcomingEvent && (
                  <p className="text-xs text-[var(--muted)] mt-1">
                    Next: <span className="font-medium">{data.upcomingEvent.title}</span> in {data.upcomingEvent.daysAway} day{data.upcomingEvent.daysAway !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            )}
            <Link
              href="/tools/civic-calendar"
              className="mt-3 inline-flex text-[11px] font-semibold text-[var(--accent-light)] hover:underline"
            >
              Full calendar →
            </Link>
          </div>

          {/* Election countdown */}
          <div className="rounded-2xl bg-[var(--accent)] text-white p-5 flex flex-col justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 mb-3">Election Countdown</p>
            {data?.nextElection ? (
              <>
                <div>
                  <p
                    className="text-4xl font-bold leading-none mb-1"
                    style={{ fontFamily: "var(--font-playfair), serif" }}
                  >
                    {data.nextElection.daysAway}
                  </p>
                  <p className="text-sm text-white/70">days until</p>
                  <p className="text-base font-semibold text-white mt-1 leading-snug">{data.nextElection.title}</p>
                  <p className="text-xs text-white/50 mt-1">{formatDate(data.nextElection.date)}</p>
                </div>
              </>
            ) : (
              <p className="text-sm text-white/70">No upcoming election found</p>
            )}
            <Link
              href="/tools/civic-calendar"
              className="mt-4 text-[11px] font-semibold text-sky-300 hover:underline"
            >
              View all election dates →
            </Link>
          </div>

          {/* On the Ballot */}
          <OnTheBallotCard races={data?.ballot ?? []} />

        </div>
      </div>
    </section>
  );
}
