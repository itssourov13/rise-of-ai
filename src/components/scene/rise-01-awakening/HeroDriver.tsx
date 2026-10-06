"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { FogExp2 } from "three";
import { engineTime } from "@/lib/animation/time";
import { applyActivation, fogDensity, LIGHT_GAIN } from "./activation";
import type { HeroKit } from "./hero-kit";
import { heroState } from "./hero-state";

/**
 * ActivationSystem driver: the only per-frame bridge from heroState to materials, fog and environment.
 * Fog: the world (WorldAtmosphere) owns the FogExp2 object; the Hero only animates its density imperatively
 * (the store config is set once on mount, never per frame). Environment intensity is restored by HeroScene.
 */
export function HeroDriver({ kit, active, reduced }: { kit: HeroKit; active: boolean; reduced: boolean }) {
  const get = useThree((s) => s.get);
  useFrame(() => {
    if (!active) return;
    const scene = get().scene;
    applyActivation(kit, heroState, engineTime.elapsed, reduced);
    if (scene.fog instanceof FogExp2) scene.fog.density = fogDensity(heroState);
    scene.environmentIntensity = (0.02 + LIGHT_GAIN.environment * 0.5 * heroState.reveal * heroState.reveal) * (1 - 0.9 * heroState.handoff);
  });
  return null;
}
