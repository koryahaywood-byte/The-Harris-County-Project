"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { POLITICIANS, type Politician } from "@/lib/politicians";
import { computeAccountability } from "@/lib/accountability";

function scoreColor(s: number) {
  if (s >= 75) return "#16a34a";
  if (s >= 50) return "#d97706";
  return "#dc2626";
}

function PolCard({ p, score }: { p: Politician; score: number }) {
  return (
    <Link href={`/politicians/${p.slug}`}
      className="group rounded-[1.5rem] bg-white/60 ring-1 ring-black/8 p-[5px] transition-all duration-500 hover:shadow-lg hover:ring-[var(--accent-light)]">
      <div className="rounded-[1.15rem] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-xl flex-shrink-0 overflow-hidden">
          {p.photo
            ? <img src={p.photo} alt={p.name} className="w-full h-full object-cover object-top" onError={(e) => { const t = e.target as HTMLImageElement; t.style.display="none"; }} />
            : <span>{p.name.split(" ").map(n => n[0]).slice(0,2).join("")}</span>
          }
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-bold text-[var(--accent)] text-sm truncate group-hover:text-[var(--accent-light)] transition-colors" style={{ fontFamily: "var(--font-playfair), serif" }}>
            {p.name}
          </div>
          <div className="text-xs text-[var(--muted)] mt-0.5">{p.office}</div>
          <div className="flex gap-2 mt-1">
            <span className={`text-[10px] font-bold ${p.party === "D" ? "text-blue-700" : p.party === "R" ? "text-red-700" : "text-gray-500"}`}>{p.party === "D" ? "Democrat" : p.party === "R" ? "Republican" : p.party}</span>
            <span className="text-[10px] text-[var(--muted)]">{p.district}</span>
          </div>
        </div>
        {/* Accountability score */}
        <div className="flex-shrink-0 text-center" title="Accountability Score — see /methodology">
          <p className="tnum text-xl font-bold leading-none" style={{ color: scoreColor(score), fontFamily: "var(--font-playfair), serif" }}>{score}</p>
          <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-[var(--muted)] mt-1">Acct.</p>
        </div>
      </div>
    </Link>
  );
}

export default function PoliticiansIndex() {
  const chambers = ["Senate", "House", "County", "City", "HISD"] as const;
  const [sort, setSort] = useState<"chamber" | "score">("chamber");

  const scores = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of POLITICIANS) m.set(p.slug, computeAccountability(p).score);
    return m;
  }, []);

  const ranked = useMemo(
    () => [...POLITICIANS].sort((a, b) => (scores.get(b.slug) ?? 0) - (scores.get(a.slug) ?? 0)),
    [scores]
  );

  return (
    <div>
      <div className="bg-[var(--accent)] text-white px-6 py-16 md:py-24 relative overflow-hidden topo-dark">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_80%_50%,rgba(37,99,168,0.4),transparent)]" />
        <div className="max-w-6xl mx-auto relative z-10">
          <p className="text-sky-300/80 text-[11px] font-bold uppercase tracking-[0.25em] mb-3">Politician Profiles</p>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-2" style={{ fontFamily: "var(--font-playfair), serif" }}>
            Your Elected Officials
          </h1>
          <p className="text-white/70 text-sm max-w-xl">
            Money, bills, salary, district, and more — for every Harris County elected official.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href="/politicians/leaderboard"
              className="inline-flex items-center gap-2 bg-sky-300 hover:bg-sky-200 text-[var(--accent)] font-bold rounded-full px-5 py-2.5 text-sm transition-all duration-300"
            >
              OVR Leaderboard
              <span>→</span>
            </Link>
            <Link href="/methodology" className="text-xs text-white/50 hover:text-white/80 underline transition-colors">
              How the Accountability Score works
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Sort toggle */}
        <div className="chip-row mb-8">
          {([["chamber", "By Chamber"], ["score", "By Accountability Score"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setSort(key)}
              className="pressable text-xs font-bold px-4 py-2 rounded-full transition-all"
              style={{
                background: sort === key ? "#1a3a5c" : "#fff",
                color: sort === key ? "#fff" : "#374151",
                border: `1.5px solid ${sort === key ? "#1a3a5c" : "#e5e7eb"}`,
              }}>
              {label}
            </button>
          ))}
        </div>

        {sort === "score" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ranked.map(p => <PolCard key={p.slug} p={p} score={scores.get(p.slug) ?? 0} />)}
          </div>
        ) : (
          chambers.map(chamber => {
            const group = POLITICIANS.filter(p => p.chamber === chamber);
            if (!group.length) return null;
            return (
              <div key={chamber} className="mb-12">
                <div className="flex items-center gap-3 mb-5">
                  <span className="block w-6 h-px bg-[var(--muted)]/40" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">{chamber}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.map(p => <PolCard key={p.slug} p={p} score={scores.get(p.slug) ?? 0} />)}
                </div>
              </div>
            );
          })
        )}
        <p className="text-[11px] text-[var(--muted)] mt-4 leading-relaxed">
          The Accountability Score (0–100) combines fundraising strength, legislative output, peer
          standing, and experience from public records. Full formula, sources, and limitations:{" "}
          <Link href="/methodology" className="underline">methodology</Link>.
        </p>
      </div>
    </div>
  );
}
