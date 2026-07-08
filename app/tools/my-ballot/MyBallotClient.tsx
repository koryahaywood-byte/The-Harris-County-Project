"use client";

// My Ballot: address → the exact races this voter sees on November 3, 2026,
// in ballot order, with leans, money, and stakes. Built to be printed and
// carried into the booth (Texas allows written notes while voting).

import { useState, useRef } from "react";
import Link from "next/link";
import { MATCHUPS_2026, type Matchup, type RaceLean } from "@/lib/matchups-2026";
import { getFinanceByName, fmt } from "@/lib/campaign-finance";
import { STAKES } from "@/lib/race-stakes";
import RelatedTools from "@/components/RelatedTools";

interface Districts { cd?: string; sd?: string; hd?: string; jp?: string; council?: string; pct?: string }
interface LookupResult { matched: string; precinct: string; districts: Districts }

const LEAN_LABEL: Record<RaceLean, string> = {
  "safe-d": "Safe D", "likely-d": "Likely D", "lean-d": "Lean D",
  "toss-up": "Toss-up",
  "lean-r": "Lean R", "likely-r": "Likely R", "safe-r": "Safe R",
  "uncontested-d": "Uncontested D", "uncontested-r": "Uncontested R",
};
const LEAN_COLOR: Record<RaceLean, string> = {
  "safe-d": "#1d4ed8", "likely-d": "#2563eb", "lean-d": "#3b82f6",
  "toss-up": "#7c3aed",
  "lean-r": "#ef4444", "likely-r": "#dc2626", "safe-r": "#b91c1c",
  "uncontested-d": "#1d4ed8", "uncontested-r": "#b91c1c",
};
const COMPETITIVE: RaceLean[] = ["toss-up", "lean-d", "lean-r"];

// ── Which matchup keys are on THIS voter's ballot, in Texas ballot order ─────
function racesForDistricts(d: Districts): { key: string; section: string }[] {
  const keys = Object.keys(MATCHUPS_2026);
  const out: { key: string; section: string }[] = [];
  const push = (key: string, section: string) => {
    if (MATCHUPS_2026[key]) out.push({ key, section });
  };
  const numeric = (prefix: string) =>
    keys.filter(k => k.startsWith(prefix))
        .sort((a, b) => (parseInt(a.replace(/\D+/g, ""), 10) || 0) - (parseInt(b.replace(/\D+/g, ""), 10) || 0));

  push("US-Senate", "Federal");
  if (d.cd) push(`CD-${d.cd}`, "Federal");
  for (const k of keys.filter(k => k.startsWith("TX-"))) push(k, "Statewide Texas");
  if (d.sd) push(`SD-${d.sd}`, "State Legislature");
  if (d.hd) push(`HD-${d.hd}`, "State Legislature");
  for (const k of numeric("DC-")) push(k, "Harris County Courts");
  push("HC-Countywide", "Harris County");
  for (const k of keys.filter(k => k.startsWith("HC-") && k !== "HC-Countywide")) push(k, "Harris County");
  for (const k of numeric("CCL-")) push(k, "Harris County Courts");
  for (const k of numeric("Probate-")) push(k, "Harris County Courts");
  if (d.pct) push(`PCT-${d.pct}`, "Your Precinct");
  if (d.jp) for (const k of keys.filter(k => k.startsWith(`JP-${d.jp}-`))) push(k, "Your Precinct");
  // Ballot order puts district courts before county offices but CCL/probate after;
  // regroup for display while keeping the in-section order above.
  const SECTION_ORDER = ["Federal", "Statewide Texas", "State Legislature", "Harris County Courts", "Harris County", "Your Precinct"];
  return out.sort((a, b) => SECTION_ORDER.indexOf(a.section) - SECTION_ORDER.indexOf(b.section));
}

function CandidateLine({ side, m }: { side: Matchup["sides"][number] | undefined; m: Matchup }) {
  if (!side) {
    const pending = m.status === "runoff-pending" || m.status === "partial";
    return <span className="text-[11px] italic" style={{ color: "#9ca3af" }}>{pending ? "Nominee TBD" : "No candidate filed"}</span>;
  }
  const fin = getFinanceByName(side.name);
  const isD = side.party === "D";
  return (
    <span className="inline-flex items-center gap-1.5 min-w-0">
      <span className="ballot-check print-only" aria-hidden>◯</span>
      <span className="text-[13px] font-semibold truncate" style={{ color: isD ? "#1d4ed8" : "#b91c1c" }}>
        {side.name}
      </span>
      {side.incumbent && (
        <span className="text-[9px] font-bold px-1 rounded" style={{ background: "#f3f4f6", color: "#6b7280" }} title="Incumbent">INC</span>
      )}
      {side.gender === "F" && (
        <span className="text-[9px] font-bold px-1 rounded no-print" style={{ background: "#fce7f3", color: "#be185d" }} title="Woman candidate">W</span>
      )}
      {fin && fin.cash > 0 && (
        <span className="text-[10px] tabular-nums no-print" style={{ color: "#6b7280" }}>{fmt(fin.cash)}</span>
      )}
    </span>
  );
}

function RaceRow({ raceKey }: { raceKey: string }) {
  const m = MATCHUPS_2026[raceKey];
  const dSide = m.sides.find(s => s.party === "D");
  const rSide = m.sides.find(s => s.party === "R");
  const stakes = STAKES[raceKey];
  return (
    <div className="px-4 py-3 border-b last:border-b-0" style={{ borderColor: "#f0ede7" }}>
      <div className="flex items-baseline justify-between gap-3 mb-1.5">
        <h3 className="text-[13px] font-bold" style={{ color: "var(--accent)" }}>{m.office}</h3>
        {m.lean && (
          <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full shrink-0"
            style={{ background: `${LEAN_COLOR[m.lean]}14`, color: LEAN_COLOR[m.lean] }}>
            {LEAN_LABEL[m.lean]}
          </span>
        )}
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6">
        <CandidateLine side={dSide} m={m} />
        <span className="hidden sm:inline text-[10px] font-bold no-print" style={{ color: "#d1d5db" }}>vs</span>
        <CandidateLine side={rSide} m={m} />
      </div>
      {stakes && <p className="mt-1.5 text-[11px] leading-snug no-print" style={{ color: "#6b7280" }}>{stakes}</p>}
    </div>
  );
}

export default function MyBallotClient() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LookupResult | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  async function lookup(params: string) {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/my-officials?${params}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Lookup failed. Try again."); setResult(null); return; }
      setResult({ matched: data.matched, precinct: data.precinct, districts: data.districts ?? {} });
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    } catch {
      setError("Lookup failed. Check your connection and try again.");
    } finally { setLoading(false); }
  }

  function useLocation() {
    if (!navigator.geolocation) { setError("Your browser doesn't support location."); return; }
    setLoading(true); setError(null);
    navigator.geolocation.getCurrentPosition(
      pos => lookup(`lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`),
      () => { setLoading(false); setError("Couldn't read your location. Type your address instead."); },
      { timeout: 10_000 }
    );
  }

  const races = result ? racesForDistricts(result.districts) : [];
  const competitive = races.filter(r => {
    const lean = MATCHUPS_2026[r.key].lean;
    return lean && COMPETITIVE.includes(lean);
  }).length;
  const sections: { section: string; keys: string[] }[] = [];
  for (const r of races) {
    const last = sections[sections.length - 1];
    if (last && last.section === r.section) last.keys.push(r.key);
    else sections.push({ section: r.section, keys: [r.key] });
  }

  return (
    <div>
      <style>{`
        .print-only { display: none; }
        @media print {
          nav, footer, .no-print { display: none !important; }
          .print-only { display: inline; }
          .ballot-sheet { box-shadow: none !important; border: none !important; }
        }
      `}</style>

      {/* Hero */}
      <section className="bg-[var(--accent)] text-white px-6 py-16 md:py-24 relative overflow-hidden topo-dark no-print">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_80%_50%,rgba(37,99,168,0.4),transparent)]" />
        <div className="max-w-3xl mx-auto relative z-10">
          <p className="text-sky-300/80 text-[11px] font-bold uppercase tracking-[0.25em] mb-3">Harris County · November 3, 2026</p>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4" style={{ fontFamily: "var(--font-playfair), serif" }}>
            Your ballot, race by race.
          </h1>
          <p className="text-white/80 text-base leading-relaxed max-w-xl mb-8">
            Type your address and see every contest you&apos;ll vote on this November,
            from U.S. Senate down to Justice of the Peace. Print it, mark it up, and
            take it with you. Texas lets you bring notes into the booth.
          </p>
          <form className="flex flex-col sm:flex-row gap-2 max-w-xl" onSubmit={e => { e.preventDefault(); if (address.trim()) lookup(`address=${encodeURIComponent(address.trim())}`); }}>
            <input
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="1400 Heights Blvd, Houston"
              className="flex-1 rounded-full px-5 py-3 text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300"
              aria-label="Street address"
            />
            <button type="submit" disabled={loading}
              className="rounded-full px-6 py-3 text-sm font-bold bg-sky-400 text-[var(--accent)] hover:bg-sky-300 transition disabled:opacity-50">
              {loading ? "Looking up…" : "Build my ballot"}
            </button>
          </form>
          <button onClick={useLocation} disabled={loading}
            className="mt-3 text-[12px] text-sky-300/90 underline underline-offset-2 hover:text-sky-200 disabled:opacity-50">
            Or use my current location
          </button>
          {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
        </div>
      </section>

      {/* Results */}
      {result && (
        <div ref={resultsRef} className="max-w-3xl mx-auto px-6 py-10">
          <div className="flex flex-wrap items-center gap-2 mb-2 no-print">
            {[
              result.districts.cd && `CD-${result.districts.cd}`,
              result.districts.sd && `SD-${result.districts.sd}`,
              result.districts.hd && `HD-${result.districts.hd}`,
              result.districts.pct && `Commissioner Pct ${result.districts.pct}`,
              result.districts.jp && `JP ${result.districts.jp}`,
              `Voting precinct ${result.precinct}`,
            ].filter(Boolean).map(chip => (
              <span key={chip as string} className="text-[10px] font-bold px-2 py-1 rounded-full"
                style={{ background: "#eef2f7", color: "var(--accent)" }}>{chip}</span>
            ))}
          </div>
          <p className="text-[12px] mb-6" style={{ color: "#6b7280" }}>
            {result.matched} · {races.length} races on your ballot · {competitive} rated competitive
          </p>

          <div className="flex items-center justify-between mb-4 no-print">
            <h2 className="text-xl font-bold" style={{ color: "var(--accent)", fontFamily: "var(--font-playfair), serif" }}>
              {`${races.length} races. Here's your sheet.`}
            </h2>
            <button onClick={() => window.print()}
              className="rounded-full px-4 py-2 text-[12px] font-bold text-white bg-[var(--accent)] hover:opacity-90 transition">
              Print crib sheet
            </button>
          </div>

          <div className="ballot-sheet rounded-2xl bg-white ring-1 ring-black/5 shadow-sm overflow-hidden">
            <div className="px-4 py-2 print-only">
              <strong>My Harris County ballot · November 3, 2026</strong> · {result.matched}
            </div>
            {sections.map(({ section, keys }) => (
              <div key={section}>
                <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em]"
                  style={{ background: "#f8f7f4", color: "#8a8578" }}>
                  {section}
                </div>
                {keys.map(k => <RaceRow key={k} raceKey={k} />)}
              </div>
            ))}
          </div>

          {/* Voting logistics */}
          <div className="mt-6 rounded-2xl px-5 py-4 no-print" style={{ background: "#eef2f7" }}>
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--accent)" }}>
              <strong>Early voting:</strong> Oct 19&ndash;30 · <strong>Election Day:</strong> Tuesday, Nov 3 ·{" "}
              <strong>Register by:</strong> Oct 5. Harris County uses countywide vote centers, so you can vote
              at any location.{" "}
              <a href="https://www.harrisvotes.com/voting-locations" target="_blank" rel="noopener noreferrer"
                className="underline font-semibold">Find a vote center →</a>
            </p>
          </div>

          <p className="mt-4 text-[11px] leading-relaxed no-print" style={{ color: "#9ca3af" }}>
            Race list is derived from your districts and the 93 matchups tracked in our 2026 ledger; ballot
            order approximates the official Texas order. Your official sample ballot comes from{" "}
            <a href="https://www.harrisvotes.com" target="_blank" rel="noopener noreferrer" className="underline">HarrisVotes.com</a>.
            Ratings and money are ours: methodology on the <Link href="/methodology" className="underline">methodology page</Link>.
          </p>

          <div className="no-print"><RelatedTools current="/tools/my-ballot" /></div>
        </div>
      )}

      {/* Empty state teaser */}
      {!result && (
        <div className="max-w-3xl mx-auto px-6 py-12 no-print">
          <p className="text-sm leading-relaxed" style={{ color: "#6b7280" }}>
            Harris County voters face one of the longest ballots in America: more than 90 contests
            in a presidential-year general. This tool trims it to exactly what&apos;s in front of you,
            with our competitiveness rating and the latest cash-on-hand for every candidate. Nothing
            is stored: we look up your districts and forget the address.
          </p>
        </div>
      )}
    </div>
  );
}
