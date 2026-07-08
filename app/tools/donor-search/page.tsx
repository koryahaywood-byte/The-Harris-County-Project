import type { Metadata } from "next";
import DonorSearchClient from "./DonorSearchClient";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Who Gave · Donor Search · The Harris County Project",
  description:
    "Search 2,000 top donors to Harris County officials by name or employer. See every official they gave to and how much, from FEC and TEC itemized filings.",
  openGraph: {
    title: "Who Gave — search the donors behind Harris County officials",
    description: "Type a name or employer, see every official they fund.",
    images: [`${SITE_URL}/api/og?s=${encodeURIComponent("Donor search|2,000 donors")}&badge=${encodeURIComponent("WHO GAVE")}`],
  },
};

export default function DonorSearchPage() {
  return <DonorSearchClient />;
}
