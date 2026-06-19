import type { Politician } from "./politicians";
import type { CandidateFinance } from "./campaign-finance";

export interface PoliticianStats {
  warChest: number;    // 0-99  fundraising / campaign finance
  lawmaker: number;    // 0-99  legislation effectiveness
  influence: number;   // 0-99  chamber / scope of power
  access: number;      // 0-99  transparency / constituent access
  tenure: number;      // 0-99  years in public service
  ovr: number;         // 0-99  overall rating
}

function clamp(v: number): number {
  return Math.max(0, Math.min(99, Math.round(v)));
}

function warChestScore(finance: CandidateFinance | null): number {
  if (!finance || finance.cash <= 0) return 22;
  const c = finance.cash;
  if (c >= 10_000_000) return 99;
  if (c >= 5_000_000)  return 93;
  if (c >= 2_000_000)  return 87;
  if (c >= 1_000_000)  return 80;
  if (c >= 500_000)    return 72;
  if (c >= 200_000)    return 62;
  if (c >= 100_000)    return 52;
  if (c >= 50_000)     return 42;
  return 32;
}

function lawmakerScore(pol: Politician, billCount: number, lawCount: number): number {
  if (!pol.legiscanName) {
    // Non-legislators get influence-adjacent score based on office level
    if (pol.chamber === "County") return 68;
    if (pol.chamber === "City")   return 62;
    if (pol.chamber === "HISD")   return 55;
    return 60;
  }
  if (billCount === 0) return 40;
  const passRate = lawCount / billCount;
  // Combine bill volume and pass rate
  const volumeScore = Math.min(billCount * 2.5, 40);
  const rateScore   = passRate * 55;
  return clamp(volumeScore + rateScore + 5);
}

function influenceScore(pol: Politician): number {
  const off = pol.office.toLowerCase();
  if (off.includes("u.s. sen") || off.includes("u.s. rep")) return 92;
  if (off.includes("governor") || off.includes("county judge") && pol.chamber === "County") return 88;
  if (off.includes("mayor"))                return 85;
  if (pol.chamber === "Senate")             return 80;
  if (off.includes("commissioner"))        return 76;
  if (pol.chamber === "House")              return 72;
  if (off.includes("sheriff") || off.includes("district attorney")) return 74;
  if (off.includes("county attorney") || off.includes("tax assessor") || off.includes("clerk")) return 68;
  if (pol.chamber === "City")               return 65;
  if (pol.chamber === "County")             return 64;
  if (pol.chamber === "HISD")               return 58;
  return 60;
}

function accessScore(pol: Politician): number {
  let score = 0;
  if (pol.website)   score += 18;
  if (pol.govUrl)    score += 12;
  if (pol.email)     score += 20;
  if (pol.twitter)   score += 16;
  if (pol.instagram) score += 14;
  if (pol.facebook)  score += 10;
  return clamp(score * 1.1);
}

function tenureScore(pol: Politician): number {
  if (!pol.termStart) return 45;
  const years = 2026 - pol.termStart;
  if (years >= 30) return 99;
  if (years >= 20) return 90;
  if (years >= 10) return 78;
  if (years >= 6)  return 65;
  if (years >= 3)  return 52;
  if (years >= 1)  return 40;
  return 32;
}

export function computeStats(
  pol: Politician,
  finance: CandidateFinance | null,
  billCount: number,
  lawCount: number,
): PoliticianStats {
  const warChest  = clamp(warChestScore(finance));
  const lawmaker  = clamp(lawmakerScore(pol, billCount, lawCount));
  const influence = clamp(influenceScore(pol));
  const access    = clamp(accessScore(pol));
  const tenure    = clamp(tenureScore(pol));

  // Weighted OVR: influence and warChest weighted slightly higher
  const ovr = clamp(
    (warChest * 0.22 + lawmaker * 0.20 + influence * 0.24 + access * 0.18 + tenure * 0.16)
  );

  return { warChest, lawmaker, influence, access, tenure, ovr };
}

export const STAT_LABELS: Record<keyof Omit<PoliticianStats, "ovr">, string> = {
  warChest:  "War Chest",
  lawmaker:  "Lawmaker",
  influence: "Influence",
  access:    "Access",
  tenure:    "Tenure",
};
