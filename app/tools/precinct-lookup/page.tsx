"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────
interface HistCandidate { name: string; party: string }
interface HistRace { label: string; candidates: HistCandidate[]; votes: Record<string, number[]> }
interface HistCycle {
  label: string;
  races?: Record<string, HistRace>;
  primary?: Record<string, { dem: number; rep: number }>;
}
interface PrecinctHistory { cycles: Record<string, HistCycle> }

// ── Helpers ───────────────────────────────────────────────────────────────────
function findDR(candidates: HistCandidate[]) {
  const dIdx = candidates.findIndex(c => c.party === "D");
  const rIdx = candidates.findIndex(c => c.party === "R");
  return dIdx > -1 && rIdx > -1 ? { dIdx, rIdx } : null;
}

function normPrec(raw: string): string { return raw.replace(/^0+/, "") || "0"; }

const CYCLES = [
  { key: "2026P", label: "2026 Primary", year: 2026 },
  { key: "2024G", label: "2024 General", year: 2024 },
  { key: "2022G", label: "2022 General", year: 2022 },
  { key: "2020G", label: "2020 General", year: 2020 },
];

function getResults(history: PrecinctHistory, cycle: string, prec: string) {
  const cd = history.cycles[cycle];
  if (!cd) return null;
  const pnorm = normPrec(prec);
  const padded = pnorm.padStart(4, "0");

  if (cd.primary) {
    const v = cd.primary[pnorm] ?? cd.primary[padded];
    if (!v) return null;
    return [{
      race: "Primary Ballot", dName: "Dem Primary", rName: "Rep Primary",
      d: v.dem, r: v.rep, total: v.dem + v.rep,
      dPct: v.dem + v.rep ? v.dem / (v.dem + v.rep) : null,
    }];
  }

  if (!cd.races) return null;
  const results = [];
  for (const [, race] of Object.entries(cd.races)) {
    const votes = race.votes[pnorm] ?? race.votes[padded];
    if (!votes) continue;
    const dr = findDR(race.candidates);
    if (!dr) continue;
    const d = votes[dr.dIdx] ?? 0, r = votes[dr.rIdx] ?? 0, total = d + r;
    results.push({
      race: race.label,
      dName: race.candidates[dr.dIdx].name,
      rName: race.candidates[dr.rIdx].name,
      d, r, total,
      dPct: total ? d / total : null,
    });
  }
  return results.length ? results : null;
}

// ── Field Intel. GOTV opportunity classification ─────────────────────────
type FieldClass = "surge" | "persuasion" | "hold" | "strongR" | "unknown";

interface FieldIntel {
  classification: FieldClass;
  label: string;
  color: string;
  bg: string;
  summary: string;
  action: string;
  turnoutDelta: number | null; // votes 2024 vs 2020, positive = growing
  avgDPct: number | null;
}

function classifyPrecinct(trend: { year: number; dPct: number }[], cycleData: { year: number; results: { total: number }[] | null }[]): FieldIntel {
  const unknown: FieldIntel = { classification: "unknown", label: "Insufficient data", color: "#9ca3af", bg: "#f9fafb", summary: "Not enough cycles to classify.", action: "Gather more data.", turnoutDelta: null, avgDPct: null };
  if (trend.length < 2) return unknown;

  const sorted = [...trend].sort((a, b) => a.year - b.year);
  const avgDPct = sorted.reduce((s, t) => s + t.dPct, 0) / sorted.length;
  const recent = sorted[sorted.length - 1];
  const oldest = sorted[0];

  // Turnout delta: compare 2024 vs 2020 totals (first race in each cycle)
  const general2024 = cycleData.find(c => c.year === 2024)?.results?.[0]?.total ?? null;
  const general2020 = cycleData.find(c => c.year === 2020)?.results?.[0]?.total ?? null;
  const turnoutDelta = general2024 != null && general2020 != null ? general2024 - general2020 : null;

  const rDPct = recent.dPct;

  if (rDPct >= 0.65) {
    const isSleeping = turnoutDelta !== null && turnoutDelta < -50;
    return {
      classification: "surge", label: "GOTV Surge Target", color: "#1d4ed8", bg: "#dbeafe",
      avgDPct, turnoutDelta,
      summary: `Reliably Democratic (avg ${Math.round(avgDPct * 100)}% D). ${isSleeping ? `Turnout dropped ${Math.abs(turnoutDelta!)} votes from 2020→2024: sleeping Democratic voters.` : "High-yield for turnout investment."}`,
      action: isSleeping ? "Prioritize door-knocks and mail here. Turnout drop means untapped votes." : "High-efficiency canvass target. Every voter contact yields near-certain D votes.",
    };
  }
  if (rDPct >= 0.55) {
    return {
      classification: "hold", label: "Hold & Grow", color: "#059669", bg: "#dcfce7",
      avgDPct, turnoutDelta,
      summary: `Lean Democratic (avg ${Math.round(avgDPct * 100)}% D). Needs defense and modest turnout lift.`,
      action: "Mobilize base with targeted mail. Don't over-invest. Move excess resources to surge precincts.",
    };
  }
  if (rDPct >= 0.44) {
    const isMovingD = recent.dPct > oldest.dPct + 0.03;
    return {
      classification: "persuasion", label: isMovingD ? "Trending D: Persuasion" : "Battleground. Persuasion", color: "#d97706", bg: "#fef3c7",
      avgDPct, turnoutDelta,
      summary: `Competitive battleground (avg ${Math.round(avgDPct * 100)}% D). ${isMovingD ? "Trending blue. Swing voters are moving." : "True coin-flip territory."}`,
      action: "Air cover + persuasion mail. Door-knock undecided voters. This is the margin-of-victory precinct.",
    };
  }
  return {
    classification: "strongR", label: "Republican Stronghold", color: "#dc2626", bg: "#fee2e2",
    avgDPct, turnoutDelta,
    summary: `Consistently Republican (avg ${Math.round(avgDPct * 100)}% D). Low ROI for D investment.`,
    action: "Low priority. Allocate canvass resources elsewhere. Monitor for unexpected demographic shifts.",
  };
}

function FieldIntelCard({ intel }: { intel: FieldIntel }) {
  if (intel.classification === "unknown") return null;
  return (
    <div className="rounded-2xl p-5" style={{ background: intel.bg, border: `1.5px solid ${intel.color}30` }}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.22em] mb-1" style={{ color: intel.color }}>
            Field Intel · Nov 2026 Targeting
          </p>
          <p className="text-sm font-black" style={{ color: intel.color }}>{intel.label}</p>
        </div>
        {intel.turnoutDelta !== null && (
          <div className="text-right flex-shrink-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] mb-0.5" style={{ color: intel.color }}>
              Turnout '20→'24
            </p>
            <p className="text-base font-black" style={{ color: intel.turnoutDelta >= 0 ? "#059669" : "#dc2626" }}>
              {intel.turnoutDelta >= 0 ? "+" : ""}{intel.turnoutDelta.toLocaleString()}
            </p>
          </div>
        )}
      </div>
      <p className="text-xs mb-3 leading-relaxed" style={{ color: "#374151" }}>{intel.summary}</p>
      <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.6)" }}>
        <p className="text-[10px] font-black uppercase tracking-[0.14em] mb-1" style={{ color: intel.color }}>
          Recommended Action
        </p>
        <p className="text-xs leading-relaxed" style={{ color: "#374151" }}>{intel.action}</p>
      </div>
    </div>
  );
}

// Simple partisan bar
function PartisanBar({ pct, size = "md" }: { pct: number; size?: "sm" | "md" | "lg" }) {
  const h = size === "lg" ? 12 : size === "md" ? 8 : 5;
  return (
    <div className="flex rounded-full overflow-hidden" style={{ height: h, background: "#fee2e2" }}>
      <div style={{ width: `${Math.round(pct * 100)}%`, background: "#2563a8", borderRadius: "9999px 0 0 9999px" }} />
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
function PrecinctLookupInner() {
  const [history, setHistory] = useState<PrecinctHistory | null>(null);
  const params = useSearchParams();
  const [input, setInput] = useState(() => params.get("p") ?? "");
  const [searched, setSearched] = useState(() => params.get("p") ?? "");

  useEffect(() => {
    fetch("/data/precinct-history.json").then(r => r.json()).then(setHistory).catch(console.error);
  }, []);

  const prec = searched.trim().replace(/^0+/, "") || "";
  const paddedPrec = prec.padStart(4, "0");

  // Build multi-cycle results for this precinct
  const cycleData = useMemo(() => {
    if (!history || !prec) return null;
    return CYCLES.map(c => ({
      ...c,
      results: getResults(history, c.key, prec),
    })).filter(c => c.results !== null);
  }, [history, prec]);

  // Trend: D% per cycle (presidential/governor only. First general election race)
  const trend = useMemo(() => {
    if (!cycleData) return [];
    return cycleData
      .filter(c => c.results && c.results[0]?.dPct != null)
      .map(c => ({ year: c.year, label: c.label, dPct: c.results![0].dPct! }));
  }, [cycleData]);

  // Swing vs previous cycle
  const swing = useMemo(() => {
    if (trend.length < 2) return null;
    const sorted = [...trend].sort((a, b) => a.year - b.year);
    const last = sorted[sorted.length - 1];
    const prev = sorted[sorted.length - 2];
    return { val: last.dPct - prev.dPct, fromLabel: prev.label, toLabel: last.label };
  }, [trend]);

  // Check if precinct exists in any cycle
  const precExists = cycleData && cycleData.length > 0;

  // Field intel
  const fieldIntel = useMemo(() => {
    if (!cycleData || !trend.length) return null;
    return classifyPrecinct(trend, cycleData);
  }, [trend, cycleData]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearched(input);
  }

  return (
    <div className="topo-light min-h-screen" style={{ background: "var(--background)", fontFamily: "var(--font-outfit, sans-serif)" }}>
      <div className="max-w-3xl mx-auto px-5 py-12">

        {/* Header */}
        <div className="mb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] mb-2" style={{ color: "var(--accent)" }}>
            Harris County Project
          </p>
          <h1 className="text-3xl font-black mb-2" style={{ color: "var(--accent)", fontFamily: "var(--font-playfair, serif)" }}>
            Precinct Voting History
          </h1>
          <p className="text-sm" style={{ color: "#6b7280" }}>
            Enter a Harris County precinct number (0001–1200+) to see how your precinct has voted across the last four election cycles.
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-10">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Enter precinct number, e.g. 0555"
            className="flex-1 px-4 py-3 rounded-xl border text-sm font-semibold"
            style={{ border: "1.5px solid rgba(0,0,0,0.12)", outline: "none", background: "#fff" }}
            maxLength={6}
          />
          <button type="submit"
            className="px-6 py-3 rounded-xl text-sm font-black uppercase tracking-[0.12em] text-white transition-opacity"
            style={{ background: "var(--accent)" }}>
            Look up
          </button>
        </form>

        {!history && (
          <div className="text-center py-16">
            <div className="w-8 h-8 rounded-full border-2 mx-auto mb-3 animate-spin"
              style={{ borderColor: "#2563a8", borderTopColor: "transparent" }} />
            <p className="text-sm" style={{ color: "#9ca3af" }}>Loading election data…</p>
          </div>
        )}

        {history && searched && !precExists && (
          <div className="rounded-xl p-8 text-center" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
            <p className="text-2xl font-black mb-2" style={{ color: "#374151" }}>Precinct {paddedPrec}</p>
            <p className="text-sm" style={{ color: "#9ca3af" }}>No election data found for this precinct number. Try 0001–1200.</p>
          </div>
        )}

        {history && precExists && cycleData && (
          <div className="flex flex-col gap-6">

            {/* Precinct header card */}
            <div className="rounded-2xl p-6 flex items-start gap-6"
              style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.22em] mb-1" style={{ color: "rgba(26,58,92,0.4)" }}>
                  Harris County
                </p>
                <p className="text-4xl font-black" style={{ color: "var(--accent)" }}>
                  Precinct {paddedPrec}
                </p>
                <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
                  {cycleData.length} election cycles on record · {cycleData[0]?.results?.[0]?.total?.toLocaleString() ?? 0} votes in most recent cycle
                </p>
              </div>

              {/* Swing chip */}
              {swing && (
                <div className="ml-auto text-right flex-shrink-0">
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] mb-1" style={{ color: "#9ca3af" }}>
                    Cycle swing
                  </p>
                  <p className="text-2xl font-black"
                    style={{ color: swing.val > 0 ? "#1d4ed8" : "#dc2626" }}>
                    {swing.val > 0 ? "+" : ""}{(swing.val * 100).toFixed(1)}%
                  </p>
                  <p className="text-[9px]" style={{ color: "#9ca3af" }}>
                    {swing.fromLabel.split(" ").pop()} → {swing.toLabel.split(" ").pop()} D
                  </p>
                </div>
              )}
            </div>

            {/* D% Trend chart */}
            {trend.length >= 2 && (
              <div className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] mb-4" style={{ color: "#374151" }}>
                  Democratic Share. Primary Race by Cycle
                </p>
                <div className="flex items-end gap-3" style={{ height: 120 }}>
                  {[...trend].sort((a, b) => a.year - b.year).map(t => {
                    const pct = Math.round(t.dPct * 100);
                    const barH = Math.max(4, (t.dPct * 100));
                    const isD = t.dPct > 0.5;
                    return (
                      <div key={t.year} className="flex flex-col items-center flex-1">
                        <p className="text-[10px] font-black mb-1" style={{ color: isD ? "#1d4ed8" : "#dc2626" }}>
                          {pct}%
                        </p>
                        <div className="w-full rounded-t-lg relative" style={{ height: 80, background: "#f3f4f6" }}>
                          <div className="absolute bottom-0 left-0 right-0 rounded-t-lg transition-all"
                            style={{
                              height: `${barH}%`,
                              background: isD ? "#2563a8" : "#dc2626",
                              opacity: 0.85,
                            }} />
                          <div className="absolute inset-0" style={{
                            height: "50%", top: "50%",
                            background: "rgba(255,255,255,0.15)",
                            borderBottom: "1px dashed rgba(0,0,0,0.1)",
                          }} />
                        </div>
                        <p className="text-[9px] font-bold mt-1" style={{ color: "#9ca3af" }}>{t.year}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-black/8">
                  <span className="flex items-center gap-1.5 text-[9px] font-semibold" style={{ color: "#6b7280" }}>
                    <span className="inline-block w-3 h-3 rounded-sm" style={{ background: "#2563a8" }} />
                    Democratic majority
                  </span>
                  <span className="flex items-center gap-1.5 text-[9px] font-semibold" style={{ color: "#6b7280" }}>
                    <span className="inline-block w-3 h-3 rounded-sm" style={{ background: "#dc2626" }} />
                    Republican majority
                  </span>
                  <span className="text-[9px] ml-auto" style={{ color: "#9ca3af" }}>
                    Dashed line = 50% threshold
                  </span>
                </div>
              </div>
            )}

            {/* Field Intel card */}
            {fieldIntel && <FieldIntelCard intel={fieldIntel} />}

            {/* Per-cycle results */}
            <div className="flex flex-col gap-4">
              {cycleData.map(c => (
                <div key={c.key} className="rounded-2xl overflow-hidden"
                  style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
                  <div className="px-5 py-3 border-b border-black/8 flex items-center justify-between"
                    style={{ background: "rgba(0,0,0,0.02)" }}>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: "var(--accent)" }}>
                      {c.label}
                    </p>
                    <Link href="/tools/heat-check"
                      className="text-[9px] font-semibold uppercase tracking-[0.14em] hover:opacity-70 transition-opacity"
                      style={{ color: "#9ca3af" }}>
                      View map →
                    </Link>
                  </div>

                  <div className="divide-y divide-black/4">
                    {c.results!.map((r, i) => {
                      const isD = (r.dPct ?? 0) > 0.5;
                      const margin = Math.abs((r.dPct ?? 0.5) - 0.5) * 2;
                      return (
                        <div key={i} className="px-5 py-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: "#6b7280" }}>
                              {r.race}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                                style={{ background: isD ? "#dbeafe" : "#fee2e2", color: isD ? "#1d4ed8" : "#dc2626" }}>
                                {isD ? "D+" : "R+"}{Math.round(margin * 100)}
                              </span>
                              <span className="text-[9px]" style={{ color: "#9ca3af" }}>
                                {r.total.toLocaleString()} votes
                              </span>
                            </div>
                          </div>

                          {r.dPct != null && <PartisanBar pct={r.dPct} size="md" />}

                          <div className="flex justify-between mt-2">
                            <div>
                              <p className="text-xs font-bold" style={{ color: "#1d4ed8" }}>
                                {r.dName}
                              </p>
                              <p className="text-[10px]" style={{ color: "#6b7280" }}>
                                {r.d.toLocaleString()} votes · {r.dPct != null ? Math.round(r.dPct * 100) : "–"}%
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-bold" style={{ color: "#dc2626" }}>
                                {r.rName}
                              </p>
                              <p className="text-[10px]" style={{ color: "#6b7280" }}>
                                {r.r.toLocaleString()} votes · {r.dPct != null ? 100 - Math.round(r.dPct * 100) : "–"}%
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer note */}
            <p className="text-[10px] text-center" style={{ color: "#9ca3af" }}>
              Source: Harris County Clerk · Two-party vote share (D vs R) shown for all cycles ·{" "}
              <Link href="/tools/heat-check" className="underline hover:opacity-70">View full county map</Link>
            </p>
          </div>
        )}

        {/* Quick examples if no search */}
        {history && !searched && (
          <div className="mt-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: "#9ca3af" }}>
              Try a precinct
            </p>
            <div className="flex flex-wrap gap-2">
              {["0555", "0563", "0404", "1001", "0202", "0876"].map(p => (
                <button key={p} onClick={() => { setInput(p); setSearched(p); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold hover:opacity-80 transition-opacity"
                  style={{ background: "#f3f4f6", color: "#374151" }}>
                  Precinct {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PrecinctLookup() {
  return (
    <Suspense>
      <PrecinctLookupInner />
    </Suspense>
  );
}
