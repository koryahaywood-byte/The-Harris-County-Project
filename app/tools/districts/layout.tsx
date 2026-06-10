import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Districts · The Harris County Project",
  description: "Every Harris County voting precinct, mapped to its real districts.",
  openGraph: {
    title: "Districts",
    description: "Every Harris County voting precinct, mapped to its real districts.",
    images: [{ url: "/api/og?tool=Districts&section=Elections&desc=Every+Harris+County+voting+precinct%2C+mapped+to+its+real+districts.", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
