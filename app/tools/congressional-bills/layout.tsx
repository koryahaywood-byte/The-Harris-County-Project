import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Congressional Bills · The Harris County Project",
  description: "What the Harris County delegation is filing and voting on in Congress.",
  openGraph: {
    title: "Congressional Bills",
    description: "What the Harris County delegation is filing and voting on in Congress.",
    images: [{ url: "/api/og?tool=Congressional+Bills&section=Legislative&desc=What+the+Harris+County+delegation+is+filing+and+voting+on+in+Congress.", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
