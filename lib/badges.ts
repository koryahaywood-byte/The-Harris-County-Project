import type { Politician } from "./politicians";
import type { CandidateFinance } from "./campaign-finance";

export type BadgeTier = "bronze" | "silver" | "gold" | "hof";

export interface Badge {
  id: string;
  name: string;
  description: string;
  tier: BadgeTier;
  icon: string; // single letter or short symbol for hex display
}

export interface BadgeContext {
  pol: Politician;
  finance: CandidateFinance | null;
  billCount: number;
  lawCount: number;
}

const ALL_BADGES: Array<Badge & { check: (ctx: BadgeContext) => boolean }> = [
  // ── Finance badges ──────────────────────────────────────────────────────────
  {
    id: "war-chest",
    name: "War Chest",
    description: "Cash on hand exceeds $1 million.",
    tier: "hof",
    icon: "W",
    check: ({ finance }) => !!finance && finance.cash >= 1_000_000,
  },
  {
    id: "money-machine",
    name: "Money Machine",
    description: "Raised over $500K in campaign funds.",
    tier: "gold",
    icon: "$",
    check: ({ finance }) => !!finance && finance.cash >= 500_000,
  },
  {
    id: "fundraiser",
    name: "Fundraiser",
    description: "Active campaign war chest on file.",
    tier: "silver",
    icon: "F",
    check: ({ finance }) => !!finance && finance.cash >= 100_000,
  },
  {
    id: "grassroots",
    name: "Grassroots",
    description: "Campaign-finance filer with a lean budget.",
    tier: "bronze",
    icon: "G",
    check: ({ finance }) => !!finance && finance.cash > 0 && finance.cash < 100_000,
  },

  // ── Legislation badges ──────────────────────────────────────────────────────
  {
    id: "legislative-titan",
    name: "Legislative Titan",
    description: "Five or more bills signed into law.",
    tier: "hof",
    icon: "T",
    check: ({ lawCount }) => lawCount >= 5,
  },
  {
    id: "lawmaker",
    name: "Lawmaker",
    description: "At least one bill signed into law.",
    tier: "gold",
    icon: "L",
    check: ({ lawCount }) => lawCount >= 1,
  },
  {
    id: "floor-general",
    name: "Floor General",
    description: "Filed ten or more bills in the current session.",
    tier: "silver",
    icon: "F",
    check: ({ billCount }) => billCount >= 10,
  },
  {
    id: "bill-filer",
    name: "Bill Filer",
    description: "Active bill sponsor in the legislature.",
    tier: "bronze",
    icon: "B",
    check: ({ billCount, pol }) => !!pol.legiscanName && billCount >= 1,
  },

  // ── Chamber / Influence badges ──────────────────────────────────────────────
  {
    id: "federal-player",
    name: "Federal Player",
    description: "Serving in the United States Congress.",
    tier: "hof",
    icon: "U",
    check: ({ pol }) => pol.chamber === "Senate" && pol.district.startsWith("U") ||
      pol.office.toLowerCase().includes("u.s. rep") ||
      pol.office.toLowerCase().includes("u.s. sen"),
  },
  {
    id: "power-broker",
    name: "Power Broker",
    description: "County Commissioner overseeing a multi-billion dollar budget.",
    tier: "gold",
    icon: "P",
    check: ({ pol }) => pol.office.toLowerCase().includes("commissioner"),
  },
  {
    id: "county-exec",
    name: "County Executive",
    description: "Leads Harris County government as the elected County Judge.",
    tier: "gold",
    icon: "E",
    check: ({ pol }) => pol.office.toLowerCase().includes("county judge"),
  },
  {
    id: "state-legislator",
    name: "State Legislator",
    description: "Member of the Texas State Legislature.",
    tier: "silver",
    icon: "S",
    check: ({ pol }) => pol.chamber === "Senate" || pol.chamber === "House",
  },
  {
    id: "city-hall",
    name: "City Hall",
    description: "Elected member of Houston City Council.",
    tier: "silver",
    icon: "C",
    check: ({ pol }) => pol.chamber === "City",
  },
  {
    id: "public-school",
    name: "Public School",
    description: "Governing the largest school district in Texas.",
    tier: "silver",
    icon: "H",
    check: ({ pol }) => pol.chamber === "HISD",
  },

  // ── Transparency / Access badges ────────────────────────────────────────────
  {
    id: "fully-connected",
    name: "Fully Connected",
    description: "Public on all four major platforms plus official email.",
    tier: "gold",
    icon: "C",
    check: ({ pol }) =>
      !!(pol.twitter && pol.instagram && pol.facebook && pol.email && pol.website),
  },
  {
    id: "digital-rep",
    name: "Digital Rep",
    description: "Active on social media and reachable by constituents.",
    tier: "silver",
    icon: "D",
    check: ({ pol }) => {
      const platforms = [pol.twitter, pol.instagram, pol.facebook, pol.email].filter(Boolean).length;
      return platforms >= 2;
    },
  },
  {
    id: "open-door",
    name: "Open Door",
    description: "Official contact email on file for constituent outreach.",
    tier: "bronze",
    icon: "O",
    check: ({ pol }) => !!pol.email,
  },
  {
    id: "on-the-web",
    name: "On The Web",
    description: "Maintains an official government or campaign website.",
    tier: "bronze",
    icon: "W",
    check: ({ pol }) => !!pol.website || !!pol.govUrl,
  },

  // ── Tenure badges ────────────────────────────────────────────────────────────
  {
    id: "veteran",
    name: "Veteran",
    description: "Has served in public office for eight or more years.",
    tier: "gold",
    icon: "V",
    check: ({ pol }) => !!pol.termStart && (2026 - pol.termStart) >= 8,
  },
  {
    id: "seasoned",
    name: "Seasoned",
    description: "Has served in public office for four or more years.",
    tier: "silver",
    icon: "S",
    check: ({ pol }) => !!pol.termStart && (2026 - pol.termStart) >= 4,
  },
  {
    id: "freshman",
    name: "The Freshman",
    description: "First term in this office — elected 2023 or later.",
    tier: "bronze",
    icon: "N",
    check: ({ pol }) => !!pol.termStart && pol.termStart >= 2023,
  },

  // ── Misc badges ─────────────────────────────────────────────────────────────
  {
    id: "across-aisle",
    name: "Across The Aisle",
    description: "Republican serving a majority-Democratic district, or vice versa.",
    tier: "gold",
    icon: "A",
    check: ({ pol }) => {
      // R serving in typically D-leaning chambers, or D in R-leaning
      if (pol.chamber === "City" && pol.party === "R") return true;
      if (pol.chamber === "County" && pol.party === "R") return true;
      return false;
    },
  },
  {
    id: "public-servant",
    name: "Public Servant",
    description: "Takes a sub-$15K annual public salary.",
    tier: "bronze",
    icon: "S",
    check: ({ pol }) => !!pol.salary && pol.salary < 15_000,
  },
  {
    id: "top-salary",
    name: "Top Salary",
    description: "Among the highest-paid elected officials in the county.",
    tier: "silver",
    icon: "$",
    check: ({ pol }) => !!pol.salary && pol.salary >= 150_000,
  },
];

export function computeBadges(ctx: BadgeContext): Badge[] {
  // Priority ordering: HoF → Gold → Silver → Bronze
  const tierOrder: BadgeTier[] = ["hof", "gold", "silver", "bronze"];
  const earned = ALL_BADGES.filter(b => b.check(ctx)).map(({ check: _c, ...b }) => b);
  earned.sort((a, b) => tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier));
  return earned;
}

export const TIER_STYLES: Record<BadgeTier, { bg: string; border: string; text: string; glow: string; label: string }> = {
  hof:    { bg: "#18120a", border: "#d97706", text: "#fbbf24", glow: "rgba(251,191,36,0.5)",  label: "Hall of Fame" },
  gold:   { bg: "#1a1500", border: "#ca8a04", text: "#fde047", glow: "rgba(253,224,71,0.35)", label: "Gold" },
  silver: { bg: "#111318", border: "#94a3b8", text: "#cbd5e1", glow: "rgba(203,213,225,0.3)", label: "Silver" },
  bronze: { bg: "#180e06", border: "#92400e", text: "#d97706", glow: "rgba(217,119,6,0.3)",   label: "Bronze" },
};
