"use client";

// The Field Briefing. Auto-updating plain-English narrative on every
// official profile. Recomputed from live data on each render; sources and
// confidence shown inline.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Politician } from "@/lib/politicians";
import { generateNarrative } from "@/lib/narrative";
import { loadHistory, aggregateGenerals, linearTrend, precinctSetFor } from "@/lib/precinct-history";
import crosswalkRaw from "@/lib/precinct-crosswalk.json";
import FieldNotes from "@/components/FieldNotes";

const CROSSWALK = (crosswalkRaw as { precincts: Record<string, Record<string, string | undefined>> }).precincts;

function districtFilter(pol: Politician): [string, string] | null {
  const d = pol.district;
  if (d.startsWith("SD-")) return ["sd", d.slice(3)];
  if (d.startsWith("HD-")) return ["hd", d.slice(3)];
  if (d.startsWith("CD-")) return ["cd", d.slice(3)];
  if (pol.chamber === "City" && d.startsWith("District ")) return ["council", d.slice(9)];
  if (pol.chamber === "County" && d.startsWith("Precinct ")) return ["pct", d.slice(9)];
  return null;
}

export default function NarrativePanel({ pol, billCount, lawCount }: { pol: Politician; billCount: number; lawCount: number }) {
  const [trend, setTrend] = useState<{ dShare: number; slopePerCycle: number; turnout: number } | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const filt = districtFilter(pol);
    loadHistory().then(h => {
      const precincts = filt ? precinctSetFor(CROSSWALK, filt[0], filt[1]) : null;
      const gens = aggregateGenerals(h, precincts);
      const lt = linearTrend(gens.map(g => ({ x: g.year, y: g.dShare })));
      setTrend({ dShare: gens[gens.length - 1].dShare, slopePerCycle: lt.slope * 2, turnout: gens[gens.length - 1].turnoutRate });
    }).catch(() => {});
  }, [pol]);

  const narrative = useMemo(
    () => generateNarrative(pol, { billCount, lawCount, districtTrend: trend }),
    [pol, billCount, lawCount, trend]
  );

  return (
    <div className="max-w-5xl mx-auto px-4 pt-8">
      <div className="hcp-card topo-light p-5 md:p-6">
        <div className="flex items-center gap-2 mb-2.5 flex-wrap">
          <svg width="18" height="18" viewBox="0 0 22 22" fill="none" aria-hidden>
            <circle cx="11" cy="11" r="3" stroke="#1a3a5c" strokeWidth="1.3" />
            <circle cx="11" cy="11" r="6.5" stroke="#1a3a5c" strokeWidth="1" opacity="0.55" />
            <circle cx="11" cy="11" r="10" stroke="#1a3a5c" strokeWidth="0.8" opacity="0.3" />
          </svg>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: "#1a3a5c" }}>
            Field Briefing
          </p>
          <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
            style={{ background: narrative.confidence === "high" ? "#15803d14" : "#b4530914", color: narrative.confidence === "high" ? "#15803d" : "#b45309" }}>
            {narrative.confidence} confidence
          </span>
          <button onClick={() => setOpen(o => !o)}
            className="ml-auto text-[10px] underline" style={{ color: "#9ca3af" }}>
            {open ? "hide sources" : "sources"}
          </button>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: "#1f2937" }}>
          {narrative.paragraph}
        </p>
        {open && (
          <div className="mt-3 rounded-xl px-3.5 py-2.5" style={{ background: "#1a3a5c08" }}>
            <ul className="space-y-0.5">
              {narrative.sources.map(s => (
                <li key={s} className="text-[10px]" style={{ color: "#374151" }}>· {s}</li>
              ))}
            </ul>
            <p className="text-[10px] mt-1.5" style={{ color: "#6b7280" }}>{narrative.confidenceNote}</p>
          </div>
        )}
        <p className="text-[9.5px] mt-2.5" style={{ color: "#9ca3af" }}>
          Written by arithmetic, not by a model. Rebuilt from the records each time data updates.
          Formulas: <Link href="/methodology" className="underline">methodology</Link>.
        </p>
        <FieldNotes target={`official:${pol.slug}`} />
      </div>
    </div>
  );
}
