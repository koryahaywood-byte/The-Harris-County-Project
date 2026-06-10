import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Consultant Flowchart · The Harris County Project",
  description: "Who runs Harris County campaigns — the consultant network, mapped.",
  openGraph: {
    title: "Consultant Flowchart",
    description: "Who runs Harris County campaigns — the consultant network, mapped.",
    images: [{ url: "/api/og?tool=Consultant+Flowchart&section=Elections&desc=Who+runs+Harris+County+campaigns+%E2%80%94+the+consultant+network%2C+mapped.", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
