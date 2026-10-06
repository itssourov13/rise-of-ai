import type { QualityTier } from "@/lib/performance/quality";

/**
 * Conceptual lighting budget. Roles:
 *  essential: defines the shot (key, primary rim); support: fill/bounce helpers; accent: small local lights.
 * Prefer emissive materials + environment lighting over many dynamic lights.
 * ALL numbers are UNVERIFIED placeholders pending profiling.
 */
export type LightRole = "essential" | "support" | "accent";

export interface LightingBudget {
  essential: number;
  support: number;
  accent: number;
  shadowCasters: number;
}

export const LIGHTING_BUDGET: Readonly<Record<QualityTier, LightingBudget>> = {
  ULTRA: { essential: 4, support: 4, accent: 8, shadowCasters: 2 },
  HIGH: { essential: 3, support: 3, accent: 6, shadowCasters: 1 },
  MEDIUM: { essential: 2, support: 2, accent: 4, shadowCasters: 1 },
  LOW: { essential: 2, support: 1, accent: 2, shadowCasters: 0 },
  MOBILE: { essential: 2, support: 1, accent: 1, shadowCasters: 0 },
};

/** Live count of mounted engine lights (components/world/lights.tsx registers them). Diagnostics-only reader. */
export const lightCensus: LightingBudget = { essential: 0, support: 0, accent: 0, shadowCasters: 0 };

export function registerLight(role: LightRole, castsShadow: boolean): () => void {
  lightCensus[role] += 1;
  if (castsShadow) lightCensus.shadowCasters += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    lightCensus[role] -= 1;
    if (castsShadow) lightCensus.shadowCasters -= 1;
  };
}

export function checkLightingBudget(census: LightingBudget, tier: QualityTier): string[] {
  const budget = LIGHTING_BUDGET[tier];
  const over: string[] = [];
  (Object.keys(budget) as (keyof LightingBudget)[]).forEach((key) => {
    if (census[key] > budget[key]) over.push(`${key} ${census[key]}/${budget[key]}`);
  });
  return over;
}
