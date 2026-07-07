"use client";

// Liquid-glass two-sided flip card for an official. Presentation layer only –
// reads the same data model as the profile page (politicians, stats, badges,
// finance, district info). Used inline on /politicians/[slug] (Card View
// toggle) and standalone at /politicians/[slug]/card.

import { useEffect, useMemo, useState } from "react";
import { POLITICIANS, type Politician } from "@/lib/politicians";
import { getFinanceByName, fmt } from "@/lib/campaign-finance";
import { computeStats, STAT_LABELS, type PoliticianStats } from "@/lib/politician-stats";
import { computeBadges } from "@/lib/badges";
import { DISTRICT_INFO } from "@/lib/districts-data";
import crosswalkRaw from "@/lib/precinct-crosswalk.json";

const GOLD = "#d4af37";
const GOLD_BRIGHT = "#fbbf24";

type CrosswalkMap = Record<string, { hd?: string; sd?: string; cd?: string; jp?: string; council?: string; pct?: string }>;
const CROSSWALK = (crosswalkRaw as { precincts: CrosswalkMap }).precincts;

// politician.district → crosswalk [field, value]; null = countywide footprint
function districtFilter(pol: Politician): [keyof CrosswalkMap[string], string] | null {
  const d = pol.district;
  if (d.startsWith("SD-")) return ["sd", d.slice(3)];
  if (d.startsWith("HD-")) return ["hd", d.slice(3)];
  if (d.startsWith("CD-")) return ["cd", d.slice(3)];
  if (d.startsWith("District ") && pol.chamber === "City") return ["council", d.slice(9)];
  if (d.startsWith("Precinct ") && pol.chamber === "County") return ["pct", d.slice(9)];
  return null;
}

function districtInfoKey(pol: Politician): string | null {
  const d = pol.district;
  if (/^(SD|HD|CD)-/.test(d)) return d;
  if (pol.chamber === "City" && d.startsWith("District ")) return `CC-${d.slice(9)}`;
  if (pol.chamber === "County" && d.startsWith("Precinct ")) return `HC-${d}`;
  if (pol.chamber === "County" && d === "Countywide") return "HC-Countywide";
  return null;
}

// Peer ranking: rank by OVR within chamber, computed on a uniform baseline
// (static finance, no bill counts) so every peer is scored identically.
function peerRank(pol: Politician): { rank: number; of: number } {
  const peers = POLITICIANS.filter(p => p.chamber === pol.chamber);
  const scored = peers
    .map(p => ({ slug: p.slug, ovr: computeStats(p, getFinanceByName(p.name), 0, 0).ovr }))
    .sort((a, b) => b.ovr - a.ovr);
  return { rank: scored.findIndex(s => s.slug === pol.slug) + 1, of: peers.length };
}

// ── Mini district map (SVG from precinct shapes) ────────────────────────────
type GeoFeature = { properties: { PREC: string }; geometry: { type: string; coordinates: number[][][] | number[][][][] } };

function MiniDistrictMap({ pol }: { pol: Politician }) {
  const [features, setFeatures] = useState<GeoFeature[] | null>(null);
  useEffect(() => {
    fetch("/data/harris-precincts.geojson")
      .then(r => r.json())
      .then(d => setFeatures(d.features))
      .catch(() => setFeatures([]));
  }, []);

  const paths = useMemo(() => {
    if (!features?.length) return null;
    const filter = districtFilter(pol);
    const inDistrict = (prec: string) => !filter || CROSSWALK[prec]?.[filter[0]] === filter[1];

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const f of features) {
      const polys = (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates) as number[][][][];
      for (const poly of polys) for (const [x, y] of poly[0]) {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
    const W = 300, H = 220, pad = 8;
    const sx = (W - pad * 2) / (maxX - minX), sy = (H - pad * 2) / (maxY - minY);
    const s = Math.min(sx, sy);
    const px = (x: number) => pad + (x - minX) * s;
    const py = (y: number) => H - pad - (y - minY) * s;

    const active: string[] = [], rest: string[] = [];
    for (const f of features) {
      const polys = (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates) as number[][][][];
      const d = polys.map(poly => "M" + poly[0].map(([x, y]) => `${px(x).toFixed(1)},${py(y).toFixed(1)}`).join("L") + "Z").join("");
      (inDistrict(f.properties.PREC) ? active : rest).push(d);
    }
    return { active, rest, W, H };
  }, [features, pol]);

  if (!paths) return <div className="h-[150px] rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />;

  return (
    <svg viewBox={`0 0 ${paths.W} ${paths.H}`} className="w-full rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
      <path d={paths.rest.join("")} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.07)" strokeWidth="0.4" />
      <path d={paths.active.join("")} fill={`${GOLD}59`} stroke={GOLD_BRIGHT} strokeWidth="0.7" />
    </svg>
  );
}

// ── Stat bar for the back grid ──────────────────────────────────────────────
function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/45">{label}</span>
        <span className="text-sm font-bold" style={{ color: GOLD_BRIGHT, fontFamily: "var(--font-playfair,serif)" }}>{value}</span>
      </div>
      <div className="h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: `linear-gradient(90deg,${GOLD},${GOLD_BRIGHT})` }} />
      </div>
    </div>
  );
}

export default function OfficialCard({ pol, defaultSide = "front" }: { pol: Politician; defaultSide?: "front" | "back" }) {
  const [flipped, setFlipped] = useState(defaultSide === "back");

  const finance = getFinanceByName(pol.name);
  const stats: PoliticianStats = computeStats(pol, finance, 0, 0);
  const badges = computeBadges({ pol, finance, billCount: 0, lawCount: 0 });
  const topBadge = badges[0];
  const { rank, of } = peerRank(pol);
  const info = districtInfoKey(pol) ? DISTRICT_INFO[districtInfoKey(pol)!] : null;
  const partyLabel = pol.party === "D" ? "Democrat" : pol.party === "R" ? "Republican" : "Nonpartisan";
  const yearsIn = pol.termStart ? 2026 - pol.termStart : null;

  const glass: React.CSSProperties = {
    background: "linear-gradient(150deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.045) 45%, rgba(212,175,55,0.06) 100%)",
    backdropFilter: "blur(22px)",
    WebkitBackdropFilter: "blur(22px)",
    border: "1px solid rgba(255,255,255,0.14)",
    boxShadow: "0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.18)",
  };

  return (
    <div className="w-full max-w-[380px] mx-auto select-none" style={{ perspective: "1400px" }}>
      <div
        className="relative w-full transition-transform duration-700 cursor-pointer"
        style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "none", aspectRatio: "5/7.2" }}
        onClick={() => setFlipped(f => !f)}
        role="button"
        aria-label={`${pol.name} official card: tap to flip`}
      >
        {/* ── FRONT ── */}
        <div className="absolute inset-0 rounded-[1.6rem] overflow-hidden p-5 flex flex-col" style={{ ...glass, backfaceVisibility: "hidden" }}>
          <div className="flex items-start justify-between">
            <p className="text-[9px] font-bold uppercase tracking-[0.26em] text-white/40">The Harris County Project</p>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(212,175,55,0.14)", color: GOLD_BRIGHT, border: `1px solid ${GOLD}40` }}>
              {partyLabel}
            </span>
          </div>

          {/* Photo */}
          <div className="mt-4 mb-3 mx-auto relative">
            <div className="w-28 h-28 rounded-full overflow-hidden"
              style={{ border: `2px solid ${GOLD}80`, boxShadow: `0 0 32px ${GOLD}30` }}>
              {pol.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={pol.photo} alt={pol.name} className="w-full h-full object-cover object-top"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold"
                  style={{ background: "rgba(255,255,255,0.08)", color: GOLD_BRIGHT }}>
                  {pol.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                </div>
              )}
            </div>
            {/* OVR chip */}
            <div className="absolute -bottom-2 -right-3 w-12 h-12 rounded-full flex flex-col items-center justify-center"
              style={{ background: "rgba(10,20,35,0.94)", border: `1.5px solid ${GOLD_BRIGHT}`, boxShadow: `0 0 18px ${GOLD}40` }}>
              <span className="text-base font-bold leading-none" style={{ color: GOLD_BRIGHT, fontFamily: "var(--font-playfair,serif)" }}>{stats.ovr}</span>
              <span className="text-[7px] font-bold tracking-[0.2em] text-white/50">OVR</span>
            </div>
          </div>

          <h2 className="text-center text-[22px] font-bold text-white leading-tight" style={{ fontFamily: "var(--font-playfair,serif)" }}>
            {pol.name}
          </h2>
          <p className="text-center text-[11px] text-white/55 mt-0.5">{pol.office}</p>
          <p className="text-center text-[11px] font-bold mt-0.5" style={{ color: GOLD_BRIGHT }}>{pol.district}</p>
          {info && <p className="text-center text-[10px] text-white/40 mt-1.5 px-3 leading-relaxed">{info.description}</p>}

          <div className="mt-auto">
            {/* Facts row */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="rounded-xl py-2 text-center" style={{ background: "rgba(255,255,255,0.05)" }}>
                <p className="text-sm font-bold text-white">{pol.termStart ?? "–"}</p>
                <p className="text-[8px] uppercase tracking-[0.14em] text-white/40 font-bold">First elected</p>
              </div>
              <div className="rounded-xl py-2 text-center" style={{ background: "rgba(255,255,255,0.05)" }}>
                <p className="text-sm font-bold text-white">{yearsIn !== null ? `${yearsIn} yrs` : "–"}</p>
                <p className="text-[8px] uppercase tracking-[0.14em] text-white/40 font-bold">In office</p>
              </div>
              <div className="rounded-xl py-2 text-center" style={{ background: "rgba(255,255,255,0.05)" }}>
                <p className="text-sm font-bold" style={{ color: GOLD_BRIGHT }}>
                  {finance?.cash ? fmt(finance.cash) : "–"}
                </p>
                <p className="text-[8px] uppercase tracking-[0.14em] text-white/40 font-bold">Cash on hand</p>
              </div>
            </div>
            {topBadge && (
              <p className="text-center text-[10px] text-white/45 mb-2">
                <span style={{ color: GOLD_BRIGHT }}>◆</span> {topBadge.name}
              </p>
            )}
            <p className="text-center text-[9px] text-white/30">Tap to flip</p>
          </div>
        </div>

        {/* ── BACK ── */}
        <div className="absolute inset-0 rounded-[1.6rem] overflow-hidden p-5 flex flex-col gap-3 overflow-y-auto"
          style={{ ...glass, backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-white" style={{ fontFamily: "var(--font-playfair,serif)" }}>{pol.name}</p>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: GOLD_BRIGHT }}>{pol.district}</p>
          </div>

          <MiniDistrictMap pol={pol} />

          {/* Money */}
          <div className="rounded-xl px-3.5 py-2.5 flex items-center justify-between"
            style={{ background: "rgba(212,175,55,0.08)", border: `1px solid ${GOLD}30` }}>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/45">Cash on hand</p>
              {finance?.raised ? <p className="text-[9px] text-white/35 mt-0.5">Raised {fmt(finance.raised)}{finance.spent ? ` · Spent ${fmt(finance.spent)}` : ""}</p> : null}
            </div>
            <p className="text-lg font-bold" style={{ color: GOLD_BRIGHT, fontFamily: "var(--font-playfair,serif)" }}>
              {finance && finance.cash > 0 ? fmt(finance.cash) : "Pending"}
            </p>
          </div>
          <p className="text-[8.5px] text-white/30 -mt-1.5 px-1">
            Top itemized donors pending Schedule A extraction. Totals from latest filing ({finance?.asOf ?? "n/a"}).
          </p>

          {/* Stat grid */}
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(STAT_LABELS) as (keyof Omit<PoliticianStats, "ovr">)[])
              .map(k => <StatCell key={k} label={STAT_LABELS[k]} value={stats[k]} />)}
          </div>

          {/* Key actions: committees + leadership */}
          {(pol.committees?.length || pol.committeeRoles?.length) ? (
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/45 mb-1.5">Key assignments</p>
              <div className="flex flex-wrap gap-1.5">
                {pol.committeeRoles?.map(r => (
                  <span key={r.committee} className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(212,175,55,0.16)", color: GOLD_BRIGHT }}>{r.role}, {r.committee}</span>
                ))}
                {pol.committees?.filter(c => !pol.committeeRoles?.some(r => r.committee === c)).slice(0, 4).map(c => (
                  <span key={c} className="text-[9px] px-2 py-0.5 rounded-full text-white/60"
                    style={{ background: "rgba(255,255,255,0.07)" }}>{c}</span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Peer ranking */}
          <div className="mt-auto rounded-xl px-3.5 py-2.5 flex items-center justify-between"
            style={{ background: "rgba(255,255,255,0.05)" }}>
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/45">Peer ranking · {pol.chamber}</p>
            <p className="text-sm font-bold text-white">#{rank} <span className="text-white/40 font-normal">of {of}</span></p>
          </div>
          <p className="text-center text-[9px] text-white/30">Tap to flip back</p>
        </div>
      </div>
    </div>
  );
}
