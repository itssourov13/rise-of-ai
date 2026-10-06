"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { AmbientLight, DirectionalLight, PointLight } from "three";
import { useExperienceStore } from "@/state/experience-store";
import { registerLight } from "@/lib/three/world/lighting-budget";
import { BOARD, MACHINE_COLORS } from "./machine-constants";
import { machineState } from "./machine-state";

/**
 * Machine lighting: cool ambient + top fill (no shadows in this scene), a warm "practical" light that travels with the
 * camera and a cool one ahead of it, plus a board light that follows `signal` (skipped on LOW/MOBILE).
 * All derived from machineState each frame. Intensities UNVERIFIED.
 */
export function MachineLights({ active }: { active: boolean }) {
  const tier = useExperienceStore((s) => s.qualityTier);
  const accents = tier !== "LOW" && tier !== "MOBILE";
  const ambient = useRef<AmbientLight>(null);
  const fill = useRef<DirectionalLight>(null);
  const warm = useRef<PointLight>(null);
  const cool = useRef<PointLight>(null);
  const board = useRef<PointLight>(null);

  useEffect(() => registerLight("support", false), []);
  useEffect(() => registerLight("essential", false), []);
  useEffect(() => registerLight("essential", false), []);
  useEffect(() => (accents ? registerLight("accent", false) : undefined), [accents]);
  useEffect(() => (accents ? registerLight("accent", false) : undefined), [accents]);

  useFrame((state) => {
    if (!active) return;
    const s = machineState;
    const r = s.reveal;
    const dim = 1 - 0.85 * s.handoff;
    const cam = state.camera.position;
    if (ambient.current) ambient.current.intensity = (0.03 + 0.3 * r) * dim;
    if (fill.current) fill.current.intensity = 0.9 * r * r * dim;
    if (warm.current) {
      warm.current.position.set(cam.x, cam.y + 3, cam.z - 2);
      warm.current.intensity = 240 * r * dim;
    }
    if (cool.current) {
      cool.current.position.set(cam.x, cam.y + 4, cam.z - 18);
      cool.current.intensity = 170 * r * dim;
    }
    if (board.current) board.current.intensity = 420 * s.signal * (0.7 + 0.3 * s.pulse);
  });

  return (
    <group name="machine-lights">
      <ambientLight ref={ambient} color="#9bb0c8" intensity={0.03} />
      <directionalLight ref={fill} color="#bcd4f0" position={[10, 40, 20]} intensity={0} />
      <pointLight ref={warm} color={MACHINE_COLORS.warm} intensity={0} distance={46} decay={2} />
      {accents && <pointLight ref={cool} color={MACHINE_COLORS.cool} intensity={0} distance={44} decay={2} />}
      {accents && <pointLight ref={board} color={MACHINE_COLORS.cool} position={[0, BOARD.y, BOARD.z + 9]} intensity={0} distance={36} decay={2} />}
    </group>
  );
}
