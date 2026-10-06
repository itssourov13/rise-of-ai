import type { QualityLevel, QualityProfile } from "@/lib/performance/quality";

/**
 * Post-processing PLAN (Phase 04). Pure data: tier -> which effects exist and their static settings.
 *
 *   BASE RENDER -> EffectComposer { Bloom, DepthOfField, ToneMapping, Vignette, Noise } -> OUTPUT
 *
 * The plan is STABLE for a given tier: effects are never added/removed per frame. Scenes animate only the
 * multipliers in lib/choreography/post-params.ts. Scenes never import the composer; only
 * components/engine/PostStack.tsx does (lazy-loaded, WebGL backend).
 *
 * Color pipeline (no double tone mapping / gamma):
 *  - With the composer active the scene renders into a HalfFloat linear buffer, where three applies NO tone mapping
 *    and NO sRGB conversion. The ToneMapping effect performs tone mapping once; the composer's final pass converts
 *    to the output color space. The renderer's own toneMapping setting therefore does not participate while the
 *    composer is active (it still applies when post-processing is off, e.g. a tier with plan.enabled=false).
 *  - Mismatch to watch (UNVERIFIED): postprocessing's ACES_FILMIC approximation is not bit-identical to three's
 *    ACESFilmicToneMapping, and `exposureScale` (engine store) only affects the non-composer path.
 *
 * Tier mapping. EVERY number is UNVERIFIED / uncalibrated.
 */
export interface PostPlan {
  enabled: boolean;
  /** MSAA samples of the composer's buffer (0 = none). */
  multisampling: number;
  bloom: { intensity: number; threshold: number; smoothing: number; radius: number; levels: number; resolutionScale: number } | null;
  dof: { bokehScale: number; resolutionScale: number; focusRange: number } | null;
  vignette: { offset: number; darkness: number } | null;
  noise: { opacity: number } | null;
}

const OFF: PostPlan = { enabled: false, multisampling: 0, bloom: null, dof: null, vignette: null, noise: null };

const PLANS: Record<QualityLevel, PostPlan> = {
  off: OFF,
  // MOBILE / LOW: minimal bloom only.
  low: { enabled: true, multisampling: 0, bloom: { intensity: 0.7, threshold: 0.9, smoothing: 0.3, radius: 0.6, levels: 5, resolutionScale: 0.5 }, dof: null, vignette: null, noise: null },
  // MEDIUM: reduced resolution/intensity, no DOF.
  medium: { enabled: true, multisampling: 0, bloom: { intensity: 0.8, threshold: 0.85, smoothing: 0.3, radius: 0.7, levels: 6, resolutionScale: 0.75 }, dof: null, vignette: { offset: 0.35, darkness: 0.45 }, noise: null },
  // HIGH: the intended look with cheaper expensive parameters.
  high: { enabled: true, multisampling: 2, bloom: { intensity: 0.9, threshold: 0.85, smoothing: 0.3, radius: 0.75, levels: 7, resolutionScale: 1 }, dof: { bokehScale: 2.2, resolutionScale: 0.5, focusRange: 0.03 }, vignette: { offset: 0.35, darkness: 0.5 }, noise: { opacity: 0.05 } },
  // ULTRA: full intended Hero treatment.
  ultra: { enabled: true, multisampling: 4, bloom: { intensity: 1.0, threshold: 0.85, smoothing: 0.3, radius: 0.8, levels: 8, resolutionScale: 1 }, dof: { bokehScale: 2.6, resolutionScale: 0.75, focusRange: 0.03 }, vignette: { offset: 0.35, darkness: 0.5 }, noise: { opacity: 0.06 } },
};

export function resolvePostPlan(profile: QualityProfile): PostPlan {
  return PLANS[profile.postProcessing];
}
