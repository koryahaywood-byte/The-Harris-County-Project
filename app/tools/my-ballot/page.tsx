import type { Metadata } from "next";
import { Suspense } from "react";
import MyBallotClient from "./MyBallotClient";
import { SITE_URL } from "@/lib/site";
import { getAllRaces, toLite } from "@/lib/races";
import { getAllMarketOdds } from "@/lib/kalshi";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Your ballot · The Harris County Project",
  description:
    "Enter your address and get your November 3, 2026 ballot: every race from U.S. Senate to justice of the peace, with the desk's rating and each candidate's cash. Print it and take it to the booth.",
  openGraph: {
    title: "Your Harris County ballot, race by race",
    description: "Every race at your address, rated, with money and the last result. Printable.",
    images: [`${SITE_URL}/api/og?${new URLSearchParams({ tool: "Your ballot", section: "November 3, 2026", desc: "Every race at your address, rated, with the money and the last result. Printable for the booth." })}`],
  },
};

export default async function MyBallotPage() {
  const odds = await getAllMarketOdds();
  const races = getAllRaces().map(r => toLite(r, odds));
  return (
    <Suspense fallback={null}>
      <MyBallotClient races={races} />
    </Suspense>
  );
}
