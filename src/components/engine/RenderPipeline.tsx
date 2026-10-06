"use client";

import { lazy, Suspense, useMemo } from "react";
import { QUALITY_PROFILES } from "@/lib/performance/quality";
import { resolvePostPlan } from "@/lib/three/renderer/post-processing";
import { useExperienceStore } from "@/state/experience-store";

// The composer library loads only when a tier's plan enables post-processing.
const PostStack = lazy(() => import("./PostStack"));

/**
 * Post-processing boundary: BASE RENDER (R3F loop) -> optional PostStack -> OUTPUT.
 * The plan comes from the quality tier only. With plan.enabled=false nothing is mounted and R3F renders directly
 * (renderer tone mapping + sRGB output apply). Scenes never mount effects; they only write post params.
 */
export function RenderPipeline() {
  const tier = useExperienceStore((s) => s.qualityTier);
  const plan = useMemo(() => resolvePostPlan(QUALITY_PROFILES[tier]), [tier]);
  if (!plan.enabled) return null;
  return (
    <Suspense fallback={null}>
      <PostStack plan={plan} />
    </Suspense>
  );
}
