import manifest from "./player-models.json";

/** Full-body 3D likenesses built by scripts/build-player-models.mjs from each official's portrait. */
export type PlayerModelEntry = {
  file: string;      // public path to the optimized GLB
  portrait: string;  // the portrait it was generated from
  pipeline: string;  // models used, for the on-page disclosure
  generated: string; // YYYY-MM-DD
  yaw?: number;      // radians, if a mesh comes out not facing the camera
};

export const PLAYER_MODELS = manifest as Record<string, PlayerModelEntry>;
export const playerModelFor = (slug: string): PlayerModelEntry | null => PLAYER_MODELS[slug] ?? null;
