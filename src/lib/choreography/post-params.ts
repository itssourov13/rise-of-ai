/**
 * Post-processing PARAMETERS written by the active scene's choreography and read by the engine's
 * PostStack each frame. Mutable and non-reactive on purpose (changes every frame; never React/Zustand state).
 * All multipliers are 0..1-ish scalers applied to the quality-tier plan (lib/three/renderer/post-processing.ts);
 * they never add or remove effects.
 *
 *   bloom    multiplier on the plan's bloom intensity
 *   dof      multiplier on the plan's bokeh scale (0 = effectively sharp)
 *   vignette multiplier on vignette darkness
 *   focus    world-space point kept in focus by depth of field
 */
export interface PostParams {
  bloom: number;
  dof: number;
  vignette: number;
  focus: [number, number, number];
}

const DEFAULTS = { bloom: 1, dof: 0, vignette: 1 } as const;

export const postParams: PostParams = { ...DEFAULTS, focus: [0, 0, 0] };

export function resetPostParams(): void {
  postParams.bloom = DEFAULTS.bloom;
  postParams.dof = DEFAULTS.dof;
  postParams.vignette = DEFAULTS.vignette;
  postParams.focus[0] = 0;
  postParams.focus[1] = 0;
  postParams.focus[2] = 0;
}
