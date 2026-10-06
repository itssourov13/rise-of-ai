"use client";

import { useEffect } from "react";
import { detectCapabilities, selectInitialTier } from "@/lib/capabilities/detect";
import { subscribeReducedMotion } from "@/lib/capabilities/reduced-motion";
import { startScrollDriver } from "@/lib/scroll/lenis-driver";
import { useExperienceStore } from "@/state/experience-store";

/** Runs once on the client: capability detection -> store, reduced-motion subscription, single scroll driver. */
export function useExperienceBootstrap(): void {
  useEffect(() => {
    const s = useExperienceStore.getState();
    const caps = detectCapabilities();
    s.setCapabilities(caps);
    s.setReducedMotion(caps.reducedMotion);
    s.setQualityTier(selectInitialTier(caps));
    // three r186 requires WebGL 2 (WebGL 1 support was removed upstream), so webgl1-only devices get the fallback.
    s.setRenderMode(caps.webgl === "webgl2" ? "active" : "disabled", caps.webgl === "webgl2" ? undefined : `WebGL 2 required (detected: ${caps.webgl})`);
    return subscribeReducedMotion((reduced) => useExperienceStore.getState().setReducedMotion(reduced));
  }, []);

  const ready = useExperienceStore((st) => st.capabilities !== null);
  const reducedMotion = useExperienceStore((st) => st.reducedMotion);

  useEffect(() => {
    if (!ready) return;
    return startScrollDriver({ smooth: !reducedMotion });
  }, [ready, reducedMotion]);
}
