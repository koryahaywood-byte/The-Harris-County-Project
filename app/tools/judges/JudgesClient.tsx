"use client";

// Know Your Judges: the down-ballot dropoff problem, solved with one sheet.
// Every judicial matchup in the 2026 ledger (district courts, county courts
// at law, probate), scannable by bench, with hold/challenge framing.

import { useMemo, useState } from "react";
import Link from "next/link";
import { MATCHUPS_2026, type RaceLean } from "@/lib/matchups-2026";
import { getFinanceByName, fmt } from "@/lib/campaign-finance";
import { STAKES } from "@/lib/race-stakes";
import RelatedTools from "@/components/RelatedTools";

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

type Filter = "all" | "r-held" | "open" | "competitive";

const SECTIONS: { prefix: string; label: string; blurb: string }[] = [
  { prefix: "DC-", label: "District Courts", blurb: "Felony trials and major civil cases. Countywide races." },
  { prefix: "CCL-", label: "County Criminal Courts at Law", blurb: "Misdemeanors: DWI, theft, assault. Countywide races." },
  { prefix: "Probate-", label: "Probate Courts", blurb: "Wills, estates, guardianships. Countywide races." },
];

function benchNumber(key: string): number {
  return parseInt(key.replace(/\D+/g, ""), 10) || 0;
}

export default function JudgesClient() {
  const [filter, setFilter] = useState<Filter>("all");

  const rows = useMemo(() => {
    return SECTIONS.map(sec => {
      const keys = Object.keys(MATCHUPS_2026)
        .filter(k => k.startsWith(sec.prefix))
        .sort((a, b) => benchNumber(a) - benchNumber(b));
      return { ...sec, keys };
    }).filter(sec => sec.keys.length > 0);
  }, []);

  function passes(key: string): boolean {
    const m = MATCHUPS_2026[key];
    const holder = m.sides.find(s => s.incumbent);
    if (filter === "r-held") return holder?.party === "R";
    if (filter === "open") return !holder;
    if (filter === "competitive") return m.lean === "toss-up" || m.lean === "lean-d" || m.lean === "lean-r";
    return true;
  }

  const allKeys = rows.flatMap(r => r.keys);
  const rHeld = allKeys.filter(k => MATCHUPS_2026[k].sides.find(s => s.incumbent)?.party === "R").length;
  const openSeats = allKeys.filter(k => !MATCHUPS_2026[k].sides.some(s => s.incumbent)).length;

  return (
    <div>
      {/* Hero */}
      <section className="bg-[var(--accent)] text-white px-6 py-16 md:py-24 relative overflow-hidden topo-dark">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_80%_50%,rgba(37,99,168,0.4),transparent)]" />
        <div className="max-w-4xl mx-auto relative z-10">
          <p className="text-sky-300/80 text-[11px] font-bold uppercase tracking-[0.25em] mb-3">Harris County · November 3, 2026</p>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4" style={{ fontFamily: "var(--font-playfair), serif" }}>
            {allKeys.length} judicial races. Most voters skip them.
          </h1>
          <p className="text-white/80 text-base leading-relaxed max-w-2xl">
            Judges decide bail, custody, evictions, and estates, and they&apos;re elected in the
            races furthest down the ballot, where information runs out. This is every contested
            Harris County bench this November: who holds it, who&apos;s challenging, and what the
            race turns on.
          </p>
          <div className="flex flex-wrap gap-4 mt-8">
            {[
              [String(allKeys.length), "contested benches"],
              [String(rHeld), "held by Republicans"],
              [String(openSeats), "open seats"],
            ].map(([n, label]) => (
              <div key={label} className="rounded-xl px-4 py-2.5 bg-white/10 backdrop-blur">
                <span className="text-xl font-bold">{n}</span>
                <span className="ml-2 text-[11px] uppercase tracking-wide text-white/70">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {([
            ["all", "All benches"],
            ["competitive", "Competitive"],
            ["r-held", "R-held benches"],
            ["open", "Open seats"],
          ] as [Filter, string][]).map(([f, label]) => (
            <button key={f} onClick={() => setFilter(f)}
              className="rounded-full px-4 py-1.5 text-[12px] font-bold transition"
              style={filter === f
                ? { background: "var(--accent)", color: "white" }
                : { background: "#eef2f7", color: "var(--accent)" }}>
              {label}
            </button>
          ))}
        </div>

        {rows.map(sec => {
          const visible = sec.keys.filter(passes);
          if (!visible.length) return null;
          return (
            <section key={sec.prefix} className="mb-10">
              <div className="mb-3">
                <h2 className="text-lg font-bold" style={{ color: "var(--accent)", fontFamily: "var(--font-playfair), serif" }}>
                  {sec.label}
                </h2>
                <p className="text-[12px]" style={{ color: "#8a8578" }}>{sec.blurb}</p>
              </div>
              <div className="rounded-2xl bg-white ring-1 ring-black/5 shadow-sm overflow-hidden">
                {visible.map(key => {
                  const m = MATCHUPS_2026[key];
                  const holder = m.sides.find(s => s.incumbent);
                  const dSide = m.sides.find(s => s.party === "D");
                  const rSide = m.sides.find(s => s.party === "R");
                  const line = STAKES[key] ?? m.detail;
                  return (
                    <div key={key} className="px-4 py-3.5 border-b last:border-b-0" style={{ borderColor: "#f0ede7" }}>
                      <div className="flex items-baseline justify-between gap-3 mb-1.5">
                        <h3 className="text-[13px] font-bold" style={{ color: "var(--accent)" }}>{m.office}</h3>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                            style={{ background: "#f3f4f6", color: "#6b7280" }}>
                            {holder ? `${holder.party}-held` : "Open seat"}
                          </span>
                          {m.lean && (
                            <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                              style={{ background: `${LEAN_COLOR[m.lean]}14`, color: LEAN_COLOR[m.lean] }}>
                              {LEAN_LABEL[m.lean]}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 mb-1">
                        {[dSide, rSide].map((side, i) => side ? (
                          <span key={i} className="inline-flex items-center gap-1.5 min-w-0">
                            <span className="text-[13px] font-semibold truncate" style={{ color: side.party === "D" ? "#1d4ed8" : "#b91c1c" }}>
                              {side.name}
                            </span>
                            {side.incumbent && (
                              <span className="text-[9px] font-bold px-1 rounded" style={{ background: "#f3f4f6", color: "#6b7280" }}>ON THE BENCH</span>
                            )}
                            {(() => { const fin = getFinanceByName(side.name); return fin && fin.cash > 0
                              ? <span className="text-[10px] tabular-nums" style={{ color: "#6b7280" }}>{fmt(fin.cash)}</span>
                              : null; })()}
                          </span>
                        ) : (
                          <span key={i} className="text-[11px] italic" style={{ color: "#9ca3af" }}>No {i === 0 ? "D" : "R"} filed</span>
                        ))}
                      </div>
                      {line && <p className="text-[11px] leading-snug" style={{ color: "#6b7280" }}>{line}</p>}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        <p className="text-[11px] leading-relaxed" style={{ color: "#9ca3af" }}>
          Incumbency and appointment history come from our 2026 race ledger; cash on hand from the
          most recent TEC filings. Competitiveness ratings reflect Harris County&apos;s countywide
          partisan lean, the strongest predictor in judicial races, which rarely generate
          candidate-specific news. Want these races in the context of your full ballot? Build it
          at <Link href="/tools/my-ballot" className="underline font-semibold">My Ballot</Link>.
        </p>

        <RelatedTools current="/tools/judges" />
      </div>
    </div>
  );
}
