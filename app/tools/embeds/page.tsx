import type { Metadata } from "next";
import EmbedsClient from "./EmbedsClient";

export const metadata: Metadata = {
  title: "Embed Our Widgets · The Harris County Project",
  description:
    "Put the election countdown or any 2026 race card on your own site with one iframe tag. Free, credited, always current.",
};

export default function EmbedsPage() {
  return <EmbedsClient />;
}
