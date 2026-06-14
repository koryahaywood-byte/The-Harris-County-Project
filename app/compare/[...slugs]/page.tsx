// Head to Head — /compare/[slugA]/[slugB]
// Two official cards side by side with direct stat comparison.
// Shareable standalone URL with OG meta.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { POLITICIANS } from "@/lib/politicians";
import { getFinanceByName, fmt } from "@/lib/campaign-finance";
import { computeStats, STAT_LABELS, type PoliticianStats } from "@/lib/politician-stats";
import OfficialCard from "@/components/OfficialCard";

const GOLD = "#fbbf24";

function resolve(slugs?: string[]) {
  if (!slugs || slugs.length !== 2) return null;
  const a = POLITICIANS.find(p => p.slug === slugs[0]);
  const b = POLITICIANS.find(p => p.slug === slugs[1]);
  return a && b && a.slug !== b.slug ? ([a, b] as const) : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slugs: string[] }> }): Promise<Metadata> {
  const { slugs } = await params;
  const pair = resolve(slugs);
  if (!pair) return {};
  const [a, b] = pair;
  const title = `${a.name} vs ${b.name} — Head to Head`;
  const desc = `${a.office} vs ${b.office}. Money, record, and stats compared — via The Harris County Project.`;
  const og = `/api/og?tool=${encodeURIComponent(`${a.name} vs ${b.name}`)}&section=Head+to+Head&desc=${encodeURIComponent(desc)}`;
  return {
    title: `${title} · The Harris County Project`,
    description: desc,
    openGraph: { title, description: desc, images: [{ url: og, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image" },
  };
}

const COMPARE_ROWS: { key: keyof Omit<PoliticianStats, "ovr"> | "ovr" | "cash"; label: string }[] = [
  { key: "ovr", label: "Overall Rating" },
  { key: "cash", label: "Cash on Hand" },
  { key: "warChest", label: STAT_LABELS.warChest },
  { key: "lawmaker", label: STAT_LABELS.lawmaker },
  { key: "influence", label: STAT_LABELS.influence },
  { key: "access", label: STAT_LABELS.access },
  { key: "tenure", label: STAT_LABELS.tenure },
];

export default async function ComparePage({ params }: { params: Promise<{ slugs: string[] }> }) {
  const { slugs } = await params;
  const pair = resolve(slugs);
  if (!pair) notFound();
  const [a, b] = pair;

  const finA = getFinanceByName(a.name), finB = getFinanceByName(b.name);
  const statsA = computeStats(a, finA, 0, 0), statsB = computeStats(b, finB, 0, 0);

  const rows = COMPARE_ROWS.map(({ key, label }) => {
    const va = key === "cash" ? (finA?.cash ?? 0) : statsA[key as keyof PoliticianStats];
    const vb = key === "cash" ? (finB?.cash ?? 0) : statsB[key as keyof PoliticianStats];
    const fmtV = (v: number) => (key === "cash" ? (v > 0 ? fmt(v) : "Pending") : String(v));
    return { label, va, vb, da: fmtV(va), db: fmtV(vb), winner: va === vb ? null : va > vb ? "a" : "b" };
  });

  const winsA = rows.filter(r => r.winner === "a").length;
  const winsB = rows.filter(r => r.winner === "b").length;

  return (
    <div className="topo-dark min-h-screen px-5 py-12"
      style={{
        background: "radial-gradient(ellipse 80% 60% at 50% 0%, #16304d 0%, #0a1623 55%, #060d16 100%)",
        fontFamily: "var(--font-outfit,sans-serif)",
      }}>
      <div className="max-w-5xl mx-auto">
        <p className="text-center text-[10px] font-bold uppercase tracking-[0.26em] text-white/40 mb-1.5">
          The Harris County Project · Head to Head
        </p>
        <h1 className="text-center text-2xl md:text-3xl font-bold text-white mb-1"
          style={{ fontFamily: "var(--font-playfair,serif)" }}>
          {a.name} <span style={{ color: GOLD }}>vs</span> {b.name}
        </h1>
        <p className="text-center text-xs text-white/40 mb-10">
          Leading {winsA > winsB ? a.name : winsB > winsA ? b.name : "— tied"} ·
          {" "}{Math.max(winsA, winsB)} of {rows.length} categories
        </p>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <OfficialCard pol={a} />
          <OfficialCard pol={b} />
        </div>

        {/* Comparison table */}
        <div className="max-w-2xl mx-auto rounded-[1.6rem] overflow-hidden"
          style={{
            background: "linear-gradient(150deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)",
            backdropFilter: "blur(22px)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center px-5 py-3.5"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-xs font-bold text-white truncate">{a.name}</p>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30 px-4">Category</p>
            <p className="text-xs font-bold text-white text-right truncate">{b.name}</p>
          </div>
          {rows.map(r => (
            <div key={r.label} className="grid grid-cols-[1fr_auto_1fr] items-center px-5 py-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <p className="text-sm font-bold tnum"
                style={{ color: r.winner === "a" ? GOLD : "rgba(255,255,255,0.55)", fontFamily: "var(--font-playfair,serif)" }}>
                {r.winner === "a" && <span className="mr-1.5 text-[9px] align-middle">◀</span>}{r.da}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40 px-4 text-center">{r.label}</p>
              <p className="text-sm font-bold text-right tnum"
                style={{ color: r.winner === "b" ? GOLD : "rgba(255,255,255,0.55)", fontFamily: "var(--font-playfair,serif)" }}>
                {r.db}{r.winner === "b" && <span className="ml-1.5 text-[9px] align-middle">▶</span>}
              </p>
            </div>
          ))}
          <p className="px-5 py-3 text-[9.5px] text-white/30 leading-relaxed">
            Ratings computed on identical inputs for both officials (latest filings, office scope,
            public access, tenure). Cash from most recent campaign finance filing.
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link href="/politicians" className="text-xs text-white/40 hover:text-white/70 transition-colors">
            Compare any two officials → pick from the index
          </Link>
        </div>
      </div>
    </div>
  );
}
