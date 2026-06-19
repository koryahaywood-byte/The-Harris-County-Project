import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Endorsement Map · The Harris County Project",
  description: "Who endorsed whom across every major Harris County race — unions, elected officials, party orgs, and civic groups.",
  openGraph: {
    title: "Endorsement Map",
    description: "Who endorsed whom across every major Harris County race.",
    images: [{ url: "/api/og?tool=Endorsement+Map&section=Networks&desc=Who+endorsed+whom+in+Harris+County+politics.", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
