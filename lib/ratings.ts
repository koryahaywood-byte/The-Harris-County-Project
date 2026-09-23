// Single visual vocabulary for race ratings. Every surface that shows a lean
// (front page strip, race board, race pages, my ballot, share cards) reads
// from here so a rating always looks and reads the same everywhere.
// Ratings themselves live ONLY in lib/matchups-2026.ts.

import type { RaceLean } from "@/lib/matchups-2026";

export interface RatingMeta {
  label: string;      // "Lean D"
  long: string;       // "Leans Democratic"
  order: number;      // 0 = most Democratic, 8 = most Republican
  color: string;      // solid fill
  ink: string;        // text color that reads on the solid fill
  tint: string;       // quiet background for chips on light surfaces
  side: "D" | "R" | "X";
  competitive: boolean;
}

export const RATING: Record<RaceLean, RatingMeta> = {
  "uncontested-d": { label: "No R filed", long: "Democrat unopposed",     order: 0, color: "#1A3A93", ink: "#fff",    tint: "#E3E9F8", side: "D", competitive: false },
  "safe-d":        { label: "Safe D",     long: "Safe Democratic",        order: 1, color: "#1F46B0", ink: "#fff",    tint: "#E3E9F8", side: "D", competitive: false },
  "likely-d":      { label: "Likely D",   long: "Likely Democratic",      order: 2, color: "#4A6FD3", ink: "#fff",    tint: "#E8EDFA", side: "D", competitive: false },
  "lean-d":        { label: "Lean D",     long: "Leans Democratic",       order: 3, color: "#93AAE8", ink: "#0F2566", tint: "#EEF2FC", side: "D", competitive: true },
  "toss-up":       { label: "Toss-up",    long: "Toss-up",                order: 4, color: "#E2B13C", ink: "#3A2A00", tint: "#FBF1D6", side: "X", competitive: true },
  "lean-r":        { label: "Lean R",     long: "Leans Republican",       order: 5, color: "#EC9C92", ink: "#5E130C", tint: "#FCEDEA", side: "R", competitive: true },
  "likely-r":      { label: "Likely R",   long: "Likely Republican",      order: 6, color: "#D2584B", ink: "#fff",    tint: "#FAE6E3", side: "R", competitive: false },
  "safe-r":        { label: "Safe R",     long: "Safe Republican",        order: 7, color: "#A92C22", ink: "#fff",    tint: "#F7E2DF", side: "R", competitive: false },
  "uncontested-r": { label: "No D filed", long: "Republican unopposed",   order: 8, color: "#86211A", ink: "#fff",    tint: "#F7E2DF", side: "R", competitive: false },
};

/** The seven steps shown on a rating scale, uncontested folded into safe. */
export const SCALE: RaceLean[] = ["safe-d", "likely-d", "lean-d", "toss-up", "lean-r", "likely-r", "safe-r"];

export const PARTY = {
  D: { color: "#2350C2", soft: "#7F9BE3", tint: "#E9EEFB", name: "Democrat" },
  R: { color: "#C0392E", soft: "#E48A80", tint: "#FBEAE7", name: "Republican" },
} as const;

export function ratingOf(lean?: RaceLean): RatingMeta | null {
  return lean ? RATING[lean] : null;
}

/** URL slug for a matchup key: "HD-134" → "hd-134", "JP-5-PL2" → "jp-5-pl2". */
export const raceSlug = (key: string) => key.toLowerCase();
export const raceHref = (key: string) => `/races/${raceSlug(key)}`;
