// Field Position. The directional performance score per precinct.
// Built ONLY from the four-cycle historical layer; methodology published in
// full below and at /methodology. It answers one question: if November looked
// like the recent past, which way does this precinct lean and how firmly?
//
//   Field Position = 100 × tanh( 2.2 × margin ) , displayed −100…+100
//   where margin is a weighted blend of:
//     55%  baseline  . Average two-party D margin across 2020/2022/2024
//     25%  trajectory. Per-cycle D-margin trend, projected one cycle ahead
//     12%  turnout   . Turnout-trend adjustment: a precinct bleeding turnout
//                        weakens whichever side it favors (signal dampening)
//      8%  composition– SSVR-share interaction with the countywide
//                        same-ballot surname differential (descriptive only)
//
// Positive = Democratic field position, negative = Republican.
// Confidence: high (3 cycles ≥25 votes), medium (2), low (1 or sparse).
// This is a DIRECTIONAL SIGNAL from past behavior. Not a forecast, not a
// poll, and it knows nothing about candidates, money, or 2026 conditions.

import {
  type PrecinctHistory, GENERAL_CYCLES, TOP_RACE, linearTrend, surnameAnalysis,
} from "./precinct-history";

export interface FieldPosition {
  prec: string;
  score: number;            // −100 (firm R) … +100 (firm D)
  label: "Firm D" | "Lean D" | "Contested" | "Lean R" | "Firm R";
  confidence: "high" | "medium" | "low";
  components: { baseline: number; trajectory: number; turnoutAdj: number; composition: number };
  cycles: number;
}

export const FIELD_POSITION_METHOD =
  "Field Position = 100·tanh(2.2·m), m = 0.55·baseline margin (avg two-party D margin, 2020/2022/2024 top-of-ticket) + 0.25·trajectory (per-cycle margin trend projected one cycle) + 0.12·turnout adjustment (a precinct losing turnout has its lean dampened) + 0.08·composition (SSVR share × the countywide same-ballot surname differential, descriptive). Inputs: TLC certified returns on current precinct lines, TX SOS registration + Spanish-surname registration, 2020 Census VAP. It is a directional read of past behavior: not a forecast.";

function bucket(score: number): FieldPosition["label"] {
  if (score >= 40) return "Firm D";
  if (score >= 12) return "Lean D";
  if (score > -12) return "Contested";
  if (score > -40) return "Lean R";
  return "Firm R";
}

export function computeFieldPositions(h: PrecinctHistory, precincts: Set<string> | null): FieldPosition[] {
  // Countywide surname differential (Cruz−Trump per SSVR bucket): one number:
  // the slope of differential vs bucket midpoint, used as a tiny composition term.
  const buckets = surnameAnalysis(h, null);
  const mids = [0.05, 0.175, 0.35, 0.6];
  const surnameSlope = buckets.length >= 2
    ? linearTrend(buckets.map((b, i) => ({ x: mids[i] ?? 0.5, y: b.differential }))).slope
    : 0;

  const perCycle = GENERAL_CYCLES.map(key => {
    const race = h.cycles[key].races![TOP_RACE[key]];
    const d = race.candidates.findIndex(c => c.party === "D");
    const r = race.candidates.findIndex(c => c.party === "R");
    return { key, year: parseInt(key), race, d, r, voter: h.cycles[key].voter! };
  });

  const out: FieldPosition[] = [];
  const allPrecs = Object.keys(h.cycles["2024G"].voter!);

  for (const prec of allPrecs) {
    if (precincts && !precincts.has(prec)) continue;

    const series: { x: number; margin: number; turnoutRate: number }[] = [];
    for (const c of perCycle) {
      const votes = c.race.votes[prec];
      const v = c.voter[prec];
      if (!votes || !v?.reg) continue;
      const dd = votes[c.d] ?? 0, rr = votes[c.r] ?? 0;
      if (dd + rr < 25) continue;
      series.push({ x: c.year, margin: (dd - rr) / (dd + rr), turnoutRate: Math.min(1, v.turnout / v.reg) });
    }
    if (!series.length) continue;

    const baseline = series.reduce((s, p) => s + p.margin, 0) / series.length;

    const trajectory = series.length >= 2
      ? Math.max(-0.5, Math.min(0.5, linearTrend(series.map(p => ({ x: p.x, y: p.margin }))).slope * 2))
      : 0;

    // Turnout trend dampens the favored side's margin
    const turnoutTrend = series.length >= 2
      ? linearTrend(series.map(p => ({ x: p.x, y: p.turnoutRate }))).slope * 2
      : 0;
    const turnoutAdj = -Math.sign(baseline) * Math.min(0.3, Math.max(0, -turnoutTrend) * 1.5);

    const v24 = h.cycles["2024G"].voter![prec];
    const ssvrShare = v24?.reg ? v24.ssvr / v24.reg : 0;
    // Descriptive composition term: in 2024, higher-SSVR precincts moved with
    // the surname differential slope; sign follows the observed direction.
    const composition = Math.max(-0.15, Math.min(0.15, -surnameSlope * ssvrShare));

    const m = 0.55 * baseline + 0.25 * trajectory + 0.12 * turnoutAdj + 0.08 * composition;
    const score = Math.round(100 * Math.tanh(2.2 * m));

    out.push({
      prec, score, label: bucket(score),
      confidence: series.length >= 3 ? "high" : series.length === 2 ? "medium" : "low",
      components: {
        baseline: Math.round(baseline * 100),
        trajectory: Math.round(trajectory * 100),
        turnoutAdj: Math.round(turnoutAdj * 100),
        composition: Math.round(composition * 100),
      },
      cycles: series.length,
    });
  }
  return out;
}

export function summarizeFieldPositions(fps: FieldPosition[]) {
  const n = fps.length || 1;
  const counts = { "Firm D": 0, "Lean D": 0, "Contested": 0, "Lean R": 0, "Firm R": 0 };
  for (const f of fps) counts[f.label]++;
  const avg = Math.round(fps.reduce((s, f) => s + f.score, 0) / n);
  return { counts, avg, total: fps.length };
}
