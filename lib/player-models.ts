import manifest from "./player-models.json";

/** Full-body 3D likenesses built by scripts/build-player-models.mjs from each official's portrait. */
export type PlayerModelEntry = {
  file: string;       // public path to the optimized GLB
  portrait: string;   // the portrait it was generated from
  pipeline: string;   // models used, for the on-page disclosure
  generated: string;  // YYYY-MM-DD
  yaw?: number;       // radians, if a mesh comes out not facing the camera
  review?: "pending"; // new models stay off the live site until approved
};

export const PLAYER_MODELS = manifest as Record<string, PlayerModelEntry>;

/** Approved models everywhere; pending ones only in local dev, for review. */
export function playerModelFor(slug: string): PlayerModelEntry | null {
  const m = PLAYER_MODELS[slug];
  if (!m) return null;
  if (m.review === "pending" && process.env.NODE_ENV === "production") return null;
  return m;
}
