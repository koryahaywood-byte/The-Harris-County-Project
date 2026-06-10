import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Harris County Budget · The Harris County Project",
  description: "Where Harris County's budget goes, department by department.",
  openGraph: {
    title: "Harris County Budget",
    description: "Where Harris County's budget goes, department by department.",
    images: [{ url: "/api/og?tool=Harris+County+Budget&section=Money&desc=Where+Harris+County%27s+budget+goes%2C+department+by+department.", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
