"use client";

// The historical depth layer. Four cycles of precinct-level data in one
// panel: partisan trend with linear projection, a combined
// demographics × turnout × performance view, and the surname-origin
// performance module (research-grade, caveat embedded in the viz).
// Used inside the Districts tool and (compact) on politician profiles.

import { useEffect, useMemo, useState } from "react";
import {
  loadHistory, aggregateGenerals, primaryAggregate, combinedPoints,
  surnameAnalysis, linearTrend, precinctSetFor,
  type PrecinctHistory, type CombinedPoint,
} from "@/lib/precinct-history";
import { computeFieldPositions, summarizeFieldPositions, FIELD_POSITION_METHOD } from "@/lib/field-position";
import crosswalkRaw from "@/lib/precinct-crosswalk.json";
import FieldNotes from "@/components/FieldNotes";

const NAVY = "#1a3a5c";
const D_BLUE = "#2563a8";
const R_RED = "#dc2626";
const MUTED = "#9ca3af";

const CROSSWALK = (crosswalkRaw as { precincts: Record<string, Record<string, string | undefined>> }).precincts;

function pct(v: number, digits = 0) { return `${(v * 100).toFixed(digits)}%`; }

/* ── 1. Partisan trend with projection ──────────────────────────────────── */
function TrendChart({ h, precincts }: { h: PrecinctHistory; precincts: Set<string> | null }) {
  const gens = useMemo(() => aggregateGenerals(h, precincts), [h, precincts]);
  const prim = useMemo(() => primaryAggregate(h, precincts), [h, precincts]);
  const trend = linearTrend(gens.map(g => ({ x: g.year, y: g.dShare })));
  const proj26 = Math.max(0, Math.min(1, trend.predict(2026)));

  const W = 560, H = 190, padL = 40, padR = 56, padT = 18, padB = 28;
  const years = [2020, 2022, 2024, 2026];
  const x = (yr: number) => padL + ((yr - 2020) / 6) * (W - padL - padR);
  const y = (share: number) => padT + (1 - (share - 0.3) / 0.45) * (H - padT - padB); // 30%–75% window

  const linePts = gens.map(g => `${x(g.year)},${y(g.dShare)}`).join(" ");
  const direction = trend.slope * 2; // per cycle
  const dirLabel = Math.abs(direction) < 0.005
    ? "holding steady"
    : `moving ${direction > 0 ? "toward Democrats" : "toward Republicans"} ${pct(Math.abs(direction), 1)} per cycle`;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: MUTED }}>
          Top-of-ticket Democratic share · three generals + linear trend
        </p>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {[0.4, 0.5, 0.6, 0.7].map(g => (
          <g key={g}>
            <line x1={padL} x2={W - padR} y1={y(g)} y2={y(g)} stroke="#00000010" strokeWidth="1" />
            <text x={padL - 6} y={y(g) + 3} textAnchor="end" fontSize="9" fill={MUTED}>{pct(g)}</text>
          </g>
        ))}
        <line x1={padL} x2={W - padR} y1={y(0.5)} y2={y(0.5)} stroke="#00000025" strokeDasharray="2 3" strokeWidth="1" />
        {/* trend extension */}
        <line x1={x(2024)} y1={y(Math.max(0.3, Math.min(0.75, trend.predict(2024))))}
          x2={x(2026)} y2={y(Math.max(0.3, Math.min(0.75, proj26)))}
          stroke={NAVY} strokeWidth="1.5" strokeDasharray="4 4" opacity="0.45" />
        <polyline points={linePts} fill="none" stroke={D_BLUE} strokeWidth="2.5" strokeLinejoin="round" />
        {gens.map(g => (
          <g key={g.cycle}>
            <circle cx={x(g.year)} cy={y(g.dShare)} r="4.5" fill={g.dShare >= 0.5 ? D_BLUE : R_RED} stroke="#fff" strokeWidth="1.5" />
            <text x={x(g.year)} y={y(g.dShare) - 9} textAnchor="middle" fontSize="10" fontWeight="700"
              fill={g.dShare >= 0.5 ? D_BLUE : R_RED}>{pct(g.dShare, 1)}</text>
          </g>
        ))}
        {/* 2026 projection marker */}
        <circle cx={x(2026)} cy={y(Math.max(0.3, Math.min(0.75, proj26)))} r="4" fill="none" stroke={NAVY} strokeWidth="1.5" strokeDasharray="2 2" />
        <text x={x(2026)} y={y(Math.max(0.3, Math.min(0.75, proj26))) - 9} textAnchor="middle" fontSize="9.5" fill={NAVY} opacity="0.7">{pct(proj26, 1)} proj.</text>
        {years.map(yr => (
          <text key={yr} x={x(yr)} y={H - 8} textAnchor="middle" fontSize="9.5" fill={MUTED}>
            {yr === 2026 ? "’26 trend" : `’${String(yr).slice(2)} ${yr === 2022 ? "Gov" : "Pres"}`}
          </text>
        ))}
      </svg>
      <p className="text-xs leading-relaxed mt-1" style={{ color: "#374151" }}>
        This electorate is <strong>{dirLabel}</strong>.
        {" "}Turnout {pct(gens[gens.length - 1].turnoutRate)} of registered in 2024
        {gens[0].turnoutRate ? ` (vs ${pct(gens[0].turnoutRate)} in 2020)` : ""}.
        {" "}In the 2026 primary, {pct(prim.dShare)} of ballots here were Democratic.
      </p>
      <p className="text-[10px] mt-1" style={{ color: MUTED }}>
        2020–2024 statewide top-of-ticket results re-tabulated on current precinct lines (Texas
        Legislative Council). The dashed projection is a least-squares line on three points –
        a trajectory, not a forecast. The 2026 primary point measures participation, not a
        head-to-head result, so it is reported separately.
      </p>
    </div>
  );
}

/* ── 2. Combined view: demographics × turnout × performance ─────────────── */
function CombinedView({ h, precincts }: { h: PrecinctHistory; precincts: Set<string> | null }) {
  const [axis, setAxis] = useState<"hispShare" | "blackShare">("hispShare");
  const pts = useMemo(() => combinedPoints(h, precincts), [h, precincts]);
  if (pts.length < 5) return null;

  const W = 560, H = 230, padL = 40, padR = 14, padT = 12, padB = 30;
  const x = (v: number) => padL + v * (W - padL - padR);
  const y = (v: number) => padT + (1 - v) * (H - padT - padB);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: MUTED }}>
          Every precinct: demographics × turnout × result, one view
        </p>
        <div className="flex gap-1.5">
          {([["hispShare", "Hispanic VAP"], ["blackShare", "Black VAP"]] as const).map(([k, label]) => (
            <button key={k} onClick={() => setAxis(k)}
              className="text-[10px] font-bold px-2.5 py-1 rounded-full transition-all"
              style={{
                background: axis === k ? NAVY : "#fff", color: axis === k ? "#fff" : "#374151",
                border: `1px solid ${axis === k ? NAVY : "#e5e7eb"}`,
              }}>{label}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {[0, 0.25, 0.5, 0.75, 1].map(g => (
          <g key={g}>
            <line x1={x(g)} x2={x(g)} y1={padT} y2={H - padB} stroke="#00000008" />
            <text x={x(g)} y={H - 10} textAnchor="middle" fontSize="9" fill={MUTED}>{pct(g)}</text>
          </g>
        ))}
        {[0.25, 0.5, 0.75].map(g => (
          <g key={g}>
            <line x1={padL} x2={W - padR} y1={y(g)} y2={y(g)} stroke="#00000010" />
            <text x={padL - 6} y={y(g) + 3} textAnchor="end" fontSize="9" fill={MUTED}>{pct(g)}</text>
          </g>
        ))}
        <line x1={padL} x2={W - padR} y1={y(0.5)} y2={y(0.5)} stroke="#00000025" strokeDasharray="2 3" />
        {pts.map(p => (
          <circle key={p.prec} cx={x(p[axis])} cy={y(p.dShare24)}
            r={2 + p.turnout24 * 5}
            fill={p.trendSlope > 0.002 ? D_BLUE : p.trendSlope < -0.002 ? R_RED : "#6b7280"}
            opacity="0.45">
            <title>{`Precinct ${p.prec}. ${pct(p[axis])} ${axis === "hispShare" ? "Hispanic" : "Black"} VAP · ${pct(p.dShare24, 1)} D 2024 · ${pct(p.turnout24)} turnout · trend ${p.trendSlope > 0 ? "+" : ""}${(p.trendSlope * 100).toFixed(1)}pp/cycle`}</title>
          </circle>
        ))}
        <text x={W - padR} y={H - 10} textAnchor="end" fontSize="9" fill={MUTED}>→ {axis === "hispShare" ? "Hispanic" : "Black"} share of voting-age population</text>
        <text x={padL} y={padT - 2} fontSize="9" fill={MUTED}>↑ 2024 Democratic share</text>
      </svg>
      <p className="text-[10px] leading-relaxed mt-1" style={{ color: MUTED }}>
        Each dot is a precinct ({pts.length} shown; precincts under 25 votes excluded). Size =
        2024 turnout rate. Color = four-year trajectory: <span style={{ color: D_BLUE }}>■</span> moving
        toward Democrats, <span style={{ color: R_RED }}>■</span> toward Republicans, grey stable.
        Demographics: 2020 Census VAP. Hover any dot for the precinct number.
      </p>
    </div>
  );
}

/* ── 3. Field Position. Directional precinct model ─────────────────────── */
function FieldPositionModule({ h, precincts }: { h: PrecinctHistory; precincts: Set<string> | null }) {
  const [showMethod, setShowMethod] = useState(false);
  const fps = useMemo(() => computeFieldPositions(h, precincts), [h, precincts]);
  if (fps.length < 3) return null;
  const sum = summarizeFieldPositions(fps);
  const ORDER = ["Firm D", "Lean D", "Contested", "Lean R", "Firm R"] as const;
  const COLORS: Record<string, string> = { "Firm D": "#1e3a8a", "Lean D": "#7ea8d8", "Contested": "#a78bfa", "Lean R": "#e58f8f", "Firm R": "#991b1b" };
  return (
    <div>
      <div className="flex items-baseline justify-between flex-wrap gap-2 mb-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: MUTED }}>
          Field Position · directional read per precinct
        </p>
        <button onClick={() => setShowMethod(m => !m)} className="text-[10px] underline" style={{ color: MUTED }}>
          {showMethod ? "hide methodology" : "methodology"}
        </button>
      </div>
      <p className="text-xs leading-relaxed mb-3" style={{ color: "#374151" }}>
        Average Field Position here: <strong style={{ color: sum.avg >= 0 ? D_BLUE : R_RED }}>
        {sum.avg > 0 ? "+" : ""}{sum.avg}</strong> on a −100 (firm Republican) to +100 (firm Democratic)
        scale, from four cycles of certified results. A signal from past behavior: not a forecast.
      </p>
      <div className="flex h-[18px] rounded-full overflow-hidden mb-2" style={{ background: "#00000008" }}>
        {ORDER.map(k => sum.counts[k] > 0 && (
          <div key={k} style={{ width: `${(sum.counts[k] / sum.total) * 100}%`, background: COLORS[k] }}
            title={`${k}: ${sum.counts[k]} precincts`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2">
        {ORDER.map(k => (
          <span key={k} className="text-[10px]" style={{ color: "#374151" }}>
            <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: COLORS[k] }} />
            {k} · <strong className="tnum">{sum.counts[k]}</strong>
          </span>
        ))}
      </div>
      {showMethod && (
        <div className="rounded-xl px-3.5 py-2.5" style={{ background: "#1a3a5c0a", border: "1px solid #1a3a5c1a" }}>
          <p className="text-[10px] leading-relaxed" style={{ color: "#374151" }}>{FIELD_POSITION_METHOD}</p>
        </div>
      )}
    </div>
  );
}

/* ── 4. Surname-origin performance ───────────────────────────────────────── */
function SurnameModule({ h, precincts }: { h: PrecinctHistory; precincts: Set<string> | null }) {
  const buckets = useMemo(() => surnameAnalysis(h, precincts), [h, precincts]);
  if (buckets.length < 2) return null;

  const biggest = buckets.reduce((a, b) => Math.abs(b.differential) > Math.abs(a.differential) ? b : a, buckets[0]);
  const pp = (Math.abs(biggest.differential) * 100).toFixed(1);
  const isPos = biggest.differential >= 0;

  // Short human-readable label for each SSVR bucket
  const shortLabel: Record<string, string> = {
    "Under 10% SSVR": "Mostly non-Hispanic",
    "10–25% SSVR":    "Mixed areas",
    "25–45% SSVR":    "Hispanic-leaning",
    "45%+ SSVR":      "Heavily Hispanic",
  };

  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1" style={{ color: MUTED }}>
        Cruz vs Trump in 2024: the surname effect
      </p>
      <p className="text-[10px] mb-3 leading-relaxed" style={{ color: MUTED }}>
        Both appeared on the same ballot. Any gap between them is a <em>candidate</em> effect, not a party one.
        In the most Hispanic precincts, Cruz {isPos ? "ran" : "ran"} <strong style={{ color: isPos ? R_RED : D_BLUE }}>{isPos ? `+${pp} pts ahead of` : `${pp} pts behind`}</strong> Trump.
      </p>

      {/* Side-by-side vote share per SSVR bucket */}
      <div className="space-y-3">
        {buckets.map(b => {
          const cruzPct  = Math.round(b.cruzShare  * 100);
          const trumpPct = Math.round(b.trumpShare * 100);
          const diffPp   = Math.round(b.differential * 100);
          const diffPos  = diffPp >= 0;
          const barMax   = Math.max(cruzPct, trumpPct, 1);
          return (
            <div key={b.label}>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-[11px] font-semibold" style={{ color: NAVY }}>
                  {shortLabel[b.label] ?? b.label}
                  <span className="font-normal text-[9px] ml-1" style={{ color: MUTED }}>({b.precincts} precincts)</span>
                </span>
                <span className="text-[10px] font-bold tnum" style={{ color: diffPos ? R_RED : D_BLUE }}>
                  Cruz {diffPos ? "+" : ""}{diffPp}pp vs Trump
                </span>
              </div>
              {/* Cruz row */}
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[9px] w-[34px] text-right font-medium tnum" style={{ color: R_RED }}>Cruz</span>
                <div className="flex-1 relative h-[7px] rounded-full overflow-hidden" style={{ background: "#fee2e2" }}>
                  <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${(cruzPct / barMax) * 100}%`, background: R_RED, opacity: 0.8 }} />
                </div>
                <span className="text-[10px] font-bold tnum w-[28px]" style={{ color: R_RED }}>{cruzPct}%</span>
              </div>
              {/* Trump row */}
              <div className="flex items-center gap-2">
                <span className="text-[9px] w-[34px] text-right font-medium tnum" style={{ color: "#6b7280" }}>Trump</span>
                <div className="flex-1 relative h-[7px] rounded-full overflow-hidden" style={{ background: "#f3f4f6" }}>
                  <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${(trumpPct / barMax) * 100}%`, background: "#9ca3af", opacity: 0.9 }} />
                </div>
                <span className="text-[10px] font-bold tnum w-[28px]" style={{ color: "#6b7280" }}>{trumpPct}%</span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[9px] mt-3 leading-relaxed" style={{ color: MUTED }}>
        Republican vote share within R+D two-way total. Buckets by Spanish-surname voter registration (SSVR) share.
        Party held constant. Isolates candidate effect only. Data: 2024 TX SOS returns.
      </p>
    </div>
  );
}

/* ── Wrapper ─────────────────────────────────────────────────────────────── */
export default function DistrictHistory({
  field, value, compact = false, title,
}: {
  field: string | null;   // crosswalk field: cd | sd | hd | jp | council | pct
  value: string | null;
  compact?: boolean;      // profile mode: trend only
  title?: string;
}) {
  const [h, setH] = useState<PrecinctHistory | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => { loadHistory().then(setH).catch(() => setErr(true)); }, []);

  const precincts = useMemo(() => precinctSetFor(CROSSWALK, field, value), [field, value]);

  if (err) return null;
  if (!h) return <div className="skeleton h-48 rounded-[1.35rem]" />;
  if (precincts && precincts.size === 0) return null;

  return (
    <div className="hcp-card p-5 md:p-6">
      <div className="flex items-baseline justify-between mb-4 flex-wrap gap-1">
        <h3 className="text-lg font-bold" style={{ color: NAVY, fontFamily: "var(--font-playfair,serif)" }}>
          {title ?? "How This Seat Has Shifted"}
        </h3>
        <p className="text-[10px]" style={{ color: MUTED }}>
          Four cycles · 2020–2026 · {precincts ? `${precincts.size} precincts` : "all 1,172 precincts"}
        </p>
      </div>
      <TrendChart h={h} precincts={precincts} />
      {!compact && (
        <>
          <div className="my-6 h-px" style={{ background: "#00000010" }} />
          <CombinedView h={h} precincts={precincts} />
          <div className="my-6 h-px" style={{ background: "#00000010" }} />
          <FieldPositionModule h={h} precincts={precincts} />
          <div className="my-6 h-px" style={{ background: "#00000010" }} />
          <SurnameModule h={h} precincts={precincts} />
        </>
      )}
      <FieldNotes target={`district:${field ?? "countywide"}-${value ?? "all"}`} />
      <p className="text-[9.5px] mt-4" style={{ color: MUTED }}>
        Sources: Texas Legislative Council election returns re-tabulated on current precinct
        geography · TX SOS voter registration &amp; Spanish-surname registration · 2020 Census VAP ·
        Harris County Clerk 2026 primary canvass. Built {new Date(h.builtAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}.
      </p>
    </div>
  );
}
