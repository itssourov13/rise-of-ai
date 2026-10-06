"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { FogExp2 } from "three";
import { engineTime } from "@/lib/animation/time";
import { applyMachineActivation } from "./machine-activation";
import type { MachineKit } from "./machine-kit";
import { machineState } from "./machine-state";

/** Per-frame bridge from machineState to materials, fog and environment (active scene only). */
export function MachineDriver({ kit, active }: { kit: MachineKit; active: boolean }) {
  const get = useThree((s) => s.get);
  useFrame(() => {
    if (!active) return;
    const scene = get().scene;
    applyMachineActivation(kit, machineState, engineTime.elapsed);
    if (scene.fog instanceof FogExp2) scene.fog.density = 0.0075 + 0.004 * (1 - machineState.reveal);
    scene.environmentIntensity = (0.015 + 0.2 * machineState.reveal * machineState.reveal) * (1 - 0.85 * machineState.handoff);
  });
  return null;
}
