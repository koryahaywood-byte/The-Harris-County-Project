import type { Metadata } from "next";
import Link from "next/link";
import RelatedTools from "@/components/RelatedTools";

export const metadata: Metadata = {
  title: "About · The Harris County Project",
  description: "Who runs The Harris County Project and why: better information makes better elected officials.",
};

export default function About() {
  return (
    <div>
      <div className="bg-[var(--accent)] text-white px-6 py-16 md:py-24 relative overflow-hidden topo-dark">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_80%_50%,rgba(37,99,168,0.4),transparent)]" />
        <div className="max-w-3xl mx-auto relative z-10">
          <p className="text-sky-300/80 text-[11px] font-bold uppercase tracking-[0.25em] mb-3">About</p>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4" style={{ fontFamily: "var(--font-playfair), serif" }}>
            Better information makes better officials.
          </h1>
          <p className="text-white/80 text-base leading-relaxed max-w-xl">
            I&apos;m Kory Haywood, a lover of civics. I believe the only way to get better elected
            officials is to arm the public with better information — so I built the toolbox I wished
            existed for Harris County.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-bold mb-2" style={{ color: "var(--accent)", fontFamily: "var(--font-playfair), serif" }}>
              What this is
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "#4b5563" }}>
              Free tools for Harris County residents: who represents you, how every precinct voted,
              where campaign money comes from, what your officials pass into law, and where public
              budgets go. No paywall, no party registration, no email required to look anything up.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2" style={{ color: "var(--accent)", fontFamily: "var(--font-playfair), serif" }}>
              Where the numbers come from
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "#4b5563" }}>
              Official canvasses from Harris County Elections, campaign-finance filings from the
              Texas Ethics Commission, the FEC, and county and city portals, Census demographics,
              and the Texas Legislature&apos;s own records. Every tool cites its sources, and the{" "}
              <Link href="/methodology" className="underline font-semibold">methodology page</Link>{" "}
              shows the formulas. Spot a number that looks wrong?{" "}
              <Link href="/contact" className="underline font-semibold">Tell me</Link> — corrections
              beat corrections-avoidance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2" style={{ color: "var(--accent)", fontFamily: "var(--font-playfair), serif" }}>
              Get in touch
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "#4b5563" }}>
              Data errors, tool ideas, press, or collaboration:{" "}
              <Link href="/contact" className="underline font-semibold">the contact page</Link> reaches me directly.
            </p>
          </section>
        </div>

        <RelatedTools />
      </div>
    </div>
  );
}
