import Link from "next/link";
import ScrollReveal from "@/components/ScrollReveal";
import DashboardWidget from "@/components/DashboardWidget";
import ToolboxOpener from "@/components/ToolboxOpener";
import Hero3D from "@/components/Hero3D";
import TerrainReport from "@/components/TerrainReport";

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
        description: "Campaign finance for 49 Harris County politicians — live from FEC, TEC, and county filings.",
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
        description: "Portrait of a seat — demographics, history, and who represents it.",
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
        description: "49 Harris County officials — stats, finance, bills, and social feeds.",
        gradient: "linear-gradient(135deg,#1a3a5c 0%,#2563a8 100%)",
        photo: U("1560472354-b33ff0c44a43") },
      { href: "/contact", name: "Contact & Feedback",
        description: "Spot a data error? Have an idea for a new tool? Tell us.",
        gradient: "linear-gradient(135deg,#374151 0%,#6b7280 100%)",
        photo: U("1577563908411-5077b6dc7624") },
    ],
  },
];

/* ── Featured flagship tools ─────────────────────────────────────────────── */
const FEATURED = [
  {
    href:        "/tools/heat-check",
    name:        "Heat Check",
    eyebrow:     "Elections",
    headline:    "See how every\nprecinct voted.",
    description: "1,011 precincts. Democratic and Republican primaries. Zoom into your block and see exactly how your neighborhood voted — and who turned out.",
    proof:       ["1,011 precincts mapped", "Dem & Rep primaries", "2026 runoff data"],
    photo:       U("1596422846543-75c6fc197f07"),
    gradient:    "linear-gradient(135deg,#7f1d1d 0%,#991b1b 60%,#dc2626 100%)",
    size:        "large",
  },
  {
    href:        "/tools/where-is-the-dough",
    name:        "Where the Money Resides",
    eyebrow:     "Money",
    headline:    "Follow the money\nbehind every official.",
    description: "Live FEC, TEC, and county filings for all 49 Harris County politicians. See who's funding your representative — and how much.",
    proof:       ["49 officials tracked", "FEC + TEC + County live", "Updated each filing cycle"],
    photo:       U("1611974789855-9c2a0a7236a3"),
    gradient:    "linear-gradient(135deg,#78350f 0%,#b45309 60%,#d97706 100%)",
    size:        "small",
  },
  {
    href:        "/tools/city-hall",
    name:        "City Hall Beat",
    eyebrow:     "The Beat",
    headline:    "What actually happened\nat Tuesday's meeting.",
    description: "Every Houston City Council meeting AI-summarized from Emily Takes Notes — major votes, who spoke, and which politicians were in the room.",
    proof:       ["Every Tuesday meeting", "AI-structured timeline", "Cross-referenced to politician profiles"],
    photo:       U("1565517613760-aa17a7a34bd7"),
    gradient:    "linear-gradient(135deg,#0f766e 0%,#0d9488 60%,#0891b2 100%)",
    size:        "small",
  },
] as const;

function FeaturedSection() {
  const [large, ...small] = FEATURED;
  return (
    <section id="start-here" className="py-16 md:py-24 px-6" style={{ background: "#f5f3ef" }}>
      <div className="max-w-6xl mx-auto">
        {/* Section label */}
        <div className="flex items-center gap-3 mb-10">
          <span className="block w-8 h-px bg-[var(--accent)]/25" />
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--accent)]/50">Start Here</span>
          <span className="flex-1 h-px bg-[var(--border)]" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">

          {/* Large featured card */}
          <Link href={large.href} className="group relative rounded-[2rem] overflow-hidden cursor-pointer block"
            style={{ minHeight: 420 }}>
            {/* Photo */}
            <img src={large.photo} alt="" loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
              style={{ opacity: 0.5 }} />
            {/* Gradient overlay */}
            <div className="absolute inset-0" style={{ background: large.gradient, opacity: 0.75 }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Content */}
            <div className="relative z-10 flex flex-col justify-end h-full p-8 md:p-10" style={{ minHeight: 420 }}>
              <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/50 mb-3">{large.eyebrow}</span>
              <h2 className="text-4xl md:text-5xl font-bold text-white leading-[1.08] mb-4 whitespace-pre-line"
                style={{ fontFamily: "var(--font-playfair), serif" }}>
                {large.headline}
              </h2>
              <p className="text-white/70 text-sm leading-relaxed max-w-md mb-6">{large.description}</p>

              {/* Proof points */}
              <div className="flex flex-wrap gap-2 mb-6">
                {large.proof.map(p => (
                  <span key={p} className="text-[10px] font-bold px-3 py-1 rounded-full"
                    style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.18)" }}>
                    {p}
                  </span>
                ))}
              </div>

              <span className="inline-flex items-center gap-2 text-sm font-bold text-white group-hover:gap-3 transition-all duration-300">
                Open {large.name}
                <span className="inline-flex w-8 h-8 rounded-full bg-white/15 items-center justify-center group-hover:bg-white/25 transition-colors">→</span>
              </span>
            </div>
          </Link>

          {/* Two smaller cards stacked */}
          <div className="flex flex-col gap-5">
            {small.map(tool => (
              <Link key={tool.href} href={tool.href}
                className="group relative rounded-[2rem] overflow-hidden cursor-pointer flex-1 block"
                style={{ minHeight: 195 }}>
                <img src={tool.photo} alt="" loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
                  style={{ opacity: 0.5 }} />
                <div className="absolute inset-0" style={{ background: tool.gradient, opacity: 0.75 }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

                <div className="relative z-10 flex flex-col justify-end h-full p-6" style={{ minHeight: 195 }}>
                  <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/50 mb-2">{tool.eyebrow}</span>
                  <h3 className="text-2xl font-bold text-white leading-tight mb-2 whitespace-pre-line"
                    style={{ fontFamily: "var(--font-playfair), serif" }}>
                    {tool.headline}
                  </h3>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      {tool.proof.slice(0, 2).map(p => (
                        <span key={p} className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.15)" }}>
                          {p}
                        </span>
                      ))}
                    </div>
                    <span className="text-white/60 text-xs font-bold group-hover:text-white group-hover:translate-x-1 transition-all duration-300">→</span>
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

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="bg-[var(--accent)] text-white flex flex-col justify-center px-6 py-24 md:py-32 relative overflow-hidden min-h-[90dvh]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_60%_40%,rgba(37,99,168,0.4),transparent)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_40%_50%_at_90%_80%,rgba(125,211,252,0.06),transparent)]" />
        {/* 3D extruded precinct map — height = turnout, color = partisan lean */}
        <Hero3D />

        <div className="max-w-5xl mx-auto w-full relative z-10 pointer-events-none">
          <p className="text-sky-300/70 text-[10px] font-bold uppercase tracking-[0.3em] mb-10 flex items-center gap-2">
            <span className="w-5 h-px bg-sky-300/40" />
            Harris County, Texas
          </p>

          <h1
            className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.75rem] font-bold leading-[1.03] mb-8 max-w-4xl"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            They stopped
            <br />teaching civics.
            <br /><span className="text-sky-300">We didn&apos;t.</span>
          </h1>

          <p className="text-white/65 text-lg md:text-xl max-w-lg leading-relaxed mb-12" style={{ lineHeight: 1.7 }}>
            A free toolbox for Harris County residents who want to understand
            their government — how it votes, where it spends, and when it decides.
          </p>

          <div className="flex flex-wrap gap-3 pointer-events-auto w-fit">
            <a
              href="#start-here"
              className="group inline-flex items-center gap-3 bg-sky-300 hover:bg-sky-200 text-[var(--accent)] font-bold rounded-full px-7 py-4 text-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[0_0_48px_rgba(125,211,252,0.35)] active:scale-[0.98]"
            >
              Start Exploring
              <span className="inline-flex w-7 h-7 rounded-full bg-[var(--accent)]/15 items-center justify-center group-hover:translate-y-0.5 transition-transform duration-500">↓</span>
            </a>
            <a
              href="#toolbox"
              className="inline-flex items-center gap-2 text-white/55 hover:text-white font-semibold text-sm transition-colors duration-300 px-4 py-4"
            >
              Browse all 25 tools
            </a>
          </div>

          <div className="mt-16 flex flex-wrap gap-8">
            {[
              { value: "25", label: "Civic tools" },
              { value: "100%", label: "Public data" },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-2xl font-bold text-white leading-none" style={{ fontFamily: "var(--font-playfair), serif" }}>{value}</p>
                <p className="text-white/45 text-xs font-semibold uppercase tracking-[0.15em] mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-30">
          <div className="w-px h-10 bg-white/60" style={{ animation: "pulse 2s ease-in-out infinite" }} />
        </div>
      </section>

      {/* ── DASHBOARD WIDGET ─────────────────────────────────────── */}
      <DashboardWidget />

      {/* ── THE TERRAIN REPORT — automated signals feed ──────────── */}
      <section className="px-6 pb-4" style={{ background: "#f5f3ef" }}>
        <div className="max-w-6xl mx-auto pt-14">
          <TerrainReport />
        </div>
      </section>

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
