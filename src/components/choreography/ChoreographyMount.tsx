"use client";

import { useEffect } from "react";
import { heroChoreography } from "@/components/scene/rise-01-awakening/hero-choreography";
import { machineChoreography } from "@/components/scene/rise-02-machine/machine-choreography";
import { computationChoreography } from "@/components/scene/rise-03-computation/computation-spec";
import { perceptionChoreography } from "@/components/scene/rise-04-perception/perception-spec";
import { learningChoreography } from "@/components/scene/rise-05-learning/learning-spec";
import { languageChoreography } from "@/components/scene/rise-06-language/language-spec";
import { generationChoreography } from "@/components/scene/rise-07-generation/generation-spec";
import { reasoningChoreography } from "@/components/scene/rise-08-reasoning/reasoning-spec";
import { agencyChoreography } from "@/components/scene/rise-09-agency/agency-spec";
import { intelligenceChoreography } from "@/components/scene/rise-10-intelligence/intelligence-spec";
import { unknownChoreography } from "@/components/scene/rise-11-unknown/unknown-spec";
import { choreographer } from "@/lib/choreography/choreographer";
import { readDebugConfig } from "@/lib/three/diagnostics/debug-flags";
import { useExperienceStore } from "@/state/experience-store";

/**
 * Registers the scene choreographies and mounts the central choreographer against the semantic DOM.
 * Mounted only while the 3D layer is active (so the fallback keeps a plain, fully visible DOM).
 * Re-runs when reduced motion changes (timelines are rebuilt with reduced-motion variants).
 * Future scenes: add their SceneChoreography to SCENES below; nothing else changes.
 * Cleanup reverts every timeline/ScrollTrigger created for the Hero. Layout refresh: ScrollTrigger refreshes on
 * resize itself; the choreographer additionally refreshes after fonts load. NOT RUNTIME VERIFIED.
 */
const SCENES = [heroChoreography, machineChoreography, computationChoreography, perceptionChoreography, learningChoreography, languageChoreography, generationChoreography, reasoningChoreography, agencyChoreography, intelligenceChoreography, unknownChoreography];

export function ChoreographyMount() {
  const reducedMotion = useExperienceStore((s) => s.reducedMotion);

  useEffect(() => {
    const root = document.getElementById("narrative");
    if (!root) return;
    const unregister = SCENES.map((s) => choreographer.registerScene(s));
    root.querySelectorAll<HTMLElement>("[data-scene-id]").forEach((el) => {
      if (SCENES.some((s) => s.sceneId === el.dataset.sceneId)) el.dataset.live = "true";
    });
    const debug = readDebugConfig();
    choreographer.mount({ root, reducedMotion, tier: useExperienceStore.getState().qualityTier, seek: debug.heroSeek });

    if (process.env.NODE_ENV !== "production") {
      (window as unknown as Record<string, unknown>).__rise = {
        seek: (p: number) => choreographer.setProgress("RISE-01-AWAKENING", p),
        release: () => choreographer.releaseProgress("RISE-01-AWAKENING"),
        progress: () => choreographer.getProgress("RISE-01-AWAKENING"),
      };
    }

    return () => {
      choreographer.cleanup();
      unregister.forEach((u) => u());
      root.querySelectorAll<HTMLElement>("[data-live]").forEach((el) => delete el.dataset.live);
      if (process.env.NODE_ENV !== "production") delete (window as unknown as Record<string, unknown>).__rise;
    };
  }, [reducedMotion]);

  return null;
}
