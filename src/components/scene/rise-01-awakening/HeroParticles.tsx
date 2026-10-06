"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BufferAttribute, BufferGeometry, PerspectiveCamera, type ShaderMaterial } from "three";
import { engineTime } from "@/lib/animation/time";
import { QUALITY_PROFILES, type QualityLevel } from "@/lib/performance/quality";
import { createSeededRandom } from "@/lib/random/seeded";
import { diagnosticsSnapshot } from "@/lib/three/diagnostics/snapshot";
import { createParticleMaterial } from "@/lib/three/shaders/particles";
import { useExperienceStore } from "@/state/experience-store";
import { heroState } from "./hero-state";

/** Particle counts per density level. UNVERIFIED placeholders (no measurement). */
const COUNT: Record<QualityLevel, number> = { off: 0, low: 350, medium: 800, high: 1400, ultra: 2200 };
const SEED = 4242;
const BOX_MIN: [number, number, number] = [-70, 0, -70];
const BOX_SIZE: [number, number, number] = [140, 48, 140];

/**
 * Hero particle layer: ONE THREE.Points object, seeded (identical every load), drift + wrap in the vertex shader.
 * Very low density dust; the intensity is progress-driven (heroState.particles). No React objects per particle.
 */
export function HeroParticles({ active, reduced }: { active: boolean; reduced: boolean }) {
  const tier = useExperienceStore((s) => s.qualityTier);
  const density = QUALITY_PROFILES[tier].particleDensity;
  const count = Math.round(COUNT[density] * (reduced ? 0.6 : 1));

  const geometry = useMemo(() => {
    const rand = createSeededRandom(SEED);
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = BOX_MIN[0] + rand() * BOX_SIZE[0];
      positions[i * 3 + 1] = BOX_MIN[1] + rand() * BOX_SIZE[1];
      positions[i * 3 + 2] = BOX_MIN[2] + rand() * BOX_SIZE[2];
      seeds[i] = rand();
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(positions, 3));
    g.setAttribute("aSeed", new BufferAttribute(seeds, 1));
    return g;
  }, [count]);

  const material = useMemo(() => {
    const m = createParticleMaterial("#9ec4e6");
    m.uniforms.uBoxMin.value = BOX_MIN;
    m.uniforms.uBoxSize.value = BOX_SIZE;
    m.uniforms.uDrift.value = [0.12, 0.05, 0.03];
    m.uniforms.uSize.value = 0.16;
    return m;
  }, []);
  const materialRef = useRef<ShaderMaterial | null>(null);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => {
    materialRef.current = material;
    return () => {
      materialRef.current = null;
      material.dispose();
    };
  }, [material]);
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") diagnosticsSnapshot.particleCount = count;
  }, [count]);

  useFrame((state) => {
    if (!active) return;
    const currentMaterial = materialRef.current;
    if (!currentMaterial) return;
    const u = currentMaterial.uniforms;
    const cam = state.camera as PerspectiveCamera;
    u.uTime.value = engineTime.elapsed;
    u.uSpeed.value = reduced ? 0.12 : 1;
    u.uOpacity.value = 0.6 * heroState.particles * (1 - 0.5 * heroState.handoff);
    u.uScale.value = state.gl.domElement.height / (2 * Math.tan((cam.fov * Math.PI) / 360));
    u.uFar.value = cam.far * 0.45;
  });

  if (count === 0) return null;
  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={5} />;
}
