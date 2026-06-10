"use client";
import { useState, useEffect } from "react";
import { FINANCE_DATA, fmt, type CandidateFinance } from "@/lib/campaign-finance";
import type { FECCandidate } from "@/app/api/finance/fec/route";
import type { TECCandidate } from "@/app/api/finance/tec/route";
import type { HCCandidate } from "@/app/api/finance/harris-county/route";
import type { COHCandidate } from "@/app/api/finance/houston/route";

type Candidate = CandidateFinance;

type Tab   = "story" | "leaderboard";
type Level = "all" | "federal" | "state" | "houston" | "county";

const LEVEL_LABELS: Record<Level, string> = {
  all: "All", federal: "Federal", state: "State", houston: "City of Houston", county: "County",
};

export default function WhereIsTheDough() {
  const [tab, setTab]     = useState<Tab>("story");
  const [level, setLevel] = useState<Level>("all");
  const [party, setParty] = useState<"all" | "D" | "R">("all");
  const [search, setSearch] = useState("");
  const [fecData, setFecData]   = useState<FECCandidate[]>([]);
  const [tecData, setTecData]   = useState<TECCandidate[]>([]);
  const [hcData,  setHcData]    = useState<HCCandidate[]>([]);
  const [cohData, setCohData]   = useState<COHCandidate[]>([]);
  const [fecFetchedAt, setFecFetchedAt] = useState<string>("");
  const [tecFetchedAt, setTecFetchedAt] = useState<string>("");

  useEffect(() => {
    fetch("/api/finance/fec")
      .then(r => r.json())
      .then(({ results, fetchedAt }: { results: FECCandidate[]; fetchedAt: string }) => {
        setFecData(results.filter(r => r.dataSource === "live"));
        setFecFetchedAt(fetchedAt);
      })
      .catch(() => {});

    fetch("/api/finance/tec")
      .then(r => r.json())
      .then(({ results, fetchedAt }: { results: TECCandidate[]; fetchedAt: string }) => {
        setTecData(results.filter(r => r.dataSource === "live"));
        setTecFetchedAt(fetchedAt);
      })
      .catch(() => {});

    fetch("/api/finance/harris-county")
      .then(r => r.json())
      .then(({ results }: { results: HCCandidate[] }) => {
        setHcData(results.filter(r => r.dataSource === "live"));
      })
      .catch(() => {});

    fetch("/api/finance/houston")
      .then(r => r.json())
      .then(({ results }: { results: COHCandidate[] }) => {
        setCohData(results.filter(r => r.dataSource === "live"));
      })
      .catch(() => {});
  }, []);

  // Merge live API data over static hardcoded data
  const BASE = FINANCE_DATA.filter((d) => d.name !== "Edward Pollard");
  const DATA: Candidate[] = BASE.map(d => {
    if (d.level === "federal") {
      const live = fecData.find(l => l.name === d.name);
      if (!live) return d;
      return { ...d, cash: live.cash, raised: live.raised, spent: live.spent, asOf: live.asOf };
    }
    if (d.level === "state") {
      const live = tecData.find(l => l.name === d.name);
      if (!live) return d;
      return { ...d, cash: live.cash, asOf: live.asOf };
    }
    if (d.level === "county") {
      const live = hcData.find(l => l.name === d.name);
      if (!live) return d;
      return { ...d, cash: live.cash, raised: live.raised, spent: live.spent, investments: live.investments, loans: live.loans, asOf: live.asOf };
    }
    if (d.level === "houston") {
      const live = cohData.find(l => l.name === d.name);
      if (!live) return d;
      return { ...d, cash: live.cash, raised: live.raised, spent: live.spent, loans: live.loans, asOf: live.asOf };
    }
    return d;
  });

  const withCash  = DATA.filter(d => d.cash > 0);
  const demTotal  = withCash.filter(d => d.party === "D").reduce((s, d) => s + d.cash, 0);
  const repTotal  = withCash.filter(d => d.party === "R").reduce((s, d) => s + d.cash, 0);
  const totalPool = demTotal + repTotal;

  const filtered = DATA
    .filter(d => level === "all" || d.level === level)
    .filter(d => party === "all" || d.party === party)
    .filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.office.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      // Officials with no data sort to the bottom
      if ((a.cash > 0) !== (b.cash > 0)) return a.cash > 0 ? -1 : 1;
      return b.cash - a.cash;
    });

  const maxCash = filtered[0]?.cash ?? 1;

  const ellis    = DATA.find(d => d.name === "Rodney Ellis");
  const briones  = DATA.find(d => d.name === "Lesley Briones");
  const garcia   = DATA.find(d => d.name === "Adrian Garcia");
  const ramsey   = DATA.find(d => d.name === "Tom Ramsey");
  const talarico = DATA.find(d => d.name === "James Talarico");
  const cornyn   = DATA.find(d => d.name === "John Cornyn");
  const whitmire = DATA.find(d => d.name === "John Whitmire");
  const hollins  = DATA.find(d => d.name === "Chris Hollins");
  const pollard  = DATA.find(d => d.name === "Ed Pollard");

  return (
    <div className="bg-[var(--background)] min-h-screen">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="bg-[var(--accent)] text-white px-6 py-16 md:py-24 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_80%_50%,rgba(37,99,168,0.4),transparent)]"/>
        <div className="max-w-6xl mx-auto relative z-10">
          <p className="text-sky-300/80 text-[11px] font-bold uppercase tracking-[0.25em] mb-3">Money</p>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-2" style={{ fontFamily: "var(--font-playfair), serif" }}>
            Where the Money Resides
          </h1>
          <p className="text-white/70 text-sm max-w-lg">
            Cash-on-hand for every Harris County official, candidate, and challenger. TEC &amp; FEC filings.
          </p>
          {(fecData.length > 0 || tecData.length > 0 || hcData.length > 0) && (
            <p className="mt-2 text-[11px] text-sky-300/80 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-400 alive-pulse" />
              {[
                fecData.length > 0 ? "Federal: FEC" : null,
                tecData.length > 0 ? "State: TEC" : null,
                hcData.length  > 0 ? "County: Harris Clerk" : null,
                cohData.length > 0 ? "City: Houston COH" : null,
              ].filter(Boolean).join(" · ")} &mdash; live data
              {fecFetchedAt && <span className="text-sky-300/50 ml-1">as of {new Date(fecFetchedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-3">
            {[
              { label: "Democrat Total",    val: fmt(demTotal),         color: "#93c5fd" },
              { label: "Republican Total",  val: fmt(repTotal),         color: "#fca5a5" },
              { label: "Biggest War Chest", val: ellis ? fmt(ellis.cash) : "—", color: "#fde68a" },
            ].map(({ label, val, color }) => (
              <div key={label} className="bg-white/10 ring-1 ring-white/20 rounded-2xl px-5 py-3">
                <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5 text-white/50">{label}</p>
                <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-playfair), serif", color }}>{val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab bar ───────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-[var(--background)]/90 backdrop-blur border-b border-[var(--border)] px-6 py-3">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-3">
          {(["story","leaderboard"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`text-xs font-bold uppercase tracking-[0.12em] px-4 py-2 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                tab === t ? "bg-[var(--accent)] text-white" : "bg-white ring-1 ring-[var(--border)] text-[var(--muted)] hover:ring-[var(--accent-light)]"
              }`}>
              {t === "story" ? "The Story" : "Leaderboard"}
            </button>
          ))}

          {tab === "leaderboard" && (
            <>
              <span className="text-[var(--border)] hidden sm:block">|</span>
              {(Object.entries(LEVEL_LABELS) as [Level, string][]).map(([l, label]) => (
                <button key={l} onClick={() => setLevel(l)}
                  className={`text-xs font-bold uppercase tracking-[0.1em] px-3 py-1.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    level === l ? "bg-[var(--accent)] text-white" : "bg-white ring-1 ring-[var(--border)] text-[var(--muted)] hover:ring-[var(--accent-light)]"
                  }`}>
                  {label}
                </button>
              ))}
              <span className="text-[var(--border)] hidden sm:block">|</span>
              {([["all","Both"],["D","Dem"],["R","Rep"]] as [string, string][]).map(([v, lbl]) => (
                <button key={v} onClick={() => setParty(v as "all"|"D"|"R")}
                  className={`text-xs font-bold uppercase tracking-[0.1em] px-3 py-1.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    party === v
                      ? v === "D" ? "bg-blue-600 text-white" : v === "R" ? "bg-red-600 text-white" : "bg-[var(--accent)] text-white"
                      : "bg-white ring-1 ring-[var(--border)] text-[var(--muted)] hover:ring-[var(--accent-light)]"
                  }`}>
                  {lbl}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">

        {/* ── THE STORY ─────────────────────────────────────────────── */}
        {tab === "story" && (
          <div className="space-y-6">
            <div className="mb-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--muted)] mb-2">What the Money Says</p>
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--accent)] leading-tight max-w-2xl"
                style={{ fontFamily: "var(--font-playfair), serif" }}>
                Four money stories that tell you everything about 2026 Harris County politics.
              </h2>
            </div>

            {[
              {
                eyebrow: "County Power",
                color: "#2563eb",
                border: "#3b82f6",
                stat: ellis ? fmt(ellis.cash) : "—",
                statLabel: "Rodney Ellis · PCT 1",
                headline: "Rodney Ellis has more cash than every other commissioner combined.",
                body: `Commissioner Ellis's ${ellis ? fmt(ellis.cash) : "—"} war chest dwarfs his colleagues — Briones has ${briones ? fmt(briones.cash) : "—"}, Garcia ${garcia ? fmt(garcia.cash) : "—"}, Ramsey ${ramsey ? fmt(ramsey.cash) : "—"}. Ellis is up in 2026, and that pile signals to any challenger: this seat won't be cheap.`,
              },
              {
                eyebrow: "Senate Race",
                color: "#7c3aed",
                border: "#a78bfa",
                stat: talarico ? fmt(talarico.cash) : "—",
                statLabel: "Talarico · D nominee",
                headline: "The Democratic challenger is outraising the Republican incumbent.",
                body: `James Talarico raised ${talarico ? fmt(talarico.raised ?? 0) : "—"} and still holds ${talarico ? fmt(talarico.cash) : "—"} — more than John Cornyn's ${cornyn ? fmt(cornyn.cash) : "—"} on hand. Cornyn has already burned ${cornyn ? fmt(cornyn.spent ?? 0) : "—"} defending his seat. The money gap between a challenger and a 4-term Republican senator is a story Texas hasn't seen in years.`,
              },
              {
                eyebrow: "City Hall",
                color: "#059669",
                border: "#10b981",
                stat: whitmire ? fmt(whitmire.cash) : "—",
                statLabel: "Mayor Whitmire",
                headline: "The Mayor isn't up until 2027 — and he's sitting on nearly $3M.",
                body: `John Whitmire holds ${whitmire ? fmt(whitmire.cash) : "—"} with no election until 2027. City Controller Chris Hollins — widely viewed as a likely mayoral candidate — has banked ${hollins ? fmt(hollins.cash) : "—"}. Council member Ed Pollard holds ${pollard ? fmt(pollard.cash) : "—"}, the most of any council seat, and is also seen as a future citywide contender.`,
              },
            ].map(({ eyebrow, color, border, stat, statLabel, headline, body }) => (
              <div key={eyebrow} className="rounded-[1.75rem] bg-white/60 ring-1 ring-black/8 p-[6px] card-lift">
                <div className="rounded-[1.35rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] px-8 py-8"
                  style={{ borderLeft: `4px solid ${border}` }}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-3" style={{ color }}>{eyebrow}</p>
                  <div className="flex flex-col md:flex-row md:items-start gap-6">
                    <div className="md:w-36 flex-shrink-0 text-center md:text-left">
                      <p className="text-4xl md:text-5xl font-bold leading-none" style={{ color, fontFamily: "var(--font-playfair), serif" }}>{stat}</p>
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--muted)] mt-1">{statLabel}</p>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-[var(--accent)] mb-2 leading-snug" style={{ fontFamily: "var(--font-playfair), serif" }}>{headline}</h3>
                      <p className="text-sm text-[var(--muted)] leading-relaxed">{body}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Monarch party split bar */}
            <div className="rounded-[1.75rem] bg-white/60 ring-1 ring-black/8 p-[6px]">
              <div className="rounded-[1.35rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] px-8 py-7">
                <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] mb-5">The Bank Split</p>
                {/* Labels */}
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-600 mb-0.5">Democrats</p>
                    <p className="text-3xl font-bold text-blue-700"
                      style={{ fontFamily: "var(--font-playfair), serif" }}>{fmt(demTotal)}</p>
                    <p className="text-[10px] text-blue-500 mt-0.5">{((demTotal / totalPool) * 100).toFixed(0)}% of tracked cash</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-red-600 mb-0.5">Republicans</p>
                    <p className="text-3xl font-bold text-red-700"
                      style={{ fontFamily: "var(--font-playfair), serif" }}>{fmt(repTotal)}</p>
                    <p className="text-[10px] text-red-500 mt-0.5">{((repTotal / totalPool) * 100).toFixed(0)}% of tracked cash</p>
                  </div>
                </div>
                {/* Single split pill bar */}
                <div className="h-6 rounded-full overflow-hidden flex">
                  <div className="h-full bg-gradient-to-r from-blue-600 to-blue-500 transition-all duration-1000 rounded-l-full"
                    style={{ width: `${(demTotal / totalPool) * 100}%` }}/>
                  <div className="h-full bg-gradient-to-r from-red-500 to-red-600 flex-1 transition-all duration-1000 rounded-r-full"/>
                </div>
                <p className="text-[10px] text-[var(--muted)] mt-4">
                  Note: Abbott&rsquo;s $105M war chest dominates the Republican total. County-level Republican candidates hold substantially less.
                </p>
              </div>
            </div>

            <div className="flex justify-center pt-2">
              <button onClick={() => setTab("leaderboard")}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--accent)] text-white text-sm font-bold hover:bg-[var(--accent-light)] transition-colors">
                See Full Leaderboard
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>
            <p className="text-xs text-[var(--muted)] text-center">Source: Texas Ethics Commission (TEC) semi-annual reports · FEC filings. Data as of Jan–Apr 2026.</p>
          </div>
        )}

        {/* ── LEADERBOARD ───────────────────────────────────────────── */}
        {tab === "leaderboard" && (
          <div>
            <div className="mb-6">
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or office…"
                className="w-full max-w-sm px-4 py-2.5 rounded-full bg-white ring-1 ring-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:ring-[var(--accent)] focus:outline-none transition-all duration-300"
              />
            </div>

            <div className="rounded-[1.75rem] bg-white/60 ring-1 ring-black/8 p-[6px]">
              <div className="rounded-[1.35rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-2.5 border-b border-[var(--border)] bg-[var(--background)]">
                  <span className="w-8 flex-shrink-0 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] text-center">#</span>
                  <span className="flex-1 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Name / Office</span>
                  <span className="w-28 flex-shrink-0 hidden sm:block text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Cash Bar</span>
                  <span className="w-24 text-right flex-shrink-0 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Cash on Hand</span>
                  <span className="w-20 text-right flex-shrink-0 hidden md:block text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">As of</span>
                </div>

                {filtered.length === 0 ? (
                  <p className="p-10 text-center text-[var(--muted)] text-sm">No results found.</p>
                ) : filtered.map((c, i) => {
                  const isD = c.party === "D";
                  const pct = Math.min((c.cash / maxCash) * 100, 100);
                  const initials = c.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
                  const rankColor = i === 0 ? "text-amber-500" : i === 1 ? "text-gray-400" : i === 2 ? "text-amber-700" : "text-[var(--muted)]";
                  return (
                    <div key={`${c.name}-${i}`}
                      className="flex items-center gap-4 px-5 py-4 border-b border-[var(--border)] last:border-0 hover:bg-black/[0.018] transition-colors duration-200">
                      {/* Rank */}
                      <span className={`w-6 flex-shrink-0 text-center text-xs font-bold ${rankColor}`}>{c.cash > 0 ? i + 1 : "—"}</span>
                      {/* Avatar */}
                      <div
                        className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[11px] font-bold"
                        style={{ background: isD ? "#3b82f6" : "#ef4444" }}>
                        {initials}
                      </div>
                      {/* Name + bar */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                          <span className="font-semibold text-sm text-[var(--foreground)] leading-tight">{c.name}</span>
                          <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full ${isD ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>{c.party}</span>
                          {c.incumbent && <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Inc</span>}
                        </div>
                        <p className="text-[10px] text-[var(--muted)] truncate mb-2">{c.office}</p>
                        {/* Monarch pill bar */}
                        <div className="h-2 bg-black/[0.05] rounded-full overflow-hidden max-w-xs hidden sm:block">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: `linear-gradient(90deg,${isD ? "#3b82f6cc" : "#ef4444cc"},${isD ? "#3b82f6" : "#ef4444"})` }}/>
                        </div>
                      </div>
                      {/* Cash + date */}
                      <div className="flex-shrink-0 text-right">
                        {c.cash > 0 ? (
                          <>
                            <p className={`text-base font-bold ${isD ? "text-blue-600" : "text-red-600"}`}
                              style={{ fontFamily: "var(--font-playfair), serif" }}>{fmt(c.cash)}</p>
                            <p className="text-[10px] text-[var(--muted)] mt-0.5 hidden md:block">{c.asOf}</p>
                          </>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-gray-100 text-gray-400">Pending</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="text-xs text-[var(--muted)] mt-4 text-center">
              Federal: FEC API (live). State: TEC semi-annual report (live). County: Harris County Clerk filings. City: Houston COH filings. Cash on hand as of most recent filing.{" "}
              <a href="/contact" className="text-[var(--accent-light)] underline underline-offset-2">Report an error →</a>
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
