import Link from "next/link";

interface Source {
  name: string;
  handle?: string;
  platform: "Newsletter" | "Blog" | "Twitter/X" | "Instagram" | "YouTube" | "Podcast" | "Website";
  description: string;
  url: string;
  tags: string[];
  recommended?: boolean;
}

const SOURCES: Source[] = [
  // ── News & Journalism ────────────────────────────────────────────────────
  { name: "Houston Chronicle Politics",   platform: "Website",     url: "https://www.houstonchronicle.com/politics/", description: "The Chronicle's dedicated politics desk — county, city, and state coverage. Best place for breaking news on Harris County government.", tags: ["Elections", "Government", "Breaking News"], recommended: true },
  { name: "Texas Tribune",               platform: "Newsletter",   url: "https://www.texastribune.org", description: "Nonprofit investigative journalism covering Texas government, politics, and policy. Exceptional depth on the state legislature and statewide races.", tags: ["Legislature", "Statewide", "Investigative"], recommended: true },
  { name: "Houston Public Media",        platform: "Website",      url: "https://www.houstonpublicmedia.org", description: "NPR and PBS affiliate covering Houston civic affairs. Reliable long-form reporting on city, county, and education.", tags: ["Radio", "Government", "Education"] },
  { name: "Axios Houston",               platform: "Newsletter",   url: "https://www.axios.com/local/houston", description: "Daily smart-brevity newsletter covering Houston politics, business, and development. Great for staying up on what matters quickly.", tags: ["Daily Briefing", "City Politics"] },
  { name: "Houston Landing",             platform: "Website",      url: "https://houstonlanding.org", description: "Local nonprofit newsroom focused on Houston accountability journalism — housing, environment, and education.", tags: ["Investigative", "Housing", "Education"], recommended: true },
  { name: "The Appeal",                  platform: "Website",      url: "https://theappeal.org", description: "National but covers Harris County criminal justice — DA races, policing, and court reform.", tags: ["Criminal Justice", "DA", "Policing"] },

  // ── Political Commentary & Analysis ─────────────────────────────────────
  { name: "Off the Kuff",               platform: "Blog",         url: "https://offthekuff.com", handle: "@OffTheKuff", description: "The definitive Houston progressive politics blog since 2002. Deep-dives on Texas elections, court cases, and redistricting. Required reading for Harris County politics.", tags: ["Elections", "Analysis", "Progressive"], recommended: true },
  { name: "Texas Politics Project",     platform: "Website",      url: "https://texaspolitics.utexas.edu", description: "UT Austin research center with data, polling, and analysis on Texas politics and public opinion.", tags: ["Research", "Polling", "Academic"] },
  { name: "The Texas Signal",           platform: "Newsletter",   url: "https://texassignal.com", description: "Progressive Texas politics news and analysis focused on elections, policy, and organizing.", tags: ["Progressive", "Statewide", "Elections"] },
  { name: "Texas GOP Vote",             platform: "Blog",         url: "https://texasgopvote.com", description: "Conservative Texas politics news, endorsements, and Republican primary analysis.", tags: ["Conservative", "GOP", "Endorsements"] },

  // ── Social Media Accounts ────────────────────────────────────────────────
  { name: "Mustafa Tameez",             platform: "Twitter/X",    url: "https://twitter.com/mustafatameez", handle: "@mustafatameez", description: "Houston Democratic strategist. Prolific commentator on Harris County races, polling, and campaign dynamics.", tags: ["Strategy", "Democratic", "Commentary"], recommended: true },
  { name: "Greg Jefferson",             platform: "Twitter/X",    url: "https://twitter.com/gregjefferson", handle: "@gregjefferson", description: "Houston Chronicle politics reporter. Follow for breaking coverage of Harris County government.", tags: ["Journalism", "Breaking News"] },
  { name: "Robert Downen",              platform: "Twitter/X",    url: "https://twitter.com/RobDownenChron", handle: "@RobDownenChron", description: "Chronicle reporter covering Texas politics with a focus on the legislature and extremism.", tags: ["Legislature", "Journalism"] },
  { name: "Jeremy Wallace",             platform: "Twitter/X",    url: "https://twitter.com/JeremySWallace", handle: "@JeremySWallace", description: "Houston Chronicle Austin bureau — TX Legislature, state government, and Harris County delegation.", tags: ["Legislature", "Journalism"] },
  { name: "Texas Tribune Politics",     platform: "Twitter/X",    url: "https://twitter.com/TexasTribune",  handle: "@TexasTribune",  description: "The Tribune's main account. Live updates from the Capitol, redistricting, and election night coverage.", tags: ["Statewide", "Elections"] },

  // ── Community & Civic Orgs ───────────────────────────────────────────────
  { name: "MOVE Texas",                 platform: "Instagram",    url: "https://www.instagram.com/movetexas", handle: "@movetexas", description: "Youth civic engagement org. Best source for voter registration drives and young voter resources in Harris County.", tags: ["Youth", "Voter Registration", "Civic Engagement"], recommended: true },
  { name: "Texas Organizing Project",  platform: "Website",      url: "https://organizetexas.org", description: "Grassroots power-building org focused on Harris County working-class communities and voter participation.", tags: ["Organizing", "Harris County", "Working Class"] },
  { name: "Harris County Votes",        platform: "Website",      url: "https://www.harrisvotes.com", description: "Official Harris County Elections page. Source of truth for voter registration, polling locations, and election results.", tags: ["Official", "Elections", "Voter Registration"] },
  { name: "Texans for Public Justice",  platform: "Website",      url: "https://tpj.org", description: "Watchdog org tracking money in Texas politics. Their lobby reports and campaign finance analysis are essential.", tags: ["Campaign Finance", "Watchdog", "Lobbying"] },

  // ── Podcasts ─────────────────────────────────────────────────────────────
  { name: "Texas Standard",             platform: "Podcast",      url: "https://www.texasstandard.org", description: "Daily Texas public radio show. Covers statewide politics, Harris County government, and policy with depth.", tags: ["Daily", "Radio", "Statewide"] },
  { name: "The Breakdown with Mustafa", platform: "YouTube",      url: "https://www.youtube.com/@mustafatameez", description: "Houston political strategist Mustafa Tameez's YouTube channel breaking down Harris County races and strategy.", tags: ["Commentary", "Strategy", "YouTube"] },
];

const PLATFORM_ICON: Record<string, string> = {
  "Newsletter":  "📬",
  "Blog":        "✍️",
  "Twitter/X":   "𝕏",
  "Instagram":   "📸",
  "YouTube":     "▶",
  "Podcast":     "🎙",
  "Website":     "🌐",
};

const PLATFORM_COLOR: Record<string, string> = {
  "Newsletter":  "#dbeafe text-blue-700 border-blue-200",
  "Blog":        "#fef3c7 text-amber-700 border-amber-200",
  "Twitter/X":   "#f3f4f6 text-gray-700 border-gray-200",
  "Instagram":   "#fce7f3 text-pink-700 border-pink-200",
  "YouTube":     "#fee2e2 text-red-700 border-red-200",
  "Podcast":     "#ede9fe text-violet-700 border-violet-200",
  "Website":     "#dcfce7 text-emerald-700 border-emerald-200",
};

const ALL_TAGS = Array.from(
  new Set(SOURCES.flatMap((s) => s.tags))
).sort();

function SourceCard({ source }: { source: Source }) {
  const [bg, text, border] = (PLATFORM_COLOR[source.platform] ?? "#f3f4f6 text-gray-700 border-gray-200").split(" ");
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-[1.75rem] bg-white/60 ring-1 ring-black/8 p-[5px] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:ring-[var(--accent-light)] hover:shadow-xl"
    >
      <div className="rounded-[1.35rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] p-5 h-full flex flex-col gap-3">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-[0.12em] px-2.5 py-0.5 rounded-full border ${bg} ${text} ${border}`}>
              {PLATFORM_ICON[source.platform]} {source.platform}
            </span>
            {source.recommended && (
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                Staff Pick
              </span>
            )}
          </div>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--muted)" strokeWidth="1.5"
            className="flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <path d="M2.5 11.5l9-9M7 2.5h4.5v4.5"/>
          </svg>
        </div>

        {/* Name */}
        <div>
          <h3 className="font-bold text-[var(--accent)] text-base leading-tight group-hover:text-[var(--accent-light)] transition-colors duration-500"
            style={{ fontFamily: "var(--font-playfair), serif" }}>
            {source.name}
          </h3>
          {source.handle && (
            <p className="text-[11px] text-[var(--muted)] mt-0.5">{source.handle}</p>
          )}
        </div>

        {/* Description */}
        <p className="text-[var(--muted)] text-sm leading-relaxed flex-1">{source.description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-auto">
          {source.tags.map((t) => (
            <span key={t} className="text-[9px] font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded-full bg-[var(--accent)]/6 text-[var(--accent)]/70">
              {t}
            </span>
          ))}
        </div>
      </div>
    </a>
  );
}

export default function BlogsPage() {
  const staffPicks = SOURCES.filter((s) => s.recommended);
  const rest = SOURCES.filter((s) => !s.recommended);

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="bg-[var(--accent)] text-white px-6 py-12 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_80%_50%,rgba(37,99,168,0.4),transparent)]" />
        <div className="max-w-6xl mx-auto relative z-10">
          <p className="text-sky-300/80 text-[11px] font-bold uppercase tracking-[0.25em] mb-3">Media</p>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-2" style={{ fontFamily: "var(--font-playfair), serif" }}>
            Blogs & Influencers
          </h1>
          <p className="text-white/70 text-sm max-w-lg">
            The best journalists, bloggers, and civic accounts covering Harris County politics. Curated — not comprehensive.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Staff picks */}
        <div className="mb-16">
          <div className="flex items-center gap-2 mb-6">
            <span className="block w-6 h-px bg-[var(--muted)]/40" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">Staff Picks — Start Here</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {staffPicks.map((s) => <SourceCard key={s.name} source={s} />)}
          </div>
        </div>

        {/* All sources */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <span className="block w-6 h-px bg-[var(--muted)]/40" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">All Sources</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rest.map((s) => <SourceCard key={s.name} source={s} />)}
          </div>
        </div>

        {/* Submit CTA */}
        <div className="mt-16 rounded-[1.75rem] bg-white/60 ring-1 ring-black/8 p-[6px]">
          <div className="rounded-[1.35rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] p-8 text-center">
            <h2 className="text-xl font-bold text-[var(--accent)] mb-2" style={{ fontFamily: "var(--font-playfair), serif" }}>
              Know a source we&apos;re missing?
            </h2>
            <p className="text-sm text-[var(--muted)] mb-5 max-w-sm mx-auto">
              If there&apos;s a blog, newsletter, or account we should add, send it our way.
            </p>
            <Link
              href="/contact"
              className="group inline-flex items-center gap-3 bg-[var(--accent)] hover:bg-[var(--accent-light)] text-white font-bold rounded-full px-7 py-4 text-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-lg active:scale-[0.98]"
            >
              Suggest a source
              <span className="inline-flex w-7 h-7 rounded-full bg-white/15 items-center justify-center group-hover:translate-x-1 transition-transform duration-500">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
