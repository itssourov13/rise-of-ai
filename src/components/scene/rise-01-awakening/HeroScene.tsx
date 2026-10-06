"use client";

import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { useRenderControls } from "@/components/engine/useRenderControls";
import type { SceneProps } from "@/components/scene/scene-definitions";
import { choreographer } from "@/lib/choreography/choreographer";
import { useEngineStore } from "@/state/engine-store";
import { useExperienceStore } from "@/state/experience-store";
import { HERO_COLORS } from "./hero-constants";
import { createHeroKit } from "./hero-kit";
import { HeroDriver } from "./HeroDriver";
import { HeroLights } from "./HeroLights";
import { HeroMachine } from "./HeroMachine";
import { HeroParticles } from "./HeroParticles";

/**
 * RISE-01-AWAKENING scene root (lazy-loaded by the scene registry, procedural: no external assets).
 * Ownership: this component owns the HeroKit (geometry/materials/procedural textures) and restores every world
 * setting it changes (environment, atmosphere, scene.environmentIntensity, continuous-render hold) on unmount.
 * It never reads Lenis/ScrollTrigger: it reads `heroState`, written by the Hero timeline.
 */
export default function HeroScene({ active }: SceneProps) {
  const reduced = useExperienceStore((s) => s.reducedMotion);
  const controls = useRenderControls();
  const scene = useThree((s) => s.scene);
  const invalidate = useThree((s) => s.invalidate);
  const microDetail = controls.geometryDetail >= 0.75; // MOBILE/LOW: fewer instanced micro details (UNVERIFIED threshold)

  const kit = useMemo(() => createHeroKit(controls.geometryDetail), [controls.geometryDetail]);
  useEffect(() => () => kit.dispose(), [kit]);

  // World configuration, applied only while this scene is ACTIVE (neighbour scenes stay mounted but hidden;
  // React runs the outgoing scene's cleanup before the incoming scene's effect, so the incoming config wins).
  useEffect(() => {
    if (!active) return;
    const engine = useEngineStore.getState();
    engine.setEnvironment({ kind: "procedural-room" });
    engine.setAtmosphere({ kind: "exp2", color: HERO_COLORS.background, density: 0.014 });
    return () => {
      const s = useEngineStore.getState();
      s.setEnvironment({ kind: "none" });
      s.setAtmosphere(null);
      scene.environmentIntensity = 1;
      invalidate();
    };
  }, [active, scene, invalidate]);

  // Render demand: continuous while the Hero animates by itself; reduced motion renders on demand (progress changes).
  useEffect(() => {
    if (!active) return;
    if (!reduced) return useEngineStore.getState().acquireContinuous();
    return choreographer.subscribe(invalidate);
  }, [active, reduced, invalidate]);

  

  return (
    <group name="rise-01-awakening">
      <HeroLights active={active} />
      <HeroMachine kit={kit} reduced={reduced} microDetail={microDetail} />
      <HeroParticles active={active} reduced={reduced} />
      <HeroDriver kit={kit} active={active} reduced={reduced} />
    </group>
  );
}
