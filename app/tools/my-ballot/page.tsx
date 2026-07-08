import type { Metadata } from "next";
import MyBallotClient from "./MyBallotClient";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "My Ballot · The Harris County Project",
  description:
    "Type your address, get your exact November 2026 ballot: every race from U.S. Senate to Justice of the Peace, with competitiveness ratings and money. Print it and take it to the booth.",
  openGraph: {
    title: "My Ballot — every race at your address, November 3, 2026",
    description: "Your personalized Harris County ballot with ratings, money, and stakes. Printable.",
    images: [`${SITE_URL}/api/og?s=${encodeURIComponent("Your ballot|Nov 3, 2026")}&badge=${encodeURIComponent("MY BALLOT")}`],
  },
};

export default function MyBallotPage() {
  return <MyBallotClient />;
}
