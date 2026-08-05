import type { Metadata } from "next";
import CampaignTrailClient from "./CampaignTrailClient";
import type { CampaignEvent } from "@/app/api/events/campaign-trail/route";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title:       "Campaign Trail · The Harris County Project",
  description: "Every block walk, phone bank, town hall, and organizing event happening in Harris County — Democrat and Republican, auto-updated daily.",
  openGraph: {
    title:       "Campaign Trail",
    description: "Every block walk, phone bank, town hall, and organizing event happening in Harris County.",
    images:      [`${SITE_URL}/api/og?tool=Campaign+Trail&section=Elections&desc=Every+organizing+event+in+Harris+County+%E2%80%94+Dem+and+GOP%2C+auto-updated.`],
  },
};

async function getEvents() {
  try {
    const res = await fetch(`${SITE_URL}/api/events/campaign-trail`, {
      next: { revalidate: 7200 },
    });
    if (!res.ok) return { events: [] as CampaignEvent[], counts: { D: 0, R: 0, total: 0 }, fetchedAt: new Date().toISOString() };
    return res.json();
  } catch {
    return { events: [] as CampaignEvent[], counts: { D: 0, R: 0, total: 0 }, fetchedAt: new Date().toISOString() };
  }
}

export default async function CampaignTrailPage() {
  const { events, counts, fetchedAt } = await getEvents();

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Hero */}
      <div className="relative overflow-hidden py-16 md:py-20"
        style={{ background: "linear-gradient(135deg,#0f2540 0%,#1a3a5c 60%,#1d4ed8 100%)" }}>
        <div className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse 80% 60% at 20% 50%,rgba(37,99,168,0.35),transparent 70%)" }} />
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <p className="text-sky-300 text-xs font-bold uppercase tracking-[0.2em] mb-3">Elections</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4"
            style={{ fontFamily: "var(--font-playfair)" }}>
            Campaign Trail
          </h1>
          <p className="text-white/70 text-lg max-w-xl leading-relaxed">
            Every block walk, phone bank, and organizing event in Harris County.
            Democrat and Republican. Auto-updated from live sources.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{ background: "rgba(37,99,168,0.3)", color: "#93c5fd" }}>
              Mobilize.us (D)
            </span>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{ background: "rgba(220,38,38,0.3)", color: "#fca5a5" }}>
              Harris County GOP (R)
            </span>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
              Refreshed every 2 hours
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-8">
        <CampaignTrailClient
          initialEvents={events}
          counts={counts}
          fetchedAt={fetchedAt}
        />
      </div>

      {/* Related tools */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="border-t pt-10" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--muted)" }}>Go deeper</p>
          <div className="flex flex-wrap gap-3">
            {[
              { href: "/tools/heat-check",         label: "Heat Check" },
              { href: "/tools/where-is-the-dough", label: "Where the Money Resides" },
              { href: "/tools/ballot-2026",         label: "2026 Ballot" },
              { href: "/tools/districts",           label: "Districts" },
              { href: "/tools/civic-calendar",      label: "Civic Calendar" },
            ].map(({ href, label }) => (
              <a key={href} href={href}
                className="text-sm font-semibold px-4 py-2 rounded-full transition-all duration-200 hover:opacity-80"
                style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--accent)" }}>
                {label} →
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
