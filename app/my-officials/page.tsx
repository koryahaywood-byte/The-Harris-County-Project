"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LEVEL_ORDER, type RepEntry } from "@/lib/representatives";
import { getFinanceByName } from "@/lib/campaign-finance";
import { WOMEN_IN_POLITICS } from "@/lib/women-names";

interface CvapEntry { total: number; black: number; hispanic: number; white: number; asian: number }
interface CvapData { cvap: { cd: Record<string, CvapEntry>; sd: Record<string, CvapEntry>; hd: Record<string, CvapEntry> } }


const RACE_SEGS: { key: keyof CvapEntry; label: string; color: string }[] = [
  { key: "hispanic", label: "Hispanic", color: "#ea580c" },
  { key: "black",    label: "Black",    color: "#7c3aed" },
  { key: "white",    label: "White",    color: "#2563a8" },
  { key: "asian",    label: "Asian",    color: "#0891b2" },
];

function CvapMini({ entry, label }: { entry: CvapEntry; label: string }) {
  const top = RACE_SEGS.reduce<{ label: string; pct: number; color: string } | null>((best, s) => {
    const pct = entry.total ? Math.round((entry[s.key] / entry.total) * 100) : 0;
    return (!best || pct > best.pct) ? { label: s.label, pct, color: s.color } : best;
  }, null);
  return (
    <div className="mt-3 pt-3 border-t border-black/8">
      <p className="text-[9px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "#9ca3af" }}>
        {label} · citizen voting-age population
      </p>
      {top && (
        <p className="text-[11px] font-semibold mb-2" style={{ color: top.color }}>
          {top.pct}% {top.label}
          <span className="font-normal" style={{ color: "#9ca3af" }}> · {entry.total.toLocaleString()} eligible voters</span>
        </p>
      )}
      {/* Multi-segment bar */}
      <div className="flex h-3 rounded-full overflow-hidden gap-px" style={{ background: "#f3f4f6" }}>
        {RACE_SEGS.map(s => {
          const pct = entry.total ? Math.round((entry[s.key] / entry.total) * 100) : 0;
          return pct > 0 ? (
            <div key={s.key} title={`${s.label} ${pct}%`} style={{ width: `${pct}%`, background: s.color }} />
          ) : null;
        })}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
        {RACE_SEGS.map(s => {
          const pct = entry.total ? Math.round((entry[s.key] / entry.total) * 100) : 0;
          return pct > 0 ? (
            <span key={s.key} className="text-[9px]" style={{ color: "#6b7280" }}>
              <span className="font-bold" style={{ color: s.color }}>{pct}%</span> {s.label}
            </span>
          ) : null;
        })}
      </div>
    </div>
  );
}

interface LookupResult {
  matched: string;
  precinct: string;
  districts: { cd?: string; sd?: string; hd?: string; jp?: string; council?: string; pct?: string };
  officials: RepEntry[];
}

const LEVEL_DESC: Record<string, string> = {
  "Congress": "Your voice in Washington",
  "Texas Legislature": "Your voice in Austin",
  "Harris County": "Runs the county — budget, roads, health, courts",
  "Justice Court": "Small claims, evictions, and your local constable",
  "City of Houston": "City services, police, fire, trash, streets",
};

function partyColor(p: string) {
  return p === "D" ? "#2563a8" : p === "R" ? "#dc2626" : "#6b7280";
}

function districtLink(dist: string): string | null {
  const m = dist.match(/^(CD|SD|HD|PCT|JP Precinct|Precinct)-?(\d+)/i);
  if (!m) return null;
  const type = m[1].toUpperCase().replace("PCT", "pct").replace("JP PRECINCT", "jp").replace("PRECINCT", "pct").replace("CD", "cd").replace("SD", "sd").replace("HD", "hd");
  return `/tools/districts?type=${type}&district=${m[2]}`;
}

function OfficialCard({ rep, districts }: { rep: RepEntry; districts?: LookupResult["districts"] }) {
  const accent = partyColor(rep.party);
  const initials = rep.name.split(" ").map(w => w[0]).slice(0, 2).join("");
  const finance = getFinanceByName(rep.name);
  const distLink = districtLink(rep.district);
  const inner = (
    <div className="hcp-card card-lift p-4 flex items-start gap-3.5 h-full">
      <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5"
        style={{ background: `${accent}1a`, color: accent, border: `1.5px solid ${accent}40` }}>
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-bold text-[15px] truncate" style={{ color: "#1a3a5c", fontFamily: "var(--font-playfair,serif)" }}>{rep.name}</p>
          {WOMEN_IN_POLITICS.has(rep.name) && (
            <span className="text-[9px] font-bold px-1 py-0.5 rounded leading-none flex-shrink-0"
              style={{ background: "#fce7f3", color: "#9d174d" }}>W</span>
          )}
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
            style={{ background: `${accent}15`, color: accent }}>
            {rep.party === "NP" ? "Nonpartisan" : rep.party === "D" ? "Dem" : "Rep"}
          </span>
        </div>
        <p className="text-xs text-[#6b7280] truncate">{rep.office} · {rep.district}</p>
        {rep.note && <p className="text-[10px] text-amber-600 mt-0.5">{rep.note}</p>}
        <div className="flex gap-3 mt-2 flex-wrap">
          {(rep.slug || rep.url) && (
            <span className="text-[10px] font-bold" style={{ color: rep.slug ? "#2563a8" : "#9ca3af" }}>
              {rep.slug ? "Profile →" : "Official site ↗"}
            </span>
          )}
          {distLink && (
            <Link href={distLink} onClick={e => e.stopPropagation()}
              className="text-[10px] font-bold hover:underline" style={{ color: "#059669" }}>
              District map →
            </Link>
          )}
          {finance && (
            <Link href={`/tools/where-is-the-dough?tab=leaderboard&q=${encodeURIComponent(rep.name)}`} onClick={e => e.stopPropagation()}
              className="text-[10px] font-bold hover:underline" style={{ color: "#7c3aed" }}>
              Finance →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
  if (rep.slug) return <Link href={`/politicians/${rep.slug}`} className="block h-full">{inner}</Link>;
  if (rep.url) return <a href={rep.url} target="_blank" rel="noopener noreferrer" className="block h-full">{inner}</a>;
  return inner;
}

export default function MyOfficialsPage() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [cvap, setCvap] = useState<CvapData | null>(null);

  useEffect(() => {
    fetch("/data/cvap-districts.json").then(r => r.json()).then(setCvap).catch(() => {});
  }, []);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    if (!address.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch(`/api/my-officials?address=${encodeURIComponent(address)}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Lookup failed."); return; }
      setResult(data);
    } catch {
      setError("Something went wrong — try again.");
    } finally {
      setLoading(false);
    }
  }

  const grouped = result
    ? LEVEL_ORDER.map(level => ({ level, reps: result.officials.filter(o => o.level === level) })).filter(g => g.reps.length)
    : [];

  return (
    <div style={{ background: "#f5f3ef", minHeight: "100vh", fontFamily: "var(--font-outfit,sans-serif)" }}>
      {/* Hero */}
      <section className="relative overflow-hidden topo-dark"
        style={{ background: "linear-gradient(135deg,#1a3a5c 0%,#0f2540 60%,#162e4a 100%)", paddingTop: "3.5rem", paddingBottom: "3.5rem" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 70% 60% at 80% 40%,rgba(37,99,168,0.18) 0%,transparent 70%)" }} />
        <div className="relative max-w-3xl mx-auto px-5">
          <p className="text-sky-300 text-xs font-bold uppercase tracking-[0.22em] mb-3">Your Government · Lookup</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-playfair,serif)" }}>
            Who Represents Me?
          </h1>
          <p className="text-white/50 text-sm max-w-lg mb-6">
            Enter your Harris County address. Get every elected official who answers to you —
            from your Justice of the Peace to your member of Congress.
          </p>

          <form onSubmit={lookup} className="flex flex-col sm:flex-row gap-2.5 max-w-xl">
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="1001 Preston St, Houston, TX 77002"
              className="flex-1 rounded-full px-5 py-3 text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.95)", color: "#1a3a5c" }}
            />
            <button type="submit" disabled={loading}
              className="pressable rounded-full px-7 py-3 text-sm font-bold text-[#1a3a5c] disabled:opacity-60"
              style={{ background: "#fbbf24" }}>
              {loading ? "Looking up…" : "Find My Officials"}
            </button>
          </form>
          <p className="text-white/30 text-[11px] mt-3">
            Your address is geocoded by the U.S. Census Bureau and never stored.
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-5 py-10">
        {error && (
          <div className="hcp-card p-5 text-sm text-red-700 bg-red-50">{error}</div>
        )}

        {loading && (
          <div className="space-y-3">
            {[0, 1, 2].map(i => <div key={i} className="skeleton h-20 rounded-[1.35rem]" />)}
          </div>
        )}

        {!result && !loading && !error && (
          <div className="text-center py-10">
            <p className="text-sm text-[#6b7280] max-w-md mx-auto leading-relaxed">
              Most people can name their member of Congress. Almost nobody can name their
              Justice of the Peace — the judge who handles evictions and small claims in
              their neighborhood. This fixes that.
            </p>
          </div>
        )}

        {result && (
          <>
            <div className="hcp-card p-5 mb-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#9ca3af] mb-1.5">Matched Address</p>
              <p className="text-sm font-bold" style={{ color: "#1a3a5c" }}>{result.matched}</p>
              <div className="chip-row mt-3">
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/[0.05] text-[#6b7280]">Precinct {result.precinct}</span>
                {result.districts.cd && (
                  <Link href={`/tools/districts?type=cd&district=${result.districts.cd}`}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors hover:bg-blue-50"
                    style={{ background: "rgba(37,99,168,0.08)", color: "#2563a8" }}>
                    CD-{result.districts.cd} →
                  </Link>
                )}
                {result.districts.sd && (
                  <Link href={`/tools/districts?type=sd&district=${result.districts.sd}`}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors hover:bg-blue-50"
                    style={{ background: "rgba(37,99,168,0.08)", color: "#2563a8" }}>
                    SD-{result.districts.sd} →
                  </Link>
                )}
                {result.districts.hd && (
                  <Link href={`/tools/districts?type=hd&district=${result.districts.hd}`}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors hover:bg-blue-50"
                    style={{ background: "rgba(37,99,168,0.08)", color: "#2563a8" }}>
                    HD-{result.districts.hd} →
                  </Link>
                )}
                {result.districts.pct && (
                  <Link href={`/tools/districts?type=pct&district=${result.districts.pct}`}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors hover:bg-blue-50"
                    style={{ background: "rgba(37,99,168,0.08)", color: "#2563a8" }}>
                    Commissioner PCT {result.districts.pct} →
                  </Link>
                )}
                {result.districts.jp && (
                  <Link href={`/tools/districts?type=jp&district=${result.districts.jp}`}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors hover:bg-blue-50"
                    style={{ background: "rgba(37,99,168,0.08)", color: "#2563a8" }}>
                    JP {result.districts.jp} →
                  </Link>
                )}
                {result.districts.council && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/[0.05] text-[#6b7280]">
                    Council {result.districts.council}
                  </span>
                )}
              </div>
              {/* CVAP demographic mini-bar for most-local available district */}
              {cvap && (() => {
                const hd = result.districts.hd;
                const cd = result.districts.cd;
                const sd = result.districts.sd;
                if (hd && cvap.cvap.hd[hd]) return <CvapMini entry={cvap.cvap.hd[hd]} label={`HD ${hd}`} />;
                if (cd && cvap.cvap.cd[cd]) return <CvapMini entry={cvap.cvap.cd[cd]} label={`CD ${cd}`} />;
                if (sd && cvap.cvap.sd[sd]) return <CvapMini entry={cvap.cvap.sd[sd]} label={`SD ${sd}`} />;
                return null;
              })()}
            </div>

            {grouped.map(({ level, reps }) => (

              <div key={level} className="mb-8">
                <div className="flex items-baseline gap-3 mb-3">
                  <h2 className="text-lg font-bold" style={{ color: "#1a3a5c", fontFamily: "var(--font-playfair,serif)" }}>{level}</h2>
                  <p className="text-[11px] text-[#9ca3af]">{LEVEL_DESC[level]}</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {reps.map((rep, i) => <OfficialCard key={`${rep.name}-${i}`} rep={rep} districts={result.districts} />)}
                </div>
              </div>
            ))}

            <p className="text-[11px] text-[#9ca3af] leading-relaxed mt-2">
              Congressional districts shown use the 2025 enacted map (PLANC2333); current members were
              elected under prior lines and serve through January 2027. Commissioner precinct assigned
              via direct point-in-polygon against Harris County GIS (June 2026 redistricted boundaries).
              Profile links (blue) go to the politician&apos;s page on this site. External links (↗) go to their official government website.
            </p>
          </>
        )}

        {/* See also */}
        <div className="mt-10 pt-6 border-t border-black/8">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: "#9ca3af" }}>Go deeper</p>
          <div className="flex flex-wrap gap-2">
            {[
              { href: "/tools/who-do-i-call",          label: "Who do I call? →" },
              { href: "/tools/districts",            label: "District vote history →" },
              { href: "/tools/where-is-the-dough",   label: "Campaign finance →" },
              { href: "/tools/heat-check",            label: "Precinct heat map →" },
              { href: "/tools/ballot-2026",           label: "2026 ballot →" },
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
  );
}
