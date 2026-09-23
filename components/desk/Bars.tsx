import { PARTY } from "@/lib/ratings";
import { fmt } from "@/lib/campaign-finance";

/** Two-party split bar with the winner's margin called out. Used for past results. */
export function ResultBar({ dPct, rPct, caption, compact = false }: { dPct: number; rPct: number; caption?: string; compact?: boolean }) {
  const margin = Math.abs(dPct - rPct);
  const winner = dPct >= rPct ? "D" : "R";
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5 num">
        <span className={`${compact ? "text-[13px]" : "text-[15px]"} font-bold`} style={{ color: PARTY.D.color }}>D {dPct.toFixed(compact ? 0 : 1)}%</span>
        <span className="text-[11px] font-semibold" style={{ color: "#5B635E" }}>
          {winner}+{margin.toFixed(1)}
        </span>
        <span className={`${compact ? "text-[13px]" : "text-[15px]"} font-bold`} style={{ color: PARTY.R.color }}>{rPct.toFixed(compact ? 0 : 1)}% R</span>
      </div>
      <div className={`relative ${compact ? "h-1.5" : "h-2.5"} rounded-full overflow-hidden flex`} style={{ background: "#E4E6E0" }}>
        <div style={{ width: `${dPct}%`, background: PARTY.D.color }} />
        <div style={{ width: `${rPct}%`, background: PARTY.R.color }} />
        <span className="absolute top-0 bottom-0 left-1/2 w-px" style={{ background: "rgba(255,255,255,0.9)" }} aria-hidden />
      </div>
      {caption && <p className="mt-1.5 text-[12px]" style={{ color: "#6B726D" }}>{caption}</p>}
    </div>
  );
}

/** Cash on hand, head to head. Bars scale to the larger war chest so the gap reads at a glance. */
export function CashDuel({ d, r, dName, rName, compact = false }: { d: number; r: number; dName?: string; rName?: string; compact?: boolean }) {
  const max = Math.max(d, r, 1);
  const lead = d === r ? null : d > r ? "D" : "R";
  const ratio = Math.min(d, r) > 0 ? Math.max(d, r) / Math.min(d, r) : null;
  const row = (party: "D" | "R", v: number, name?: string) => (
    <div className="grid items-center gap-2" style={{ gridTemplateColumns: compact ? "1fr 64px" : "minmax(0,110px) 1fr 76px" }}>
      {!compact && <span className="text-[13px] font-semibold truncate" style={{ color: "var(--ink)" }}>{name}</span>}
      <div className="h-2 rounded-full" style={{ background: "#ECEDE8" }}>
        <div className="h-2 rounded-full" style={{ width: `${Math.max((v / max) * 100, v > 0 ? 2 : 0)}%`, background: PARTY[party].color, opacity: lead && lead !== party ? 0.55 : 1 }} />
      </div>
      <span className="text-[13px] font-bold text-right num" style={{ color: v > 0 ? PARTY[party].color : "#9AA19C" }}>{v > 0 ? fmt(v) : "None"}</span>
    </div>
  );
  return (
    <div className="space-y-1.5">
      {row("D", d, dName)}
      {row("R", r, rName)}
      {!compact && lead && (
        <p className="text-[12px]" style={{ color: "#6B726D" }}>
          {lead === "D" ? dName : rName} {ratio && ratio >= 1.1 ? `holds ${ratio >= 10 ? Math.round(ratio) : ratio.toFixed(1)}x as much cash` : "holds a narrow cash edge"}.
        </p>
      )}
    </div>
  );
}
