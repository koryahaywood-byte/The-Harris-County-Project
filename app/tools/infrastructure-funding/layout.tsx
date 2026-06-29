import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Infrastructure Funding · The Harris County Project",
  description: "Federal grants and construction projects flowing into Harris County. Where the dollars land.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
