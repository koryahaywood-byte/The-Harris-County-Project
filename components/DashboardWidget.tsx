import Link from "next/link";
import { getDashboardData } from "@/lib/dashboard-data";
import type { DashboardData, NewsStory } from "@/lib/dashboard-data";

const CAT_COLOR: Record<string, string> = {
  Elections:     "#2563a8",
  Legislature:   "#7c3aed",
  Courts:        "#d97706",
  "City Council":"#0d9488",
  HISD:          "#dc2626",
  Civic:         "#16a34a",
};

const TIER_META = {
  local:   { label: "Houston", color: "#0d9488", desc: "City Hall & Harris County" },
  state:   { label: "Texas",   color: "#7c3aed", desc: "Austin & the statehouse" },
  federal: { label: "D.C.",    color: "#2563a8", desc: "Congress & the White House" },
};

// ── Political quotes — rotates daily ────────────────────────────────────────
const QUOTES = [
  { text: "Nearly all men can stand adversity, but if you want to test a man's character, give him power.", author: "Abraham Lincoln", title: "16th President" },
  { text: "The most terrifying words in the English language are: I'm from the government and I'm here to help.", author: "Ronald Reagan", title: "40th President" },
  { text: "Ask not what your country can do for you — ask what you can do for your country.", author: "John F. Kennedy", title: "35th President" },
  { text: "Democracy is not a spectator sport.", author: "Lyndon B. Johnson", title: "36th President" },
  { text: "The price of apathy towards public affairs is to be ruled by evil men.", author: "Plato", title: "Philosopher" },
  { text: "In politics, nothing happens by accident. If it happens, you can bet it was planned that way.", author: "Franklin D. Roosevelt", title: "32nd President" },
  { text: "The basis of our political system is the right of the people to make and to alter their constitutions of government.", author: "George Washington", title: "1st President" },
  { text: "Politics is the art of the possible, the attainable — the art of the next best.", author: "Otto von Bismarck", title: "German Chancellor" },
  { text: "One of the penalties for refusing to participate in politics is that you end up being governed by your inferiors.", author: "Plato", title: "Philosopher" },
  { text: "Change will not come if we wait for some other person or some other time.", author: "Barack Obama", title: "44th President" },
  { text: "The only thing necessary for the triumph of evil is for good men to do nothing.", author: "Edmund Burke", title: "Statesman" },
  { text: "It is not in the nature of politics for truth to be told.", author: "James Madison", title: "4th President" },
  { text: "The ignorance of one voter in a democracy impairs the security of all.", author: "John F. Kennedy", title: "35th President" },
  { text: "Elections belong to the people. It's their decision.", author: "Abraham Lincoln", title: "16th President" },
  { text: "If voting changed anything, they'd make it illegal.", author: "Emma Goldman", title: "Political Activist" },
  { text: "Power concedes nothing without a demand. It never did and it never will.", author: "Frederick Douglass", title: "Abolitionist & Statesman" },
  { text: "Those who do not move do not notice their chains.", author: "Rosa Luxemburg", title: "Political Theorist" },
  { text: "The only stable state is the one in which all men are equal before the law.", author: "Aristotle", title: "Philosopher" },
  { text: "An election is coming. Universal peace is declared, and the foxes have a sincere interest in prolonging the lives of the poultry.", author: "George Eliot", title: "Author" },
  { text: "Politics is not the art of the possible. It consists in choosing between the disastrous and the unpalatable.", author: "John Kenneth Galbraith", title: "Economist & Ambassador" },
  { text: "To make laws that man cannot, and will not obey, serves to bring all law into contempt.", author: "Elizabeth Cady Stanton", title: "Suffragist" },
  { text: "A vote is like a rifle: its usefulness depends upon the character of the user.", author: "Theodore Roosevelt", title: "26th President" },
  { text: "I am not a politician, and my other habits are also good.", author: "Artemus Ward", title: "Humorist" },
  { text: "The difference between a politician and a statesman is that a politician thinks about the next election while the statesman thinks about the next generation.", author: "James Freeman Clarke", title: "Minister & Author" },
  { text: "Real leadership is leaders recognizing that they serve the people that they lead.", author: "Pete Buttigieg", title: "Secretary of Transportation" },
  { text: "Injustice anywhere is a threat to justice everywhere.", author: "Martin Luther King Jr.", title: "Civil Rights Leader" },
  { text: "The ultimate measure of a man is not where he stands in moments of comfort, but where he stands at times of challenge.", author: "Martin Luther King Jr.", title: "Civil Rights Leader" },
  { text: "Never doubt that a small group of thoughtful, committed citizens can change the world.", author: "Margaret Mead", title: "Anthropologist" },
  { text: "Those who stand for nothing fall for anything.", author: "Alexander Hamilton", title: "Founding Father" },
  { text: "Government of the people, by the people, for the people, shall not perish from the earth.", author: "Abraham Lincoln", title: "16th President" },
];

function getDailyQuote() {
  const day = Math.floor(Date.now() / 86400000);
  return QUOTES[day % QUOTES.length];
}

function timeAgo(pubDate: string): string {
  if (!pubDate) return "";
  const diff = Date.now() - new Date(pubDate).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1)  return "Just now";
  if (h < 24) return `${h}h ago`;
  return "Yesterday";
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── The Briefing header ──────────────────────────────────────────────────────
function BriefingHeader() {
  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1 mb-8">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] mb-1"
          style={{ color: "var(--accent)", opacity: 0.4 }}>
          Harris County · Political Intelligence
        </p>
        <h2 className="text-2xl md:text-3xl font-bold text-[var(--accent)]"
          style={{ fontFamily: "var(--font-playfair), serif" }}>
          The Briefing
        </h2>
      </div>
      <p className="text-sm text-[var(--muted)]">{dateLabel}</p>
    </div>
  );
}

// ── News card ────────────────────────────────────────────────────────────────
function NewsCard({ story, tier }: { story: NewsStory | null; tier: keyof typeof TIER_META }) {
  const meta = TIER_META[tier];
  return (
    <div className="group flex flex-col rounded-[1.5rem] overflow-hidden bg-white ring-1 ring-black/8"
      style={{ boxShadow: "0 2px 12px rgba(26,58,92,0.06)" }}>

      {/* Tier bar */}
      <div className="flex items-center gap-2 px-5 pt-4 pb-3"
        style={{ borderBottom: "1px solid #f0ede8" }}>
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: meta.color }} />
        <span className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: meta.color }}>
          {meta.label}
        </span>
        <span className="text-[10px] text-[var(--muted)] ml-1">{meta.desc}</span>
      </div>

      {/* Photo */}
      <div className="w-full overflow-hidden flex-shrink-0" style={{ height: 130 }}>
        {story?.image
          ? <img src={story.image} alt="" loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          : <div className="w-full h-full flex items-center justify-center"
              style={{ background: `${meta.color}10` }}>
              <span className="text-2xl opacity-15">📰</span>
            </div>
        }
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 px-5 py-4 gap-2">
        {story ? (
          <>
            <span className="self-start text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ background: `${meta.color}15`, color: meta.color }}>
              {story.pubDate ? timeAgo(story.pubDate) : "Latest"}
            </span>
            <a href={story.link} target="_blank" rel="noopener noreferrer" className="group/link flex-1">
              <h3 className="text-[14px] font-bold leading-snug line-clamp-3 group-hover/link:underline"
                style={{ color: "var(--accent)", fontFamily: "var(--font-playfair), serif" }}>
                {story.title}
              </h3>
            </a>
            <div className="flex items-center justify-between gap-2 pt-2 mt-auto"
              style={{ borderTop: "1px solid #f0ede8" }}>
              <span className="text-[11px] font-semibold text-[var(--muted)] truncate">{story.source}</span>
              <a href={story.link} target="_blank" rel="noopener noreferrer"
                className="text-[11px] font-semibold flex-shrink-0 hover:underline"
                style={{ color: meta.color }}>
                Read →
              </a>
            </div>
          </>
        ) : (
          <p className="text-sm text-[var(--muted)] py-6 text-center">
            Checking {meta.label} sources…
          </p>
        )}
      </div>
    </div>
  );
}

// ── Today's agenda ───────────────────────────────────────────────────────────
function AgendaCard({ todayEvents, upcomingEvent }: {
  todayEvents: DashboardData["todayEvents"];
  upcomingEvent: DashboardData["upcomingEvent"];
}) {
  return (
    <div className="rounded-[1.5rem] bg-white ring-1 ring-black/8 p-5 flex flex-col"
      style={{ boxShadow: "0 2px 12px rgba(26,58,92,0.06)" }}>
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] mb-3">
        Today&apos;s Agenda
      </p>

      {todayEvents.length > 0 ? (
        <ul className="flex flex-col gap-3 flex-1">
          {todayEvents.slice(0, 4).map((e, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: CAT_COLOR[e.category] ?? "#1a3a5c" }} />
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-[var(--accent)] leading-snug">{e.title}</p>
                <p className="text-[10px] text-[var(--muted)] mt-0.5 leading-snug line-clamp-2">{e.description}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex-1 flex flex-col justify-center">
          <p className="text-[13px] font-semibold text-[var(--accent)]">Nothing scheduled today</p>
          {upcomingEvent && (
            <p className="text-[11px] text-[var(--muted)] mt-2 leading-relaxed">
              Next up in{" "}
              <span className="font-semibold text-[var(--accent)]">{upcomingEvent.daysAway} day{upcomingEvent.daysAway !== 1 ? "s" : ""}</span>
              {" "}—{" "}{upcomingEvent.title}
            </p>
          )}
        </div>
      )}

      <Link href="/tools/civic-calendar"
        className="mt-4 text-[11px] font-semibold text-[var(--accent-light)] hover:underline">
        Full calendar →
      </Link>
    </div>
  );
}

// ── Election countdown — center, dominant ────────────────────────────────────
function CountdownCard({ nextElection }: { nextElection: DashboardData["nextElection"] }) {
  return (
    <div className="rounded-[1.5rem] text-white flex flex-col items-center justify-center text-center p-6 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg,#1a3a5c 0%,#0f2540 100%)" }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 80% at 50% 30%,rgba(125,211,252,0.13),transparent)" }} />

      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/40 mb-4 relative z-10">
        Days Until Election
      </p>

      {nextElection ? (
        <div className="relative z-10 flex flex-col items-center">
          <p className="font-bold leading-none text-white mb-1"
            style={{ fontFamily: "var(--font-playfair), serif", fontSize: "5rem" }}>
            {nextElection.daysAway}
          </p>
          <div className="w-12 h-px mb-4" style={{ background: "rgba(125,211,252,0.3)" }} />
          <p className="text-sm font-semibold text-white/80 leading-snug max-w-[180px]">
            {nextElection.title}
          </p>
          <p className="text-[11px] text-white/35 mt-2">{formatDate(nextElection.date)}</p>
        </div>
      ) : (
        <p className="text-sm text-white/50 relative z-10">No upcoming election</p>
      )}

      <Link href="/tools/civic-calendar"
        className="relative z-10 mt-5 text-[11px] font-semibold text-sky-300 hover:underline">
        All election dates →
      </Link>
    </div>
  );
}

// ── Daily political quote ────────────────────────────────────────────────────
function QuoteCard() {
  const q = getDailyQuote();
  return (
    <div className="rounded-[1.5rem] bg-white ring-1 ring-black/8 p-6 flex flex-col justify-between relative overflow-hidden"
      style={{ boxShadow: "0 2px 12px rgba(26,58,92,0.06)" }}>
      {/* Decorative quote mark */}
      <span className="absolute top-4 right-5 text-[5rem] leading-none font-serif select-none pointer-events-none"
        style={{ color: "rgba(26,58,92,0.05)", fontFamily: "Georgia, serif" }}>
        &ldquo;
      </span>

      <div className="relative z-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] mb-4">
          Words to govern by
        </p>
        <p className="text-[14px] font-semibold text-[var(--accent)] leading-relaxed"
          style={{ fontFamily: "var(--font-playfair), serif" }}>
          &ldquo;{q.text}&rdquo;
        </p>
      </div>

      <div className="relative z-10 mt-5 pt-4" style={{ borderTop: "1px solid #f0ede8" }}>
        <p className="text-[12px] font-bold text-[var(--accent)]">{q.author}</p>
        <p className="text-[10px] text-[var(--muted)] mt-0.5">{q.title}</p>
      </div>
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

        <BriefingHeader />

        {/* Row 1 — Three news tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <NewsCard story={data?.local   ?? null} tier="local"   />
          <NewsCard story={data?.state   ?? null} tier="state"   />
          <NewsCard story={data?.federal ?? null} tier="federal" />
        </div>

        {/* Row 2 — Agenda · Countdown · Quote */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <AgendaCard
            todayEvents={data?.todayEvents ?? []}
            upcomingEvent={data?.upcomingEvent ?? null}
          />
          <CountdownCard nextElection={data?.nextElection ?? null} />
          <QuoteCard />
        </div>

        {/* Source attribution */}
        <p className="mt-6 text-[10px] text-[var(--muted)]/40 text-center leading-relaxed max-w-2xl mx-auto">
          Sources: Houston Chronicle · Texas Tribune · Austin American-Statesman · Texas Monthly ·
          NY Times · Washington Post · Wall Street Journal · AP · Reuters.
          News refreshes every 30 min. Quotes rotate daily.
        </p>

      </div>
    </section>
  );
}
