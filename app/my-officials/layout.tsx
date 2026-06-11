import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Who Represents Me? · The Harris County Project",
  description: "Enter your Harris County address — get every elected official who answers to you, from your Justice of the Peace to Congress.",
  openGraph: {
    title: "Who Represents Me?",
    description: "Enter your Harris County address — get every elected official who answers to you, from your Justice of the Peace to Congress.",
    images: [{ url: "/api/og?tool=Who+Represents+Me%3F&section=Your+Government&desc=Every+official+who+answers+to+you%2C+from+your+JP+to+Congress.", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
