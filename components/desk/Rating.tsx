import type { RaceLean } from "@/lib/matchups-2026";
import { RATING, SCALE } from "@/lib/ratings";

/** Compact rating chip. `solid` fills with the rating color (for dark or dense contexts). */
export function RatingChip({ lean, solid = false, className = "" }: { lean?: RaceLean; solid?: boolean; className?: string }) {
  if (!lean) return <span className={`label px-2 py-[3px] rounded ${className}`} style={{ background: "#ECEDE8", color: "#5B635E" }}>Unrated</span>;
  const m = RATING[lean];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded px-2 py-[3px] text-[11px] font-bold uppercase tracking-[0.06em] ${className}`}
      style={solid ? { background: m.color, color: m.ink } : { background: m.tint, color: m.side === "X" ? "#7A5A00" : m.side === "D" ? "#173A9A" : "#962A20" }}>
      {!solid && <span className="w-2 h-2 rounded-[2px]" style={{ background: m.color }} aria-hidden />}
      {m.label}
    </span>
  );
}

/** Seven-step rating scale with the race's position marked. */
export function RatingScale({ lean, dark = false }: { lean?: RaceLean; dark?: boolean }) {
  const idx = lean ? SCALE.indexOf(lean === "uncontested-d" ? "safe-d" : lean === "uncontested-r" ? "safe-r" : lean) : -1;
  return (
    <div>
      <div className="grid grid-cols-7 gap-[3px]" role="img" aria-label={lean ? `Rated ${RATING[lean].long}` : "Not rated"}>
        {SCALE.map((s, i) => (
          <div key={s} className="h-3 rounded-[2px] relative"
            style={{ background: RATING[s].color, opacity: idx < 0 ? 0.25 : i === idx ? 1 : dark ? 0.22 : 0.18 }}>
            {i === idx && (
              <span className="absolute -top-[7px] left-1/2 -translate-x-1/2 w-0 h-0"
                style={{ borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: `6px solid ${dark ? "#fff" : "var(--ink)"}` }} aria-hidden />
            )}
          </div>
        ))}
      </div>
      <div className={`flex justify-between mt-1.5 label ${dark ? "text-white/45" : ""}`} style={dark ? undefined : { color: "#7C837E" }}>
        <span>Safe D</span><span>Toss-up</span><span>Safe R</span>
      </div>
    </div>
  );
}
