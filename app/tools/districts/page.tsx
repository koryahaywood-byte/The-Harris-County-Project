import type { Metadata } from "next";
import { readFileSync } from "fs";
import { join } from "path";
import { MATCHUPS_2026, type RaceLean } from "@/lib/matchups-2026";
import { getFinanceByName } from "@/lib/campaign-finance";
import { findLastContestedGeneral, type DistrictRacesFile } from "@/lib/path-to-win";
import DistrictsClient from "./DistrictsClient";

/* Server shell for the Districts portrait. Its whole job is the share spec:
   the og:image is built from the SAME view state the client renders
   (?type=hd&district=134), so a shared link's preview card carries the actual
   result bar, cash duel, and rating — not a generic tool card. */

const LEAN_LABEL: Record<RaceLean, string> = {
  "safe-d": "Safe D", "likely-d": "Likely D", "lean-d": "Lean D",
  "toss-up": "Toss-up",
  "lean-r": "Lean R", "likely-r": "Likely R", "safe-r": "Safe R",
  "uncontested-d": "Uncontested D", "uncontested-r": "Uncontested R",
};

let racesCache: DistrictRacesFile | null = null;
function loadRaces(): DistrictRacesFile | null {
  if (racesCache) return racesCache;
  try {
    racesCache = JSON.parse(readFileSync(join(process.cwd(), "public/data/district-races.json"), "utf8"));
    return racesCache;
  } catch { return null; }
}

export async function generateMetadata(
  { searchParams }: { searchParams: Promise<Record<string, string | undefined>> }
): Promise<Metadata> {
  const sp = await searchParams;
  const type = (sp.type ?? "").toLowerCase();
  const district = sp.district ?? "";

  const fallback: Metadata = {
    title: "Districts · The Harris County Project",
    description: "Every Harris County voting precinct, mapped to its real districts.",
    openGraph: {
      title: "Districts",
      description: "Every Harris County voting precinct, mapped to its real districts.",
      images: [{ url: "/api/og?tool=Districts&section=Elections&desc=Every+Harris+County+voting+precinct%2C+mapped+to+its+real+districts.", width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image" },
  };
  if (!["hd", "sd", "cd"].includes(type) || !district) return fallback;

  const key = `${type.toUpperCase()}-${district}`;
  const title = `${type.toUpperCase()} ${district}`;
  const og = new URLSearchParams();
  og.set("tool", `${title} · District portrait`);
  og.set("section", "Elections");

  const m = MATCHUPS_2026[key];
  if (m?.lean) og.set("badge", LEAN_LABEL[m.lean]);

  // Last contested general → result bar with real percentages.
  const races = loadRaces();
  const last = races ? findLastContestedGeneral(races, type as "hd" | "sd" | "cd", district) : null;
  if (last) {
    const dPct = last.winnerParty === "D" ? last.winnerPct : last.loserPct;
    const rPct = last.winnerParty === "R" ? last.winnerPct : last.loserPct;
    og.set("bar", `D ${last.year}|${dPct}|R ${last.year}|${rPct}`);
  }

  // 2026 matchup cash duel.
  const d = m?.sides.find(s => s.party === "D");
  const r = m?.sides.find(s => s.party === "R");
  const dFin = d ? getFinanceByName(d.name) : null;
  const rFin = r ? getFinanceByName(r.name) : null;
  if (d && r && ((dFin?.cash ?? 0) + (rFin?.cash ?? 0) > 0)) {
    og.set("duel", `${d.name}|${dFin?.cash ?? 0}|${r.name}|${rFin?.cash ?? 0}`);
  }

  const descBits = [
    m ? `${m.office}: ${m.sides.map(s => `${s.name} (${s.party})`).join(" vs ")}` : null,
    last ? `${last.year} general: ${last.winnerParty} +${last.marginPts}` : null,
  ].filter(Boolean);
  const desc = descBits.join(". ") || `District portrait for ${title}.`;
  og.set("desc", desc);

  return {
    title: `${title} District Portrait · The Harris County Project`,
    description: desc,
    openGraph: {
      title: `${title} · District portrait`,
      description: desc,
      images: [{ url: `/api/og?${og.toString()}`, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default function Page() {
  return <DistrictsClient />;
}
