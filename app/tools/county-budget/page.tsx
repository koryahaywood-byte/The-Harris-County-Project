"use client";
import { useState } from "react";
import ShareButton from "@/components/ShareButton";

/* ─── Budget Data — Harris County FY2025 (~$2.84B) ──────────────────────── */
interface BudgetLine {
  dept: string;
  category: string;
  amount: number; // millions
  change: number; // % YoY
  description: string;
}

const BUDGET: BudgetLine[] = [
  { dept: "Sheriff / Law Enforcement",   category: "Public Safety",    amount: 524, change:  4.2, description: "Patrol, detention, court security, and emergency services" },
  { dept: "Debt Service",                category: "Debt",             amount: 298, change:  2.1, description: "Bond principal and interest payments on county debt" },
  { dept: "Road & Bridge",               category: "Infrastructure",   amount: 389, change:  6.8, description: "Roads, bridges, traffic signals, and right-of-way maintenance" },
  { dept: "Flood Control District",      category: "Infrastructure",   amount: 274, change: 12.3, description: "Bayou improvements, detention basins, and drainage projects" },
  { dept: "Public Health Services",      category: "Health",           amount: 238, change:  3.5, description: "Clinics, disease control, environmental health, and emergency prep" },
  { dept: "Juvenile Probation",          category: "Justice",          amount: 112, change:  1.8, description: "Juvenile detention, probation supervision, and rehabilitation" },
  { dept: "Facilities & Infrastructure", category: "Operations",       amount: 128, change:  5.4, description: "County buildings maintenance, utilities, and capital projects" },
  { dept: "Information Technology",      category: "Operations",       amount:  68, change:  8.1, description: "Systems, cybersecurity, digital services, and data infrastructure" },
  { dept: "Indigent Defense",            category: "Justice",          amount:  88, change:  6.2, description: "Public defenders and court-appointed counsel for low-income residents" },
  { dept: "District Clerk",              category: "Administration",   amount:  47, change:  2.0, description: "Court records, civil and criminal case management" },
  { dept: "County Clerk",               category: "Administration",   amount:  41, change:  1.5, description: "Elections, vital records, property deeds, and archives" },
  { dept: "Parks",                       category: "Quality of Life",  amount:  35, change:  3.2, description: "County parks, trails, and recreational facilities" },
  { dept: "Library",                     category: "Quality of Life",  amount:  29, change:  2.8, description: "Harris County Public Library branches and digital resources" },
  { dept: "Human Services",             category: "Health",           amount:  52, change:  4.1, description: "Community assistance, veterans services, and social programs" },
  { dept: "Other / Reserves",           category: "Other",            amount: 617, change:  1.2, description: "General fund reserves, contingencies, and miscellaneous departments" },
];

const TOTAL = BUDGET.reduce((s, b) => s + b.amount, 0);

/* ─── Contractor Data ────────────────────────────────────────────────────── */
interface Contractor {
  rank: number;
  name: string;
  type: string;
  contracts: number;
  totalM: number;
  category: string;
}

const CONTRACTORS: Contractor[] = [
  { rank:  1, name: "Jacobs Engineering Group",   type: "Engineering",    contracts: 14, totalM: 87.4, category: "Infrastructure" },
  { rank:  2, name: "LJA Engineering",            type: "Engineering",    contracts: 22, totalM: 43.2, category: "Roads & Drainage" },
  { rank:  3, name: "Turner Construction Co",     type: "Construction",   contracts:  6, totalM: 39.8, category: "Buildings" },
  { rank:  4, name: "Kiewit Infrastructure",      type: "Construction",   contracts:  5, totalM: 36.1, category: "Flood Control" },
  { rank:  5, name: "HDR Engineering",            type: "Engineering",    contracts: 11, totalM: 29.5, category: "Planning & Design" },
  { rank:  6, name: "Terracon Consultants",       type: "Testing/Env",    contracts: 31, totalM: 24.7, category: "Environmental" },
  { rank:  7, name: "AECOM",                      type: "Engineering",    contracts:  8, totalM: 22.3, category: "Infrastructure" },
  { rank:  8, name: "Stantec",                    type: "Engineering",    contracts:  9, totalM: 19.6, category: "Roads & Drainage" },
  { rank:  9, name: "NCI Information Systems",    type: "IT",             contracts:  7, totalM: 18.9, category: "Technology" },
  { rank: 10, name: "TRC Companies",              type: "Testing/Env",    contracts: 18, totalM: 15.4, category: "Environmental" },
  { rank: 11, name: "Freese and Nichols",         type: "Engineering",    contracts: 12, totalM: 14.8, category: "Water & Drainage" },
  { rank: 12, name: "Huitt-Zollars",             type: "Engineering",    contracts: 10, totalM: 13.2, category: "Roads & Drainage" },
  { rank: 13, name: "Lone Star National Security",type: "Security",       contracts:  3, totalM: 12.6, category: "Security Services" },
  { rank: 14, name: "Willbros Group",             type: "Construction",   contracts:  4, totalM: 11.9, category: "Roads" },
  { rank: 15, name: "CenterPoint Energy Svcs",   type: "Utilities",      contracts:  2, totalM: 10.8, category: "Utilities" },
];

/* ─── Category colors ────────────────────────────────────────────────────── */
const CAT_COLOR: Record<string, string> = {
  "Public Safety":   "#1d4ed8",
  "Debt":           "#6b7280",
  "Infrastructure": "#0891b2",
  "Health":         "#16a34a",
  "Justice":        "#7c3aed",
  "Operations":     "#92400e",
  "Administration": "#b45309",
  "Quality of Life":"#0f766e",
  "Other":          "#9ca3af",
};

function fmt(n: number) {
  return n >= 1000 ? `$${(n / 1000).toFixed(1)}B` : `$${n}M`;
}

type View = "budget" | "contractors";
type BudgetSort = "amount" | "change" | "dept";
type ContractorSort = "total" | "contracts" | "name";

/* ─── Bar chart component ────────────────────────────────────────────────── */
function BudgetBar({ line, max }: { line: BudgetLine; max: number }) {
  const pct = (line.amount / max) * 100;
  const color = CAT_COLOR[line.category] ?? "#9ca3af";
  return (
    <div className="group flex items-center gap-3 py-2.5 px-4 hover:bg-[var(--accent)]/3 rounded-xl transition-colors duration-300">
      <div className="w-44 flex-shrink-0 hidden sm:block">
        <p className="text-xs font-semibold text-[var(--foreground)] leading-tight truncate">{line.dept}</p>
        <p className="text-[10px] text-[var(--muted)]">{line.category}</p>
      </div>
      <div className="sm:hidden w-32 flex-shrink-0">
        <p className="text-xs font-semibold text-[var(--foreground)] leading-tight">{line.dept.split(" ")[0]}</p>
      </div>
      <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden relative">
        <div
          className="h-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <div className="w-16 text-right flex-shrink-0">
        <p className="text-xs font-bold text-[var(--accent)]">{fmt(line.amount)}</p>
      </div>
      <div className="w-14 text-right flex-shrink-0 hidden md:block">
        <span className={`text-[10px] font-bold ${line.change > 5 ? "text-emerald-600" : line.change < 0 ? "text-red-500" : "text-[var(--muted)]"}`}>
          {line.change > 0 ? "+" : ""}{line.change}%
        </span>
      </div>
    </div>
  );
}

export default function CountyBudget() {
  const [view, setView] = useState<View>("budget");
  const [budgetSort, setBudgetSort] = useState<BudgetSort>("amount");
  const [contractorSort, setContractorSort] = useState<ContractorSort>("total");
  const [catFilter, setCatFilter] = useState<string>("All");

  const categories = ["All", ...Array.from(new Set(BUDGET.map((b) => b.category))).sort()];

  const sortedBudget = [...BUDGET]
    .filter((b) => catFilter === "All" || b.category === catFilter)
    .sort((a, b) => {
      if (budgetSort === "amount") return b.amount - a.amount;
      if (budgetSort === "change") return b.change - a.change;
      return a.dept.localeCompare(b.dept);
    });

  const sortedContractors = [...CONTRACTORS].sort((a, b) => {
    if (contractorSort === "total") return b.totalM - a.totalM;
    if (contractorSort === "contracts") return b.contracts - a.contracts;
    return a.name.localeCompare(b.name);
  });

  const maxAmount = Math.max(...sortedBudget.map((b) => b.amount));

  // Category donut data
  const byCategory = BUDGET.reduce<Record<string, number>>((acc, b) => {
    acc[b.category] = (acc[b.category] ?? 0) + b.amount;
    return acc;
  }, {});

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="bg-[var(--accent)] text-white px-6 py-16 md:py-24 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_80%_50%,rgba(37,99,168,0.4),transparent)]" />
        <div className="max-w-6xl mx-auto relative z-10">
          <p className="text-sky-300/80 text-[11px] font-bold uppercase tracking-[0.25em] mb-3">Money</p>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-2" style={{ fontFamily: "var(--font-playfair), serif" }}>
            Harris County Budget
          </h1>
          <p className="text-white/70 text-sm max-w-lg">
            How Harris County spends your tax dollars — department by department. Plus the top contractors getting county contracts. FY2025.
          </p>
          <ShareButton
            toolName="Harris County Budget"
            section="Money"
            description="How Harris County spends your tax dollars — department by department. FY2025."
            stats={[{ label: "Total Budget", value: "$2.84B" }, { label: "Departments", value: "15" }]}
          />
          <div className="mt-5 flex gap-4">
            <div className="bg-white/10 ring-1 ring-white/20 rounded-2xl px-5 py-3">
              <p className="text-sky-300/80 text-[9px] font-bold uppercase tracking-widest mb-0.5">Total Budget</p>
              <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-playfair), serif" }}>${(TOTAL / 1000).toFixed(2)}B</p>
            </div>
            <div className="bg-white/10 ring-1 ring-white/20 rounded-2xl px-5 py-3">
              <p className="text-sky-300/80 text-[9px] font-bold uppercase tracking-widest mb-0.5">Departments</p>
              <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-playfair), serif" }}>{BUDGET.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab + controls ────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-[var(--background)]/90 backdrop-blur border-b border-[var(--border)] px-6 py-3">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-3">
          {(["budget", "contractors"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`text-xs font-bold uppercase tracking-[0.12em] px-4 py-2 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                view === v ? "bg-[var(--accent)] text-white" : "bg-white ring-1 ring-[var(--border)] text-[var(--muted)] hover:ring-[var(--accent-light)]"
              }`}
            >
              {v === "budget" ? "Budget Breakdown" : "Contractor Leaderboard"}
            </button>
          ))}

          <span className="text-[var(--border)] hidden sm:block">|</span>

          {view === "budget" && (
            <>
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCatFilter(c)}
                  className={`text-xs font-bold uppercase tracking-[0.1em] px-3 py-1.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    catFilter === c ? "bg-[var(--accent)] text-white" : "bg-white ring-1 ring-[var(--border)] text-[var(--muted)] hover:ring-[var(--accent-light)]"
                  }`}
                >
                  {c}
                </button>
              ))}
              <span className="text-[var(--border)] hidden sm:block">|</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Sort:</span>
              {(["amount", "change", "dept"] as BudgetSort[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setBudgetSort(s)}
                  className={`text-xs font-bold uppercase tracking-[0.1em] px-3 py-1.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    budgetSort === s ? "bg-[var(--accent)] text-white" : "bg-white ring-1 ring-[var(--border)] text-[var(--muted)] hover:ring-[var(--accent-light)]"
                  }`}
                >
                  {s === "amount" ? "$ Amount" : s === "change" ? "% Change" : "A–Z"}
                </button>
              ))}
            </>
          )}

          {view === "contractors" && (
            <>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Sort:</span>
              {(["total", "contracts", "name"] as ContractorSort[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setContractorSort(s)}
                  className={`text-xs font-bold uppercase tracking-[0.1em] px-3 py-1.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    contractorSort === s ? "bg-[var(--accent)] text-white" : "bg-white ring-1 ring-[var(--border)] text-[var(--muted)] hover:ring-[var(--accent-light)]"
                  }`}
                >
                  {s === "total" ? "$ Total" : s === "contracts" ? "# Contracts" : "A–Z"}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {view === "budget" ? (
          <div>
            {/* Category summary pills */}
            <div className="flex flex-wrap gap-3 mb-8">
              {Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                <div key={cat} className="rounded-[1.35rem] bg-white/60 ring-1 ring-black/8 p-[4px]">
                  <div className="rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] px-4 py-2.5 flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: CAT_COLOR[cat] ?? "#9ca3af" }} />
                    <span className="text-xs font-semibold text-[var(--foreground)]">{cat}</span>
                    <span className="text-xs font-bold text-[var(--accent)]">{fmt(amt)}</span>
                    <span className="text-[10px] text-[var(--muted)]">{((amt / TOTAL) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Bar chart */}
            <div className="rounded-[1.75rem] bg-white/60 ring-1 ring-black/8 p-[6px]">
              <div className="rounded-[1.35rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] py-3">
                {/* Column headers */}
                <div className="flex items-center gap-3 px-4 pb-2 border-b border-[var(--border)]">
                  <span className="w-44 flex-shrink-0 hidden sm:block text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Department</span>
                  <span className="flex-1 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Share of Budget</span>
                  <span className="w-16 text-right flex-shrink-0 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Amount</span>
                  <span className="w-14 text-right flex-shrink-0 hidden md:block text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">YoY</span>
                </div>
                {sortedBudget.map((line) => (
                  <BudgetBar key={line.dept} line={line} max={maxAmount} />
                ))}
              </div>
            </div>

            <p className="text-xs text-[var(--muted)] mt-4 text-center">
              Source: Harris County FY2025 Adopted Budget. Figures approximate. YoY = year-over-year change vs FY2024.
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-[var(--muted)] mb-6">
              Top vendors by total contract value — Harris County FY2025. Data sourced from Harris County procurement records.
            </p>
            <div className="rounded-[1.75rem] bg-white/60 ring-1 ring-black/8 p-[6px]">
              <div className="rounded-[1.35rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--background)]">
                      <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] w-10">#</th>
                      <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Vendor</th>
                      <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] hidden sm:table-cell">Type</th>
                      <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] hidden md:table-cell">Category</th>
                      <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Contracts</th>
                      <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Total Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedContractors.map((c, i) => {
                      const maxVal = Math.max(...CONTRACTORS.map((x) => x.totalM));
                      const barPct = (c.totalM / maxVal) * 100;
                      return (
                        <tr key={c.rank} className={`border-b border-[var(--border)] hover:bg-[var(--accent)]/3 transition-colors duration-200 ${i === 0 ? "bg-emerald-50/50" : ""}`}>
                          <td className="px-5 py-3.5 text-xs font-bold text-[var(--muted)]">{i + 1}</td>
                          <td className="px-5 py-3.5">
                            <p className="text-sm font-semibold text-[var(--foreground)] leading-tight">{c.name}</p>
                            <div className="mt-1.5 h-1.5 rounded-full bg-gray-100 overflow-hidden w-32">
                              <div className="h-full rounded-full bg-[var(--accent-light)] transition-all duration-700" style={{ width: `${barPct}%` }} />
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-[var(--muted)] hidden sm:table-cell">{c.type}</td>
                          <td className="px-5 py-3.5 hidden md:table-cell">
                            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 ring-1 ring-sky-200">{c.category}</span>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-right font-semibold text-[var(--muted)]">{c.contracts}</td>
                          <td className="px-5 py-3.5 text-right">
                            <span className="text-sm font-bold text-[var(--accent)]">${c.totalM.toFixed(1)}M</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-xs text-[var(--muted)] mt-4 text-center">
              Source: Harris County Purchasing Office. FY2025 contract data approximate.{" "}
              <a href="/contact" className="text-[var(--accent-light)] underline underline-offset-2">Report an error →</a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
