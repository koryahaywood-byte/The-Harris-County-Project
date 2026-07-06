import type { Metadata } from "next";
import { MATCHUPS_2026 } from "@/lib/matchups-2026";
import TxHouseClient from "./TxHouseClient";

/* Server shell: the share card carries the live seat tally computed from the
   same ratings store the board renders, so a shared link previews the data. */

function tally() {
  let d = 0, r = 0, t = 0, battlegrounds = 0;
  for (const [key, m] of Object.entries(MATCHUPS_2026)) {
    if (!key.startsWith("HD-") || !m.lean) continue;
    if (m.lean === "toss-up") { t++; battlegrounds++; continue; }
    if (m.lean === "lean-d" || m.lean === "lean-r") battlegrounds++;
    if (m.lean.endsWith("-d")) d++; else if (m.lean.endsWith("-r")) r++;
  }
  return { d, r, t, battlegrounds, total: d + r + t };
}

export async function generateMetadata(
  { searchParams }: { searchParams: Promise<Record<string, string | undefined>> }
): Promise<Metadata> {
  const sp = await searchParams;
  const { d, r, t, battlegrounds, total } = tally();
  const bgOnly = sp.bg === "1";
  const desc = bgOnly
    ? `${battlegrounds} battleground seats decide Harris County's House delegation. Chamber today: R 88 to D 62; net 14 flips control.`
    : `Harris County's ${total} Texas House seats: ${d} lean or safe D, ${r} lean or safe R, ${t} toss-up. Net 14 seats flips the chamber.`;
  const og = new URLSearchParams({
    tool: bgOnly ? "TX House Battlegrounds" : "Texas House Board",
    section: "Elections",
    desc,
  });
  og.append("s", `Rated D|${d}`);
  og.append("s", `Battlegrounds|${battlegrounds}`);
  og.append("s", `Rated R|${r}`);

  return {
    title: "Texas House Board · The Harris County Project",
    description: desc,
    openGraph: {
      title: bgOnly ? "TX House Battlegrounds" : "Texas House Board",
      description: desc,
      images: [{ url: `/api/og?${og.toString()}`, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default function Page() {
  return <TxHouseClient />;
}
