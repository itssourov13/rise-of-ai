"use client";

import { useMemo } from "react";
import { createRenderControls, type RenderControls } from "@/lib/performance/render-controls";
import { QUALITY_PROFILES } from "@/lib/performance/quality";
import { useExperienceStore } from "@/state/experience-store";

/** Renderer-level quality controls for the current tier. Scenes/lights read this, never device checks. */
export function useRenderControls(): RenderControls {
  const tier = useExperienceStore((s) => s.qualityTier);
  return useMemo(() => createRenderControls(QUALITY_PROFILES[tier]), [tier]);
}
