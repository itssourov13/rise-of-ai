"use client";

import { QUALITY_PROFILES, type QualityLevel } from "@/lib/performance/quality";
import { useExperienceStore } from "@/state/experience-store";

/** Per-density-level counts (UNVERIFIED placeholders). Reduced motion keeps 70% of the count. */
export function useDensityCount(table: Record<QualityLevel, number>): number {
  const tier = useExperienceStore((s) => s.qualityTier);
  const reduced = useExperienceStore((s) => s.reducedMotion);
  return Math.round(table[QUALITY_PROFILES[tier].particleDensity] * (reduced ? 0.7 : 1));
}
