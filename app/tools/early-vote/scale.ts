/** Map scales for the early-vote precinct map, shared by the map and its legend (kept out of the Leaflet bundle). */
export type PrecinctRow = [number, number, number, number, number, number, number, number, number, number, number]; // all, D, R, N, inPerson, mail, reg2024, poolD, poolR, D26, R26
export type Metric = "gap" | "edge" | "turnout";

export const EDGE_STEPS = [
  { max: -30, color: "#8E2A21", label: "R+30" }, { max: -15, color: "#C0392E", label: "R+15" }, { max: -5, color: "#E48A80", label: "R+5" },
  { max: 5, color: "#E4E6E0", label: "Even" },
  { max: 15, color: "#7F9BE3", label: "D+5" }, { max: 30, color: "#2350C2", label: "D+15" }, { max: Infinity, color: "#17398F", label: "D+30" },
];
export const TURNOUT_RAMP = ["#E6F0EA", "#BFDCCB", "#8CC2A5", "#55A07B", "#2B7A56", "#0B5A3B"];

export function turnoutBreaks(rows: PrecinctRow[]) {
  const rates = rows.filter(r => r[6] > 50).map(r => r[0] / r[6]).sort((a, b) => a - b);
  const q = (p: number) => rates[Math.floor(p * (rates.length - 1))] ?? 0;
  // Quantile breaks, rounded to a whole percent so the legend reads cleanly.
  return [0.2, 0.4, 0.6, 0.8, 0.95].map(p => Math.max(0.01, Math.round(q(p) * 100) / 100));
}


/** Turnout gap: D minus R share of each party's March 2026 primary voters who have voted, in points. */
export const GAP_STEPS = [
  { max: -10, color: "#8E2A21", label: "R+10" }, { max: -5, color: "#C0392E", label: "R+5" }, { max: -2, color: "#E48A80", label: "R+2" },
  { max: 2, color: "#E4E6E0", label: "Even" },
  { max: 5, color: "#7F9BE3", label: "D+2" }, { max: 10, color: "#2350C2", label: "D+5" }, { max: Infinity, color: "#17398F", label: "D+10" },
];
export const MIN_POOL = 30;   // March primary voters per party needed to read a precinct's gap
export const gapOf = (r: PrecinctRow) => (r[7] >= MIN_POOL && r[8] >= MIN_POOL ? (r[9] / r[7] - r[10] / r[8]) * 100 : null);
