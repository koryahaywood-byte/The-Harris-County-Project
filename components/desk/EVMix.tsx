import { PARTY } from "@/lib/ratings";
import type { Mix } from "@/lib/early-vote";

export const NONE_COLOR = "#868D88";

/** Early voters by primary history: one 100% bar, 2px surface gaps, values in the legend (never in the color). */
export default function EVMix({ m, compact = false, inline = false, caption }: { m: Mix; compact?: boolean; inline?: boolean; caption?: string }) {
  const parts = [
    { key: "D", label: "Democratic primary", n: m.D, color: PARTY.D.color },
    { key: "R", label: "Republican primary", n: m.R, color: PARTY.R.color },
    { key: "N", label: "No primary", n: m.N, color: NONE_COLOR },
  ];
  const total = m.all || 1;
  return (
    <div>
      <div className={`flex ${inline ? "h-2" : compact ? "h-2.5" : "h-4"} gap-[2px] rounded-[4px] overflow-hidden`}
        role="img" aria-label={parts.map(p => `${p.label} ${((p.n / total) * 100).toFixed(1)}%`).join(", ")}>
        {parts.map(p => p.n > 0 && (
          <span key={p.key} className="bar-grow" title={`${p.label}: ${p.n.toLocaleString()} (${((p.n / total) * 100).toFixed(1)}%)`}
            style={{ width: `${(p.n / total) * 100}%`, background: p.color }} />
        ))}
      </div>
      {inline ? (
        // Table cells: one line, letters carry identity alongside the bar above.
        <p className="mt-1 text-[11.5px] num" style={{ color: "var(--ink-2)" }}>
          {parts.map((p, i) => (
            <span key={p.key}>{i > 0 && <span style={{ color: "#B5BAB3" }}> · </span>}
              <b className="font-semibold" style={{ color: "var(--ink)" }}>{Math.round((p.n / total) * 100)}</b> {p.key === "N" ? "none" : p.key}
            </span>
          ))}
        </p>
      ) : (
      <div className={`flex flex-wrap gap-x-4 gap-y-1 ${compact ? "mt-1.5 text-[12px]" : "mt-2.5 text-[13.5px]"}`}>
        {parts.map(p => (
          <span key={p.key} className="inline-flex items-center gap-1.5 num" style={{ color: "var(--ink-2)" }}>
            <span className="w-2.5 h-2.5 rounded-[2px] shrink-0" style={{ background: p.color }} aria-hidden />
            <span>{p.label}</span>
            <b className="font-semibold" style={{ color: "var(--ink)" }}>{((p.n / total) * 100).toFixed(1)}%</b>
          </span>
        ))}
      </div>
      )}
      {caption && <p className="text-[12px] mt-1.5" style={{ color: "#6B726D" }}>{caption}</p>}
    </div>
  );
}
