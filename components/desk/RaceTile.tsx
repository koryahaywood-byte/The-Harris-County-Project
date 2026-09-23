import Link from "next/link";
import type { RaceLite } from "@/lib/races";
import { RATING, PARTY, raceHref } from "@/lib/ratings";
import { fmt } from "@/lib/campaign-finance";
import { RatingChip } from "@/components/desk/Rating";
import { ResultBar } from "@/components/desk/Bars";
import Face from "@/components/desk/Face";

type Side = NonNullable<RaceLite["d"]>;

function SideRow({ s, party, max }: { s: Side | null; party: "D" | "R"; max: number }) {
  if (!s) {
    return (
      <div className="flex items-center gap-3 py-1.5">
        <span className="w-8 h-8 rounded-full border border-dashed shrink-0" style={{ borderColor: "#C9CCC4" }} aria-hidden />
        <span className="text-[13px] italic" style={{ color: "#8A918C" }}>No {party === "D" ? "Democrat" : "Republican"} on the ballot</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 py-1.5">
      <Face name={s.name} party={party} photo={s.photo} size={32} />
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-bold leading-tight truncate" style={{ color: "var(--ink)" }}>
          {s.name}
          {s.incumbent && <span className="ml-1.5 label align-[1px]" style={{ color: "#6B726D", fontSize: 10 }}>Inc.</span>}
        </p>
        <div className="mt-1 h-[3px] rounded-full" style={{ background: "#EEEFEA" }}>
          <div className="h-[3px] rounded-full" style={{ width: `${max > 0 ? Math.max((s.cash / max) * 100, s.cash > 0 ? 3 : 0) : 0}%`, background: PARTY[party].color }} />
        </div>
      </div>
      <span className="text-[13px] font-bold num shrink-0 w-[62px] text-right" style={{ color: s.cash > 0 ? "var(--ink)" : "#9AA19C" }}>
        {s.cash > 0 ? fmt(s.cash) : "No cash"}
      </span>
    </div>
  );
}

export default function RaceTile({ race, showStakes = true }: { race: RaceLite; showStakes?: boolean }) {
  const m = race.lean ? RATING[race.lean] : null;
  const max = Math.max(race.d?.cash ?? 0, race.r?.cash ?? 0);
  return (
    <Link href={raceHref(race.key)}
      className="group panel panel-hover flex flex-col overflow-hidden h-full"
      style={{ borderTop: `4px solid ${m?.color ?? "#C9CCC4"}` }}>
      <div className="px-4 pt-3.5 pb-3 flex-1 flex flex-col">
        <div className="flex items-center justify-between gap-3">
          <span className="label" style={{ color: "#6B726D" }}>{race.tag}{race.open ? " · Open seat" : ""}</span>
          <RatingChip lean={race.lean} />
        </div>
        <h3 className="serif text-[18px] leading-snug font-semibold mt-1.5 group-hover:underline decoration-1 underline-offset-4" style={{ color: "var(--ink)" }}>
          {race.office}
        </h3>
        <div className="mt-2.5 mb-1">
          <SideRow s={race.d} party="D" max={max} />
          <SideRow s={race.r} party="R" max={max} />
        </div>
        {showStakes && race.stakes && (
          <p className="text-[13px] leading-snug mt-1 line-clamp-3" style={{ color: "#454D48" }}>{race.stakes}</p>
        )}
      </div>
      {race.last && (
        <div className="px-4 py-2.5 border-t" style={{ borderColor: "var(--rule)", background: "#FAFAF8" }}>
          <p className="label mb-1" style={{ color: "#7C837E", fontSize: 10 }}>
            {race.last.proxy ? `Baseline, ${race.last.year}` : `Last general, ${race.last.year}${race.last.oldLines ? ", old district lines" : ""}`}
          </p>
          <ResultBar dPct={race.last.dPct} rPct={race.last.rPct} compact />
        </div>
      )}
    </Link>
  );
}
