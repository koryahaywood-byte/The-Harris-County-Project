import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "In Development · The Harris County Project",
  robots: { index: false, follow: false },
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
