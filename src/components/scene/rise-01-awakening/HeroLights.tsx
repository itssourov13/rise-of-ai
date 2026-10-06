"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { AmbientLight, DirectionalLight, PointLight } from "three";
import { useRenderControls } from "@/components/engine/useRenderControls";
import { useExperienceStore } from "@/state/experience-store";
import { registerLight } from "@/lib/three/world/lighting-budget";
import { LIGHT_GAIN } from "./activation";
import { HERO, HERO_COLORS } from "./hero-constants";
import { heroState } from "./hero-state";

/**
 * Hero lighting rig, layered:
 *   WORLD FILL   ambient + (scene.environmentIntensity, see HeroDriver)  -> reveals form last
 *   PRIMARY KEY  one shadow-casting directional (the ONLY shadow map)
 *   RIM          cool directional from behind-left: silhouette / edge highlights
 *   CORE         point light inside the housing, follows `energy` (+ pulse)
 *   MICRO ACCENT warm status point at the service aperture; scanning point that travels up the structure (skipped on LOW/MOBILE)
 * Intensities are animated per frame from heroState (mutable, no React state) and are all derived from progress.
 * They register with the Phase 03 lighting census so the budget diagnostics stay honest. Values UNVERIFIED.
 */
export function HeroLights({ active }: { active: boolean }) {
  const { shadows } = useRenderControls();
  const tier = useExperienceStore((s) => s.qualityTier);
  const accents = tier !== "LOW" && tier !== "MOBILE";
  const casts = shadows.enabled;

  const ambient = useRef<AmbientLight>(null);
  const key = useRef<DirectionalLight>(null);
  const rim = useRef<DirectionalLight>(null);
  const core = useRef<PointLight>(null);
  const status = useRef<PointLight>(null);
  const scan = useRef<PointLight>(null);

  useEffect(() => registerLight("support", false), []); // ambient
  useEffect(() => registerLight("essential", casts), [casts]); // key
  useEffect(() => registerLight("support", false), []); // rim
  useEffect(() => registerLight("essential", false), []); // core
  useEffect(() => (accents ? registerLight("accent", false) : undefined), [accents]); // status
  useEffect(() => (accents ? registerLight("accent", false) : undefined), [accents]); // scan

  useFrame(() => {
    if (!active) return;
    const s = heroState;
    const dim = 1 - 0.9 * s.handoff;
    const r = s.reveal;
    if (ambient.current) ambient.current.intensity = (0.04 + 0.55 * r) * dim;
    if (key.current) key.current.intensity = LIGHT_GAIN.key * r * r * 1.4 * dim;
    if (rim.current) rim.current.intensity = LIGHT_GAIN.rim * (0.15 * r + 0.85 * r * r) * dim;
    if (core.current) core.current.intensity = LIGHT_GAIN.core * s.energy * s.energy * (0.85 + 0.15 * Math.sin(s.pulse * Math.PI)) * dim;
    if (status.current) status.current.intensity = 60 * Math.max(0, (s.power - 0.5) / 0.5) * dim;
    if (scan.current) {
      const a = s.mechanical * Math.PI * 2;
      scan.current.position.set(Math.cos(a) * 12, 3 + 21 * s.pulse, Math.sin(a) * 12);
      scan.current.intensity = LIGHT_GAIN.scan * Math.sin(Math.min(1, s.pulse) * Math.PI) * s.energy * dim;
    }
  });

  return (
    <group name="hero-lights">
      <ambientLight ref={ambient} color="#9fb4d0" intensity={0.04} />
      <directionalLight
        ref={key}
        color={HERO_COLORS.keyLight}
        position={[-28, 44, 34]}
        intensity={0}
        castShadow={casts}
        shadow-mapSize={[shadows.mapSize || 1, shadows.mapSize || 1]}
        shadow-camera-left={-32}
        shadow-camera-right={32}
        shadow-camera-top={34}
        shadow-camera-bottom={-6}
        shadow-camera-near={5}
        shadow-camera-far={120}
        shadow-bias={-0.0004}
        shadow-normalBias={0.05}
      />
      <directionalLight ref={rim} color={HERO_COLORS.rimLight} position={[26, 22, -48]} intensity={0} />
      <pointLight ref={core} color={HERO_COLORS.emissiveCool} position={[0, HERO.coreY, 0]} intensity={0} distance={46} decay={2} />
      {accents && <pointLight ref={status} color={HERO_COLORS.statusWarm} position={[0, 4.2, 15]} intensity={0} distance={20} decay={2} />}
      {accents && <pointLight ref={scan} color={HERO_COLORS.emissiveCool} position={[12, 3, 0]} intensity={0} distance={26} decay={2} />}
    </group>
  );
}
