import Link from "next/link";

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
    <div className={`group relative rounded-[1.75rem] bg-white/60 ring-1 ring-black/8 p-[6px] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:ring-[var(--accent-light)] hover:shadow-xl ${tool.status === "coming" ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}>
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
            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-green-400 mt-2 ring-2 ring-green-100" />
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
    <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] mb-5">
      <span className="block w-6 h-px bg-[var(--muted)]/40" />
      {children}
    </span>
  );
}

export default function Home() {
  return (
    <div className="overflow-x-hidden">

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="bg-[var(--accent)] text-white min-h-[92dvh] flex flex-col justify-center px-6 py-24 md:py-32 relative overflow-hidden">
        {/* Subtle radial wash */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_60%_40%,rgba(37,99,168,0.35),transparent)]" />

        <div className="max-w-5xl mx-auto w-full relative z-10">
          <p className="text-sky-300/80 text-[11px] font-bold uppercase tracking-[0.25em] mb-8">
            The Harris County Project
          </p>

          <h1
            className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-bold leading-[1.05] mb-8 max-w-4xl"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            They stopped
            <br />
            teaching civics.
            <br />
            <span className="text-sky-300">We didn&apos;t.</span>
          </h1>

          <p className="text-white/70 text-lg md:text-xl max-w-xl leading-relaxed mb-12">
            A free toolbox for Harris County residents who want to understand
            their government — how it votes, where it spends, and when it decides.
          </p>

          {/* CTA pill */}
          <a
            href="#toolbox"
            className="inline-flex items-center gap-3 bg-sky-300 hover:bg-sky-200 text-[var(--accent)] font-bold rounded-full px-7 py-4 text-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[0_0_40px_rgba(125,211,252,0.3)] active:scale-[0.98]"
          >
            Open the Toolbox
            <span className="inline-flex w-7 h-7 rounded-full bg-[var(--accent)]/15 items-center justify-center text-base translate-y-px">
              ↓
            </span>
          </a>
        </div>
      </section>

      {/* ── TOOLBOX ──────────────────────────────────────────────────── */}
      <section id="toolbox" className="py-28 md:py-40 px-6">
        <div className="max-w-6xl mx-auto">

          {/* Toolbox header */}
          <div className="mb-16 md:mb-20">
            <SectionLabel>The Toolbox</SectionLabel>
            <h2
              className="text-4xl md:text-5xl font-bold text-[var(--accent)] leading-tight max-w-xl"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              Civic tools,
              <br />
              all in one place.
            </h2>
            <p className="text-[var(--muted)] mt-4 max-w-md leading-relaxed">
              Built for Harris County. Free, always. All data from public sources.
            </p>
          </div>

          {/* ── MONEY ── */}
          <div className="mb-20">
            <SectionLabel>Money</SectionLabel>
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

          {/* ── ELECTIONS ── */}
          <div className="mb-20">
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
          </div>

          {/* ── LEGISLATIVE ── */}
          <div className="mb-20">
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
          </div>

          {/* ── COMMUNITY ── */}
          <div>
            <SectionLabel>Community</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  href: "/contact",
                  name: "Contact & Feedback",
                  description: "Spot a data error? Have an idea for a new tool? Report a missing civic date? We want to hear from you.",
                  status: "live",
                }}
              />
            </div>
          </div>

        </div>
      </section>

      {/* ── ABOUT ──────────────────────────────────────────────────────── */}
      <section id="about" className="border-t border-[var(--border)] py-28 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <SectionLabel>About</SectionLabel>
          <h2
            className="text-3xl md:text-4xl font-bold text-[var(--accent)] mb-6"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            Built for Harris County.
            <br />
            Free, always.
          </h2>
          <p className="text-[var(--muted)] leading-relaxed text-lg max-w-xl mx-auto">
            This project exists because civic engagement shouldn&apos;t require a lobbyist or
            a law degree. All data comes from public sources. All tools are free to use and share.
          </p>
        </div>
      </section>

    </div>
  );
}
