import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Houston City Budget · The Harris County Project",
  description: "How Houston closed a $174M gap without raising taxes — and where your money goes. FY2027.",
  openGraph: {
    title: "Houston City Budget",
    description: "How Houston closed a $174M gap without raising taxes — and where your money goes. FY2027.",
    images: [{ url: "/api/og?tool=Houston+City+Budget&section=Money&desc=How+Houston+closed+a+%24174M+gap+without+raising+taxes+%E2%80%94+and+where+your+money+goes.+FY2027.", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
