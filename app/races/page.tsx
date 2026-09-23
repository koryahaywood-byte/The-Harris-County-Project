import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllRaces, tally, toLite, GROUPS } from "@/lib/races";
import RaceBoard from "./RaceBoard";

export async function generateMetadata(): Promise<Metadata> {
  const races = getAllRaces();
  const t = tally(races);
  const desc = `All ${t.total} races on the Harris County ballot, rated: ${t.toss} toss-ups, ${t.dLean + t.rLean} leaning, with money on hand and the last result for each.`;
  const og = new URLSearchParams({ tool: "The Race Board", section: "November 3, 2026", desc });
  og.append("s", `Races|${t.total}`);
  og.append("s", `Toss-ups|${t.toss}`);
  og.append("s", `In play|${t.toss + t.dLean + t.rLean}`);
  return {
    title: "The Race Board · 2026 Harris County ballot, rated",
    description: desc,
    openGraph: { title: "The Race Board: every Harris County race, rated", description: desc, images: [{ url: `/api/og?${og}`, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image" },
  };
}

export default function RacesPage() {
  const races = getAllRaces();
  const t = tally(races);
  return (
    <div>
      <header className="border-b" style={{ borderColor: "var(--rule)", background: "var(--surface)" }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-10 pb-8">
          <p className="label" style={{ color: "var(--brand)" }}>November 3, 2026 general election</p>
          <h1 className="serif text-[40px] md:text-[52px] leading-[1.03] tracking-[-0.02em] font-semibold mt-2" style={{ color: "var(--ink)" }}>
            The race board
          </h1>
          <p className="mt-3 max-w-2xl text-[17px] leading-relaxed" style={{ color: "#3C443F" }}>
            {`All ${t.total} contests on the Harris County ballot, with the desk's rating, the cash each candidate reports,`}{" "}
            and how the seat voted last time. Select any race for the full matchup.
          </p>
        </div>
      </header>
      <Suspense fallback={<div className="max-w-7xl mx-auto px-4 md:px-6 py-10 text-[14px]" style={{ color: "#6B726D" }}>Loading the board…</div>}>
        <RaceBoard races={races.map(toLite)} groups={GROUPS} />
      </Suspense>
    </div>
  );
}
