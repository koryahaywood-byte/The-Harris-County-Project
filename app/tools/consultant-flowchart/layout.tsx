import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Consultant Network · The Harris County Project",
  description: "The political consulting firms behind every Harris County candidate. Who shares the same playbook.",
  openGraph: {
    title: "Consultant Network",
    description: "The political consulting firms behind every Harris County candidate.",
    images: [{ url: "/api/og?tool=Consultant+Network&section=Networks&desc=The+consultant+network+behind+Harris+County+campaigns.", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
