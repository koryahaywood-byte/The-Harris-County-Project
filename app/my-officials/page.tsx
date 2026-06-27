"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LEVEL_ORDER, type RepEntry } from "@/lib/representatives";
import { getFinanceByName } from "@/lib/campaign-finance";
import { WOMEN_IN_POLITICS } from "@/lib/women-names";
import { MATCHUPS_2026 } from "@/lib/matchups-2026";
import ShareButton from "@/components/ShareButton";

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

function districtLink(rep: RepEntry): string | null {
  const { district, level, office } = rep;
  // Congress + Legislature carry an explicit prefix: CD-7, SD-15, HD-134
  const prefixed = district.match(/^(CD|SD|HD)-(\d+)/i);
  if (prefixed) return `/tools/districts?type=${prefixed[1].toLowerCase()}&district=${prefixed[2]}`;
  // Justice Court — both JPs ("JP Precinct 4") and constables ("Precinct 4") use the 8 JP/constable precincts.
  if (level === "Justice Court") {
    const n = district.match(/(\d+)/)?.[1];
    return n ? `/tools/districts?type=jp&district=${n}` : null;
  }
  // Harris County — only commissioners map to a precinct ("Precinct 4"); the County Judge is countywide.
  if (level === "Harris County") {
    const n = office.toLowerCase().includes("commissioner") ? district.match(/(\d+)/)?.[1] : null;
    return n ? `/tools/districts?type=pct&district=${n}` : null;
  }
  // City of Houston — only district council members map ("District A"); mayor/controller/at-large are citywide.
  if (level === "City of Houston") {
    const m = district.match(/^District\s+(\w+)/i);
    return m ? `/tools/districts?type=council&district=${m[1]}` : null;
  }
  return null;
}

const ON_BALLOT_2026 = new Set(
  Object.values(MATCHUPS_2026).flatMap(m => m.sides.map(s => s.name))
);

// Map each 2026 candidate to their race's competitiveness rating for the ballot chip.
const LEAN_2026_BY_NAME: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const m of Object.values(MATCHUPS_2026)) {
    if (!m.lean) continue;
    for (const s of m.sides) out[s.name] = m.lean;
  }
  return out;
})();

const LEAN_2026_META: Record<string, { label: string; color: string }> = {
  "safe-d":        { label: "Safe D",    color: "#1d4ed8" },
  "likely-d":      { label: "Likely D",  color: "#2563a8" },
  "lean-d":        { label: "Lean D",    color: "#3b82f6" },
  "toss-up":       { label: "Toss-up",   color: "#7c3aed" },
  "lean-r":        { label: "Lean R",    color: "#dc2626" },
  "likely-r":      { label: "Likely R",  color: "#dc2626" },
  "safe-r":        { label: "Safe R",    color: "#b91c1c" },
  "uncontested-d": { label: "Unopposed", color: "#1d4ed8" },
  "uncontested-r": { label: "Unopposed", color: "#b91c1c" },
};

function OfficialCard({ rep, districts }: { rep: RepEntry; districts?: LookupResult["districts"] }) {
  const accent = partyColor(rep.party);
  const initials = rep.name.split(" ").map(w => w[0]).slice(0, 2).join("");
  const finance = getFinanceByName(rep.name);
  const distLink = districtLink(rep);
  const onBallot2026 = ON_BALLOT_2026.has(rep.name);
  const leanMeta = LEAN_2026_META[LEAN_2026_BY_NAME[rep.name] ?? ""] ?? null;
  const inner = (
    <div className="hcp-card card-lift p-4 flex items-start gap-3.5 h-full">
      {rep.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={rep.photo} alt={rep.name} className="w-11 h-11 rounded-full object-cover flex-shrink-0 mt-0.5"
          style={{ outline: `2px solid ${accent}`, outlineOffset: 1 }} />
      ) : (
        <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5"
          style={{ background: `linear-gradient(135deg, ${accent}29, ${accent}0d)`, color: accent, border: `1.5px solid ${accent}33`, boxShadow: "inset 0 1px 1px rgba(255,255,255,0.65)" }}>
          {initials}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {rep.slug ? (
            <Link href={`/politicians/${rep.slug}`} className="font-bold text-[15px] truncate hover:underline" style={{ color: "#1a3a5c", fontFamily: "var(--font-playfair,serif)" }}>{rep.name}</Link>
          ) : (
            <p className="font-bold text-[15px] truncate" style={{ color: "#1a3a5c", fontFamily: "var(--font-playfair,serif)" }}>{rep.name}</p>
          )}
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
        {rep.note && (
          <p className="text-[10px] mt-0.5"
            style={{ color: /term ends|not seeking|lost|leaving|retir|did not|vacat/i.test(rep.note) ? "#dc2626" : "#d97706" }}>
            {rep.note}
          </p>
        )}
        <div className="flex gap-3 mt-2 flex-wrap">
          {rep.slug ? (
            <Link href={`/politicians/${rep.slug}`}
              className="text-[10px] font-bold hover:underline" style={{ color: "#2563a8" }}>
              Profile →
            </Link>
          ) : rep.url ? (
            <a href={rep.url} target="_blank" rel="noopener noreferrer"
              className="text-[10px] font-bold hover:underline" style={{ color: "#9ca3af" }}>
              Official site ↗
            </a>
          ) : null}
          {distLink && (
            <Link href={distLink}
              className="text-[10px] font-bold hover:underline" style={{ color: "#059669" }}>
              District map →
            </Link>
          )}
          {finance && (
            <Link href={`/tools/where-is-the-dough?tab=leaderboard&q=${encodeURIComponent(rep.name)}`}
              className="text-[10px] font-bold hover:underline" style={{ color: "#7c3aed" }}>
              Finance →
            </Link>
          )}
          {onBallot2026 && (
            <Link href={`/tools/ballot-2026?q=${encodeURIComponent(rep.name)}`}
              className="text-[10px] font-bold hover:underline" style={{ color: leanMeta?.color ?? "#d97706" }}>
              {leanMeta ? `${leanMeta.label} in Nov →` : "2026 race →"}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
  return inner;
}

export default function MyOfficialsPage() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [cvap, setCvap] = useState<CvapData | null>(null);
  const [cvapSel, setCvapSel] = useState<"cd" | "sd" | "hd" | null>(null);

  useEffect(() => {
    fetch("/data/cvap-districts.json").then(r => r.json()).then(setCvap).catch(() => {});
  }, []);

  async function runLookup(url: string) {
    setLoading(true); setError(null); setResult(null); setCvapSel(null);
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Lookup failed."); return; }
      setResult(data);
    } catch {
      setError("Something went wrong — try again.");
    } finally {
      setLoading(false);
    }
  }

  function lookup(e: React.FormEvent) {
    e.preventDefault();
    if (!address.trim()) return;
    runLookup(`/api/my-officials?address=${encodeURIComponent(address)}`);
  }

  function useMyLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Your browser can't share location — enter your address instead.");
      return;
    }
    setLoading(true); setError(null); setResult(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => runLookup(`/api/my-officials?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`),
      (err) => {
        setLoading(false);
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied — enter your address instead."
            : "Couldn't get your location — enter your address instead."
        );
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 }
    );
  }

  const grouped = result
    ? LEVEL_ORDER.map(level => ({ level, reps: result.officials.filter(o => o.level === level) })).filter(g => g.reps.length)
    : [];

  // Which district's demographics to show in the matched-address card. Clicking a CD/SD/HD
  // chip switches this inline (no navigation); defaults to the most-local available district.
  const hasCvap = (t: "cd" | "sd" | "hd") => {
    const v = result?.districts[t];
    return !!(v && cvap?.cvap[t][v]);
  };
  const cvapDefault: "cd" | "sd" | "hd" | null =
    hasCvap("hd") ? "hd" : hasCvap("cd") ? "cd" : hasCvap("sd") ? "sd" : null;
  const cvapActive = (cvapSel && hasCvap(cvapSel)) ? cvapSel : cvapDefault;

  return (
    <div style={{ background: "#f2f5f9", minHeight: "100vh", fontFamily: "var(--font-outfit,sans-serif)" }}>
      {/* Hero — Synex-style light, with the topo terrain motif */}
      <section className="relative overflow-hidden topo-hero"
        style={{ background: "linear-gradient(180deg,#fbfbfd 0%,#f2f5f9 60%,#f2f5f9 100%)", paddingTop: "3.75rem", paddingBottom: "3.5rem" }}>
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_45%_55%_at_82%_30%,rgba(37,99,168,0.10),transparent_70%)]" />
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_40%_45%_at_90%_75%,rgba(52,160,110,0.04),transparent_70%)]" />
        <div className="relative max-w-3xl mx-auto px-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-4 flex items-center gap-2" style={{ color: "#64748b" }}>
            <span className="w-5 h-px" style={{ background: "#94a3b8" }} />
            Your Government · Lookup
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-3" style={{ fontFamily: "var(--font-playfair,serif)" }}>
            <span style={{ color: "#aab4c0" }}>Who represents </span><span style={{ color: "#0f2540" }}>me?</span>
          </h1>
          <p className="text-sm md:text-[15px] max-w-lg mb-7" style={{ color: "#5b6470" }}>
            Enter your Harris County address. Get every elected official who answers to you —
            from your Justice of the Peace to your member of Congress.
          </p>

          <form onSubmit={lookup} className="flex flex-col sm:flex-row gap-2.5 max-w-xl">
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="1001 Preston St, Houston, TX 77002"
              className="flex-1 rounded-full px-5 py-3 text-sm outline-none transition-shadow focus:shadow-[0_0_0_3px_rgba(37,99,168,0.12)]"
              style={{ background: "#fff", color: "#1a3a5c", border: "1px solid #e5e7eb" }}
            />
            <button type="submit" disabled={loading}
              className="pressable rounded-full px-7 py-3 text-sm font-bold text-white disabled:opacity-60"
              style={{ background: "#0f2540", boxShadow: "0 10px 24px rgba(15,37,64,0.2)" }}>
              {loading ? "Looking up…" : "Find My Officials"}
            </button>
          </form>
          <div className="flex items-center gap-2.5 mt-3">
            <button type="button" onClick={useMyLocation} disabled={loading}
              className="pressable inline-flex items-center gap-1.5 text-[13px] font-bold disabled:opacity-60"
              style={{ color: "#2563a8" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              Use my location
            </button>
            <span className="text-[11px]" style={{ color: "#94a3b8" }}>or type an address</span>
          </div>
          <p className="text-[11px] mt-3" style={{ color: "#94a3b8" }}>
            Your location or address is used once to find your precinct and never stored.
            Addresses are geocoded by the U.S. Census Bureau.
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
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#9ca3af]">Matched Address</p>
                <ShareButton
                  toolName="Who Represents Me?"
                  section="Government"
                  description={`${result.officials.length} elected officials · ${result.matched}`}
                  stats={[
                    { label: "Officials", value: result.officials.length.toString() },
                    { label: "Levels", value: grouped.length.toString() },
                  ]}
                  summary={`${result.officials.length} elected officials representing ${result.matched} — via The Harris County Project`}
                  light={false}
                />
              </div>
              <p className="text-sm font-bold" style={{ color: "#1a3a5c" }}>{result.matched}</p>
              <div className="chip-row mt-3">
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/[0.05] text-[#6b7280]">Precinct {result.precinct}</span>
                {/* CD/SD/HD chips toggle the demographics shown below (no navigation) */}
                {([
                  ["cd", `CD-${result.districts.cd}`],
                  ["sd", `SD-${result.districts.sd}`],
                  ["hd", `HD-${result.districts.hd}`],
                ] as const).map(([t, label]) =>
                  result.districts[t] ? (
                    <button key={t} onClick={() => setCvapSel(t)}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors"
                      style={cvapActive === t
                        ? { background: "#2563a8", color: "#fff" }
                        : { background: "rgba(37,99,168,0.08)", color: "#2563a8" }}>
                      {label}
                    </button>
                  ) : null
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
                  <Link href={`/tools/districts?type=council&district=${result.districts.council}`}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors hover:bg-blue-50"
                    style={{ background: "rgba(37,99,168,0.08)", color: "#2563a8" }}>
                    Council {result.districts.council} →
                  </Link>
                )}
              </div>
              {/* CVAP demographics for the selected (or most-local) district */}
              {cvap && cvapActive && result.districts[cvapActive] && cvap.cvap[cvapActive][result.districts[cvapActive]!] && (
                <CvapMini
                  entry={cvap.cvap[cvapActive][result.districts[cvapActive]!]}
                  label={`${cvapActive.toUpperCase()} ${result.districts[cvapActive]}`}
                />
              )}
              {result.districts.cd || result.districts.sd || result.districts.hd ? (
                <p className="text-[10px] mt-2.5" style={{ color: "#9ca3af" }}>
                  Tap CD / SD / HD to see that district&rsquo;s demographics.
                </p>
              ) : null}
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
