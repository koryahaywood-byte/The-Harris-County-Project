import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bill Tracker · The Harris County Project",
  description: "Texas Legislature bills that affect Harris County, tracked in plain English.",
  openGraph: {
    title: "Bill Tracker",
    description: "Texas Legislature bills that affect Harris County, tracked in plain English.",
    images: [{ url: "/api/og?tool=Bill+Tracker&section=Legislative&desc=Texas+Legislature+bills+that+affect+Harris+County%2C+tracked+in+plain+English.", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
