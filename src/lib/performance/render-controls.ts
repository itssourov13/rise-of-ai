import type { QualityLevel, QualityProfile } from "./quality";

/**
 * Renderer-level controls derived from a QualityProfile. This is the ONE place semantic quality
 * levels become numbers. Every numeric value in the tables below is UNVERIFIED: chosen as plausible
 * placeholders, not measured. Runtime profiling on target devices must calibrate them.
 */
export interface ShadowControls {
  enabled: boolean;
  /** Shadow map edge in px (power of two). 0 when disabled. */
  mapSize: number;
}

export interface RenderControls {
  /** [min, max] device pixel ratio. The Canvas clamps it to the real devicePixelRatio. */
  dpr: readonly [number, number];
  /** Fixed at WebGL context creation; changing tier later does not change it without a new context. */
  antialias: boolean;
  shadows: ShadowControls;
  /** PMREM source size hint (px) for environment prefiltering. Consumed when an environment loader exists. */
  environmentSize: number;
  /** Multiplier (0..1) for texture resolution variants. Consumed by asset variant selection (future). */
  textureScale: number;
  /** Multiplier for procedural geometry segment counts (1 = baseline). */
  geometryDetail: number;
  /** False -> skip the optional post-processing stage entirely. */
  effectsEnabled: boolean;
}

// UNVERIFIED tables.
const SHADOW_MAP_SIZE: Record<QualityLevel, number> = { off: 0, low: 512, medium: 1024, high: 2048, ultra: 4096 };
const ENV_SIZE: Record<QualityLevel, number> = { off: 128, low: 128, medium: 256, high: 512, ultra: 1024 };
const TEXTURE_SCALE: Record<QualityLevel, number> = { off: 0.25, low: 0.5, medium: 0.75, high: 1, ultra: 1 };
const GEOMETRY_DETAIL: Record<QualityLevel, number> = { off: 0.25, low: 0.5, medium: 0.75, high: 1, ultra: 1.25 };

export function createRenderControls(profile: QualityProfile): RenderControls {
  const mapSize = SHADOW_MAP_SIZE[profile.shadowQuality];
  return {
    dpr: profile.pixelRatio,
    antialias: profile.tier !== "LOW" && profile.tier !== "MOBILE",
    shadows: { enabled: mapSize > 0, mapSize },
    environmentSize: ENV_SIZE[profile.environmentDetail],
    textureScale: TEXTURE_SCALE[profile.textureScale],
    geometryDetail: GEOMETRY_DETAIL[profile.modelDetail],
    effectsEnabled: profile.postProcessing !== "off",
  };
}
