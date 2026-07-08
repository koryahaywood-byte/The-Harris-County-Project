import type { Metadata } from "next";
import JudgesClient from "./JudgesClient";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Know Your Judges · The Harris County Project",
  description:
    "Every contested Harris County judicial race on the November 2026 ballot: district courts, county courts at law, and probate courts. Who holds the bench, who's challenging, and what each race turns on.",
  openGraph: {
    title: "Know Your Judges — the races most voters skip",
    description: "Every contested Harris County bench on the 2026 ballot, one scannable sheet.",
    images: [`${SITE_URL}/api/og?s=${encodeURIComponent("Judicial races|One sheet")}&badge=${encodeURIComponent("KNOW YOUR JUDGES")}`],
  },
};

export default function JudgesPage() {
  return <JudgesClient />;
}
