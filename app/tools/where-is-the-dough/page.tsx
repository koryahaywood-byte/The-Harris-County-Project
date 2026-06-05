"use client";
import { useState } from "react";

/* ─── Data ───────────────────────────────────────────────────────────────── */
interface Candidate {
  name: string;
  office: string;
  level: "federal" | "state" | "houston" | "county";
  party: "D" | "R";
  cash: number;
  raised?: number;
  spent?: number;
  asOf: string;
  incumbent?: boolean;
}

const DATA: Candidate[] = [
  // Federal
  { name: "James Talarico",       office: "U.S. Senate (D nominee)",       level: "federal",  party: "D", cash: 9858865,  raised: 27000000, spent: 17141135, asOf: "Apr 2026", incumbent: false },
  { name: "John Cornyn",          office: "U.S. Senate (R runoff)",         level: "federal",  party: "R", cash: 8200000,  raised: 9000000,  spent: 15800000, asOf: "Apr 2026", incumbent: true  },
  { name: "Ken Paxton",           office: "U.S. Senate (R runoff)",         level: "federal",  party: "R", cash: 2600000,  raised: 2200000,  spent: 3200000,  asOf: "Apr 2026", incumbent: false },
  { name: "Lizzie Fletcher",      office: "U.S. Rep CD-07",                 level: "federal",  party: "D", cash: 1750893,  asOf: "Apr 2026", incumbent: true  },
  { name: "Shaun Finnie",         office: "U.S. Rep CD-02 (D nominee)",     level: "federal",  party: "D", cash: 1543080,  asOf: "Apr 2026", incumbent: false },
  { name: "Al Green",             office: "U.S. Rep CD-18 (runoff)",        level: "federal",  party: "D", cash: 264570,   asOf: "Apr 2026", incumbent: true  },
  { name: "Christian Menefee",    office: "U.S. Rep CD-18 (runoff)",        level: "federal",  party: "D", cash: 255858,   asOf: "Apr 2026", incumbent: false },
  { name: "Sylvia Garcia",        office: "U.S. Rep CD-29",                 level: "federal",  party: "D", cash: 175662,   asOf: "Apr 2026", incumbent: true  },
  // State
  { name: "Greg Abbott",          office: "Governor",                        level: "state",    party: "R", cash: 105700000, raised: 22700000, asOf: "Jan 2026", incumbent: true  },
  { name: "Carol Alvarado",       office: "State Senator SD-6",             level: "state",    party: "D", cash: 1564381,  asOf: "Jan 2025", incumbent: true  },
  { name: "Senfronia Thompson",   office: "State Rep HD-141",               level: "state",    party: "D", cash: 1032927,  asOf: "Jan 2025", incumbent: true  },
  { name: "Gina Hinojosa",        office: "Governor (D nominee)",            level: "state",    party: "D", cash: 1000000,  raised: 1300000,  spent: 300000,  asOf: "Jan 2026 est.", incumbent: false },
  { name: "Ann Johnson",          office: "State Rep HD-134",               level: "state",    party: "D", cash: 527021,   asOf: "Jan 2025", incumbent: true  },
  { name: "Ana Hernandez",        office: "State Rep HD-143",               level: "state",    party: "D", cash: 448309,   asOf: "Jan 2025", incumbent: true  },
  { name: "Armando Walle",        office: "State Rep HD-140",               level: "state",    party: "D", cash: 267898,   asOf: "Jan 2025", incumbent: true  },
  { name: "Mary Ann Perez",       office: "State Rep HD-144",               level: "state",    party: "D", cash: 211703,   asOf: "Jan 2025", incumbent: true  },
  { name: "Molly Cook",           office: "State Senator SD-15",            level: "state",    party: "D", cash: 155853,   asOf: "Jan 2025", incumbent: true  },
  // County
  { name: "Rodney Ellis",         office: "Commissioner PCT 1",             level: "county",   party: "D", cash: 7783681,  asOf: "Jan 2026", incumbent: true  },
  { name: "Lesley Briones",       office: "Commissioner PCT 4",             level: "county",   party: "D", cash: 4058292,  asOf: "Jan 2026", incumbent: true  },
  { name: "Abbie Kamin",          office: "County Attorney (D nominee)",    level: "county",   party: "D", cash: 572019,   asOf: "Jan 2026", incumbent: false },
  { name: "Adrian Garcia",        office: "Commissioner PCT 2",             level: "county",   party: "D", cash: 2544776,  asOf: "Jan 2026", incumbent: true  },
  { name: "Tom Ramsey",           office: "Commissioner PCT 3",             level: "county",   party: "R", cash: 2032612,  asOf: "Jan 2026", incumbent: true  },
  { name: "Annise Parker",        office: "County Judge (D runoff)",        level: "county",   party: "D", cash: 332475,   asOf: "Jan 2026", incumbent: false },
  { name: "Lina Hidalgo",         office: "County Judge",                   level: "county",   party: "D", cash: 344873,   asOf: "Jan 2026", incumbent: true  },
  { name: "Warren Howell",        office: "County Judge (R runoff)",        level: "county",   party: "R", cash: 106156,   asOf: "Jan 2026", incumbent: false },
  { name: "Ed Gonzalez",          office: "Sheriff",                        level: "county",   party: "D", cash: 90573,    asOf: "Jan 2026", incumbent: true  },
  { name: "Richard Vega",         office: "Commissioner PCT 2 (R general)", level: "county",   party: "R", cash: 59395,    asOf: "Jan 2026", incumbent: false },
  { name: "Marilyn Burgess",      office: "District Clerk",                 level: "county",   party: "D", cash: 26240,    asOf: "Jan 2026", incumbent: true  },
  { name: "Teneshia Hudspeth",    office: "County Clerk",                   level: "county",   party: "D", cash: 17147,    asOf: "Jan 2026", incumbent: true  },
  { name: "Sean Teare",           office: "District Attorney",              level: "county",   party: "D", cash: 14291,    asOf: "Jan 2026", incumbent: true  },
  { name: "Annette Ramirez",      office: "Tax Assessor-Collector",         level: "county",   party: "D", cash: 5775,     asOf: "Jan 2026", incumbent: true  },
  // City of Houston
  { name: "John Whitmire",        office: "Mayor",                          level: "houston",  party: "D", cash: 2741969,  asOf: "Jan 2026", incumbent: true  },
  { name: "Ed Pollard",           office: "City Council At-Large 2",        level: "houston",  party: "D", cash: 2197573,  asOf: "Jan 2026", incumbent: true  },
  { name: "Chris Hollins",        office: "City Controller",                level: "houston",  party: "D", cash: 530765,   asOf: "Jan 2026", incumbent: true  },
  { name: "Martha Castex-Tatum",  office: "City Council District F",        level: "houston",  party: "D", cash: 366298,   asOf: "Jan 2026", incumbent: true  },
  { name: "Tiffany Thomas",       office: "City Council At-Large 4",        level: "houston",  party: "D", cash: 262877,   asOf: "Jan 2026", incumbent: true  },
  { name: "Julian Ramirez",       office: "City Council District I",        level: "houston",  party: "R", cash: 174226,   asOf: "Jan 2026", incumbent: true  },
  { name: "Mario Castillo",       office: "City Council At-Large 5",        level: "houston",  party: "D", cash: 160561,   asOf: "Jan 2026", incumbent: true  },
  { name: "Twila Carter",         office: "City Council District G",        level: "houston",  party: "R", cash: 103895,   asOf: "Jan 2026", incumbent: true  },
  { name: "Alejandra Salinas",    office: "City Council District C",        level: "houston",  party: "D", cash: 101659,   asOf: "Jan 2026", incumbent: true  },
  { name: "Sallie Alcorn",        office: "City Council At-Large 1",        level: "houston",  party: "D", cash: 79344,    asOf: "Jan 2026", incumbent: true  },
  { name: "Fred Flickinger",      office: "City Council At-Large 3",        level: "houston",  party: "R", cash: 60932,    asOf: "Jan 2026", incumbent: true  },
  { name: "Amy Peck",             office: "City Council District A",        level: "houston",  party: "R", cash: 44030,    asOf: "Jan 2026", incumbent: true  },
  { name: "Joaquin Martinez",     office: "City Council District H",        level: "houston",  party: "D", cash: 29304,    asOf: "Jan 2026", incumbent: true  },
  { name: "Carolyn Evans-Shabazz",office: "City Council District D",        level: "houston",  party: "D", cash: 17235,    asOf: "Jan 2026", incumbent: true  },
  { name: "Tarsha Jackson",       office: "City Council District B",        level: "houston",  party: "D", cash: 9689,     asOf: "Jan 2026", incumbent: true  },
];

type Tab   = "story" | "leaderboard";
type Level = "all" | "federal" | "state" | "houston" | "county";

const LEVEL_LABELS: Record<Level, string> = {
  all: "All", federal: "Federal", state: "State", houston: "City of Houston", county: "County",
};

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${Math.round(n / 1000).toLocaleString()}K`;
  return `$${n.toLocaleString()}`;
}

export default function WhereIsTheDough() {
  const [tab, setTab]     = useState<Tab>("story");
  const [level, setLevel] = useState<Level>("all");
  const [party, setParty] = useState<"all" | "D" | "R">("all");
  const [search, setSearch] = useState("");

  const withCash  = DATA.filter(d => d.cash > 0);
  const demTotal  = withCash.filter(d => d.party === "D").reduce((s, d) => s + d.cash, 0);
  const repTotal  = withCash.filter(d => d.party === "R").reduce((s, d) => s + d.cash, 0);
  const totalPool = demTotal + repTotal;

  const filtered = DATA
    .filter(d => d.cash > 0)
    .filter(d => level === "all" || d.level === level)
    .filter(d => party === "all" || d.party === party)
    .filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.office.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.cash - a.cash);

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

            {/* Party bank */}
            <div className="rounded-[1.75rem] bg-[var(--accent)]/4 ring-1 ring-[var(--accent)]/10 p-[6px]">
              <div className="rounded-[1.35rem] px-8 py-7">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--accent)] mb-5">The Bank Split</p>
                <div className="flex flex-col gap-4">
                  {[
                    { label: "Democrats", total: demTotal, color: "#3b82f6", textColor: "text-blue-700" },
                    { label: "Republicans", total: repTotal, color: "#ef4444", textColor: "text-red-700" },
                  ].map(({ label, total, color, textColor }) => (
                    <div key={label}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className={`font-bold ${textColor}`}>{label}</span>
                        <span className={`font-bold ${textColor}`}>{fmt(total)}</span>
                      </div>
                      <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(total / totalPool) * 100}%`, background: color }}/>
                      </div>
                      <p className="text-[10px] text-[var(--muted)] mt-1">{((total / totalPool) * 100).toFixed(0)}% of all tracked cash</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[var(--muted)] mt-5">Note: Abbott&rsquo;s $105M war chest dominates the Republican total. County-level Republican candidates hold substantially less.</p>
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
                  return (
                    <div key={`${c.name}-${i}`}
                      className="flex items-center gap-3 px-5 py-3.5 border-b border-[var(--border)] last:border-0 hover:bg-[var(--accent)]/3 transition-colors duration-200">
                      <span className={`w-8 flex-shrink-0 text-center text-xs font-bold ${i===0?"text-amber-500":i===1?"text-gray-400":i===2?"text-amber-700":"text-[var(--muted)]"}`}>{i+1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-[var(--foreground)] leading-tight">{c.name}</span>
                          <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full ${isD?"bg-blue-100 text-blue-700":"bg-red-100 text-red-700"}`}>{c.party}</span>
                          {c.incumbent && <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">★ Inc</span>}
                        </div>
                        <p className="text-[11px] text-[var(--muted)] truncate">{c.office}</p>
                      </div>
                      <div className="w-28 flex-shrink-0 hidden sm:block">
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: isD ? "#3b82f6" : "#ef4444" }}/>
                        </div>
                      </div>
                      <span className={`w-24 text-right flex-shrink-0 text-sm font-bold ${isD?"text-blue-600":"text-red-600"}`}>{fmt(c.cash)}</span>
                      <span className="w-20 text-right flex-shrink-0 text-[10px] text-[var(--muted)] hidden md:block">{c.asOf}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="text-xs text-[var(--muted)] mt-4 text-center">
              Source: Texas Ethics Commission (TEC) · FEC. Cash on hand as of most recent filing. Figures may lag by 6 months.{" "}
              <a href="/contact" className="text-[var(--accent-light)] underline underline-offset-2">Report an error →</a>
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
