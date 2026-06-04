"use client";
import { useState } from "react";

/* ─── Houston City Budget FY2025 (~$6.48B) ──────────────────────────────── */
interface BudgetLine {
  dept: string;
  category: string;
  amount: number; // millions
  change: number; // % YoY
  employees?: number;
  description: string;
}

const BUDGET: BudgetLine[] = [
  { dept: "Houston Police Department",    category: "Public Safety",    amount: 1050, change:  3.8, employees: 5400, description: "Patrol, investigations, special operations, and crime prevention" },
  { dept: "Houston Fire Department",      category: "Public Safety",    amount:  870, change:  4.1, employees: 4100, description: "Fire suppression, emergency medical services, and rescue operations" },
  { dept: "Debt Service",                category: "Debt",             amount: 1120, change:  1.2,               description: "General obligation and revenue bond principal and interest" },
  { dept: "Public Works & Engineering",  category: "Infrastructure",   amount:  820, change:  7.4, employees: 1200, description: "Streets, drainage, traffic management, and capital improvements" },
  { dept: "Housing & Community Dev",     category: "Housing",          amount:  285, change: 11.2, employees:  180, description: "Affordable housing, community block grants, and anti-displacement programs" },
  { dept: "Solid Waste Management",      category: "Operations",       amount:  192, change:  2.9, employees: 1100, description: "Garbage collection, recycling, hazardous waste, and litter abatement" },
  { dept: "Parks & Recreation",          category: "Quality of Life",  amount:  168, change:  5.1, employees: 1800, description: "Parks, pools, recreation centers, trails, and youth programming" },
  { dept: "General Administration",      category: "Administration",   amount:  215, change:  2.0, employees: 1500, description: "Mayor's Office, City Council, legal, HR, and support services" },
  { dept: "Health & Human Services",     category: "Health",           amount:  148, change:  6.3, employees:  650, description: "Public health clinics, environmental health, and social services" },
  { dept: "Information Technology",      category: "Operations",       amount:   98, change:  9.5, employees:  420, description: "IT infrastructure, cybersecurity, 311, and digital government services" },
  { dept: "Houston Public Library",      category: "Quality of Life",  amount:   64, change:  3.4, employees:  850, description: "44 library branches, digital resources, and community programs" },
  { dept: "Planning & Development",      category: "Administration",   amount:   48, change:  4.2, employees:  340, description: "Zoning, permitting, historic preservation, and urban planning" },
  { dept: "Aviation / Airport System",  category: "Enterprise",       amount:  580, change:  6.8, employees: 1600, description: "IAH and Hobby airports — largely self-funded from revenues" },
  { dept: "Other Departments & Reserves",category: "Other",            amount:  820, change:  1.5,               description: "Controller, municipal courts, fleet, and contingency reserves" },
];

const TOTAL = BUDGET.reduce((s, b) => s + b.amount, 0);

/* ─── Council Member District Profiles ─────────────────────────────────── */
interface CouncilMember {
  district: string;
  name: string;
  party: "D" | "R" | "NP";
  discretionaryM: number;
  topProject: string;
}

const COUNCIL: CouncilMember[] = [
  { district: "District A", name: "Amy Peck",          party: "R",  discretionaryM: 1.2, topProject: "Addicks Reservoir area road repairs" },
  { district: "District B", name: "Tarsha Jackson",    party: "D",  discretionaryM: 1.2, topProject: "Kashmere Gardens drainage improvements" },
  { district: "District C", name: "Abbie Kamin",       party: "D",  discretionaryM: 1.2, topProject: "Washington Ave corridor streetscaping" },
  { district: "District D", name: "Carolyn Evans-Shabazz", party: "D", discretionaryM: 1.2, topProject: "Third Ward sidewalk and crosswalk program" },
  { district: "District E", name: "Fred Flickinger",   party: "R",  discretionaryM: 1.2, topProject: "Clear Lake area parks improvements" },
  { district: "District F", name: "Tiffany Thomas",    party: "D",  discretionaryM: 1.2, topProject: "Westheimer corridor mobility upgrades" },
  { district: "District G", name: "Mary Nan Huffman",  party: "R",  discretionaryM: 1.2, topProject: "Meyerland drainage and trail work" },
  { district: "District H", name: "Joaquin Martinez",  party: "D",  discretionaryM: 1.2, topProject: "Near Northside pedestrian safety" },
  { district: "District I", name: "Mario Castillo",    party: "D",  discretionaryM: 1.2, topProject: "East End connectivity and bike lanes" },
  { district: "District J", name: "Edward Pollard",    party: "D",  discretionaryM: 1.2, topProject: "Sharpstown park and rec upgrades" },
  { district: "District K", name: "Martha Castex-Tatum", party: "D", discretionaryM: 1.2, topProject: "Alief drainage and park improvements" },
  { district: "At-Large 1", name: "Mike Knox",         party: "R",  discretionaryM: 0.8, topProject: "Citywide public safety infrastructure" },
  { district: "At-Large 2", name: "Willie Davis",      party: "D",  discretionaryM: 0.8, topProject: "Minority business development initiatives" },
  { district: "At-Large 3", name: "Twila Carter",      party: "D",  discretionaryM: 0.8, topProject: "Senior services and transit connections" },
  { district: "At-Large 4", name: "Letitia Plummer",   party: "D",  discretionaryM: 0.8, topProject: "Youth workforce and community centers" },
  { district: "At-Large 5", name: "Sallie Alcorn",     party: "D",  discretionaryM: 0.8, topProject: "Resilience and climate infrastructure" },
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

type View = "breakdown" | "council";

export default function CityBudget() {
  const [view, setView] = useState<View>("breakdown");
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
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="bg-[var(--accent)] text-white px-6 py-12 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_80%_50%,rgba(37,99,168,0.4),transparent)]" />
        <div className="max-w-6xl mx-auto relative z-10">
          <p className="text-sky-300/80 text-[11px] font-bold uppercase tracking-[0.25em] mb-3">Money</p>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-2" style={{ fontFamily: "var(--font-playfair), serif" }}>
            Houston City Budget
          </h1>
          <p className="text-white/70 text-sm max-w-lg">
            Where does Houston spend its $6.5 billion? Department-by-department breakdown plus each council member&apos;s district discretionary spending. FY2025.
          </p>
          <div className="mt-5 flex gap-4 flex-wrap">
            <div className="bg-white/10 ring-1 ring-white/20 rounded-2xl px-5 py-3">
              <p className="text-sky-300/80 text-[9px] font-bold uppercase tracking-widest mb-0.5">Total Budget</p>
              <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-playfair), serif" }}>{fmt(TOTAL)}</p>
            </div>
            <div className="bg-white/10 ring-1 ring-white/20 rounded-2xl px-5 py-3">
              <p className="text-sky-300/80 text-[9px] font-bold uppercase tracking-widest mb-0.5">City Employees</p>
              <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-playfair), serif" }}>22,000+</p>
            </div>
            <div className="bg-white/10 ring-1 ring-white/20 rounded-2xl px-5 py-3">
              <p className="text-sky-300/80 text-[9px] font-bold uppercase tracking-widest mb-0.5">Fiscal Year</p>
              <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-playfair), serif" }}>FY2025</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Controls ──────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-[var(--background)]/90 backdrop-blur border-b border-[var(--border)] px-6 py-3">
        <div className="max-w-6xl mx-auto flex flex-wrap gap-2 items-center">
          {(["breakdown", "council"] as View[]).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`text-xs font-bold uppercase tracking-[0.12em] px-4 py-2 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${view === v ? "bg-[var(--accent)] text-white" : "bg-white ring-1 ring-[var(--border)] text-[var(--muted)] hover:ring-[var(--accent-light)]"}`}>
              {v === "breakdown" ? "Budget Breakdown" : "Council Members"}
            </button>
          ))}
          {view === "breakdown" && (
            <>
              <span className="text-[var(--border)] hidden sm:block">|</span>
              {categories.map((c) => (
                <button key={c} onClick={() => setCatFilter(c)}
                  className={`text-xs font-bold uppercase tracking-[0.1em] px-3 py-1.5 rounded-full transition-all duration-500 ${catFilter === c ? "bg-[var(--accent)] text-white" : "bg-white ring-1 ring-[var(--border)] text-[var(--muted)] hover:ring-[var(--accent-light)]"}`}>
                  {c}
                </button>
              ))}
              <span className="text-[var(--border)] hidden sm:block">|</span>
              {(["amount", "change", "dept"] as const).map((s) => (
                <button key={s} onClick={() => setSort(s)}
                  className={`text-xs font-bold uppercase tracking-[0.1em] px-3 py-1.5 rounded-full transition-all duration-500 ${sort === s ? "bg-[var(--accent)] text-white" : "bg-white ring-1 ring-[var(--border)] text-[var(--muted)] hover:ring-[var(--accent-light)]"}`}>
                  {s === "amount" ? "$ Amount" : s === "change" ? "% Change" : "A–Z"}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {view === "breakdown" ? (
          <div>
            {/* Category summary */}
            <div className="flex flex-wrap gap-3 mb-8">
              {Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                <div key={cat} className="rounded-[1.35rem] bg-white/60 ring-1 ring-black/8 p-[4px]">
                  <div className="rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] px-4 py-2.5 flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: CAT_COLOR[cat] ?? "#9ca3af" }} />
                    <span className="text-xs font-semibold">{cat}</span>
                    <span className="text-xs font-bold text-[var(--accent)]">{fmt(amt)}</span>
                    <span className="text-[10px] text-[var(--muted)]">{((amt / TOTAL) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Bars */}
            <div className="rounded-[1.75rem] bg-white/60 ring-1 ring-black/8 p-[6px]">
              <div className="rounded-[1.35rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] py-3">
                <div className="flex items-center gap-3 px-4 pb-2 border-b border-[var(--border)]">
                  <span className="w-48 flex-shrink-0 hidden sm:block text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Department</span>
                  <span className="flex-1 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Share</span>
                  <span className="w-20 text-right flex-shrink-0 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Amount</span>
                  <span className="w-14 text-right hidden md:block flex-shrink-0 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">YoY</span>
                </div>
                {sortedBudget.map((line) => (
                  <div key={line.dept} className="group flex items-center gap-3 py-2.5 px-4 hover:bg-[var(--accent)]/3 rounded-xl transition-colors duration-300">
                    <div className="w-48 flex-shrink-0 hidden sm:block">
                      <p className="text-xs font-semibold leading-tight truncate">{line.dept}</p>
                      <p className="text-[10px] text-[var(--muted)] flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CAT_COLOR[line.category] ?? "#9ca3af" }} />
                        {line.category}
                        {line.employees && <span className="ml-1">{line.employees.toLocaleString()} staff</span>}
                      </p>
                    </div>
                    <div className="sm:hidden w-32 flex-shrink-0">
                      <p className="text-xs font-semibold leading-tight">{line.dept.split(" ")[0]}</p>
                    </div>
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                        style={{ width: `${(line.amount / maxAmt) * 100}%`, background: CAT_COLOR[line.category] ?? "#9ca3af" }} />
                    </div>
                    <div className="w-20 text-right flex-shrink-0">
                      <p className="text-xs font-bold text-[var(--accent)]">{fmt(line.amount)}</p>
                    </div>
                    <div className="w-14 text-right flex-shrink-0 hidden md:block">
                      <span className={`text-[10px] font-bold ${line.change > 5 ? "text-emerald-600" : line.change < 0 ? "text-red-500" : "text-[var(--muted)]"}`}>
                        {line.change > 0 ? "+" : ""}{line.change}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-[var(--muted)] mt-4 text-center">Source: City of Houston FY2025 Adopted Budget. Enterprise funds (airports, water, wastewater) shown for context. Figures approximate.</p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-[var(--muted)] mb-6">
              Each Houston City Council member controls discretionary District Improvement Funds for capital projects, street repairs, and community investments in their district.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {COUNCIL.map((cm) => (
                <div key={cm.district} className="rounded-[1.75rem] bg-white/60 ring-1 ring-black/8 p-[5px] hover:ring-[var(--accent-light)] hover:shadow-md transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                  <div className="rounded-[1.35rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--muted)]">{cm.district}</p>
                        <h3 className="font-bold text-[var(--accent)] text-base leading-tight mt-0.5" style={{ fontFamily: "var(--font-playfair), serif" }}>
                          {cm.name}
                        </h3>
                      </div>
                      <div className="flex flex-col items-end gap-1">
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
              District Improvement Fund amounts are approximate. Top project examples drawn from public meeting agendas.{" "}
              <a href="/contact" className="text-[var(--accent-light)] underline underline-offset-2">Submit corrections →</a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
