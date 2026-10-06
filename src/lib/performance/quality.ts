export type QualityTier = "ULTRA" | "HIGH" | "MEDIUM" | "LOW" | "MOBILE";

export type QualityLevel = "off" | "low" | "medium" | "high" | "ultra";

/**
 * Semantic quality controls. Scenes read levels, never device checks.
 * Phase 04: LOW/MOBILE postProcessing changed "off" -> "low" (minimal bloom only; see post-processing.ts). "off" remains available.
 * Every value below is an UNCALIBRATED placeholder; real calibration requires
 * runtime profiling on target devices (Phase 03+/15). No measurements exist yet.
 */
export interface QualityProfile {
  tier: QualityTier;
  /** [min, max] device pixel ratio passed to the renderer. */
  pixelRatio: readonly [number, number];
  particleDensity: QualityLevel;
  shadowQuality: QualityLevel;
  textureScale: QualityLevel;
  postProcessing: QualityLevel;
  environmentDetail: QualityLevel;
  modelDetail: QualityLevel;
  effectIntensity: QualityLevel;
}

export const QUALITY_PROFILES: Record<QualityTier, QualityProfile> = {
  ULTRA: { tier: "ULTRA", pixelRatio: [1, 2], particleDensity: "ultra", shadowQuality: "ultra", textureScale: "ultra", postProcessing: "ultra", environmentDetail: "ultra", modelDetail: "ultra", effectIntensity: "ultra" },
  HIGH: { tier: "HIGH", pixelRatio: [1, 1.75], particleDensity: "high", shadowQuality: "high", textureScale: "high", postProcessing: "high", environmentDetail: "high", modelDetail: "high", effectIntensity: "high" },
  MEDIUM: { tier: "MEDIUM", pixelRatio: [1, 1.5], particleDensity: "medium", shadowQuality: "medium", textureScale: "medium", postProcessing: "medium", environmentDetail: "medium", modelDetail: "medium", effectIntensity: "medium" },
  LOW: { tier: "LOW", pixelRatio: [1, 1], particleDensity: "low", shadowQuality: "off", textureScale: "low", postProcessing: "low", environmentDetail: "low", modelDetail: "low", effectIntensity: "low" },
  MOBILE: { tier: "MOBILE", pixelRatio: [1, 1.5], particleDensity: "low", shadowQuality: "off", textureScale: "low", postProcessing: "low", environmentDetail: "low", modelDetail: "low", effectIntensity: "low" },
};
