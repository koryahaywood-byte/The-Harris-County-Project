// The Accountability Score — a single published 0–100 number per official,
// built to be cited. Every component is computable from public data, the
// formula is fixed and documented at /methodology, and missing data is
// handled by reweighting (never by guessing).
//
// Components (default weights):
//   Fundraising strength  30%  — percentile of cash on hand within chamber,
//                                from the official's latest campaign filing
//   Legislative output    30%  — bills passed into law ÷ bills filed (when
//                                LegiScan data is loaded); non-legislators
//                                and unloaded states use an office-scope
//                                baseline, flagged in the breakdown
//   Peer standing         20%  — percentile of OVR rating within chamber
//   Experience            20%  — years in elected office, capped at 25
//
// When a component has no data (e.g. no filing on record), it is dropped and
// the remaining weights are renormalized. The score never penalizes an
// official for our missing data — but the breakdown says exactly what was used.

import { POLITICIANS, type Politician } from "./politicians";
import { getFinanceByName } from "./campaign-finance";
import { computeStats } from "./politician-stats";

export interface AccountabilityComponent {
  key: "fundraising" | "legislation" | "peerStanding" | "experience";
  label: string;
  value: number | null;   // 0–100, null = no data (dropped + reweighted)
  weight: number;          // default weight
  basis: string;           // exactly what this number measures
}

export interface AccountabilityScore {
  score: number;           // 0–100
  components: AccountabilityComponent[];
  asOf: string;
}

function percentile(value: number, population: number[]): number {
  if (!population.length) return 50;
  const below = population.filter(v => v < value).length;
  const equal = population.filter(v => v === value).length;
  return Math.round(((below + equal / 2) / population.length) * 100);
}

export function computeAccountability(
  pol: Politician,
  opts?: { billCount?: number; lawCount?: number }
): AccountabilityScore {
  const peers = POLITICIANS.filter(p => p.chamber === pol.chamber);

  // ── Fundraising strength: cash percentile within chamber ──
  const finance = getFinanceByName(pol.name);
  const peerCash = peers
    .map(p => getFinanceByName(p.name)?.cash ?? null)
    .filter((c): c is number => c !== null && c > 0);
  const fundraising: number | null =
    finance && finance.cash > 0 ? percentile(finance.cash, peerCash) : null;

  // ── Legislative output: pass rate when bill data is loaded ──
  let legislation: number | null;
  let legislationBasis: string;
  if (opts?.billCount && opts.billCount > 0) {
    const passRate = (opts.lawCount ?? 0) / opts.billCount;
    // Pass rate carries most of the signal; filing volume earns up to 20 pts.
    legislation = Math.round(Math.min(100, passRate * 80 + Math.min(opts.billCount, 20)));
    legislationBasis = `${opts.lawCount ?? 0} of ${opts.billCount} bills became law (TX 89th, LegiScan)`;
  } else if (pol.legiscanName) {
    legislation = null;
    legislationBasis = "Bill data not loaded in this view — open the profile for the live figure";
  } else {
    // Non-legislators: office-scope baseline, explicitly labeled.
    legislation = pol.chamber === "County" ? 65 : pol.chamber === "City" ? 60 : 55;
    legislationBasis = "Executive/administrative office — office-scope baseline, not a pass rate";
  }

  // ── Peer standing: OVR percentile within chamber (uniform inputs) ──
  const ovrs = peers.map(p => computeStats(p, getFinanceByName(p.name), 0, 0).ovr);
  const myOvr = computeStats(pol, finance, 0, 0).ovr;
  const peerStanding = percentile(myOvr, ovrs);

  // ── Experience: years in elected office, capped at 25 ──
  const experience: number | null = pol.termStart
    ? Math.round(Math.min(2026 - pol.termStart, 25) / 25 * 100)
    : null;

  const components: AccountabilityComponent[] = [
    {
      key: "fundraising", label: "Fundraising strength", value: fundraising, weight: 0.30,
      basis: finance && finance.cash > 0
        ? `Cash on hand percentile among ${pol.chamber} officials (filing as of ${finance.asOf})`
        : "No campaign filing on record — component dropped, weights renormalized",
    },
    { key: "legislation", label: "Legislative output", value: legislation, weight: 0.30, basis: legislationBasis },
    {
      key: "peerStanding", label: "Peer standing", value: peerStanding, weight: 0.20,
      basis: `Overall-rating percentile among ${peers.length} ${pol.chamber} officials, identical inputs`,
    },
    {
      key: "experience", label: "Experience", value: experience, weight: 0.20,
      basis: pol.termStart
        ? `${2026 - pol.termStart} years since first elected (${pol.termStart}), capped at 25`
        : "First-elected year not on record — component dropped, weights renormalized",
    },
  ];

  const usable = components.filter(c => c.value !== null);
  const totalWeight = usable.reduce((s, c) => s + c.weight, 0);
  const score = Math.round(usable.reduce((s, c) => s + (c.value as number) * (c.weight / totalWeight), 0));

  return { score, components, asOf: "June 2026" };
}
