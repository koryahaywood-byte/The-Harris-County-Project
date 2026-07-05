"use client";
import { useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { COUNTY_BUDGET, CITY_BUDGET, CAT_COLOR, TIRZ_DATA, type BudgetLine, type TIRZ } from "@/lib/budget-data";

/* ─── Shared helpers ─────────────────────────────────────────────────────── */
function fmtM(n: number) { return n >= 1000 ? `$${(n / 1000).toFixed(1)}B` : `$${n}M`; }


/* ─── Sub-components ──────────────────────────────────────────────────────── */
function StackedBar({ lines }: { lines: BudgetLine[] }) {
  const total = lines.reduce((s, b) => s + b.amount, 0);
  const byCategory = lines.reduce<Record<string, number>>((acc, b) => {
    acc[b.category] = (acc[b.category] ?? 0) + b.amount;
    return acc;
  }, {});
  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  return (
    <div className="rounded-2xl bg-white ring-1 ring-black/7 p-5 mb-6">
      <p className="text-[9px] font-bold uppercase tracking-[0.22em] mb-3" style={{ color: "#9ca3af" }}>Spending by Category</p>
      <div className="h-4 rounded-full flex overflow-hidden mb-4 gap-[2px]">
        {sorted.map(([cat, amt]) => (
          <div key={cat} className="h-full transition-all duration-700"
            style={{ width: `${(amt / total) * 100}%`, background: CAT_COLOR[cat] ?? "#9ca3af", minWidth: amt / total > 0.01 ? 3 : 0 }}
            title={`${cat}: ${fmtM(amt)}`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {sorted.map(([cat, amt]) => (
          <div key={cat} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: CAT_COLOR[cat] ?? "#9ca3af" }} />
            <span className="text-[10px]" style={{ color: "#6b7280" }}>{cat}</span>
            <span className="text-[10px] font-bold" style={{ color: "#1a3a5c" }}>{fmtM(amt)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BudgetBar({ line, max }: { line: BudgetLine; max: number }) {
  const pct = (line.amount / max) * 100;
  const color = CAT_COLOR[line.category] ?? "#9ca3af";
  const up = line.change > 0;
  return (
    <div className="group px-5 py-3.5 hover:bg-black/[0.02] rounded-2xl transition-all cursor-default">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-[3px]" style={{ background: color }} />
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight" style={{ color: "#1a3a5c" }}>{line.dept}</p>
            <p className="text-[10px]" style={{ color: "#9ca3af" }}>
              {line.category}{line.employees ? ` · ${line.employees.toLocaleString()} staff` : ""}
              {line.note ? <span className="text-amber-600 font-semibold ml-1">· {line.note}</span> : null}
            </p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-base font-bold" style={{ fontFamily: "var(--font-playfair), serif", color: "#1a3a5c" }}>{fmtM(line.amount)}</p>
          <span className={`text-[10px] font-bold ${up ? "text-emerald-600" : line.change < 0 ? "text-red-500" : "text-[#9ca3af]"}`}>
            {up ? "▲" : line.change < 0 ? "▼" : "–"} {Math.abs(line.change).toFixed(1)}%
          </span>
        </div>
      </div>
      <div className="h-2 bg-black/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: `linear-gradient(90deg,${color}cc,${color})`, transition: "width 0.9s cubic-bezier(0.22,1,0.36,1)" }} />
      </div>
      <div className="overflow-hidden max-h-0 group-hover:max-h-10 transition-all duration-300">
        <p className="text-[10px] mt-1.5 leading-relaxed" style={{ color: "#9ca3af" }}>{line.description}</p>
      </div>
    </div>
  );
}

/* ─── Tab types ──────────────────────────────────────────────────────────── */
type MainTab = "county" | "city" | "infrastructure" | "discretionary" | "tirz";

const TAB_META: Record<MainTab, { label: string; subtitle: string; gradient: string; chips: { label: string; value: string }[] }> = {
  county:         { label: "Harris County", subtitle: "FY2027 Proposed Budget — $3B+, 5th consecutive deficit",  gradient: "linear-gradient(135deg,#0f2540 0%,#1a3a5c 100%)", chips: [{ label: "Total Budget", value: "$3B+" }, { label: "Deficit", value: "$129M–$287M" }, { label: "Deficit Year", value: "5th in a row" }] },
  city:           { label: "City of Houston", subtitle: "FY2027 Budget — $7.5B total, $3.1B General Fund, passed 15–1", gradient: "linear-gradient(135deg,#0c4a6e 0%,#0891b2 100%)", chips: [{ label: "Total", value: "$7.5B" }, { label: "General Fund", value: "$3.1B" }, { label: "Gap closed", value: "$180M" }] },
  infrastructure: { label: "Infrastructure", subtitle: "Federal & state infrastructure funding flowing to Harris County", gradient: "linear-gradient(135deg,#064e3b 0%,#059669 100%)", chips: [] },
  discretionary:  { label: "Discretionary",  subtitle: "City Council member discretionary funds by district",          gradient: "linear-gradient(135deg,#431407 0%,#b45309 100%)", chips: [] },
  tirz:           { label: "TIRZ",           subtitle: `${TIRZ_DATA.length} Tax Increment Reinvestment Zones — $${TIRZ_DATA.reduce((s,t)=>s+t.totalRevenueM,0).toLocaleString()}M total`, gradient: "linear-gradient(135deg,#4c1d95 0%,#7c3aed 100%)", chips: [{ label: "Active Zones", value: `${TIRZ_DATA.length}` }, { label: "Total Revenue", value: `$${(TIRZ_DATA.reduce((s,t)=>s+t.totalRevenueM,0)/1000).toFixed(1)}B` }] },
};

/* ─── Inner page ─────────────────────────────────────────────────────────── */
function PublicMoneyInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initTab = (searchParams.get("tab") as MainTab) ?? "county";
  const [tab, setTab] = useState<MainTab>(initTab);
  const [budgetSort, setBudgetSort] = useState<"amount" | "change">("amount");
  const [selectedTirz, setSelectedTirz] = useState<number | null>(null);

  function switchTab(t: MainTab) {
    setTab(t);
    router.replace(`/tools/public-money?tab=${t}`, { scroll: false });
  }

  const meta = TAB_META[tab];

  const countyTotal = COUNTY_BUDGET.reduce((s, b) => s + b.amount, 0);
  const cityTotal   = CITY_BUDGET.reduce((s, b) => s + b.amount, 0);

  const sortedCounty = useMemo(() =>
    [...COUNTY_BUDGET].sort((a, b) => budgetSort === "amount" ? b.amount - a.amount : b.change - a.change),
  [budgetSort]);
  const sortedCity = useMemo(() =>
    [...CITY_BUDGET].sort((a, b) => budgetSort === "amount" ? b.amount - a.amount : b.change - a.change),
  [budgetSort]);

  const TABS: MainTab[] = ["county", "city", "infrastructure", "discretionary", "tirz"];

  return (
    <div style={{ background: "var(--background)", minHeight: "100vh" }}>

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ minHeight: 220 }}>
        <div className="absolute inset-0" style={{ background: meta.gradient, opacity: 0.92 }} />
        <div className="relative max-w-5xl mx-auto px-5 pt-10 pb-0">
          <Link href="/" className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3 block" style={{ color: "rgba(255,255,255,0.45)" }}>← Harris County Project</Link>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-1" style={{ fontFamily: "var(--font-playfair), serif" }}>Public Money</h1>
          <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.55)" }}>{meta.subtitle}</p>

          {/* Tab switcher */}
          <div className="flex flex-wrap gap-1 mb-4">
            {TABS.map(t => (
              <button key={t} onClick={() => switchTab(t)}
                className="px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] rounded-full transition-all cursor-pointer"
                style={tab === t
                  ? { background: "rgba(255,255,255,0.2)", color: "#fff", backdropFilter: "blur(8px)" }
                  : { color: "rgba(255,255,255,0.5)" }}>
                {TAB_META[t].label}
              </button>
            ))}
          </div>

          {/* Chips */}
          {meta.chips.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-4">
              {meta.chips.map(c => (
                <div key={c.label} className="rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em] mb-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{c.label}</p>
                  <p className="text-xs font-bold text-white">{c.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Sort bar for budget tabs */}
          {(tab === "county" || tab === "city") && (
            <div className="flex gap-1 mt-2">
              {(["amount", "change"] as const).map(s => (
                <button key={s} onClick={() => setBudgetSort(s)}
                  className="px-4 py-2.5 text-xs font-bold uppercase tracking-[0.15em] rounded-t-lg transition-all cursor-pointer"
                  style={budgetSort === s ? { background: "rgba(245,243,239,1)", color: "var(--accent)" } : { color: "rgba(255,255,255,0.5)" }}>
                  {s === "amount" ? "$ Amount" : "% Change"}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-5 py-8">

        {/* ── Harris County Budget ── */}
        {tab === "county" && (
          <div>
            <div className="rounded-2xl mb-6 p-4 flex gap-3" style={{ background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.15)" }}>
              <div className="w-1 rounded-full flex-shrink-0" style={{ background: "#dc2626" }} />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1" style={{ color: "#dc2626" }}>FY2027 Gap</p>
                <p className="text-sm font-semibold" style={{ color: "#1a3a5c" }}>
                  $129M–$287M shortfall to close before Oct. 1. Fifth consecutive deficit. Law enforcement raises are the single biggest driver (+$73M).
                  State cap prevents revenue growth. Commissioner Tom Ramsey: <em>"Thank God for Harris County. Otherwise we'd have a problem in the state of Texas."</em>
                </p>
              </div>
            </div>
            <StackedBar lines={COUNTY_BUDGET} />
            <div className="rounded-2xl bg-white ring-1 ring-black/7 py-2">
              {sortedCounty.map(line => <BudgetBar key={line.dept} line={line} max={sortedCounty[0].amount} />)}
            </div>
            <p className="text-[11px] mt-4 text-center" style={{ color: "#9ca3af" }}>
              Source: Harris County FY2027 Proposed Budget. Total: {fmtM(countyTotal)}. Figures approximate. YoY vs FY2026.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {[
                { label: "Top Contractor: Jacobs Engineering", href: "/tools/the-network?tab=donors", note: "$87.4M across 14 contracts" },
                { label: "Commissioners Court", href: "/tools/the-brief?level=county", note: "Who controls this budget" },
              ].map(l => (
                <Link key={l.href} href={l.href} className="rounded-xl bg-white ring-1 ring-black/7 px-4 py-3 hover:shadow-md transition-all group block">
                  <p className="text-xs font-bold text-[var(--accent)] group-hover:text-[var(--accent-light)]">{l.label}</p>
                  <p className="text-[10px]" style={{ color: "#6b7280" }}>{l.note}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── City of Houston Budget ── */}
        {tab === "city" && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {[
                { stat: "$5/mo", label: "New trash fee", detail: "First-ever — starts FY27", color: "#0891b2" },
                { stat: "$104M", label: "Utility → General Fund", detail: "Right-of-way fee paid annually by water system", color: "#7c3aed" },
                { stat: "39%", label: "HPD share of GF", detail: "$1.25B police budget dominates", color: "#1d4ed8" },
              ].map(s => (
                <div key={s.label} className="rounded-2xl bg-white ring-1 ring-black/7 p-4 text-center">
                  <p className="text-3xl font-black mb-1" style={{ color: s.color, fontFamily: "var(--font-playfair), serif" }}>{s.stat}</p>
                  <p className="text-xs font-bold mb-0.5" style={{ color: "#1a3a5c" }}>{s.label}</p>
                  <p className="text-[10px]" style={{ color: "#9ca3af" }}>{s.detail}</p>
                </div>
              ))}
            </div>
            <StackedBar lines={CITY_BUDGET} />
            <div className="rounded-2xl bg-white ring-1 ring-black/7 py-2">
              {sortedCity.map(line => <BudgetBar key={line.dept} line={line} max={sortedCity[0].amount} />)}
            </div>
            <p className="text-[11px] mt-4 text-center" style={{ color: "#9ca3af" }}>
              Source: City of Houston FY2027 Budget. Passed 15–1, June 10 2026. Total all funds: {fmtM(cityTotal)}. Figures approximate.
            </p>
            <div className="mt-6">
              <Link href="/tools/public-money?tab=tirz" className="inline-block rounded-xl bg-white ring-1 ring-black/7 px-4 py-3 hover:shadow-md transition-all group">
                <p className="text-xs font-bold text-[var(--accent)] group-hover:text-[var(--accent-light)]">See the TIRZ zones →</p>
                <p className="text-[10px]" style={{ color: "#6b7280" }}>$1B+ in tax increment financing off the city books</p>
              </Link>
            </div>
          </div>
        )}

        {/* ── Infrastructure Map ── */}
        {tab === "infrastructure" && (
          <div className="-mx-5 -mb-8">
            <iframe
              src="/infrastructure-funding.html"
              className="w-full border-0"
              style={{ height: "calc(100vh - 260px)", minHeight: "520px" }}
              title="Infrastructure Funding Map: Harris County"
              allowFullScreen
            />
          </div>
        )}

        {/* ── Discretionary Funds ── */}
        {tab === "discretionary" && (
          <div className="-mx-5 -mb-8">
            <iframe
              src="/discretionary-funds.html"
              className="w-full border-0"
              style={{ height: "calc(100vh - 260px)", minHeight: "520px" }}
              title="Discretionary Funds: Houston City Council"
              allowFullScreen
            />
          </div>
        )}

        {/* ── TIRZ ── */}
        {tab === "tirz" && (
          <div>
            <p className="text-sm mb-6 leading-relaxed" style={{ color: "#6b7280" }}>
              Tax Increment Reinvestment Zones capture property tax growth above a base year and reinvest it in the zone. Board members are appointed by the Mayor and City Council members — meaning who sits on council determines who controls hundreds of millions in economic development spending.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {TIRZ_DATA.sort((a, b) => b.totalRevenueM - a.totalRevenueM).map(tirz => (
                <button key={tirz.id} onClick={() => setSelectedTirz(selectedTirz === tirz.id ? null : tirz.id)}
                  className="text-left rounded-2xl bg-white ring-1 ring-black/7 p-4 hover:shadow-md transition-all cursor-pointer"
                  style={selectedTirz === tirz.id ? { boxShadow: "0 0 0 2px #7c3aed" } : {}}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "#9ca3af" }}>TIRZ {tirz.id} · {tirz.neighborhood}</p>
                      <p className="font-bold text-sm leading-tight" style={{ fontFamily: "var(--font-playfair), serif", color: "#1a3a5c" }}>{tirz.name}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-black" style={{ color: "#7c3aed", fontFamily: "var(--font-playfair), serif" }}>${tirz.totalRevenueM}M</p>
                      <p className="text-[9px]" style={{ color: "#9ca3af" }}>tax increment</p>
                    </div>
                  </div>
                  <div className="h-1 rounded-full mb-2" style={{ background: `linear-gradient(90deg, #7c3aed ${Math.min(100, (tirz.totalRevenueM / 198) * 100).toFixed(0)}%, #e5e7eb 0%)` }} />
                  {selectedTirz === tirz.id && (
                    <div className="mt-3 pt-3 border-t border-black/6 space-y-2">
                      <div className="flex gap-4 text-[10px]">
                        <span><span className="font-bold" style={{ color: "#9ca3af" }}>Created</span> {tirz.created}</span>
                        <span><span className="font-bold" style={{ color: "#9ca3af" }}>Expires</span> {tirz.expires}</span>
                      </div>
                      <p className="text-[11px]"><span className="font-bold" style={{ color: "#1a3a5c" }}>Key project: </span><span style={{ color: "#6b7280" }}>{tirz.keyProject}</span></p>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-1" style={{ color: "#9ca3af" }}>Board appointers</p>
                        <div className="flex flex-wrap gap-1">
                          {tirz.boardAppointers.map(a => (
                            <span key={a} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "#ede9fe", color: "#6d28d9" }}>{a}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {selectedTirz !== tirz.id && (
                    <p className="text-[10px]" style={{ color: "#9ca3af" }}>{tirz.keyProject}</p>
                  )}
                </button>
              ))}
            </div>
            <p className="text-[11px] mt-6 text-center" style={{ color: "#9ca3af" }}>
              TIRZ zones are governed by City of Houston Code Ch. 311. Board appointees serve without pay.
              Revenue captures incremental property tax growth above the base year — not city General Fund money.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PublicMoneyPage() {
  return (
    <Suspense>
      <PublicMoneyInner />
    </Suspense>
  );
}
