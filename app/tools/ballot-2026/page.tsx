import type { Metadata } from "next";
import { MATCHUPS_2026 } from "@/lib/matchups-2026";
import { getFinanceByName } from "@/lib/campaign-finance";
import Ballot2026Client from "./Ballot2026Client";

/* Server shell: the share card leads with the county-judge marquee duel and
   the live matchup counts from the same store the page renders. */

export async function generateMetadata(): Promise<Metadata> {
  let set = 0, tossup = 0, uncontested = 0;
  for (const m of Object.values(MATCHUPS_2026)) {
    if (m.status === "set") set++;
    if (m.lean === "toss-up") tossup++;
    if (m.lean === "uncontested-d" || m.lean === "uncontested-r") uncontested++;
  }
  const desc = `${set} November matchups are set: ${tossup} toss-ups, ${uncontested} uncontested. Governor to JP, with money on hand and a rating for every race.`;

  const og = new URLSearchParams({ tool: "2026 Ballot", section: "Elections", desc });
  const judge = MATCHUPS_2026["HC-Countywide"];
  const d = judge?.sides.find(s => s.party === "D");
  const r = judge?.sides.find(s => s.party === "R");
  if (d && r) {
    const dCash = getFinanceByName(d.name)?.cash ?? 0;
    const rCash = getFinanceByName(r.name)?.cash ?? 0;
    if (dCash + rCash > 0) og.set("duel", `${d.name}|${dCash}|${r.name}|${rCash}`);
    if (judge.lean) og.set("badge", judge.lean === "toss-up" ? "Toss-up" : judge.lean.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase()));
  }
  og.append("s", "Matchups set|" + set);
  og.append("s", "Toss-ups|" + tossup);

  return {
    title: "2026 Ballot · The Harris County Project",
    description: desc,
    openGraph: {
      title: "2026 Ballot",
      description: desc,
      images: [{ url: `/api/og?${og.toString()}`, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default function Page() {
  return <Ballot2026Client />;
}
