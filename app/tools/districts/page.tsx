"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { GeoJsonObject } from "geojson";
import { POLITICIANS } from "@/lib/politicians";
import type { Politician } from "@/lib/politicians";
import { DISTRICT_INFO } from "@/lib/districts-data";
import { getMatchup } from "@/lib/matchups-2026";
import { getFinanceByName, fmt } from "@/lib/campaign-finance";
import crosswalkRaw from "@/lib/precinct-crosswalk.json";
import ShareButton from "@/components/ShareButton";
import DistrictHistory from "@/components/DistrictHistory";
import TerrainReport from "@/components/TerrainReport";
import DistrictHeatMap from "@/components/DistrictHeatMap";
import VoterDemographics from "@/components/VoterDemographics";
import { useUrlState, readUrlParams } from "@/lib/useUrlState";
import type { MapLayer, PrecinctTurnout, ResultsUpload, PrecinctFeature } from "./DistrictsMap";

const DistrictsMap = dynamic(() => import("./DistrictsMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center animate-pulse" style={{ height: 540, background: "#f0f4f8" }}>
      <p className="text-xs" style={{ color: "#9ca3af" }}>Loading map…</p>
    </div>
  ),
});

const CROSSWALK = (crosswalkRaw as { precincts: Record<string, { hd?: string; sd?: string; cd?: string; jp?: string; council?: string; pct?: string }> }).precincts;

type DistrictField = "cd" | "sd" | "hd" | "jp" | "council" | "pct";
type TypeKey = DistrictField | "countywide";

const TYPES: { key: TypeKey; label: string }[] = [
  { key: "countywide", label: "Countywide" },
  { key: "cd",      label: "Congress" },
  { key: "sd",      label: "State Senate" },
  { key: "hd",      label: "State House" },
  { key: "jp",      label: "JP / Constable" },
  { key: "pct",     label: "Commissioner" },
  { key: "council", label: "City Council" },
];

// Real district lists derived from the precinct crosswalk (centroid point-in-polygon)
const DISTRICT_LISTS: Record<DistrictField, string[]> = (() => {
  const sets: Record<DistrictField, Map<string, number>> = { cd: new Map(), sd: new Map(), hd: new Map(), jp: new Map(), council: new Map(), pct: new Map() };
  for (const v of Object.values(CROSSWALK)) {
    (Object.keys(sets) as DistrictField[]).forEach(k => {
      const val = v[k];
      if (val) sets[k].set(val, (sets[k].get(val) ?? 0) + 1);
    });
  }
  const list = (k: DistrictField, numeric: boolean) =>
    [...sets[k].entries()].filter(([, n]) => n > 3).map(([d]) => d)
      .sort((a, b) => numeric ? parseInt(a) - parseInt(b) : a.localeCompare(b));
  return { cd: list("cd", true), sd: list("sd", true), hd: list("hd", true), jp: list("jp", true), council: list("council", false), pct: list("pct", true) };
})();

function districtKey(type: TypeKey, value: string | null): string {
  if (type === "countywide") return "HC-Countywide";
  if (!value) return "";
  if (type === "cd") return `CD-${value}`;
  if (type === "sd") return `SD-${value}`;
  if (type === "hd") return `HD-${value}`;
  if (type === "jp") return `HC-JP${value}`;
  if (type === "pct") return `PCT-${value}`;
  return `COH-District ${value}`;
}

function politicianLabel(type: TypeKey, value: string | null): string {
  if (type === "countywide") return "Countywide";
  if (!value) return "";
  if (type === "cd") return `CD-${value}`;
  if (type === "sd") return `SD-${value}`;
  if (type === "hd") return `HD-${value}`;
  if (type === "jp") return `JP ${value}`;
  if (type === "pct") return `Precinct ${value}`;
  return `District ${value}`;
}

function headerLabel(type: TypeKey, value: string | null): string {
  if (type === "countywide") return "Harris County";
  if (!value) return "";
  if (type === "cd") return `Congressional District ${value}`;
  if (type === "sd") return `Senate District ${value}`;
  if (type === "hd") return `House District ${value}`;
  if (type === "jp") return `JP / Constable Precinct ${value}`;
  if (type === "pct") return `Commissioner Precinct ${value}`;
  return `Council District ${value}`;
}

/* ── Kalshi prediction-market strip inside the VS card ────────────────────── */
interface KalshiOdds { available: boolean; label?: string; demProb?: number; repProb?: number; volume?: number; url?: string }

function KalshiStrip({ dKey }: { dKey: string }) {
  const [odds, setOdds] = useState<KalshiOdds | null>(null);
  useEffect(() => {
    let alive = true;
    setOdds(null);
    fetch(`/api/kalshi?race=${encodeURIComponent(dKey)}`)
      .then(r => r.json())
      .then(d => { if (alive) setOdds(d); })
      .catch(() => { if (alive) setOdds({ available: false }); });
    return () => { alive = false; };
  }, [dKey]);

  if (!odds || !odds.available) return null;

  return (
    <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.4)" }}>
          Market Odds — Who Wins
        </p>
        <a href={odds.url} target="_blank" rel="noopener noreferrer"
          className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full hover:opacity-80 transition-opacity"
          style={{ background: "rgba(74,222,128,0.15)", color: "#4ade80" }}>
          Kalshi ↗
        </a>
      </div>
      <div className="flex items-center gap-3">
        <span className="tnum text-sm font-bold w-12" style={{ color: "#7aaee8" }}>{odds.demProb}%</span>
        <div className="flex-1 h-3 rounded-full overflow-hidden flex" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div className="h-full transition-all duration-700" style={{ width: `${odds.demProb}%`, background: "#7aaee8" }} />
          <div className="h-full transition-all duration-700" style={{ width: `${odds.repProb}%`, background: "#f08080" }} />
        </div>
        <span className="tnum text-sm font-bold w-12 text-right" style={{ color: "#f08080" }}>{odds.repProb}%</span>
      </div>
      <p className="text-[9px] mt-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
        Implied win probability from Kalshi&rsquo;s &ldquo;{odds.label}&rdquo; margin markets
        {odds.volume ? ` · ${odds.volume.toLocaleString()} contracts open` : ""} · not a poll, real-money market
      </p>
    </div>
  );
}

/* ── VS card — incumbent vs challenger with money ─────────────────────────── */
function VsCard({ dKey, office }: { dKey: string; office: string }) {
  const matchup = getMatchup(dKey === "US-Senate" ? "US-Senate" : dKey);
  const pol = POLITICIANS.find((p: Politician) => p.district === office);

  // Build the two sides — from matchup data, falling back to incumbent + TBD
  const sides = matchup?.sides ?? (pol ? [{ name: pol.name, party: pol.party as "D" | "R", incumbent: true }] : []);
  if (sides.length === 0) return null;

  const enriched = sides.map(s => {
    const fin = getFinanceByName(s.name);
    const p = POLITICIANS.find((x: Politician) => x.name === s.name);
    return { ...s, cash: fin?.cash ?? 0, raised: fin?.raised, spent: fin?.spent, loans: fin?.loans, asOf: fin?.asOf, photo: p?.photo };
  });
  while (enriched.length < 2) {
    enriched.push({ name: "Challenger", party: enriched[0].party === "D" ? "R" : "D", incumbent: false, note: "Awaiting filings", cash: 0, raised: undefined, spent: undefined, loans: undefined, asOf: undefined, photo: undefined });
  }
  const maxCash = Math.max(...enriched.map(s => s.cash), 1);

  return (
    <div className="rounded-[1.35rem] mt-4" style={{ background: "#1a2e44" }}>
      <div className="rounded-[1.35rem] p-5" style={{ background: "#1a3a5c" }}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.4)" }}>November 2026 — The Matchup</p>
          {matchup?.status === "runoff-pending" && (
            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24" }}>Runoff Pending</span>
          )}
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3">
          {enriched.slice(0, 2).map((s, i) => {
            const isD = s.party === "D";
            const accent = isD ? "#7aaee8" : "#f08080";
            return (
              <div key={i} className={`flex flex-col ${i === 0 ? "items-start text-left" : "items-end text-right"} gap-2`}>
                <div className="flex items-center gap-3" style={{ flexDirection: i === 0 ? "row" : "row-reverse" }}>
                  {s.photo ? (
                    <img src={s.photo} alt={s.name} className="w-14 h-14 rounded-full object-cover shrink-0"
                      style={{ outline: `2.5px solid ${accent}`, outlineOffset: 2 }} />
                  ) : (
                    <div className="w-14 h-14 rounded-full shrink-0 flex items-center justify-center text-white font-bold text-sm"
                      style={{ background: s.name === "Challenger" ? "rgba(255,255,255,0.2)" : `${accent}33`, border: `1.5px solid ${accent}40`, color: accent }}>
                      {s.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-sm leading-tight" style={{ color: "#fff", fontFamily: "var(--font-playfair,serif)" }}>{s.name}</p>
                    <div className={`flex items-center gap-1.5 mt-1 ${i === 0 ? "" : "justify-end"}`}>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.1)", color: accent }}>
                        {s.party === "D" ? "Dem" : "Rep"}
                      </span>
                      {s.incumbent && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(52,211,153,0.15)", color: "#34d399" }}>Inc</span>}
                    </div>
                  </div>
                </div>
                {/* Money */}
                <div className="w-full">
                  <p className="text-xl font-bold" style={{ color: accent, fontFamily: "var(--font-playfair,serif)" }}>
                    {s.cash > 0 ? fmt(s.cash) : "—"}
                  </p>
                  <p className="text-[9px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>
                    Cash on hand{s.asOf ? ` · ${s.asOf}` : ""}
                  </p>
                  <div className={`h-[5px] rounded-full overflow-hidden mt-1.5 ${i === 0 ? "" : "scale-x-[-1]"}`} style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${(s.cash / maxCash) * 100}%`, background: accent }} />
                  </div>
                  {(s.raised != null || s.spent != null || (s.loans ?? 0) > 0) && (
                    <p className="tnum text-[9px] mt-1.5 leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
                      {s.raised != null && <>Raised {fmt(s.raised)}<br /></>}
                      {s.spent != null && <>Spent {fmt(s.spent)}<br /></>}
                      {(s.loans ?? 0) > 0 && <>Loans {fmt(s.loans!)}</>}
                    </p>
                  )}
                </div>
                {s.note && <p className="text-[10px] italic" style={{ color: "rgba(255,255,255,0.35)" }}>{s.note}</p>}
              </div>
            );
          })}

          {/* VS divider */}
          <div className="row-start-1 col-start-2 self-center flex flex-col items-center px-1">
            <span className="text-2xl font-black" style={{ fontFamily: "var(--font-playfair,serif)", color: "rgba(255,255,255,0.25)" }}>VS</span>
          </div>
        </div>

        <KalshiStrip dKey={dKey} />

        {/* Link to full finance page */}
        <div className="mt-4 pt-3 flex items-center justify-between" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          {matchup?.detail ? (
            <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>{matchup.detail}</p>
          ) : !matchup ? (
            <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
              Challenger filings for this seat have not been confirmed yet.
            </p>
          ) : <span />}
          <Link href="/tools/where-is-the-dough"
            className="ml-4 shrink-0 text-[10px] font-bold hover:opacity-80 transition-opacity"
            style={{ color: "#4ade80" }}>
            Full finance →
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── Win Number card ──────────────────────────────────────────────────────── */
interface WinNum {
  precinctCount: number;
  turnout2022: number;
  dVotes2022: number;
  dPct2022: number | null;
  estimatedTurnout2026: number;
  targetDVotes: number;
  gap: number;
  status: "ahead" | "behind" | "toss-up";
  primary2026DemBallots: number;
  primary2026RepBallots: number;
  primary2026DemEdge: number;
}

function WinNumber({ dKey }: { dKey: string }) {
  const [data, setData] = useState<WinNum | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setData(null);
    fetch(`/api/districts/win-number?district=${encodeURIComponent(dKey)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [dKey]);

  if (loading) return (
    <div className="rounded-[1.35rem] bg-white/70 ring-1 ring-black/8 p-[4px] mt-4">
      <div className="rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] p-4">
        <div className="h-3 w-24 rounded bg-gray-100 animate-pulse mb-4" />
        <div className="h-8 w-32 rounded bg-gray-100 animate-pulse" />
      </div>
    </div>
  );
  if (!data) return null;

  const fmt = (n: number) => n.toLocaleString();
  const gapAbs = Math.abs(data.gap);
  const isAhead = data.gap <= 0;
  const gapColor = isAhead ? "#16a34a" : "#dc2626";
  const primEdgePos = data.primary2026DemEdge > 0;

  return (
    <div className="rounded-[1.35rem] bg-white/70 ring-1 ring-black/8 p-[4px] mt-4">
      <div className="rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: "#6b7280" }}>
          Win Number — 2026 Outlook
        </p>

        {/* Target to win + progress bar */}
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-black tabular-nums leading-none" style={{ color: "#1a3a5c", fontFamily: "var(--font-playfair,serif)" }}>
            {fmt(data.targetDVotes)}
          </span>
          <span className="text-[11px]" style={{ color: "#9ca3af" }}>D votes needed to win</span>
        </div>

        {/* Progress bar: 2022 baseline vs. target */}
        {data.dVotes2022 > 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-[9px] mb-1">
              <span style={{ color: "#2563a8" }} className="font-semibold">2022 base: {fmt(data.dVotes2022)}</span>
              <span style={{ color: "#9ca3af" }}>
                {Math.round(Math.min(data.dVotes2022 / data.targetDVotes * 100, 100))}% of win number
              </span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "#e5e7eb" }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(data.dVotes2022 / data.targetDVotes * 100, 100)}%`,
                  background: data.dVotes2022 >= data.targetDVotes ? "#16a34a" : "#2563a8",
                }} />
            </div>
            {data.dVotes2022 < data.targetDVotes && (
              <p className="text-[9px] mt-0.5" style={{ color: "#9ca3af" }}>
                Need {fmt(data.targetDVotes - data.dVotes2022)} more than 2022 off-year
              </p>
            )}
          </div>
        )}

        {/* Gap status bar */}
        <div className={`rounded-lg px-3 py-2 mb-4 flex items-center gap-2`}
          style={{ background: isAhead ? "#f0fdf4" : "#fef2f2" }}>
          <span className="text-lg">{isAhead ? "▲" : "▼"}</span>
          <div>
            <p className="text-[12px] font-bold" style={{ color: gapColor }}>
              {isAhead ? `${fmt(gapAbs)} votes ahead of target` : `${fmt(gapAbs)} more votes needed`}
            </p>
            <p className="text-[10px]" style={{ color: "#9ca3af" }}>
              vs. 2022 governor baseline ({data.dPct2022}% D)
            </p>
          </div>
        </div>

        {/* Key numbers grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: "2022 D Votes", value: fmt(data.dVotes2022), sub: "off-year base" },
            { label: "2022 Total", value: fmt(data.turnout2022), sub: "actual turnout" },
            { label: "Est. 2026 Total", value: fmt(data.estimatedTurnout2026), sub: "reg-adjusted" },
          ].map(s => (
            <div key={s.label} className="text-center rounded-xl py-2 px-1" style={{ background: "#f8f9fa" }}>
              <p className="text-sm font-bold leading-none" style={{ color: "#1a3a5c" }}>{s.value}</p>
              <p className="text-[9px] mt-1 uppercase tracking-wider leading-tight" style={{ color: "#9ca3af" }}>{s.label}</p>
              <p className="text-[8px] leading-tight mt-0.5" style={{ color: "#cbd5e1" }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* 2026 primary edge signal */}
        {(data.primary2026DemBallots + data.primary2026RepBallots) > 0 && (
          <div className="pt-3 border-t border-gray-100">
            <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: "#9ca3af" }}>March 2026 Primary Edge</p>
            <p className="text-[11px] font-semibold" style={{ color: primEdgePos ? "#2563a8" : "#dc2626" }}>
              {primEdgePos ? "+" : ""}{fmt(data.primary2026DemEdge)} Dem ballot edge
            </p>
            <div className="flex justify-between text-[10px] mt-0.5" style={{ color: "#9ca3af" }}>
              <span>D {fmt(data.primary2026DemBallots)}</span>
              <span>R {fmt(data.primary2026RepBallots)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Results upload (election night mode) ─────────────────────────────────── */
function parseResultsCsv(text: string): ResultsUpload | null {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return null;
  const header = lines[0].split(",").map(s => s.trim());
  if (header.length < 2) return null;
  const candidates = header.slice(1);
  const byPrecinct: Record<string, number[]> = {};
  for (const line of lines.slice(1)) {
    const cells = line.split(",").map(s => s.trim());
    const prec = cells[0].padStart(4, "0");
    byPrecinct[prec] = candidates.map((_, i) => parseInt(cells[i + 1] ?? "0", 10) || 0);
  }
  return { candidates, byPrecinct };
}

/* ── Voter profile under the VS card ──────────────────────────────────────── */
interface CvapEntry { total: number; asian?: number; black?: number; white?: number; hispanic?: number }
export interface CvapData { cvap: { cd: Record<string, CvapEntry>; sd: Record<string, CvapEntry>; hd: Record<string, CvapEntry> } }

const RACE_LABELS: [keyof CvapEntry, string, string][] = [
  ["black", "Black", "#7c3aed"],
  ["hispanic", "Hispanic/Latino", "#ea580c"],
  ["white", "White", "#2563a8"],
  ["asian", "Asian", "#0891b2"],
];

function VoterProfile({ type, district, agg, cvap }: {
  type: TypeKey; district: string | null;
  agg: { dem: number; rep: number; count: number; total: number };
  cvap: CvapData | null;
}) {
  const entry = (type === "cd" || type === "sd" || type === "hd") && district && cvap
    ? cvap.cvap[type]?.[district] : null;
  const demPct = agg.total ? Math.round((agg.dem / agg.total) * 100) : 0;
  const turnoutRate = entry?.total ? Math.round((agg.total / entry.total) * 1000) / 10 : null;

  return (
    <div className="rounded-[1.35rem] bg-white/70 ring-1 ring-black/8 p-[4px] mt-4">
      <div className="rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-4" style={{ color: "#6b7280" }}>
          Who Actually Votes Here
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: "#9ca3af" }}>Party of 2026 primary voters</p>
            <p className="text-lg font-bold" style={{ color: "#1a3a5c", fontFamily: "var(--font-playfair,serif)" }}>
              {demPct}% D · {100 - demPct}% R
            </p>
            <div className="h-2 rounded-full overflow-hidden mt-1.5" style={{ background: "#fecaca" }}>
              <div className="h-full" style={{ width: `${demPct}%`, background: "#2563a8" }} />
            </div>
            <p className="text-[9px] mt-1" style={{ color: "#9ca3af" }}>{agg.total.toLocaleString()} ballots cast</p>
          </div>

          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: "#9ca3af" }}>Primary turnout rate</p>
            {turnoutRate !== null ? (
              <>
                <p className="text-lg font-bold" style={{ color: "#1a3a5c", fontFamily: "var(--font-playfair,serif)" }}>{turnoutRate}%</p>
                <p className="text-[9px] mt-1 leading-relaxed" style={{ color: "#9ca3af" }}>
                  of {entry!.total.toLocaleString()} citizens of voting age (Census CVAP 2019–23)
                </p>
              </>
            ) : (
              <p className="text-[11px] italic mt-1" style={{ color: "#9ca3af" }}>
                CVAP published for Congressional, State Senate &amp; House districts only
              </p>
            )}
          </div>

          <div className="col-span-2">
            <p className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#9ca3af" }}>
              Citizen voting-age population by race/ethnicity
            </p>
            {entry ? (
              <div className="flex flex-col gap-1.5">
                {RACE_LABELS.map(([k, label, color]) => {
                  const v = entry[k] ?? 0;
                  const pct = entry.total ? Math.round((v / entry.total) * 100) : 0;
                  return (
                    <div key={k} className="flex items-center gap-2">
                      <span className="text-[10px] w-24 shrink-0" style={{ color: "#6b7280" }}>{label}</span>
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "#f3f4f6" }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                      </div>
                      <span className="text-[10px] font-bold w-8 text-right" style={{ color: "#1a3a5c" }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[11px] italic" style={{ color: "#9ca3af" }}>
                Not published at this district level — Census releases CVAP for Congressional, State Senate and State House geographies.
              </p>
            )}
          </div>
        </div>

        <p className="text-[10px] leading-relaxed mt-4 pt-3" style={{ color: "#9ca3af", borderTop: "1px solid #f3f4f6" }}>
          Age ranges, turnout across the last 3 elections, and primary-vs-general participation require the Harris County
          voter file with vote history (harrisvotes.com → Voter Registration Data Request). Racial composition above is the
          citizen voting-age population — the closest public proxy for the electorate; per-voter race is not in public data.
        </p>
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────────────────────── */
export default function DistrictsPage() {
  const [geojson, setGeojson] = useState<GeoJsonObject | null>(null);
  const [turnout, setTurnout] = useState<Record<string, PrecinctTurnout>>({});
  const [cvap, setCvap] = useState<CvapData | null>(null);
  const [type, setType] = useState<TypeKey>("cd");
  const [district, setDistrict] = useState<string | null>("18");
  const [layer, setLayer] = useState<MapLayer>("votes");
  const [results, setResults] = useState<ResultsUpload | null>(null);
  const [selectedPrecinct, setSelectedPrecinct] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    fetch("/data/harris-precincts.geojson").then(r => r.json()).then(setGeojson).catch(() => setMapError(true));
    fetch("/data/precinct-turnout-2026.json").then(r => r.json()).then(d => setTurnout(d.precincts ?? {})).catch(() => {});
    fetch("/data/cvap-districts.json").then(r => r.json()).then(setCvap).catch(() => {});
    // Hydrate view from shared-link params
    const p = readUrlParams(["type", "district", "layer"]);
    if (p.type && TYPES.some(t => t.key === p.type)) setType(p.type as TypeKey);
    if (p.district) setDistrict(p.district);
    if (p.layer === "population" || p.layer === "votes") setLayer(p.layer);
  }, []);
  useUrlState(
    { type, district: district ?? undefined, layer },
    { type: "cd", district: "18", layer: "votes" }
  );

  const districtField: DistrictField | null = type === "countywide" ? null : type;
  const dKey = districtKey(type, district);
  const polLabel = politicianLabel(type, district);
  const info = DISTRICT_INFO[dKey];
  const currentRep = POLITICIANS.find((p: Politician) => p.district === polLabel);

  // Real turnout aggregates for the selected district
  const agg = useMemo(() => {
    let dem = 0, rep = 0, count = 0;
    for (const [prec, t] of Object.entries(turnout)) {
      if (districtField && district && CROSSWALK[prec]?.[districtField] !== district) continue;
      dem += t.dem; rep += t.rep; count++;
    }
    return { dem, rep, count, total: dem + rep };
  }, [turnout, districtField, district]);

  const demPct = agg.total ? Math.round((agg.dem / agg.total) * 100) : 0;

  function pickType(t: TypeKey) {
    setType(t);
    setSelectedPrecinct(null);
    setDistrict(t === "countywide" ? null : DISTRICT_LISTS[t as DistrictField][0]);
  }

  function onUpload(file: File) {
    file.text().then(text => {
      let parsed: ResultsUpload | null = null;
      if (file.name.endsWith(".json")) {
        try {
          const j = JSON.parse(text);
          if (j.candidates && j.byPrecinct) parsed = j;
        } catch { /* fall through */ }
      } else {
        parsed = parseResultsCsv(text);
      }
      if (parsed) { setResults(parsed); setLayer("results"); }
    });
  }

  return (
    <div style={{ background: "#f5f3ef", minHeight: "100vh", fontFamily: "var(--font-outfit,sans-serif)" }}>
      {/* Hero */}
      <section className="relative overflow-hidden topo-dark"
        style={{ background: "linear-gradient(135deg,#1a3a5c 0%,#0f2540 60%,#162e4a 100%)", paddingTop: "3.5rem", paddingBottom: "3.5rem" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 70% 60% at 80% 40%,rgba(37,99,168,0.18) 0%,transparent 70%)" }} />
        <div className="relative max-w-7xl mx-auto px-5">
          <p className="text-sky-300 text-xs font-bold uppercase tracking-[0.22em] mb-3">Elections · Representation</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-playfair,serif)" }}>
            Districts
          </h1>
          <p className="text-white/50 text-sm max-w-lg">
            Every Harris County voting precinct, mapped to its real districts. See who votes, who represents the seat, and the matchup for November.
          </p>
          <ShareButton
            toolName="Districts"
            section="Elections"
            description="Every Harris County voting precinct, mapped to its real districts."
            summary={`${headerLabel(type, district)} — ${agg.total.toLocaleString()} 2026 primary ballots across ${agg.count} precincts (${demPct}% Dem) — via The Harris County Project`}
            stats={[
              { label: "District", value: headerLabel(type, district) },
              { label: "Primary ballots", value: agg.total.toLocaleString() },
              { label: "Dem share", value: `${demPct}%` },
            ]}
          />
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-5 py-8">
        <div className="flex flex-col xl:flex-row gap-6">

          {/* Left: controls + map + VS card */}
          <div className="flex-1 min-w-0">

            {/* Type pills */}
            <div className="chip-row mb-3">
              {TYPES.map(t => (
                <button key={t.key} onClick={() => pickType(t.key)}
                  className="pressable rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200"
                  style={{
                    background: type === t.key ? "#1a3a5c" : "#fff",
                    color:      type === t.key ? "#fff" : "#374151",
                    border:     `1.5px solid ${type === t.key ? "#1a3a5c" : "#e5e7eb"}`,
                  }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* District chips */}
            {districtField && (
              <div className="chip-row mb-4" style={{ gap: "0.375rem" }}>
                {DISTRICT_LISTS[districtField].map(d => (
                  <button key={d} onClick={() => { setDistrict(d); setSelectedPrecinct(null); }}
                    className="pressable rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150"
                    style={{
                      background: district === d ? "#1a3a5c" : "#fff",
                      color:      district === d ? "#fff" : "#374151",
                      border:     `1.5px solid ${district === d ? "#1a3a5c" : "#e5e7eb"}`,
                    }}>
                    {d}
                  </button>
                ))}
              </div>
            )}

            {/* Layer toggle */}
            <div className="chip-row items-center mb-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "#6b7280" }}>Layer:</span>
              {([
                { key: "votes",      label: "Who Votes — 2026 Primary", live: true },
                { key: "population", label: "Population Demographics",  live: false },
                { key: "results",    label: "Election Night Results",   live: !!results },
              ] as { key: MapLayer; label: string; live: boolean }[]).map(l => (
                <button key={l.key} onClick={() => setLayer(l.key)}
                  className="rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition-all duration-200 flex items-center gap-1.5"
                  style={{
                    background: layer === l.key ? "#2563a8" : "#fff",
                    color:      layer === l.key ? "#fff" : "#374151",
                    border:     `1.5px solid ${layer === l.key ? "#2563a8" : "#e5e7eb"}`,
                  }}>
                  {l.label}
                  {!l.live && <span className="text-[8px] font-bold uppercase px-1 py-px rounded" style={{ background: layer === l.key ? "rgba(255,255,255,0.25)" : "#f3f4f6", color: layer === l.key ? "#fff" : "#9ca3af" }}>
                    {l.key === "results" ? "Upload" : "Pending"}
                  </span>}
                </button>
              ))}
            </div>

            {/* Layer-specific banners */}
            {layer === "population" && (
              <div className="rounded-xl px-4 py-3 mb-3 text-[11px] leading-relaxed" style={{ background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e" }}>
                <strong>Population demographics need one thing from you:</strong> a free Census API key (instant signup at api.census.gov/data/key_signup.html — the API now requires it).
                With the key set as <code>CENSUS_API_KEY</code>, this layer auto-fills with ACS race/ethnicity, age, and citizen-voting-age population for every district shown here. No other work needed.
              </div>
            )}
            {layer === "results" && !results && (
              <div className="rounded-xl px-4 py-3 mb-3 text-[11px] leading-relaxed flex items-center justify-between gap-3" style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e40af" }}>
                <span>
                  <strong>Election night mode.</strong> Upload precinct results as they come in — CSV with header
                  <code className="mx-1">precinct,Candidate A,Candidate B</code> — and the map colors each precinct by who&rsquo;s leading.
                </span>
                <button onClick={() => fileRef.current?.click()}
                  className="shrink-0 rounded-full px-4 py-1.5 text-[11px] font-bold text-white" style={{ background: "#2563a8" }}>
                  Upload CSV
                </button>
                <input ref={fileRef} type="file" accept=".csv,.json" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); }} />
              </div>
            )}
            {layer === "results" && results && (
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                {results.candidates.map((c, i) => (
                  <span key={c} className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: "#374151" }}>
                    <span className="inline-block w-3 h-3 rounded-sm" style={{ background: ["#1d4ed8","#dc2626","#16a34a","#7c3aed","#ea580c","#0891b2","#be185d","#b45309"][i % 8] }} />
                    {c}
                  </span>
                ))}
                <button onClick={() => fileRef.current?.click()} className="text-[10px] font-bold underline" style={{ color: "#2563a8" }}>
                  Upload new file
                </button>
                <input ref={fileRef} type="file" accept=".csv,.json" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); }} />
              </div>
            )}
            {layer === "votes" && (
              <div className="flex items-center gap-4 mb-3 text-[11px] flex-wrap" style={{ color: "#6b7280" }}>
                <span className="font-semibold uppercase tracking-wider text-[10px]">Primary ballots cast:</span>
                {[
                  { color: "#1e3a8a", label: "Heavy Dem" },
                  { color: "#7ea8d8", label: "Lean Dem" },
                  { color: "#a78bfa", label: "Split" },
                  { color: "#e58f8f", label: "Lean Rep" },
                  { color: "#991b1b", label: "Heavy Rep" },
                  { color: "#c8c4be", label: "Outside district" },
                ].map(l => (
                  <span key={l.label} className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded-sm" style={{ background: l.color }} />
                    {l.label}
                  </span>
                ))}
              </div>
            )}

            {/* Map — Heat Check treatment */}
            <div className="rounded-[1.35rem] bg-white/70 ring-1 ring-black/8 p-[4px]">
              <div className="rounded-[1rem] overflow-hidden bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
                {mapError ? (
                  <div className="empty-state" style={{ height: 540, border: "none" }}>
                    <p className="text-sm font-semibold" style={{ color: "#1a3a5c" }}>The precinct map didn&rsquo;t load.</p>
                    <p className="text-xs max-w-xs">Usually a network hiccup — the boundary file is ~1MB.</p>
                    <button onClick={() => { setMapError(false); fetch("/data/harris-precincts.geojson").then(r => r.json()).then(setGeojson).catch(() => setMapError(true)); }}
                      className="pressable mt-2 rounded-full px-5 py-2 text-xs font-bold text-white" style={{ background: "#1a3a5c" }}>
                      Try again
                    </button>
                  </div>
                ) : (
                <DistrictsMap
                  geojson={geojson}
                  crosswalk={CROSSWALK}
                  districtField={districtField}
                  districtValue={district}
                  layer={layer}
                  turnout={turnout}
                  results={results}
                  selectedPrecinct={selectedPrecinct}
                  onPrecinctClick={setSelectedPrecinct}
                />
                )}
              </div>
            </div>
            <p className="mt-2 text-[11px]" style={{ color: "#9ca3af" }}>
              Precinct shapes: Harris County Clerk. Congressional districts: 2025 enacted plan PLANC2333 (Texas Legislative Council). State + local: Census TIGER 2024 + Harris County/Houston GIS.
              Ballots cast: March 2026 primary, top-of-ticket race.
            </p>

            {/* VS card */}
            <VsCard dKey={type === "countywide" ? "HC-Countywide" : dKey} office={polLabel} />
            <VoterProfile type={type} district={district} agg={agg} cvap={cvap} />
            <VoterDemographics
              districtField={districtField}
              districtValue={district}
            />

            {/* Historical depth layer — four cycles, combined view, surname module */}
            <div className="mt-4">
              <DistrictHistory field={districtField} value={district} />
            </div>

            {/* Partisan heatmap — Heat Check filtered to this district */}
            <DistrictHeatMap
              districtField={districtField}
              districtValue={district}
              districtLabel={headerLabel(type, district)}
            />

            {/* Terrain Report — turnout signals */}
            <div className="mt-4">
              <TerrainReport types={["turnout"]} compact />
            </div>
          </div>

          {/* Right: Seat Portrait */}
          <div className="w-full xl:w-[340px] shrink-0 space-y-4">
            {/* Header */}
            <div className="rounded-[1.35rem] bg-white/70 ring-1 ring-black/8 p-[4px]">
              <div className="rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1" style={{ color: "#2563a8" }}>
                  {TYPES.find(t => t.key === type)?.label}
                </p>
                <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: "var(--font-playfair,serif)", color: "#1a3a5c" }}>
                  {headerLabel(type, district)}
                </h2>
                {info?.description && (
                  <p className="text-[12px] leading-relaxed" style={{ color: "#6b7280" }}>{info.description}</p>
                )}
              </div>
            </div>

            {/* Current rep */}
            {currentRep && (
              <div className="rounded-[1.35rem] bg-white/70 ring-1 ring-black/8 p-[4px]">
                <div className="rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: "#6b7280" }}>Current Representative</p>
                  <Link href={`/politicians/${currentRep.slug}`} className="flex items-center gap-3 group">
                    {currentRep.photo && (
                      <img src={currentRep.photo} alt={currentRep.name}
                        className="w-14 h-14 rounded-full object-cover shrink-0"
                        style={{ outline: `2px solid ${currentRep.party === "D" ? "#2563a8" : "#dc2626"}`, outlineOffset: 2 }} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm group-hover:underline" style={{ color: "#1a3a5c" }}>{currentRep.name}</p>
                      <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-bold mt-1"
                        style={{
                          background: currentRep.party === "D" ? "#dbeafe" : "#fee2e2",
                          color:      currentRep.party === "D" ? "#1d4ed8" : "#dc2626",
                        }}>
                        {currentRep.party === "D" ? "Democrat" : currentRep.party === "R" ? "Republican" : "Nonpartisan"}
                      </span>
                      {currentRep.note && <p className="text-[10px] mt-1" style={{ color: "#b45309" }}>{currentRep.note}</p>}
                    </div>
                  </Link>
                </div>
              </div>
            )}

            {/* Real turnout stats */}
            {agg.total > 0 && (
              <div className="rounded-[1.35rem] bg-white/70 ring-1 ring-black/8 p-[4px]">
                <div className="rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: "#6b7280" }}>2026 Primary — Who Showed Up</p>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { label: "Ballots Cast", value: agg.total.toLocaleString() },
                      { label: "Precincts", value: agg.count.toString() },
                      { label: "Dem Share", value: `${demPct}%` },
                    ].map(s => (
                      <div key={s.label} className="text-center rounded-xl py-3 px-1" style={{ background: "#f8f9fa" }}>
                        <p className="text-base font-bold leading-none" style={{ color: "#1a3a5c" }}>{s.value}</p>
                        <p className="text-[9px] mt-1 uppercase tracking-wider leading-tight" style={{ color: "#9ca3af" }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-full overflow-hidden mb-1" style={{ height: 10, background: "#fee2e2" }}>
                    <div className="h-full rounded-full" style={{ width: `${demPct}%`, background: "#2563a8" }} />
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span style={{ color: "#2563a8" }} className="font-semibold">Dem {agg.dem.toLocaleString()}</span>
                    <span style={{ color: "#dc2626" }} className="font-semibold">Rep {agg.rep.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Win Number */}
            {(type === "cd" || type === "sd" || type === "hd" || type === "pct" || type === "countywide") && (
              <WinNumber dKey={type === "countywide" ? "HC-Countywide" : dKey} />
            )}

            {/* Seat history */}
            {info?.seatHistory && info.seatHistory.length > 0 && (
              <div className="rounded-[1.35rem] bg-white/70 ring-1 ring-black/8 p-[4px]">
                <div className="rounded-[1rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: "#6b7280" }}>Seat History</p>
                  <div className="space-y-2">
                    {[...info.seatHistory].reverse().map((h, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full shrink-0"
                          style={{ background: h.party === "D" ? "#2563a8" : h.party === "R" ? "#dc2626" : "#9ca3af" }} />
                        <span className="text-[12px] font-semibold flex-1" style={{ color: "#1a3a5c" }}>{h.name}</span>
                        <span className="text-[11px]" style={{ color: "#9ca3af" }}>{h.years}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Data sources & needs */}
            <div className="rounded-xl px-4 py-3 text-[10px] leading-relaxed" style={{ background: "rgba(26,58,92,0.05)", color: "#6b7280" }}>
              <strong style={{ color: "#1a3a5c" }}>Data status:</strong> Turnout layer is real (March 2026 primary, Harris County Clerk).
              District assignment is real (TIGER + county GIS boundaries). Two layers still need inputs:
              <span className="block mt-1">① <strong>Population &amp; CVAP demographics</strong> — free Census API key (api.census.gov/data/key_signup.html).</span>
              <span className="block">② <strong>Turnout by race/age/gender</strong> — Harris County voter registration + voter history file from the Tax Office/Elections (harrisvotes.com → Voter Registration Data Request; CSV with precinct, demographics, and per-election vote history).</span>
            </div>

            {/* See also */}
            <div className="pt-4 border-t border-black/8">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: "#9ca3af" }}>Go deeper</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { href: "/tools/heat-check",          label: "Precinct heat map →" },
                  { href: "/tools/where-is-the-dough",  label: "Campaign finance →" },
                  { href: "/my-officials",               label: "Who represents me →" },
                  { href: "/tools/ballot-2026",          label: "2026 ballot →" },
                ].map(l => (
                  <Link key={l.href} href={l.href}
                    className="text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-colors hover:bg-[#1a3a5c] hover:text-white hover:border-[#1a3a5c]"
                    style={{ color: "#374151", borderColor: "#e5e7eb", background: "#fff" }}>
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
