import Link from "next/link";
import ScrollReveal from "@/components/ScrollReveal";
import DashboardWidget from "@/components/DashboardWidget";
import ToolboxOpener from "@/components/ToolboxOpener";

type Tool = {
  href: string;
  name: string;
  description: string;
  status: "live" | "coming";
  tag?: string;
};

// ── Double-bezel card (high-end-visual-design skill) ──────────────────────
function ToolCard({ tool, large }: { tool: Tool; large?: boolean }) {
  const inner = (
    // Outer shell
    <div className={`group relative rounded-[1.75rem] bg-white/60 ring-1 ring-black/8 p-[6px] card-lift transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:ring-[var(--accent-light)] ${tool.status === "coming" ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}>
      {/* Inner core */}
      <div className={`rounded-[1.35rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] ${large ? "p-8 md:p-10" : "p-6"} h-full flex flex-col gap-3`}>
        <div className="flex items-start justify-between gap-3">
          <h3
            className={`font-bold text-[var(--accent)] leading-tight group-hover:text-[var(--accent-light)] transition-colors duration-500 ${large ? "text-2xl md:text-3xl" : "text-lg"}`}
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            {tool.name}
          </h3>
          {tool.status === "coming" && (
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted)] border border-[var(--border)] rounded-full px-3 py-1 flex-shrink-0 mt-1">
              Coming Soon
            </span>
          )}
          {tool.status === "live" && (
            <span className="flex-shrink-0 relative flex h-2.5 w-2.5 mt-1.5">
              <span className="alive-halo absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
              <span className="alive-pulse relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
          )}
        </div>
        <p className={`text-[var(--muted)] leading-relaxed ${large ? "text-base" : "text-sm"}`}>
          {tool.description}
        </p>
        {tool.status === "live" && (
          <div className="mt-auto pt-2 flex items-center gap-2 text-[var(--accent-light)] text-sm font-semibold">
            Open tool
            <span className="inline-flex w-6 h-6 rounded-full bg-[var(--accent-light)]/10 items-center justify-center group-hover:translate-x-1 group-hover:-translate-y-px transition-transform duration-500">
              →
            </span>
          </div>
        )}
      </div>
    </div>
  );

  if (tool.status === "coming") return inner;
  return <Link href={tool.href} className="block h-full">{inner}</Link>;
}

// ── Section label ─────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="block w-8 h-px bg-[var(--accent)]/25" />
      <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--accent)]/50">
        {children}
      </span>
      <span className="flex-1 h-px bg-[var(--border)]" />
    </div>
  );
}

export default function Home() {
  return (
    <div className="overflow-x-hidden">

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="bg-[var(--accent)] text-white min-h-[94dvh] flex flex-col justify-center px-6 py-24 md:py-32 relative overflow-hidden">
        {/* Multi-layer radial wash */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_60%_40%,rgba(37,99,168,0.4),transparent)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_40%_50%_at_90%_80%,rgba(125,211,252,0.06),transparent)]" />


        <div className="max-w-5xl mx-auto w-full relative z-10">
          <p className="text-sky-300/70 text-[10px] font-bold uppercase tracking-[0.3em] mb-10 flex items-center gap-2">
            <span className="w-5 h-px bg-sky-300/40" />
            Harris County, Texas
          </p>

          <h1
            className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.75rem] font-bold leading-[1.03] mb-8 max-w-4xl"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            They stopped
            <br />
            teaching civics.
            <br />
            <span className="text-sky-300">We didn&apos;t.</span>
          </h1>

          <p className="text-white/65 text-lg md:text-xl max-w-lg leading-relaxed mb-12" style={{ lineHeight: 1.7 }}>
            A free toolbox for Harris County residents who want to understand
            their government — how it votes, where it spends, and when it decides.
          </p>

          {/* CTA */}
          <a
            href="#toolbox"
            className="group inline-flex items-center gap-3 bg-sky-300 hover:bg-sky-200 text-[var(--accent)] font-bold rounded-full px-7 py-4 text-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[0_0_48px_rgba(125,211,252,0.35)] active:scale-[0.98]"
          >
            Open the Toolbox
            <span className="inline-flex w-7 h-7 rounded-full bg-[var(--accent)]/15 items-center justify-center group-hover:translate-y-0.5 transition-transform duration-500">
              ↓
            </span>
          </a>

          {/* Stat strip */}
          <div className="mt-16 flex flex-wrap gap-8">
            {[
              { value: "18+", label: "Civic tools" },
              { value: "4.7M", label: "Residents served" },
              { value: "Free", label: "Always" },
              { value: "100%", label: "Public data" },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-2xl font-bold text-white leading-none" style={{ fontFamily: "var(--font-playfair), serif" }}>{value}</p>
                <p className="text-white/45 text-xs font-semibold uppercase tracking-[0.15em] mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-30">
          <div className="w-px h-10 bg-white/60" style={{ animation: "pulse 2s ease-in-out infinite" }} />
        </div>
      </section>

      {/* ── DASHBOARD WIDGET ─────────────────────────────────────── */}
      <DashboardWidget />

      {/* ── TOOLBOX ──────────────────────────────────────────────────── */}
      <section id="toolbox" className="py-28 md:py-40 px-6">
        <div className="max-w-6xl mx-auto">

          {/* Toolbox header — animated toolbox SVG reveal */}
          <ToolboxOpener />

          {/* ── CITY HALL ── */}
          <ScrollReveal className="mb-20">
            <SectionLabel>City Hall</SectionLabel>
            <div className="mb-4">
              <ToolCard
                large
                tool={{
                  href: "/tools/city-hall",
                  name: "City Hall Story Engine",
                  description: "Every Tuesday, Houston City Council meets. Every Wednesday, Emily Takes Notes covers it. This engine turns her reporting into a structured timeline — then cross-references each agenda item against local news coverage and links to politician profiles.",
                  status: "live",
                }}
              />
            </div>
          </ScrollReveal>

          {/* ── MONEY ── */}
          <ScrollReveal className="mb-20">
            <SectionLabel>Money</SectionLabel>
            <div className="mb-4">
              <ToolCard
                large
                tool={{
                  href: "/tools/where-is-the-dough",
                  name: "Where the Money Resides",
                  description: "Follow the money. See who's funding Harris County politicians, how much they've raised, where it comes from, and where it goes. Donor lists, spending graphs, party and club bank totals.",
                  status: "live",
                }}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <ToolCard
                tool={{
                  href: "/tools/county-budget",
                  name: "Harris County Budget",
                  description: "How Harris County spends your tax dollars — department by department. Plus the top contractors winning county contracts. FY2025.",
                  status: "live",
                }}
              />
              <ToolCard
                tool={{
                  href: "/tools/city-budget",
                  name: "Houston City Budget",
                  description: "Where does Houston spend its $6.5 billion? Department breakdown, YoY changes, and each council member's discretionary district funds. FY2025.",
                  status: "live",
                }}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <ToolCard
                tool={{
                  href: "/tools/tirz",
                  name: "TIRZ Tool",
                  description: "Houston has 27+ Tax Increment Reinvestment Zones redirecting property tax growth. See which neighborhoods have them, how much they collect, and what projects they fund.",
                  status: "live",
                }}
              />
              <ToolCard
                tool={{
                  href: "/tools/tirz#governance",
                  name: "TIRZ Governance",
                  description: "Who sits on each TIRZ board? Who appointed them? See the full governance layer — board seats, appointers, term dates, and how each zone is controlled.",
                  status: "live",
                }}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ToolCard
                tool={{
                  href: "/tools/infrastructure-funding",
                  name: "Infrastructure Funding Map",
                  description: "Where is federal and state infrastructure money landing in Harris County? IIJA, FEMA, HUD, TxDOT — mapped by project.",
                  status: "live",
                }}
              />
              <ToolCard
                tool={{
                  href: "/tools/county-budget#map",
                  name: "County Project Map",
                  description: "25 major Harris County capital projects — roads, flood control, health, parks — mapped by location with funding sources and status.",
                  status: "live",
                }}
              />
            </div>
          </ScrollReveal>

          {/* ── ELECTIONS ── */}
          <ScrollReveal className="mb-20">
            <SectionLabel>Elections</SectionLabel>
            <div className="mb-4">
              <ToolCard
                large
                tool={{
                  href: "/tools/heat-check",
                  name: "Heat Check",
                  description: "See how Harris County voted — precinct by precinct. Pick a race and watch the map light up. Includes charts showing county-wide vote share and margins.",
                  status: "live",
                }}
              />
            </div>
            <div className="mb-4">
              <ToolCard
                tool={{
                  href: "/tools/districts",
                  name: "Districts",
                  description: "Explore Harris County voting precincts by district — Congressional, State House, State Senate, City Council, and JP. Click any precinct for turnout, demographics, and party participation data.",
                  status: "live",
                }}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ToolCard
                tool={{
                  href: "/tools/endorsement-flowchart",
                  name: "Endorsement Flowchart",
                  description: "Who endorsed whom in Harris County races? See which unions, orgs, and officials backed which candidates — and who they have in common.",
                  status: "live",
                }}
              />
              <ToolCard
                tool={{
                  href: "/tools/consultant-flowchart",
                  name: "Consultant Flowchart",
                  description: "Follow the consultants. See which campaign strategists, pollsters, and ad firms work for which candidates — and how their networks overlap.",
                  status: "live",
                }}
              />
            </div>
          </ScrollReveal>

          {/* ── LEGISLATIVE ── */}
          <ScrollReveal className="mb-20">
            <SectionLabel>Legislative</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ToolCard
                tool={{
                  href: "/tools/bill-tracker",
                  name: "Bill Tracker",
                  description: "See what your Texas state rep and senator actually passed — or didn't — this legislative session. Ranked by bills signed into law.",
                  status: "live",
                }}
              />
              <ToolCard
                tool={{
                  href: "/tools/congressional-bills",
                  name: "Congressional Bill Tracker",
                  description: "What did Harris County's U.S. reps and senators actually pass in Congress? Ranked by bills signed into federal law — 119th Congress.",
                  status: "live",
                }}
              />
            </div>
          </ScrollReveal>

          {/* ── MEDIA ── */}
          <ScrollReveal className="mb-20">
            <SectionLabel>Media</SectionLabel>
            <div className="mb-4">
              <ToolCard
                large
                tool={{
                  href: "/tools/tv-station",
                  name: "TV Station",
                  description: "Watch Harris County Commissioners Court, Houston City Council, HISD Board, and the Texas Legislature live — all in one place. Streams from official public channels.",
                  status: "live",
                }}
              />
            </div>
            <ToolCard
              tool={{
                href: "/blogs",
                name: "Blogs & Influencers",
                description: "The best journalists, newsletters, blogs, and civic accounts covering Harris County politics. Curated staff picks and a full directory — start here.",
                status: "live",
              }}
            />
          </ScrollReveal>

          {/* ── COMMUNITY ── */}
          <ScrollReveal>
            <SectionLabel>Community</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <ToolCard
                tool={{
                  href: "/tools/civic-calendar",
                  name: "Civic Calendar",
                  description: "Election dates, filing deadlines, commissioners court meetings, HISD board — every date that matters. Add any event straight to your phone's calendar.",
                  status: "live",
                }}
              />
              <ToolCard
                tool={{
                  href: "/tools/discretionary-funds",
                  name: "Discretionary Funds Map",
                  description: "How is each Houston City Council member spending their district improvement funds? Projects mapped by location across all 11 districts and 5 at-large seats.",
                  status: "live",
                }}
              />
              <ToolCard
                tool={{
                  href: "/contact",
                  name: "Contact & Feedback",
                  description: "Spot a data error? Have an idea for a new tool? Report a missing civic date? We want to hear from you.",
                  status: "live",
                }}
              />
            </div>
          </ScrollReveal>

        </div>
      </section>

      {/* ── ABOUT ──────────────────────────────────────────────────────── */}
      <section id="about" className="border-t border-[var(--border)] py-28 md:py-40 px-6 bg-[var(--accent)] text-white relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_20%_50%,rgba(37,99,168,0.4),transparent)]" />
        <ScrollReveal className="max-w-4xl mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <span className="block w-8 h-px bg-sky-300/30" />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-sky-300/60">About</span>
          </div>
          <h2
            className="text-4xl md:text-5xl font-bold text-white leading-[1.1] mb-8 max-w-2xl"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            Built for Harris County.
            <br />
            <span className="text-sky-300">Free, always.</span>
          </h2>
          <p className="text-white/60 leading-relaxed text-lg max-w-xl" style={{ lineHeight: 1.8 }}>
            This project exists because civic engagement shouldn&apos;t require a lobbyist or
            a law degree. All data comes from public sources. All tools are free to use and share.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/#toolbox"
              className="group inline-flex items-center gap-3 bg-sky-300 hover:bg-sky-200 text-[var(--accent)] font-bold rounded-full px-6 py-3.5 text-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[0_0_36px_rgba(125,211,252,0.3)] active:scale-[0.98]"
            >
              Explore the Toolbox
              <span className="inline-flex w-6 h-6 rounded-full bg-[var(--accent)]/15 items-center justify-center group-hover:translate-x-1 transition-transform duration-500">→</span>
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-white/60 hover:text-white font-semibold text-sm transition-colors duration-300 underline underline-offset-4"
            >
              Contact us
            </Link>
          </div>
        </ScrollReveal>
      </section>

    </div>
  );
}
