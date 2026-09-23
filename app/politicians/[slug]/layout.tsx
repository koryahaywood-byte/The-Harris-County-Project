import type { Metadata } from "next";
import { POLITICIANS } from "@/lib/politicians";

// The profile page is a client component, so its title and share card live here.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = POLITICIANS.find(x => x.slug === slug);
  if (!p) return { title: "Official · The Harris County Project" };
  const party = p.party === "D" ? "Democrat" : p.party === "R" ? "Republican" : "Nonpartisan";
  const desc = `${p.name}, ${p.office} (${party}${p.district ? `, ${p.district}` : ""}): campaign cash, bills, committees and record, from public filings.`;
  const og = new URLSearchParams({ tool: p.name, section: `${p.office} · ${party}`, desc });
  return {
    title: `${p.name}, ${p.office} · The Harris County Project`,
    description: desc,
    openGraph: { title: `${p.name}: record and money`, description: desc, images: [{ url: `/api/og?${og}`, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image" },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
