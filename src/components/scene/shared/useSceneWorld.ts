"use client";

import { useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { FogExp2 } from "three";
import { choreographer } from "@/lib/choreography/choreographer";
import type { AtmosphereConfig } from "@/lib/three/world/atmosphere";
import type { EnvironmentSource } from "@/lib/three/world/environment";
import { useEngineStore } from "@/state/engine-store";
import { useExperienceStore } from "@/state/experience-store";

export interface SceneWorld {
  environment: EnvironmentSource;
  atmosphere: AtmosphereConfig | null;
}

/**
 * Shared scene-side world hook (Phase 06+). While `active`: applies the scene's environment/atmosphere, holds
 * continuous rendering (or invalidates on choreography progress in reduced motion). On deactivation/unmount it
 * restores defaults. Returns `reduced`. Neighbour scenes stay mounted but never touch shared world state.
 */
export function useSceneWorld(active: boolean, world: SceneWorld): boolean {
  const reduced = useExperienceStore((s) => s.reducedMotion);
  const get = useThree((s) => s.get);
  const invalidate = useThree((s) => s.invalidate);
  const envKey = world.environment.kind;
  const atmoKey = world.atmosphere ? JSON.stringify(world.atmosphere) : "";

  useEffect(() => {
    if (!active) return;
    const engine = useEngineStore.getState();
    engine.setEnvironment(world.environment);
    engine.setAtmosphere(world.atmosphere);
    return () => {
      const s = useEngineStore.getState();
      s.setEnvironment({ kind: "none" });
      s.setAtmosphere(null);
      get().scene.environmentIntensity = 1;
      invalidate();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, envKey, atmoKey, get, invalidate]);

  useEffect(() => {
    if (!active) return;
    if (!reduced) return useEngineStore.getState().acquireContinuous();
    return choreographer.subscribe(invalidate);
  }, [active, reduced, invalidate]);

  return reduced;
}

/** Per-frame fog density / environment intensity control for the active scene. */
export function useSceneAtmosphere(active: boolean, getValues: () => { fog?: number; env?: number }): void {
  const get = useThree((s) => s.get);
  useFrame(() => {
    if (!active) return;
    const scene = get().scene;
    const v = getValues();
    if (v.fog !== undefined && scene.fog instanceof FogExp2) scene.fog.density = v.fog;
    if (v.env !== undefined) scene.environmentIntensity = v.env;
  });
}
