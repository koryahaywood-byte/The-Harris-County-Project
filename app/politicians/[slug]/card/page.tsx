// Standalone shareable official card — dark page, liquid-glass flip card,
// per-official Open Graph meta for clean unfurls.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { POLITICIANS } from "@/lib/politicians";
import OfficialCard from "@/components/OfficialCard";
import CardShareButton from "@/components/CardShareButton";

export function generateStaticParams() {
  return POLITICIANS.map(p => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const pol = POLITICIANS.find(p => p.slug === slug);
  if (!pol) return {};
  const title = `${pol.name} — Official Card`;
  const desc = `${pol.office}, ${pol.district}. Stats, money, and record — via The Harris County Project.`;
  const og = `/api/og/card/${pol.slug}`;
  return {
    title: `${title} · The Harris County Project`,
    description: desc,
    openGraph: { title, description: desc, images: [{ url: og, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image" },
  };
}

export default async function CardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pol = POLITICIANS.find(p => p.slug === slug);
  if (!pol) notFound();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-12"
      style={{
        background: "radial-gradient(ellipse 80% 60% at 50% 0%, #16304d 0%, #0a1623 55%, #060d16 100%)",
        fontFamily: "var(--font-outfit,sans-serif)",
      }}>
      <OfficialCard pol={pol} />

      {/* share + nav row */}
      <div className="mt-7 flex flex-col items-center gap-3">
        <CardShareButton slug={pol.slug} name={pol.name} office={pol.office} />
        <div className="flex items-center gap-4 mt-1">
          <Link href={`/politicians/${pol.slug}`}
            className="pressable text-xs font-bold px-5 py-2.5 rounded-full text-white/70"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}>
            Full profile →
          </Link>
          <Link href="/politicians"
            className="text-xs text-white/30 hover:text-white/55 transition-colors">
            All officials
          </Link>
        </div>
      </div>
    </div>
  );
}
