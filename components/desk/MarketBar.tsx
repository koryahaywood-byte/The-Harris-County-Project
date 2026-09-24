import { PARTY } from "@/lib/ratings";

/** Kalshi implied win probability as a split bar. Only rendered for liquid markets (lib/kalshi.ts). */
export default function MarketBar({ dName, rName, demProb, openInterest, compact = false }: {
  dName: string; rName: string; demProb: number; openInterest?: number; compact?: boolean;
}) {
  const repProb = 100 - demProb;
  const last = (n: string) => n.replace(/\s+(Jr\.?|Sr\.?|III|II)$/i, "").split(" ").slice(-1)[0];
  return (
    <div>
      <div className="flex items-baseline justify-between num">
        <span className={`${compact ? "text-[13px]" : "text-[15px]"} font-bold`} style={{ color: PARTY.D.color }}>{last(dName)} {demProb}%</span>
        {compact && <span className="label" style={{ fontSize: 9, color: "#7C837E" }}>Kalshi{openInterest ? ` · ${Math.round(openInterest / 1000)}K open` : ""}</span>}
        <span className={`${compact ? "text-[13px]" : "text-[15px]"} font-bold`} style={{ color: PARTY.R.color }}>{repProb}% {last(rName)}</span>
      </div>
      <div className={`relative flex ${compact ? "h-1.5" : "h-2.5"} mt-1.5 rounded-full overflow-hidden`} style={{ background: "#E4E6E0" }}
        role="img" aria-label={`Kalshi traders give ${dName} a ${demProb}% chance and ${rName} ${repProb}%`}>
        <span className="bar-grow" style={{ width: `${demProb}%`, background: `repeating-linear-gradient(135deg, ${PARTY.D.color} 0 6px, ${PARTY.D.soft} 6px 8px)` }} />
        <span className="bar-grow" style={{ width: `${repProb}%`, background: `repeating-linear-gradient(135deg, ${PARTY.R.color} 0 6px, ${PARTY.R.soft} 6px 8px)` }} />
        <span className="absolute top-0 bottom-0 left-1/2 w-px bg-white/90" aria-hidden />
      </div>
    </div>
  );
}
