import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Endorsement Flowchart · The Harris County Project",
  description: "Who endorses whom in Harris County politics.",
  openGraph: {
    title: "Endorsement Flowchart",
    description: "Who endorses whom in Harris County politics.",
    images: [{ url: "/api/og?tool=Endorsement+Flowchart&section=Elections&desc=Who+endorses+whom+in+Harris+County+politics.", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
