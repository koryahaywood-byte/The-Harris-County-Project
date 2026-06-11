"use client";

import { useState } from "react";
import Link from "next/link";
import { LEVEL_ORDER, type RepEntry } from "@/lib/representatives";

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

function OfficialCard({ rep }: { rep: RepEntry }) {
  const accent = partyColor(rep.party);
  const initials = rep.name.split(" ").map(w => w[0]).slice(0, 2).join("");
  const inner = (
    <div className="hcp-card card-lift p-4 flex items-center gap-3.5 h-full">
      <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
        style={{ background: `${accent}1a`, color: accent, border: `1.5px solid ${accent}40` }}>
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-bold text-[15px] truncate" style={{ color: "#1a3a5c", fontFamily: "var(--font-playfair,serif)" }}>{rep.name}</p>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
            style={{ background: `${accent}15`, color: accent }}>
            {rep.party === "NP" ? "Nonpartisan" : rep.party === "D" ? "Dem" : "Rep"}
          </span>
        </div>
        <p className="text-xs text-[#6b7280] truncate">{rep.office} · {rep.district}</p>
        {rep.note && <p className="text-[10px] text-amber-600 mt-0.5">{rep.note}</p>}
      </div>
      {rep.slug && <span className="text-[#9ca3af] text-xs flex-shrink-0">→</span>}
    </div>
  );
  return rep.slug ? <Link href={`/politicians/${rep.slug}`} className="block h-full">{inner}</Link> : inner;
}

export default function MyOfficialsPage() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LookupResult | null>(null);

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
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/[0.05] text-[#6b7280]">Voting Precinct {result.precinct}</span>
                {result.districts.cd && <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/[0.05] text-[#6b7280]">CD-{result.districts.cd}</span>}
                {result.districts.sd && <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/[0.05] text-[#6b7280]">SD-{result.districts.sd}</span>}
                {result.districts.hd && <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/[0.05] text-[#6b7280]">HD-{result.districts.hd}</span>}
                {result.districts.pct && <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/[0.05] text-[#6b7280]">Commissioner PCT {result.districts.pct}</span>}
                {result.districts.jp && <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/[0.05] text-[#6b7280]">JP {result.districts.jp}</span>}
                {result.districts.council && <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/[0.05] text-[#6b7280]">Council {result.districts.council}</span>}
              </div>
              <p className="text-[11px] text-[#9ca3af] mt-3 leading-relaxed">
                <Link href={`/tools/districts?district=${result.districts.cd ?? ""}`} className="underline">
                  See your districts on the map →
                </Link>
              </p>
            </div>

            {grouped.map(({ level, reps }) => (
              <div key={level} className="mb-8">
                <div className="flex items-baseline gap-3 mb-3">
                  <h2 className="text-lg font-bold" style={{ color: "#1a3a5c", fontFamily: "var(--font-playfair,serif)" }}>{level}</h2>
                  <p className="text-[11px] text-[#9ca3af]">{LEVEL_DESC[level]}</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {reps.map((rep, i) => <OfficialCard key={`${rep.name}-${i}`} rep={rep} />)}
                </div>
              </div>
            ))}

            <p className="text-[11px] text-[#9ca3af] leading-relaxed mt-2">
              Congressional districts shown use the 2025 enacted map (PLANC2333); current members were
              elected under prior lines and serve through January 2027. Precinct assignment via centroid
              match against Harris County Clerk shapes — addresses on a precinct boundary may differ from
              your voter registration card.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
