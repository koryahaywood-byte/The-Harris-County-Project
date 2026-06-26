import Link from "next/link";
import ScrollReveal from "@/components/ScrollReveal";
import DashboardWidget from "@/components/DashboardWidget";
import ToolboxOpener from "@/components/ToolboxOpener";

/* ── Tool catalogue ─────────────────────────────────────────────────────── */
interface Tool {
  href: string;
  name: string;
  description: string;
  gradient: string;
  photo?: string;        // Unsplash URL — shown behind gradient overlay
  status?: "coming";
}

// Curated Unsplash photos — each dark enough to work under a semi-opaque gradient
const PX = "?auto=format&fit=crop&w=600&q=75";
const U  = (id: string) => `https://images.unsplash.com/photo-${id}${PX}`;

const ROWS: { section: string; tools: Tool[] }[] = [
  {
    section: "Money",
    tools: [
      { href: "/tools/where-is-the-dough", name: "Where the Money Resides",
        description: "Campaign finance for every Harris County elected official — live from FEC, TEC, and county filings.",
        gradient: "linear-gradient(135deg,#92400e 0%,#b45309 60%,#d97706 100%)",
        // Magnifying glass over $100 bill — investigative finance look
        photo: U("1554672408-b55a5c0cc4b7") },
      { href: "/tools/county-budget", name: "Harris County Budget",
        description: "FY2027 proposed spending — departments, contractors, story format.",
        gradient: "linear-gradient(135deg,#1e3a5f 0%,#2563a8 100%)",
        photo: U("1575470021395-45dca7d3e3d0") },
      { href: "/tools/city-budget", name: "Houston City Budget",
        description: "The city's $6.5B budget broken down with the Three Moves explainer.",
        gradient: "linear-gradient(135deg,#065f46 0%,#059669 100%)",
        photo: U("1527631746610-bca00a040d60") },
      { href: "/tools/tirz", name: "TIRZ Tool",
        description: "27+ tax increment zones — what they collect and who governs them.",
        gradient: "linear-gradient(135deg,#1e40af 0%,#2563a8 100%)",
        photo: U("1486325212027-8081e485255e") },
      { href: "/tools/discretionary-funds", name: "Discretionary Funds",
        description: "How each council member spends their district improvement dollars.",
        gradient: "linear-gradient(135deg,#0e7490 0%,#0891b2 100%)",
        photo: U("1529156069898-49953e39b3ac") },
      { href: "/tools/infrastructure-funding", name: "Infrastructure Funding",
        description: "Federal grants and construction projects flowing into Harris County — where the dollars land.",
        gradient: "linear-gradient(135deg,#0f2540 0%,#1e3a5c 100%)",
        photo: U("1558618666-fcd25c85cd64") },
    ],
  },
  {
    section: "Elections",
    tools: [
      { href: "/my-officials", name: "Who Represents Me?",
        description: "Enter your address — every official who answers to you, JP to Congress.",
        gradient: "linear-gradient(135deg,#92400e 0%,#d97706 100%)",
        photo: U("1449157291145-7efd050a4d0e") },
      { href: "/tools/ballot-2026", name: "2026 Ballot",
        description: "Every race on your November 2026 ballot — Governor to JP. D vs. R matchup, money on hand, and competitiveness rating.",
        gradient: "linear-gradient(135deg,#1e3a5f 0%,#2563a8 100%)",
        photo: U("1554224155-8d04cb9a382a") },
      { href: "/tools/pac-tracker", name: "Outside Money",
        description: "PAC and Super PAC independent expenditures in Texas 2026 federal races. Who's buying air time?",
        gradient: "linear-gradient(135deg,#4c1d95 0%,#7c3aed 100%)",
        photo: U("1611532736542-ef8f87e20f8c") },
      { href: "/tools/heat-check", name: "Heat Check",
        description: "Harris County primary & runoff results, precinct by precinct.",
        gradient: "linear-gradient(135deg,#991b1b 0%,#dc2626 100%)",
        photo: U("1524661135-1165ef7b63f4") },
      { href: "/tools/precinct-lookup", name: "Precinct History",
        description: "Enter any precinct number — see how it voted in 2020, 2022, 2024, and 2026.",
        gradient: "linear-gradient(135deg,#1e3a8a 0%,#2563a8 100%)",
        photo: U("1507041957456-9c397ce39c97") },
      { href: "/tools/voter-search", name: "Voter Search",
        description: "Search Harris County's 2.4M registered voters — see who voted, when, and how.",
        gradient: "linear-gradient(135deg,#1e3a5c 0%,#0f766e 100%)",
        photo: U("1540910419892-4a036eb0ebc1") },
      { href: "/tools/districts", name: "Districts",
        description: "Portrait of a seat — demographics, vote history, 2026 matchup, and win number target.",
        gradient: "linear-gradient(135deg,#0f2540 0%,#1a3a5c 100%)",
        photo: U("1569091791842-7cfb64e04797") },
      { href: "/tools/early-vote", name: "Early Vote Tracker",
        description: "Dem vs. Rep universe turnout by precinct — who is showing up.",
        gradient: "linear-gradient(135deg,#3730a3 0%,#4f46e5 100%)",
        photo: U("1541872703-74c5e44368f9") },
      { href: "/tools/field-sweep", name: "Field Sweep",
        description: "All 1,000+ precincts ranked by GOTV opportunity — surge targets, battlegrounds, and R base.",
        gradient: "linear-gradient(135deg,#064e3b 0%,#059669 100%)",
        photo: U("1596495577886-d920f1fb7238") },
      { href: "/tools/civic-calendar", name: "Civic Calendar",
        description: "Every election date, filing deadline, and public meeting.",
        gradient: "linear-gradient(135deg,#14532d 0%,#16a34a 100%)",
        photo: U("1506784983877-45594efa4cbe") },
    ],
  },
  {
    section: "Legislation",
    tools: [
      { href: "/tools/bill-tracker", name: "Bill Tracker",
        description: "TX 89th Legislature — bills filed by Harris County reps, ranked by laws passed.",
        gradient: "linear-gradient(135deg,#4c1d95 0%,#6d28d9 100%)",
        photo: U("1585952406519-9d8b8c3ba4b4") },
      { href: "/tools/congressional-bills", name: "Congress Bills",
        description: "119th Congress — what Harris County's US reps actually signed into law.",
        gradient: "linear-gradient(135deg,#1d4ed8 0%,#2563a8 100%)",
        photo: U("1523348837708-15d4a09cfac2") },
    ],
  },
  {
    section: "The Beat",
    tools: [
      { href: "/tools/city-hall", name: "City Hall Beat",
        description: "Emily Takes Notes — City Council and HISD hearings AI-summarized and cross-referenced with politician profiles.",
        gradient: "linear-gradient(135deg,#0f766e 0%,#0d9488 60%,#0891b2 100%)",
        photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Houston_City_Hall_2019.jpg/800px-Houston_City_Hall_2019.jpg" },
      { href: "/tools/harris-county-beat", name: "Harris County Beat",
        description: "Commissioners Court, JPD, and county agencies — hearings tracked with full context.",
        gradient: "linear-gradient(135deg,#1a3a5c 0%,#2563a8 100%)",
        photo: U("1589829545856-d10d557cf95f") },
      { href: "/tools/state-beat", name: "State House Beat",
        description: "TX 89th Legislature — floor votes, committee hearings, and lobbyist filings from Austin.",
        gradient: "linear-gradient(135deg,#4c1d95 0%,#7c3aed 100%)",
        photo: U("1569949382669-ecf63b8c2c9f") },
      { href: "/tools/congress-beat", name: "Congressional Beat",
        description: "Harris County's US representatives — floor speeches, votes, and committee work in Washington.",
        gradient: "linear-gradient(135deg,#991b1b 0%,#b91c1c 60%,#dc2626 100%)",
        photo: U("1503198515498-d0bd9ed16902") },
    ],
  },
  {
    section: "Networks",
    tools: [
      { href: "/tools/endorsement-flowchart", name: "Endorsement Map",
        description: "Who endorsed whom across every major Harris County race — unions, officials, party orgs.",
        gradient: "linear-gradient(135deg,#1e3a5c 0%,#4f46e5 100%)",
        photo: U("1521737604-43416ae6b50a") },
      { href: "/tools/consultant-flowchart", name: "Consultant Network",
        description: "The political consulting firms behind every candidate — who shares the same playbook.",
        gradient: "linear-gradient(135deg,#1e3a5c 0%,#0f766e 100%)",
        photo: U("1519389950473-47ba0277781c") },
      { href: "/tools/donor-network", name: "Donor Network",
        description: "876 cross-official donors — see who funds multiple candidates and how money flows between Rs and Ds.",
        gradient: "linear-gradient(135deg,#78350f 0%,#d97706 100%)",
        photo: U("1604594849809-dfedbc827105") },
    ],
  },
  {
    section: "Media",
    tools: [
      { href: "/tools/tv-station", name: "TV Station",
        description: "Commissioners Court, City Council, HISD, TX Legislature — all live.",
        gradient: "linear-gradient(135deg,#111827 0%,#1f2937 100%)",
        photo: U("1585771724684-38269d6639fd") },
      { href: "/blogs", name: "Journalists & Voices",
        description: "The best journalists and civic accounts — X, Instagram, Threads, newsletters — covering Harris County.",
        gradient: "linear-gradient(135deg,#78350f 0%,#b45309 100%)",
        photo: U("1504711434969-e33886168f5c") },
      { href: "/politicians", name: "Politicians",
        description: "Harris County elected officials — stats, finance, bills, and social feeds.",
        gradient: "linear-gradient(135deg,#1a3a5c 0%,#2563a8 100%)",
        photo: U("1560472354-b33ff0c44a43") },
      { href: "/contact", name: "Contact & Feedback",
        description: "Spot a data error? Have an idea for a new tool? Tell us.",
        gradient: "linear-gradient(135deg,#374151 0%,#6b7280 100%)",
        photo: U("1577563908411-5077b6dc7624") },
    ],
  },
];

/* ── Start Here — the 4 tools to master first ───────────────────────────── */
const START_HERE = [
  {
    href:        "/tools/heat-check",
    name:        "Heat Check",
    eyebrow:     "Elections",
    headline:    "See how every\nprecinct voted.",
    description: "1,011 precincts. Every election cycle back to 2012 — primaries, runoffs, and generals. Zoom into any neighborhood and see exactly how it voted.",
    proof:       ["1,011 precincts mapped", "2012 – 2026 · all cycles", "Precinct-level detail"],
    photo:       U("1596422846543-75c6fc197f07"),
    gradient:    "linear-gradient(135deg,#7f1d1d 0%,#991b1b 60%,#dc2626 100%)",
    hero:        true,
  },
  {
    href:        "/tools/where-is-the-dough",
    name:        "Where the Money Resides",
    eyebrow:     "Money",
    headline:    "Follow the money.",
    description: "Live FEC, TEC, and county filings for every Harris County elected official.",
    proof:       ["All elected officials", "FEC + TEC live"],
    photo:       U("1611974789855-9c2a0a7236a3"),
    gradient:    "linear-gradient(135deg,#78350f 0%,#b45309 60%,#d97706 100%)",
    hero:        false,
  },
  {
    href:        "/tools/districts",
    name:        "Districts",
    eyebrow:     "Elections",
    headline:    "Your district,\nin full.",
    description: "Demographics, vote history, 2026 matchup, win number, and actual race results for every seat.",
    proof:       ["Every seat covered", "Actual race results"],
    photo:       U("1569091791842-7cfb64e04797"),
    gradient:    "linear-gradient(135deg,#0f2540 0%,#1a3a5c 100%)",
    hero:        false,
  },
  {
    href:        "/my-officials",
    name:        "Who Represents Me?",
    eyebrow:     "Officials",
    headline:    "Enter your\naddress.",
    description: "Every official who answers to you — JP to Congress — with contact info, money raised, and record.",
    proof:       ["JP to Congress", "Real contact info"],
    photo:       U("1449157291145-7efd050a4d0e"),
    gradient:    "linear-gradient(135deg,#92400e 0%,#d97706 100%)",
    hero:        false,
  },
] as const;

function FeaturedSection() {
  const [hero, ...three] = START_HERE;
  return (
    <section id="start-here" className="py-16 md:py-24 px-6" style={{ background: "#f5f3ef" }}>
      <div className="max-w-6xl mx-auto">
        {/* Section label */}
        <div className="flex items-center gap-3 mb-10">
          <span className="block w-8 h-px bg-[var(--accent)]/25" />
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--accent)]/50">Start Here</span>
          <span className="flex-1 h-px bg-[var(--border)]" />
          <span className="text-[11px]" style={{ color: "#9ca3af" }}>4 tools to know cold</span>
        </div>

        <div className="flex flex-col gap-5">

          {/* Hero — Heat Check */}
          <Link href={hero.href} className="group relative rounded-[2rem] overflow-hidden cursor-pointer block"
            style={{ minHeight: 380 }}>
            <img src={hero.photo} alt="" loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
              style={{ opacity: 0.5 }} />
            <div className="absolute inset-0" style={{ background: hero.gradient, opacity: 0.78 }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="relative z-10 flex flex-col justify-end h-full p-8 md:p-10" style={{ minHeight: 380 }}>
              <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/50 mb-3">{hero.eyebrow}</span>
              <h2 className="text-4xl md:text-5xl font-bold text-white leading-[1.08] mb-4 whitespace-pre-line"
                style={{ fontFamily: "var(--font-playfair), serif" }}>
                {hero.headline}
              </h2>
              <p className="text-white/70 text-sm leading-relaxed max-w-xl mb-6">{hero.description}</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {hero.proof.map(p => (
                  <span key={p} className="text-[10px] font-bold px-3 py-1 rounded-full"
                    style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.18)" }}>
                    {p}
                  </span>
                ))}
              </div>
              <span className="inline-flex items-center gap-2 text-sm font-bold text-white group-hover:gap-3 transition-all duration-300">
                Open Heat Check
                <span className="inline-flex w-8 h-8 rounded-full bg-white/15 items-center justify-center group-hover:bg-white/25 transition-colors">→</span>
              </span>
            </div>
          </Link>

          {/* Three equal cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {three.map(tool => (
              <Link key={tool.href} href={tool.href}
                className="group relative rounded-[2rem] overflow-hidden cursor-pointer block"
                style={{ minHeight: 230 }}>
                <img src={tool.photo} alt="" loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
                  style={{ opacity: 0.5 }} />
                <div className="absolute inset-0" style={{ background: tool.gradient, opacity: 0.78 }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="relative z-10 flex flex-col justify-end h-full p-6" style={{ minHeight: 230 }}>
                  <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/50 mb-2">{tool.eyebrow}</span>
                  <h3 className="text-2xl font-bold text-white leading-[1.1] mb-3 whitespace-pre-line"
                    style={{ fontFamily: "var(--font-playfair), serif" }}>
                    {tool.headline}
                  </h3>
                  <p className="text-white/60 text-[11px] leading-relaxed mb-3 line-clamp-2">{tool.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      {tool.proof.map(p => (
                        <span key={p} className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.15)" }}>
                          {p}
                        </span>
                      ))}
                    </div>
                    <span className="text-white/50 text-sm font-bold group-hover:text-white group-hover:translate-x-1 transition-all duration-300">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}

/* ── Browse card ─────────────────────────────────────────────────────────── */
function BrowseCard({ tool }: { tool: Tool }) {
  const card = (
    <div
      className={`group relative flex-shrink-0 w-[230px] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-2 hover:shadow-[0_14px_36px_rgba(26,58,92,0.18),0_4px_8px_rgba(0,0,0,0.07)] ${tool.status === "coming" ? "opacity-40 pointer-events-none" : ""}`}
      style={{
        background: "#fff",
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 2px 8px rgba(26,58,92,0.08), 0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      {/* Cover — photo + gradient overlay */}
      <div className="w-full h-[130px] relative overflow-hidden" style={{ background: "#0a0a0a" }}>
        {tool.photo && (
          <img
            src={tool.photo}
            alt=""
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
            style={{ opacity: 0.45 }}
          />
        )}
        {/* Gradient colour identity — slightly translucent so photo shows through */}
        <div className="absolute inset-0" style={{ background: tool.gradient, opacity: tool.photo ? 0.72 : 1 }} />
        {/* Hover shimmer */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
      {/* Info */}
      <div className="p-4">
        <h3
          className="font-bold text-sm text-[#1a3a5c] leading-tight mb-1.5 group-hover:text-[#2563a8] transition-colors duration-300"
          style={{ fontFamily: "var(--font-playfair), serif" }}
        >
          {tool.name}
        </h3>
        <p className="text-[11px] text-[#6b7280] leading-relaxed line-clamp-2">
          {tool.description}
        </p>
        {tool.status !== "coming" && (
          <p className="mt-2 text-[11px] font-semibold text-[#2563a8] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Open <span>→</span>
          </p>
        )}
      </div>
    </div>
  );

  if (tool.status === "coming") return card;
  return <Link href={tool.href}>{card}</Link>;
}

/* ── Scroll row ──────────────────────────────────────────────────────────── */
function BrowseRow({ section, tools }: { section: string; tools: Tool[] }) {
  return (
    <div className="mb-12">
      <div className="flex items-baseline gap-3 mb-4 px-6 max-w-7xl mx-auto">
        <h2
          className="text-lg font-bold text-[#1a3a5c]"
          style={{ fontFamily: "var(--font-playfair), serif" }}
        >
          {section}
        </h2>
        <span className="text-[11px] text-[#9ca3af]">{tools.length} tool{tools.length !== 1 ? "s" : ""}</span>
      </div>
      {/* Scrollable strip — no scrollbar, drag to scroll on mobile */}
      <div
        className="flex gap-3 overflow-x-auto pl-6 pr-6"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {tools.map(tool => (
          <BrowseCard key={tool.href} tool={tool} />
        ))}
        {/* End spacer */}
        <div className="flex-shrink-0 w-2" />
      </div>
    </div>
  );
}

/* ── Full toolbox browse ─────────────────────────────────────────────────── */
function ToolboxBrowse() {
  return (
    <section id="toolbox" className="pb-20" style={{ background: "#f5f3ef", borderTop: "1px solid #ddd9d0" }}>
      <div className="max-w-7xl mx-auto px-6 pt-12 pb-6">
        <div className="flex items-center gap-3">
          <span className="block w-8 h-px bg-[var(--accent)]/25" />
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--accent)]/50">All Tools</span>
          <span className="flex-1 h-px bg-[var(--border)]" />
          <span className="text-[11px] text-[var(--muted)]">
            {ROWS.reduce((n, r) => n + r.tools.length, 0)} tools · {ROWS.map(r => r.section).join(" · ")}
          </span>
        </div>
      </div>
      {ROWS.map(row => (
        <BrowseRow key={row.section} section={row.section} tools={row.tools} />
      ))}
    </section>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function Home() {
  return (
    <div className="overflow-x-hidden">

      {/* ── HERO (Synex-style: airy, two-tone headline, floating data card) ── */}
      <section className="relative overflow-hidden topo-hero px-6 pt-28 pb-20 md:pt-32 md:pb-28 min-h-[94dvh] flex items-center"
        style={{ background: "linear-gradient(180deg,#fbfbfd 0%,#f5f3ef 55%,#eef1f5 100%)" }}>
        {/* Soft organic glows — the "terrain" light */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_78%_32%,rgba(37,99,168,0.10),transparent_70%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_40%_45%_at_88%_70%,rgba(52,160,110,0.08),transparent_70%)]" />

        <div className="max-w-6xl mx-auto w-full relative z-10 grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-8 items-center">
          {/* ── Left: copy ── */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-7 flex items-center gap-2" style={{ color: "#64748b" }}>
              <span className="w-5 h-px" style={{ background: "#94a3b8" }} />
              Harris County · Civics, Reimagined
            </p>

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5rem] font-bold leading-[1.02] mb-7"
              style={{ fontFamily: "var(--font-playfair), serif" }}>
              <span style={{ color: "#aab4c0" }}>They stopped<br />teaching civics.</span>
              <br /><span style={{ color: "#0f2540" }}>We didn&apos;t.</span>
            </h1>

            <p className="text-base md:text-lg max-w-md leading-relaxed mb-9" style={{ color: "#5b6470", lineHeight: 1.7 }}>
              A free toolbox for Harris County residents — see how your government
              votes, where it spends, and who answers to you.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <a href="#start-here"
                className="group inline-flex items-center gap-2.5 rounded-full px-7 py-3.5 text-sm font-bold text-white transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
                style={{ background: "#0f2540", boxShadow: "0 12px 30px rgba(15,37,64,0.22)" }}>
                Start exploring
                <span className="inline-flex w-6 h-6 rounded-full items-center justify-center group-hover:translate-y-0.5 transition-transform duration-500" style={{ background: "rgba(255,255,255,0.15)" }}>↓</span>
              </a>
              <a href="#toolbox"
                className="inline-flex items-center gap-2 font-semibold text-sm px-3 py-3.5 transition-colors duration-300"
                style={{ color: "#5b6470" }}>
                Browse all 25 tools →
              </a>
            </div>

            <div className="mt-12 flex flex-wrap gap-10">
              {[
                { value: "1,011", label: "Precincts mapped" },
                { value: "25", label: "Civic tools" },
                { value: "100%", label: "Public data" },
              ].map(({ value, label }) => (
                <div key={label}>
                  <p className="text-3xl font-bold leading-none tnum" style={{ color: "#0f2540", fontFamily: "var(--font-playfair), serif" }}>{value}</p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] mt-1.5" style={{ color: "#94a3b8" }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: floating glass data card ── */}
          <div className="relative hidden lg:block" style={{ perspective: 1200 }}>
            {/* Main dashboard card */}
            <div className="hero-float relative rounded-[1.4rem] overflow-hidden mx-auto max-w-sm"
              style={{ background: "rgba(255,255,255,0.82)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.9)", boxShadow: "0 30px 70px rgba(15,37,64,0.18), 0 6px 18px rgba(15,37,64,0.08)" }}>
              {/* window chrome */}
              <div className="flex items-center gap-1.5 px-4 py-2.5 border-b" style={{ borderColor: "rgba(15,37,64,0.06)" }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#f87171" }} />
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#fbbf24" }} />
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#34d399" }} />
                <span className="ml-2 text-[9px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(15,37,64,0.04)", color: "#94a3b8" }}>harriscounty.tools / heat-check</span>
              </div>
              {/* body */}
              <div className="p-5">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full alive-pulse" style={{ background: "#2563a8" }} />
                  <span className="text-[9px] font-bold uppercase tracking-[0.16em]" style={{ color: "#94a3b8" }}>Harris County · 2024 General</span>
                </div>
                <div className="flex items-end gap-2 mb-3">
                  <span className="text-4xl font-bold leading-none tnum" style={{ color: "#0f2540", fontFamily: "var(--font-playfair), serif" }}>61%</span>
                  <span className="text-sm font-bold mb-0.5" style={{ color: "#2563a8" }}>Dem</span>
                  <span className="text-[10px] font-semibold mb-1 ml-auto px-1.5 py-0.5 rounded-full" style={{ background: "rgba(37,160,110,0.12)", color: "#15803d" }}>+4 vs &apos;20</span>
                </div>
                {/* D/R bar */}
                <div className="h-2.5 rounded-full overflow-hidden flex mb-4">
                  <div style={{ width: "61%", background: "#2563a8" }} />
                  <div style={{ width: "39%", background: "#dc2626" }} />
                </div>
                {/* mini area chart */}
                <svg viewBox="0 0 240 64" className="w-full" style={{ height: 56 }} preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="heroArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563a8" stopOpacity="0.32" />
                      <stop offset="100%" stopColor="#2563a8" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,48 L40,42 L80,46 L120,30 L160,34 L200,18 L240,22 L240,64 L0,64 Z" fill="url(#heroArea)" />
                  <path d="M0,48 L40,42 L80,46 L120,30 L160,34 L200,18 L240,22" fill="none" stroke="#2563a8" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                </svg>
                {/* rows */}
                <div className="mt-3 space-y-2">
                  {[
                    { k: "HD 134", v: "61% D", c: "#2563a8" },
                    { k: "Money tracked", v: "$345M", c: "#0f2540" },
                  ].map((r) => (
                    <div key={r.k} className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold" style={{ color: "#64748b" }}>{r.k}</span>
                      <span className="font-bold tnum" style={{ color: r.c }}>{r.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating stat chip — top */}
            <div className="hero-float-2 absolute -top-5 -left-3 rounded-2xl px-4 py-3"
              style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.9)", boxShadow: "0 18px 40px rgba(15,37,64,0.16)" }}>
              <p className="text-[8px] font-bold uppercase tracking-[0.16em]" style={{ color: "#94a3b8" }}>Turnout · Nov &apos;24</p>
              <p className="text-2xl font-bold leading-none tnum mt-0.5" style={{ color: "#0f2540", fontFamily: "var(--font-playfair), serif" }}>1.49M</p>
            </div>

            {/* Floating stat chip — bottom */}
            <div className="hero-float-3 absolute -bottom-4 -right-2 rounded-2xl px-4 py-3"
              style={{ background: "rgba(15,37,64,0.92)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 18px 40px rgba(15,37,64,0.28)" }}>
              <p className="text-[8px] font-bold uppercase tracking-[0.16em]" style={{ color: "#7aaee8" }}>Biggest war chest</p>
              <p className="text-2xl font-bold leading-none tnum mt-0.5 text-white" style={{ fontFamily: "var(--font-playfair), serif" }}>$105.7M</p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-25">
          <div className="w-px h-10" style={{ background: "#1a3a5c", animation: "pulse 2s ease-in-out infinite" }} />
        </div>
      </section>

      {/* ── CLARITY (Synex-style numbered feature columns + floating cards) ── */}
      <section className="relative overflow-hidden topo-hero px-6 py-20 md:py-28" style={{ background: "linear-gradient(180deg,#eef1f5 0%,#f5f3ef 100%)" }}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_45%_45%_at_15%_30%,rgba(52,160,110,0.07),transparent_70%)]" />
        <div className="max-w-6xl mx-auto relative z-10">
          {/* Header row */}
          <div className="grid md:grid-cols-[1.2fr_1fr] gap-6 md:gap-12 items-end mb-14">
            <h2 className="text-3xl md:text-[2.75rem] font-bold leading-[1.08]" style={{ fontFamily: "var(--font-playfair),serif" }}>
              <span style={{ color: "#aab4c0" }}>Clarity and control over </span>
              <span style={{ color: "#0f2540" }}>every part of your county.</span>
            </h2>
            <p className="text-sm md:text-[15px] leading-relaxed" style={{ color: "#5b6470" }}>
              A clear, structured view of local power — from how each precinct votes to where the
              money flows and who, exactly, answers to you.
            </p>
          </div>

          {/* Three numbered feature columns */}
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                n: "1", title: "See every vote",
                desc: "Precinct-level results for every cycle back to 2012 — primaries, runoffs, and generals.",
                href: "/tools/heat-check",
                card: (
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[9px] font-bold uppercase tracking-[0.16em]" style={{ color: "#94a3b8" }}>Precinct results</span>
                      <span className="text-[10px] font-bold" style={{ color: "#2563a8" }}>61% D</span>
                    </div>
                    <div className="grid grid-cols-6 gap-1">
                      {["#2563a8","#2563a8","#7aaee8","#dc2626","#2563a8","#7aaee8","#2563a8","#f08080","#2563a8","#2563a8","#7aaee8","#dc2626","#7aaee8","#2563a8","#2563a8","#2563a8","#f08080","#2563a8"].map((c,i)=>(
                        <span key={i} className="rounded-[3px]" style={{ background: c, aspectRatio: "1", opacity: 0.9 }} />
                      ))}
                    </div>
                    <p className="text-[10px] mt-2.5" style={{ color: "#9ca3af" }}>1,011 precincts · 2012–2026</p>
                  </div>
                ),
              },
              {
                n: "2", title: "Follow every dollar",
                desc: "Live FEC, TEC, and county filings — cash on hand for every official and challenger.",
                href: "/tools/where-is-the-dough",
                card: (
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] mb-2" style={{ color: "#94a3b8" }}>Cash on hand</p>
                    <p className="text-3xl font-bold leading-none tnum mb-3" style={{ color: "#0f2540", fontFamily: "var(--font-playfair),serif" }}>$345M</p>
                    <div className="h-2 rounded-full overflow-hidden flex mb-1.5">
                      <div style={{ width: "44%", background: "#93c5fd" }} />
                      <div style={{ width: "56%", background: "#fca5a5" }} />
                    </div>
                    <div className="flex justify-between text-[10px] font-semibold">
                      <span style={{ color: "#2563a8" }}>D 44%</span>
                      <span style={{ color: "#9ca3af" }}>FEC + TEC live</span>
                      <span style={{ color: "#dc2626" }}>R 56%</span>
                    </div>
                  </div>
                ),
              },
              {
                n: "3", title: "Know who answers",
                desc: "Type your address or share your location — every official from your JP to Congress.",
                href: "/my-officials",
                card: (
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] mb-2.5" style={{ color: "#94a3b8" }}>Your district</p>
                    {[
                      { i: "AJ", n: "Ann Johnson", o: "State Rep · HD 134", c: "#2563a8" },
                      { i: "RE", n: "Rodney Ellis", o: "Commissioner · Pct 1", c: "#2563a8" },
                    ].map((r) => (
                      <div key={r.n} className="flex items-center gap-2.5 mb-2">
                        <span className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0" style={{ background: `${r.c}1a`, color: r.c, border: `1px solid ${r.c}33` }}>{r.i}</span>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold leading-tight truncate" style={{ color: "#1a3a5c" }}>{r.n}</p>
                          <p className="text-[9px] truncate" style={{ color: "#9ca3af" }}>{r.o}</p>
                        </div>
                      </div>
                    ))}
                    <p className="text-[10px] mt-1" style={{ color: "#9ca3af" }}>JP → Congress</p>
                  </div>
                ),
              },
            ].map((f) => (
              <Link key={f.n} href={f.href} className="group block">
                <div className="flex items-baseline gap-2.5 mb-3">
                  <span className="text-[11px] font-bold tnum" style={{ color: "#94a3b8" }}>[{f.n}]</span>
                  <h3 className="text-base font-bold" style={{ color: "#0f2540" }}>{f.title}</h3>
                </div>
                <p className="text-[13px] leading-relaxed mb-5" style={{ color: "#64748b" }}>{f.desc}</p>
                {/* Floating frosted preview card */}
                <div className="card-lift rounded-2xl p-4"
                  style={{ background: "rgba(255,255,255,0.78)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,0.9)", boxShadow: "0 18px 44px rgba(15,37,64,0.10), 0 3px 10px rgba(15,37,64,0.05)" }}>
                  {f.card}
                </div>
                <span className="inline-flex items-center gap-1.5 mt-4 text-[12px] font-bold group-hover:gap-2.5 transition-all duration-300" style={{ color: "#2563a8" }}>
                  Open tool <span>→</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── DASHBOARD WIDGET ─────────────────────────────────────── */}
      <DashboardWidget />

      {/* ── FEATURED FLAGSHIP TOOLS ──────────────────────────────── */}
      <FeaturedSection />

      {/* ── FULL TOOLBOX BROWSE ──────────────────────────────────── */}
      <ToolboxBrowse />

      {/* ── ABOUT ──────────────────────────────────────────────────── */}
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
            <br /><span className="text-sky-300">Free, always.</span>
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
              See the tools
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
