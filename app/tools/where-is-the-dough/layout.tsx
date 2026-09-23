import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Campaign cash · The Harris County Project",
  description: "Cash on hand, raised and spent for every Harris County official and 2026 candidate, from FEC, Texas Ethics Commission and county filings.",
  openGraph: {
    title: "Campaign cash: who has the money in Harris County",
    description: "Cash-on-hand for every Harris County official, candidate, and challenger. TEC & FEC filings.",
    images: [{ url: "/api/og?tool=Campaign+cash&section=Money&desc=Cash+on+hand%2C+raised+and+spent+for+every+Harris+County+official+and+2026+candidate.", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
