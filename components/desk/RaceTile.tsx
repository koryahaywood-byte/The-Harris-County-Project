import Link from "next/link";
import type { RaceLite } from "@/lib/races";
import { RATING, PARTY, raceHref } from "@/lib/ratings";
import { fmt } from "@/lib/campaign-finance";
import { RatingChip } from "@/components/desk/Rating";
import { ResultBar } from "@/components/desk/Bars";
import MarketBar from "@/components/desk/MarketBar";
import Face from "@/components/desk/Face";

type Side = NonNullable<RaceLite["d"]>;

/** One corner of the face-off: photo, name, incumbency, cash. */
function Corner({ s, party, align }: { s: Side | null; party: "D" | "R"; align: "left" | "right" }) {
  const right = align === "right";
  if (!s) {
    return (
      <div className={`flex flex-col ${right ? "items-end text-right" : "items-start"} min-w-0`}>
        <span className="w-12 h-12 rounded-full border-2 border-dashed" style={{ borderColor: "#C9CCC4" }} aria-hidden />
        <p className="text-[13px] italic mt-2 leading-tight" style={{ color: "#8A918C" }}>No {party === "D" ? "Democrat" : "Republican"}</p>
      </div>
    );
  }
  return (
    <div className={`flex flex-col ${right ? "items-end text-right" : "items-start"} min-w-0`}>
      <span className="face-pop"><Face name={s.name} party={party} photo={s.photo} size={48} /></span>
      <p className="text-[14.5px] font-bold leading-tight mt-2 line-clamp-2" style={{ color: "var(--ink)" }}>{s.name}</p>
      <p className="text-[12px] mt-0.5 num" style={{ color: PARTY[party].color }}>
        {s.incumbent && <span className="label mr-1" style={{ fontSize: 9, color: "#6B726D" }}>Inc.</span>}
        {s.cash > 0 ? fmt(s.cash) : <span style={{ color: "#9AA19C" }}>No cash</span>}
      </p>
    </div>
  );
}

export default function RaceTile({ race, showStakes = true }: { race: RaceLite; showStakes?: boolean }) {
  const m = race.lean ? RATING[race.lean] : null;
  const dCash = race.d?.cash ?? 0, rCash = race.r?.cash ?? 0;
  const cashTotal = dCash + rCash;
  const dShare = cashTotal > 0 ? (dCash / cashTotal) * 100 : 50;
  return (
    <Link href={raceHref(race.key)}
      className="group card-depth flex flex-col overflow-hidden h-full"
      style={{ ["--tint" as string]: m?.tint ?? "#F1F2EE", ["--accent-line" as string]: m?.color ?? "#C9CCC4" }}>
      <div className="px-4 pt-4 pb-3.5 flex-1 flex flex-col">
        <div className="flex items-center justify-between gap-3">
          <span className="label" style={{ color: "#5B635E" }}>{race.tag}{race.open ? " · Open seat" : ""}</span>
          <RatingChip lean={race.lean} solid={m?.competitive} />
        </div>
        <h3 className="serif text-[18px] leading-snug font-semibold mt-1.5 group-hover:underline decoration-1 underline-offset-4" style={{ color: "var(--ink)" }}>
          {race.office}
        </h3>

        {/* Face-off */}
        <div className="relative grid grid-cols-[1fr_auto_1fr] items-start gap-2 mt-4">
          <Corner s={race.d} party="D" align="left" />
          <span className="mt-3 w-7 h-7 rounded-full flex items-center justify-center label shrink-0"
            style={{ fontSize: 9, background: "#fff", color: "#6B726D", boxShadow: "0 0 0 1px var(--rule), 0 2px 6px rgba(18,23,20,0.08)" }} aria-hidden>vs</span>
          <Corner s={race.r} party="R" align="right" />
        </div>

        {/* Money tug-of-war: each side's share of the combined war chest */}
        {cashTotal > 0 && race.d && race.r && (
          <div className="mt-3">
            <div className="relative flex h-1.5 rounded-full overflow-hidden" style={{ background: "#E4E6E0" }}
              role="img" aria-label={`Cash on hand: ${race.d.name} ${fmt(dCash)}, ${race.r.name} ${fmt(rCash)}`}>
              <span className="bar-grow" style={{ width: `${dShare}%`, background: PARTY.D.color }} />
              <span className="bar-grow" style={{ width: `${100 - dShare}%`, background: PARTY.R.color }} />
              <span className="absolute top-0 bottom-0 left-1/2 w-px bg-white" aria-hidden />
            </div>
            <p className="label mt-1 text-center" style={{ fontSize: 9, color: "#8A918C" }}>Share of cash on hand</p>
          </div>
        )}

        {race.market && race.d && race.r && (
          <div className="mt-3 rounded-md px-2.5 py-2" style={{ background: "rgba(255,255,255,0.7)", boxShadow: "inset 0 0 0 1px var(--rule)" }}>
            <MarketBar dName={race.d.name} rName={race.r.name} demProb={race.market.demProb} openInterest={race.market.openInterest} compact />
          </div>
        )}

        {showStakes && race.stakes && (
          <p className="text-[13px] leading-snug mt-3 line-clamp-3" style={{ color: "#454D48" }}>{race.stakes}</p>
        )}
      </div>
      {race.last && (
        <div className="px-4 py-2.5 border-t" style={{ borderColor: "var(--rule)", background: "rgba(250,250,248,0.9)" }}>
          <p className="label mb-1" style={{ color: "#7C837E", fontSize: 10 }}>
            {race.last.proxy ? `Baseline, ${race.last.year}` : `Last general, ${race.last.year}${race.last.oldLines ? ", old district lines" : ""}`}
          </p>
          <ResultBar dPct={race.last.dPct} rPct={race.last.rPct} compact />
        </div>
      )}
    </Link>
  );
}
