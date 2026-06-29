"use client";
import { useState } from "react";
import Link from "next/link";
import ShareButton from "@/components/ShareButton";
import { SourceBadge, EvidencePanel } from "@/components/SourceBadge";

/* ─── FY2027 Budget Data ─────────────────────────────────────────────────── */
interface BudgetLine {
  dept: string;
  category: string;
  amount: number;
  change: number;
  employees?: number;
  description: string;
  note?: string;
}

const BUDGET: BudgetLine[] = [
  { dept: "Houston Police Department",   category: "Public Safety",   amount: 1250, change: 19.0, employees: 5400, description: "Patrol, investigations, special operations, and crime prevention", note: "Largest General Fund line item" },
  { dept: "Houston Fire Department",     category: "Public Safety",   amount:  900, change:  3.4, employees: 4100, description: "Fire suppression, emergency medical services, and rescue operations" },
  { dept: "Debt Service",               category: "Debt",            amount: 1140, change:  1.8,               description: "General obligation and revenue bond principal and interest" },
  { dept: "Public Works & Engineering", category: "Infrastructure",  amount:  850, change:  3.7, employees: 1200, description: "Streets, drainage, traffic management, and capital improvements" },
  { dept: "Housing & Community Dev",    category: "Housing",         amount:  300, change:  5.3, employees:  180, description: "Affordable housing, community block grants, and anti-displacement programs" },
  { dept: "Solid Waste Management",     category: "Operations",      amount:  134, change:    0, employees: 1100, description: "Moved to Combined Utility System. No longer a General Fund line item in FY27", note: "Shifted to utility" },
  { dept: "Parks & Recreation",         category: "Quality of Life", amount:  175, change:  4.2, employees: 1800, description: "Parks, pools, recreation centers, trails, and youth programming" },
  { dept: "General Administration",     category: "Administration",  amount:  220, change:  2.3, employees: 1500, description: "Mayor's Office, City Council, legal, HR, and support services" },
  { dept: "Health & Human Services",    category: "Health",          amount:  155, change:  4.7, employees:  650, description: "Public health clinics, environmental health, and social services" },
  { dept: "Information Technology",     category: "Operations",      amount:  105, change:  7.1, employees:  420, description: "IT infrastructure, cybersecurity, 311, and digital government services" },
  { dept: "Houston Public Library",     category: "Quality of Life", amount:   68, change:  6.3, employees:  850, description: "44 library branches, digital resources, and community programs" },
  { dept: "Planning & Development",     category: "Administration",  amount:   50, change:  4.2, employees:  340, description: "Zoning, permitting, historic preservation, and urban planning" },
  { dept: "Aviation / Airport System", category: "Enterprise",      amount:  620, change:  6.9, employees: 1600, description: "IAH and Hobby airports. Self-funded from revenues" },
  { dept: "Other Departments & Reserves",category:"Other",           amount:  800, change:  1.2,               description: "Controller, municipal courts, fleet, and contingency reserves" },
];

const TOTAL = BUDGET.reduce((s, b) => s + b.amount, 0);

const MOVES = [
  {
    step: "01",
    title: "$5 Trash Fee",
    sub: "Houston's first-ever garbage fee",
    body: "Starting FY27, the ~400,000 residents who get solid waste pickup pay $5/month. That's new. Houston was the only major Texas city without one. The fee can ramp to $25/month over time, eventually generating up to $120M/year.",
    chip: "$24M in year one",
    note: "→ ramps to $120M/yr at full scale",
    color: "#0891b2",
    pct: 14,
  },
  {
    step: "02",
    title: "Solid Waste Exits the General Fund",
    sub: "~$100M department off the books",
    body: "The entire Solid Waste department moves out of the General Fund and into the Combined Utility System. The same fund running water and wastewater. On paper, the General Fund looks leaner. In practice, utility ratepayers carry the load.",
    chip: "$100M shifted",
    note: "from General Fund to water bill",
    color: "#7c3aed",
    pct: 57,
  },
  {
    step: "03",
    title: "City Charges Its Own Utility",
    sub: "Circular. But legal",
    body: "The city bills the Combined Utility System a right-of-way fee for using public streets to run pipes. The utility pays $104M/year, which flows straight back into the General Fund. That money ultimately comes from your water and sewer bill.",
    chip: "$104M/yr",
    note: "utility → General Fund annually",
    color: "#b45309",
    pct: 100,
  },
];

/* ─── Council Members (FY2027) ──────────────────────────────────────────── */
interface CouncilMember {
  district: string;
  name: string;
  party: "D" | "R" | "NP";
  discretionaryM: number;
  topProject: string;
  slug?: string;
  vote?: "yes" | "no" | "absent";
}

const COUNCIL: CouncilMember[] = [
  { district: "District A", name: "Amy Peck",               party: "R",  discretionaryM: 1.2, topProject: "Addicks Reservoir area road repairs",          slug: "amy-peck",               vote: "yes" },
  { district: "District B", name: "Tarsha Jackson",         party: "D",  discretionaryM: 1.2, topProject: "Kashmere Gardens drainage improvements",        slug: "tarsha-jackson",         vote: "yes" },
  { district: "District C", name: "Joe Panzarella",         party: "D",  discretionaryM: 1.2, topProject: "Washington Ave corridor streetscaping",         slug: "joe-panzarella",         vote: "yes" },
  { district: "District D", name: "Carolyn Evans-Shabazz",  party: "D",  discretionaryM: 1.2, topProject: "Third Ward sidewalk and crosswalk program",     slug: "carolyn-evans-shabazz",  vote: "yes" },
  { district: "District E", name: "Fred Flickinger",        party: "R",  discretionaryM: 1.2, topProject: "Clear Lake area parks improvements",            slug: "fred-flickinger",        vote: "yes" },
  { district: "District F", name: "Tiffany Thomas",         party: "D",  discretionaryM: 1.2, topProject: "Westheimer corridor mobility upgrades",         slug: "tiffany-thomas",         vote: "absent" },
  { district: "District G", name: "Mary Nan Huffman",       party: "R",  discretionaryM: 1.2, topProject: "Meyerland drainage and trail work",             slug: "mary-nan-huffman",       vote: "yes" },
  { district: "District H", name: "Mario Castillo",         party: "D",  discretionaryM: 1.2, topProject: "Near Northside pedestrian safety",             slug: "mario-castillo",         vote: "yes" },
  { district: "District I", name: "Joaquin Martinez",       party: "D",  discretionaryM: 1.2, topProject: "East End connectivity and bike lanes",          slug: "joaquin-martinez",       vote: "yes" },
  { district: "District J", name: "Ed Pollard",             party: "D",  discretionaryM: 1.2, topProject: "Sharpstown park and rec upgrades",             slug: "edward-pollard",         vote: "no" },
  { district: "District K", name: "Martha Castex-Tatum",    party: "D",  discretionaryM: 1.2, topProject: "Alief drainage and park improvements",          slug: "martha-castex-tatum",    vote: "yes" },
  { district: "At-Large 1", name: "Julian Ramirez",         party: "R",  discretionaryM: 0.8, topProject: "Citywide public safety infrastructure",         slug: "julian-ramirez",         vote: "yes" },
  { district: "At-Large 2", name: "Willie Davis",           party: "R",  discretionaryM: 0.8, topProject: "Minority business development initiatives",     slug: "willie-davis",           vote: "yes" },
  { district: "At-Large 3", name: "Twila Carter",           party: "R",  discretionaryM: 0.8, topProject: "Youth workforce and community centers",         slug: "twila-carter",           vote: "yes" },
  { district: "At-Large 4", name: "Alejandra Salinas",      party: "D",  discretionaryM: 0.8, topProject: "Resilience and climate infrastructure",         slug: "alejandra-salinas",      vote: "yes" },
  { district: "At-Large 5", name: "Sallie Alcorn",          party: "D",  discretionaryM: 0.8, topProject: "Senior services and transit connections",       slug: "sallie-alcorn",          vote: "yes" },
];

const CAT_COLOR: Record<string, string> = {
  "Public Safety":   "#1d4ed8",
  "Debt":           "#6b7280",
  "Infrastructure": "#0891b2",
  "Housing":        "#16a34a",
  "Operations":     "#92400e",
  "Quality of Life":"#0f766e",
  "Administration": "#b45309",
  "Health":         "#15803d",
  "Enterprise":     "#7c3aed",
  "Other":          "#9ca3af",
};

function fmt(n: number) {
  return n >= 1000 ? `$${(n / 1000).toFixed(2)}B` : `$${n}M`;
}

/* ─── Monarch-style budget bar ───────────────────────────────────────────── */
function MonarchBudgetBar({ line, max }: { line: BudgetLine; max: number }) {
  const pct = (line.amount / max) * 100;
  const color = CAT_COLOR[line.category] ?? "#9ca3af";
  const up = line.change > 0;
  return (
    <div className="group px-5 py-4 hover:bg-black/[0.02] rounded-2xl transition-all duration-300 cursor-default">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          <span className="w-3 h-3 rounded-full flex-shrink-0 mt-[3px]" style={{ background: color }}/>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--foreground)] leading-tight">{line.dept}</p>
            <p className="text-[10px] text-[var(--muted)] mt-0.5">
              {line.category}{line.employees ? ` · ${line.employees.toLocaleString()} staff` : ""}
              {line.note ? <span className="ml-1 text-amber-600 font-semibold">· {line.note}</span> : null}
            </p>
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="text-base font-bold text-[var(--accent)]"
            style={{ fontFamily: "var(--font-playfair), serif" }}>{fmt(line.amount)}</p>
          <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${
            up ? "text-emerald-600" : line.change < 0 ? "text-red-500" : "text-[var(--muted)]"
          }`}>
            {up ? "▲" : line.change < 0 ? "▼" : "–"} {Math.abs(line.change).toFixed(1)}%
          </span>
        </div>
      </div>
      <div className="h-2.5 bg-black/[0.05] rounded-full overflow-hidden">
        <div className="h-full rounded-full"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg,${color}cc,${color})`,
            transition: "width 0.9s cubic-bezier(0.22,1,0.36,1)" }}/>
      </div>
      <div className="overflow-hidden max-h-0 group-hover:max-h-10 transition-all duration-300">
        <p className="text-[10px] text-[var(--muted)] mt-2 leading-relaxed">{line.description}</p>
      </div>
    </div>
  );
}

/* ─── Stacked category bar ───────────────────────────────────────────────── */
function CategoryStackedBar({ byCategory, total }: { byCategory: Record<string, number>; total: number }) {
  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  return (
    <div className="rounded-[1.75rem] bg-white/60 ring-1 ring-black/8 p-[6px] mb-8">
      <div className="rounded-[1.35rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] p-6">
        <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] mb-4">Spending by Category</p>
        <div className="h-5 rounded-full flex overflow-hidden mb-5 gap-[2px]">
          {sorted.map(([cat, amt]) => (
            <div key={cat}
              className="h-full transition-all duration-700"
              style={{ width: `${(amt / total) * 100}%`, background: CAT_COLOR[cat] ?? "#9ca3af",
                minWidth: amt / total > 0.008 ? 3 : 0 }}
              title={`${cat}: ${fmt(amt)}`}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {sorted.map(([cat, amt]) => (
            <div key={cat} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: CAT_COLOR[cat] ?? "#9ca3af" }}/>
              <span className="text-[10px] font-medium text-[var(--muted)]">{cat}</span>
              <span className="text-[10px] font-bold text-[var(--accent)]">{fmt(amt)}</span>
              <span className="text-[10px] text-[var(--muted)]/60">{((amt / total) * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

type Tab = "story" | "breakdown" | "council";

export default function CityBudget() {
  const [tab, setTab] = useState<Tab>("story");
  const [sort, setSort] = useState<"amount" | "change" | "dept">("amount");
  const [catFilter, setCatFilter] = useState("All");

  const categories = ["All", ...Array.from(new Set(BUDGET.map((b) => b.category))).sort()];
  const sortedBudget = [...BUDGET]
    .filter((b) => catFilter === "All" || b.category === catFilter)
    .sort((a, b) => {
      if (sort === "amount") return b.amount - a.amount;
      if (sort === "change") return b.change - a.change;
      return a.dept.localeCompare(b.dept);
    });
  const maxAmt = Math.max(...sortedBudget.map((b) => b.amount));
  const byCategory = BUDGET.reduce<Record<string, number>>((acc, b) => {
    acc[b.category] = (acc[b.category] ?? 0) + b.amount;
    return acc;
  }, {});

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="bg-[var(--accent)] text-white px-6 py-16 md:py-24 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_80%_50%,rgba(37,99,168,0.4),transparent)]" />
        <div className="max-w-6xl mx-auto relative z-10">
          <p className="text-sky-300/80 text-[11px] font-bold uppercase tracking-[0.25em] mb-3">Money</p>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-2" style={{ fontFamily: "var(--font-playfair), serif" }}>
            Houston City Budget
          </h1>
          <p className="text-white/70 text-sm max-w-lg">
            How Houston closed a $180M gap without raising taxes. And where your money actually goes. FY2027, passed 15–1 on June 10, 2026.
          </p>
          <ShareButton
            toolName="Houston City Budget"
            section="Money"
            description="How Houston closed a $180M gap without raising taxes. And where your money goes. FY2027."
            stats={[{ label: "Total Budget", value: "$7.5B" }, { label: "General Fund", value: "$3.1B" }, { label: "Vote", value: "15–1" }]}
          />
          <div className="mt-5 flex gap-4 flex-wrap">
            <div className="bg-white/10 ring-1 ring-white/20 rounded-2xl px-5 py-3">
              <p className="text-sky-300/80 text-[9px] font-bold uppercase tracking-widest mb-0.5">Total Budget</p>
              <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-playfair), serif" }}>$7.5B</p>
            </div>
            <div className="bg-white/10 ring-1 ring-white/20 rounded-2xl px-5 py-3">
              <p className="text-sky-300/80 text-[9px] font-bold uppercase tracking-widest mb-0.5">General Fund</p>
              <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-playfair), serif" }}>$3.1B</p>
            </div>
            <div className="bg-white/10 ring-1 ring-white/20 rounded-2xl px-5 py-3">
              <p className="text-sky-300/80 text-[9px] font-bold uppercase tracking-widest mb-0.5">Council Vote</p>
              <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-playfair), serif" }}>15–1</p>
            </div>
            <div className="bg-white/10 ring-1 ring-white/20 rounded-2xl px-5 py-3">
              <p className="text-sky-300/80 text-[9px] font-bold uppercase tracking-widest mb-0.5">Gap Closed</p>
              <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-playfair), serif" }}>$180M</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-[var(--background)]/90 backdrop-blur border-b border-[var(--border)] px-6 py-3">
        <div className="max-w-6xl mx-auto flex flex-wrap gap-2 items-center">
          {([["story", "The Story"], ["breakdown", "Budget Breakdown"], ["council", "Council Members"]] as [Tab, string][]).map(([v, label]) => (
            <button key={v} onClick={() => setTab(v)}
              style={{ transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)" }}
              className={`text-xs font-bold uppercase tracking-[0.12em] px-4 py-2 rounded-full ${tab === v ? "bg-[var(--accent)] text-white" : "bg-white ring-1 ring-[var(--border)] text-[var(--muted)] hover:ring-[var(--accent-light)]"}`}>
              {label}
            </button>
          ))}
          {tab === "breakdown" && (
            <>
              <span className="text-[var(--border)] hidden sm:block">|</span>
              {categories.map((c) => (
                <button key={c} onClick={() => setCatFilter(c)}
                  style={{ transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)" }}
                  className={`text-xs font-bold uppercase tracking-[0.1em] px-3 py-1.5 rounded-full ${catFilter === c ? "bg-[var(--accent)] text-white" : "bg-white ring-1 ring-[var(--border)] text-[var(--muted)] hover:ring-[var(--accent-light)]"}`}>
                  {c}
                </button>
              ))}
              <span className="text-[var(--border)] hidden sm:block">|</span>
              {(["amount", "change", "dept"] as const).map((s) => (
                <button key={s} onClick={() => setSort(s)}
                  style={{ transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)" }}
                  className={`text-xs font-bold uppercase tracking-[0.1em] px-3 py-1.5 rounded-full ${sort === s ? "bg-[var(--accent)] text-white" : "bg-white ring-1 ring-[var(--border)] text-[var(--muted)] hover:ring-[var(--accent-light)]"}`}>
                  {s === "amount" ? "$ Amount" : s === "change" ? "% Change" : "A–Z"}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">

        {/* ══ STORY TAB ══════════════════════════════════════════════════ */}
        {tab === "story" && (
          <div>

            {/* The Problem */}
            <div className="mb-16">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] mb-3">The Problem</p>
              <h2 className="text-2xl md:text-3xl font-bold text-[var(--accent)] mb-6 leading-tight" style={{ fontFamily: "var(--font-playfair), serif" }}>
                Houston has run a deficit every single year since 2009.
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="rounded-[1.75rem] bg-white/60 ring-1 ring-black/8 p-[5px] md:col-span-2">
                  <div className="rounded-[1.35rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] p-6">
                    <p className="text-sm text-[var(--muted)] leading-relaxed mb-4">
                      The city&apos;s <strong className="text-[var(--foreground)]">$3.1 billion General Fund</strong>. Which pays for police, fire, libraries, parks, and trash pickup. Has run structural deficits for over a decade. By FY26, Houston was staring at a <strong className="text-[var(--foreground)]">$107M shortfall</strong>. FY27 was worse: <strong className="text-[var(--foreground)]">$180M</strong>.
                    </p>
                    <p className="text-sm text-[var(--muted)] leading-relaxed">
                      Mayor Whitmire&apos;s FY27 budget, passed <strong className="text-[var(--foreground)]">15–1 on June 10, 2026</strong>, closes the gap without raising property taxes. Three accounting moves make that possible. But City Controller Chris Hollins argues the moves trade one-year relief for long-term risk.
                    </p>
                  </div>
                </div>

                <div className="rounded-[1.75rem] bg-[var(--accent)]/5 ring-1 ring-[var(--accent)]/15 p-[5px]">
                  <div className="rounded-[1.35rem] bg-[var(--accent)]/5 p-6 h-full flex flex-col justify-center">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]/60 mb-3">FY27 Budget Gap</p>
                    <p className="text-5xl font-bold text-[var(--accent)] mb-2" style={{ fontFamily: "var(--font-playfair), serif" }}>$180M</p>
                    <p className="text-xs text-[var(--muted)]">Structural shortfall requiring closure</p>
                    <div className="mt-4 pt-4 border-t border-[var(--accent)]/10">
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--accent)]/60 mb-1">16th straight deficit year</p>
                      <div className="flex items-end gap-0.5 h-8">
                        {[145,89,124,90,156,68,74,142,198,126,84,116,78,52,107,174].map((h, i) => (
                          <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${(h / 198) * 100}%`, background: i === 15 ? "var(--accent)" : "var(--accent-light)", opacity: i === 15 ? 1 : 0.4 }} />
                        ))}
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[9px] text-[var(--muted)]">FY09</span>
                        <span className="text-[9px] font-bold text-[var(--accent)]">FY27</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Three Moves */}
            <div className="mb-16">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] mb-3">The Fix</p>
              <h2 className="text-2xl md:text-3xl font-bold text-[var(--accent)] mb-2 leading-tight" style={{ fontFamily: "var(--font-playfair), serif" }}>
                Three moves. No tax increase.
              </h2>
              <p className="text-sm text-[var(--muted)] mb-8 max-w-2xl">
                Taken together, these three mechanisms redirect over $229M toward the General Fund. Without any single action that can officially be called a tax increase.
              </p>

              {/* Progress bar across all 3 */}
              <div className="mb-8 rounded-full bg-gray-100 h-2 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#0891b2] via-[#7c3aed] to-[#b45309] transition-all duration-1000"
                  style={{ width: "100%" }} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {MOVES.map((move, i) => (
                  <div key={i} className="relative">
                    <div className="rounded-[1.75rem] bg-white/60 ring-1 ring-black/8 p-[5px] h-full">
                      <div className="rounded-[1.35rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] p-6 h-full flex flex-col">
                        <div className="flex items-start justify-between mb-4">
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: move.color }}>Move {move.step}</span>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: move.color }}>
                            {move.step}
                          </div>
                        </div>
                        <h3 className="font-bold text-[var(--accent)] text-lg leading-tight mb-1" style={{ fontFamily: "var(--font-playfair), serif" }}>
                          {move.title}
                        </h3>
                        <p className="text-[11px] font-semibold mb-3" style={{ color: move.color }}>{move.sub}</p>
                        <p className="text-sm text-[var(--muted)] leading-relaxed flex-1 mb-5">{move.body}</p>
                        <div className="rounded-xl p-3" style={{ background: move.color + "10" }}>
                          <p className="text-xl font-bold" style={{ color: move.color, fontFamily: "var(--font-playfair), serif" }}>{move.chip}</p>
                          <p className="text-[10px] text-[var(--muted)] mt-0.5">{move.note}</p>
                        </div>
                      </div>
                    </div>
                    {i < 2 && (
                      <div className="hidden md:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white ring-1 ring-[var(--border)] items-center justify-center text-[var(--muted)] text-sm font-bold shadow-sm">
                        +
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Result callout */}
              <div className="mt-8 rounded-[1.75rem] bg-white/60 ring-1 ring-black/8 p-[5px]">
                <div className="rounded-[1.35rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] mb-1">The Result</p>
                    <p className="font-bold text-[var(--accent)] text-lg leading-snug" style={{ fontFamily: "var(--font-playfair), serif" }}>
                      Gap officially closed. But the Controller says it&apos;s accounting, not reform.
                    </p>
                    <p className="text-sm text-[var(--muted)] mt-1">$229M+ redirected to the General Fund. None of it officially a tax increase. Whether it&apos;s sustainable depends on who you ask.</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-3xl font-bold text-emerald-600" style={{ fontFamily: "var(--font-playfair), serif" }}>$229M+</p>
                    <p className="text-[10px] text-[var(--muted)] uppercase tracking-widest">Redirected to GF</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                <SourceBadge source={{ label: "Houston Chronicle", detail: "Abby Church, June 10 2026. Budget passage coverage", type: "news" }} />
                <SourceBadge source={{ label: "htxbudget.com", detail: "Local Insight / OCSI analysis", type: "news", url: "https://htxbudget.com" }} />
                <SourceBadge source={{ label: "Houston Public Media", detail: "FY27 budget coverage", type: "news" }} />
                <SourceBadge source={{ label: "City of Houston", detail: "FY2027 Proposed Budget document", type: "government", url: "https://www.houstontx.gov/budget" }} />
              </div>
            </div>

            {/* HPD Spotlight */}
            <div className="mb-16">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] mb-3">Biggest Line Item</p>
              <div className="rounded-[1.75rem] bg-white/60 ring-1 ring-black/8 p-[5px]">
                <div className="rounded-[1.35rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <div className="flex-1">
                      <h3 className="font-bold text-[var(--accent)] text-xl mb-2" style={{ fontFamily: "var(--font-playfair), serif" }}>
                        HPD alone consumes 39% of the General Fund
                      </h3>
                      <p className="text-sm text-[var(--muted)] leading-relaxed">
                        At <strong className="text-[var(--foreground)]">$1.2B+</strong>, the Houston Police Department is by far the single largest line item. That&apos;s why the budget is nearly impossible to balance without either cutting public safety, raising revenue, or shifting costs. Like moving trash out of the General Fund entirely.
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-center md:text-right">
                      <p className="text-5xl font-bold text-[#1d4ed8]" style={{ fontFamily: "var(--font-playfair), serif" }}>$1.25B</p>
                      <p className="text-xs text-[var(--muted)] uppercase tracking-widest mt-1">HPD FY2027</p>

                      <div className="mt-3 h-3 bg-gray-100 rounded-full overflow-hidden w-48 mx-auto md:ml-auto md:mr-0">
                        <div className="h-full rounded-full bg-[#1d4ed8]" style={{ width: "39%" }} />
                      </div>
                      <p className="text-[10px] text-[var(--muted)] mt-1">39% of $3.1B General Fund</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Amendments */}
            <div className="mb-16">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] mb-3">What Council Added</p>
              <h2 className="text-2xl md:text-3xl font-bold text-[var(--accent)] mb-6 leading-tight" style={{ fontFamily: "var(--font-playfair), serif" }}>
                Key amendments passed alongside the budget.
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { who: "Salinas", title: "$3M for Illegal Dumping", body: "Hire workers, buy equipment, expand surveillance and drop-off hours. Requires quarterly reports on staff hired, sites cleared, cameras installed, and dumping cases.", color: "#15803d" },
                  { who: "Martinez / Castillo / Peck", title: "Fee Relief Study", body: "Administration must report whether the utility fund can reduce, offset, or eliminate the $5 fee for seniors, people with disabilities, and qualified veterans.", color: "#0891b2" },
                  { who: "Salinas (vote in 2 weeks)", title: "W.A.T.E.R. Fund Expansion", body: "Lets residents paying the new trash fee access the city's Water Aid to Elderly Residents charitable fund, which helps seniors, disabled, and low-income families cover water bills.", color: "#7c3aed" },
                ].map((a, i) => (
                  <div key={i} className="rounded-[1.75rem] bg-white/60 ring-1 ring-black/8 p-[5px]">
                    <div className="rounded-[1.35rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] p-5 h-full flex flex-col">
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-2" style={{ color: a.color }}>{a.who}</p>
                      <h3 className="font-bold text-[var(--accent)] text-base mb-2 leading-snug" style={{ fontFamily: "var(--font-playfair), serif" }}>{a.title}</h3>
                      <p className="text-[11px] text-[var(--muted)] leading-relaxed flex-1">{a.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center">
              <button onClick={() => setTab("breakdown")}
                className="inline-flex items-center gap-2 bg-[var(--accent)] text-white font-bold rounded-full px-6 py-3 text-sm hover:bg-[var(--accent-light)] transition-colors">
                See Full Budget Breakdown
                <span>→</span>
              </button>
            </div>
          </div>
        )}

        {/* ══ BREAKDOWN TAB ══════════════════════════════════════════════ */}
        {tab === "breakdown" && (
          <div>
            {/* Monarch stacked category bar */}
            <CategoryStackedBar byCategory={byCategory} total={TOTAL} />

            {/* Monarch department bars */}
            <div className="rounded-[1.75rem] bg-white/60 ring-1 ring-black/8 p-[6px]">
              <div className="rounded-[1.35rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] py-2">
                {sortedBudget.map((line) => (
                  <MonarchBudgetBar key={line.dept} line={line} max={maxAmt} />
                ))}
              </div>
            </div>
            <EvidencePanel className="mt-6" sources={[
              { label: "City of Houston FY2027 Proposed Budget", detail: "Official budget document. Department figures, General Fund", type: "government", url: "https://www.houstontx.gov/budget" },
              { label: "htxbudget.com / Local Insight", detail: "Three Moves analysis. OCSI civic finance reporting", type: "news", url: "https://htxbudget.com" },
              { label: "Houston Public Media", detail: "FY27 budget coverage. Chris Hollins Controller objections", type: "news" },
              { label: "City Controller Chris Hollins", detail: "Issued formal objection to one-time accounting moves", type: "government" },
            ]} />
          </div>
        )}

        {/* ══ COUNCIL TAB ════════════════════════════════════════════════ */}
        {tab === "council" && (
          <div>
            <p className="text-sm text-[var(--muted)] mb-6 max-w-2xl">
              Each Houston City Council member controls District Improvement Funds for capital projects, street repairs, and community investments. The FY27 budget passed 15–1 on June 10, 2026. Pollard voted no, Thomas was absent.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {COUNCIL.map((cm) => (
                <div key={cm.district} className="rounded-[1.75rem] bg-white/60 ring-1 ring-black/8 p-[5px] card-lift hover:ring-[var(--accent-light)] transition-all duration-500">
                  <div className="rounded-[1.35rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--muted)]">{cm.district}</p>
                        {cm.slug ? (
                          <Link href={`/politicians/${cm.slug}`}
                            className="font-bold text-[var(--accent)] text-base leading-tight mt-0.5 hover:text-[var(--accent-light)] hover:underline underline-offset-2 transition-colors block"
                            style={{ fontFamily: "var(--font-playfair), serif" }}>
                            {cm.name}
                          </Link>
                        ) : (
                          <h3 className="font-bold text-[var(--accent)] text-base leading-tight mt-0.5" style={{ fontFamily: "var(--font-playfair), serif" }}>
                            {cm.name}
                          </h3>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {cm.vote && (
                          <span className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                            cm.vote === "yes" ? "bg-emerald-100 text-emerald-700" :
                            cm.vote === "no" ? "bg-red-100 text-red-700" :
                            "bg-gray-100 text-gray-500"
                          }`}>
                            {cm.vote === "absent" ? "absent" : cm.vote}
                          </span>
                        )}
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${cm.party === "D" ? "bg-blue-700" : cm.party === "R" ? "bg-red-700" : "bg-gray-500"}`}>
                          {cm.party}
                        </span>
                      </div>
                    </div>
                    <div className="bg-[var(--accent)]/5 rounded-xl px-3 py-2 mb-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-0.5">Discretionary Funds</p>
                      <p className="text-lg font-bold text-[var(--accent)]" style={{ fontFamily: "var(--font-playfair), serif" }}>
                        ${cm.discretionaryM.toFixed(1)}M
                      </p>
                    </div>
                    <p className="text-[11px] text-[var(--muted)] leading-snug">
                      <span className="font-semibold text-[var(--foreground)]">Top project: </span>
                      {cm.topProject}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-[var(--muted)] mt-8 text-center">
              Council member data approximate. Discretionary fund amounts may vary.{" "}
              <a href="/contact" className="text-[var(--accent-light)] underline underline-offset-2">Submit corrections →</a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
