import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
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
  return (
    <>
      <div style={{ background: "#fffbeb", borderBottom: "1px solid #fde68a" }} className="px-6 py-2.5 text-center">
        <p className="text-[11px] font-semibold" style={{ color: "#92400e" }}>
          🚧 This tool is in development and unlisted — data and design are not final.
        </p>
      </div>
      {children}
    </>
  );
}
