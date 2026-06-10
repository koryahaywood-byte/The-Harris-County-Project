import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Where the Money Resides · The Harris County Project",
  description: "Cash-on-hand for every Harris County official, candidate, and challenger. TEC & FEC filings.",
  openGraph: {
    title: "Where the Money Resides",
    description: "Cash-on-hand for every Harris County official, candidate, and challenger. TEC & FEC filings.",
    images: [{ url: "/api/og?tool=Where+the+Money+Resides&section=Money&desc=Cash-on-hand+for+every+Harris+County+official%2C+candidate%2C+and+challenger.+TEC+%26+FEC+filings.", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
