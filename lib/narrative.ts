// Narrative generation. The auto-updating plain-English read on every
// official. Deterministic prose assembled from live data, so it literally
// rewrites itself the moment a new filing, bill action, or cycle of precinct
// results lands. Every sentence traces to a source listed alongside it.
// A signal for the reader: never a conclusion.

import type { Politician } from "./politicians";
import { getFinanceByName, fmt } from "./campaign-finance";
import { computeAccountability } from "./accountability";
import { computeStats } from "./politician-stats";
import { POLITICIANS } from "./politicians";

export interface Narrative {
  paragraph: string;
  sources: string[];
  confidence: "high" | "medium";
  confidenceNote: string;
}

export function generateNarrative(
  pol: Politician,
  opts?: { billCount?: number; lawCount?: number; districtTrend?: { dShare: number; slopePerCycle: number; turnout: number } | null }
): Narrative {
  const finance = getFinanceByName(pol.name);
  const acct = computeAccountability(pol, opts);
  const stats = computeStats(pol, finance, opts?.billCount ?? 0, opts?.lawCount ?? 0);
  const peers = POLITICIANS.filter(p => p.chamber === pol.chamber);
  const cashRank = peers
    .map(p => ({ slug: p.slug, cash: getFinanceByName(p.name)?.cash ?? 0 }))
    .sort((a, b) => b.cash - a.cash)
    .findIndex(p => p.slug === pol.slug) + 1;

  const sentences: string[] = [];
  const sources: string[] = [];

  // Opening: who they are, in time
  const years = pol.termStart ? 2026 - pol.termStart : null;
  sentences.push(
    years !== null
      ? `${pol.name} has held elected office since ${pol.termStart}: ${years} years: currently as ${pol.office.toLowerCase().startsWith("u.s.") ? pol.office : `${pol.office} for ${pol.district}`}.`
      : `${pol.name} serves as ${pol.office} for ${pol.district}.`
  );

  // Money
  if (finance && finance.cash > 0) {
    const standing = cashRank === 1 ? `the largest war chest among ${pol.chamber} officials`
      : cashRank <= 3 ? `the #${cashRank} war chest among ${pol.chamber} officials`
      : `#${cashRank} of ${peers.length} ${pol.chamber} war chests`;
    sentences.push(
      `The latest filing (${finance.asOf}) shows ${fmt(finance.cash)} cash on hand` +
      (finance.raised ? `, ${fmt(finance.raised)} raised in the period` : "") +
      `: ${standing}.`
    );
    sources.push(`Campaign finance filing, ${finance.asOf} (${finance.level === "federal" ? "FEC" : finance.level === "state" ? "TEC" : finance.level === "houston" ? "City of Houston" : "harrisvotes.com"})`);
  } else {
    sentences.push(`No campaign finance figures are on record yet. The next filing window will populate this.`);
  }

  // Legislation
  if (opts?.billCount && opts.billCount > 0) {
    const rate = Math.round(((opts.lawCount ?? 0) / opts.billCount) * 100);
    sentences.push(
      `In the 89th Legislature ${pol.name.split(" ").pop()} has filed ${opts.billCount} bills with ${opts.lawCount ?? 0} signed into law (${rate}%)` +
      (rate >= 25 ? ". A high conversion rate; most members land well under that." : ".")
    );
    sources.push("LegiScan, TX 89th Legislature (live)");
  }

  // District terrain
  if (opts?.districtTrend) {
    const t = opts.districtTrend;
    const drift = Math.abs(t.slopePerCycle) < 0.005 ? "has held steady"
      : t.slopePerCycle > 0 ? `has moved toward Democrats by ${(t.slopePerCycle * 100).toFixed(1)} points per cycle`
      : `has moved toward Republicans by ${(Math.abs(t.slopePerCycle) * 100).toFixed(1)} points per cycle`;
    sentences.push(
      `The ground underneath: across the last three general elections, ${pol.district} ${drift}, with ${Math.round(t.turnout * 100)}% of registered voters turning out in 2024.`
    );
    sources.push("TLC precinct returns 2020–2024, re-tabulated on current lines");
  }

  // Standing
  sentences.push(
    `Accountability Score: ${acct.score} of 100. Overall rating ${stats.ovr}, driven by ` +
    (stats.warChest >= stats.tenure && stats.warChest >= stats.influence ? "fundraising strength"
      : stats.tenure >= stats.influence ? "tenure" : "the scope of the office") + `.`
  );
  sources.push("Accountability Score + OVR. Formulas published at /methodology");

  return {
    paragraph: sentences.join(" "),
    sources: [...new Set(sources)],
    confidence: finance && finance.cash > 0 ? "high" : "medium",
    confidenceNote: "Assembled sentence-by-sentence from the records cited below. No inference beyond arithmetic. Rewrites automatically when any source updates.",
  };
}
