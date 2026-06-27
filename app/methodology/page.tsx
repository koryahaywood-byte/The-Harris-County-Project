import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Accountability Score Methodology · The Harris County Project",
  description: "Exactly how the Accountability Score is computed — every component, weight, data source, and limitation, published in full.",
};

const COMPONENTS = [
  {
    name: "Fundraising strength", weight: "30%",
    what: "The official's cash on hand, expressed as a percentile among officials in the same chamber (Texas Senate, Texas House, Harris County, City of Houston, HISD).",
    source: "Latest campaign finance filing — FEC (federal), Texas Ethics Commission (state), harrisvotes.com (county), City of Houston (city). Filing date shown in every breakdown.",
    limits: "A single-snapshot measure. As our filing archive accumulates (we snapshot every filing period), this upgrades to a trajectory: growth across consecutive filings.",
  },
  {
    name: "Legislative output", weight: "30%",
    what: "For legislators: bills passed into law divided by bills filed in the current legislature, plus a small volume credit (capped at 20 points). For executives and administrators (commissioners, council members, judges): a fixed office-scope baseline, labeled as such — never presented as a pass rate.",
    source: "LegiScan, TX 89th Legislature (live).",
    limits: "Pass rate rewards focus over volume; a member who files 5 bills and passes 3 outscores one who files 60 and passes 10. We consider that a feature. Co-authorship is not yet counted.",
  },
  {
    name: "Peer standing", weight: "20%",
    what: "The official's overall rating (OVR) as a percentile within their chamber. OVR combines war chest, lawmaking, office scope, public accessibility, and tenure — computed with identical inputs for every official so the ranking is apples-to-apples.",
    source: "Computed in the open: lib/politician-stats.ts in our public repository.",
    limits: "OVR shares inputs with other components (deliberately — peer standing is the relative view of the same public record).",
  },
  {
    name: "Experience", weight: "20%",
    what: "Years since first elected to public office, scaled linearly and capped at 25 years — so a 40-year incumbent doesn't drown out everything else.",
    source: "First-elected year per official, from official biographies and election records.",
    limits: "Counts continuous public service including prior offices (e.g. a commissioner's years as state senator).",
  },
];

export default function MethodologyPage() {
  return (
    <div style={{ background: "#f2f5f9", minHeight: "100vh", fontFamily: "var(--font-outfit,sans-serif)" }}>
      <section className="relative overflow-hidden topo-dark"
        style={{ background: "linear-gradient(135deg,#1a3a5c 0%,#0f2540 60%,#162e4a 100%)", paddingTop: "3.5rem", paddingBottom: "3.5rem" }}>
        <div className="relative max-w-3xl mx-auto px-5">
          <p className="text-sky-300 text-xs font-bold uppercase tracking-[0.22em] mb-3">Methodology · Published in full</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-playfair,serif)" }}>
            The Accountability Score
          </h1>
          <p className="text-white/50 text-sm max-w-xl">
            One number per official, 0–100, built only from public records. Here is the entire
            formula — every component, weight, source, and limitation. If you cite the score,
            cite this page with it.
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-5 py-10">
        <div className="hcp-card p-6 mb-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#9ca3af] mb-2">The formula</p>
          <p className="text-sm leading-relaxed" style={{ color: "#1a3a5c" }}>
            <strong>Score = 30% Fundraising strength + 30% Legislative output + 20% Peer standing + 20% Experience.</strong>
          </p>
          <p className="text-xs text-[#6b7280] mt-3 leading-relaxed">
            When a component has no underlying data — an official with no campaign filing on
            record, or no first-elected year — that component is <em>dropped and the remaining
            weights renormalized</em>. We never penalize an official for a gap in our records,
            and every score's breakdown states exactly which components were used.
          </p>
        </div>

        {COMPONENTS.map(c => (
          <div key={c.name} className="hcp-card p-6 mb-4">
            <div className="flex items-baseline justify-between mb-2">
              <h2 className="text-lg font-bold" style={{ color: "#1a3a5c", fontFamily: "var(--font-playfair,serif)" }}>{c.name}</h2>
              <span className="text-sm font-bold" style={{ color: "#2563a8" }}>{c.weight}</span>
            </div>
            <p className="text-sm text-[#374151] leading-relaxed mb-2">{c.what}</p>
            <p className="text-xs text-[#6b7280] leading-relaxed mb-1"><strong>Source:</strong> {c.source}</p>
            <p className="text-xs text-[#6b7280] leading-relaxed"><strong>Limitations:</strong> {c.limits}</p>
          </div>
        ))}

        <div className="hcp-card p-6 mt-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#9ca3af] mb-2">What this score is not</p>
          <p className="text-xs text-[#6b7280] leading-relaxed">
            It is not an ideology score, an endorsement, or a prediction. Two officials with
            opposite politics can both score 85. It measures the observable mechanics of holding
            office — money raised, bills passed, standing among peers, time served — from public
            filings. The complete computation is open source in our repository; corrections to the
            underlying data are welcome via the <Link href="/contact" className="underline">contact page</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
