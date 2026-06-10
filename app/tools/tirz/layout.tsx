import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TIRZ Explorer · The Harris County Project",
  description: "Houston's tax increment reinvestment zones — where the diverted property tax goes.",
  openGraph: {
    title: "TIRZ Explorer",
    description: "Houston's tax increment reinvestment zones — where the diverted property tax goes.",
    images: [{ url: "/api/og?tool=TIRZ+Explorer&section=Money&desc=Houston%27s+tax+increment+reinvestment+zones+%E2%80%94+where+the+diverted+property+tax+goes.", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
