import { clamp01 } from "@/lib/animation/math";
import { BAYS } from "./machine-constants";
import type { MachineKit } from "./machine-kit";
import type { MachineState } from "./machine-state";

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Bay i is lit once the flow front (0..1 mapped over BAYS + lead-in) has passed it. History-independent. */
export function bayLevel(flow: number, bay: number): number {
  return smooth(clamp01(flow * (BAYS + 1.5) - bay));
}

/** A bell centred on the pulse front (extra brightness as a signal travels bay to bay). */
export function bayBump(front: number, bay: number): number {
  const u = (front * (BAYS + 2) - bay - 0.5) / 1.2;
  const b = Math.max(0, 1 - u * u);
  return b * b;
}

export function applyMachineActivation(kit: MachineKit, s: MachineState, elapsed: number): void {
  const dim = 1 - 0.85 * s.handoff; // the hall dims, the board's signal remains
  for (let b = 0; b < BAYS; b += 1) {
    const level = bayLevel(s.flow, b);
    const bump = bayBump(s.flow, b) * 0.6; // leading edge of the power flow
    kit.mat.bayCool[b].emissiveIntensity = (1.9 * level + bump) * dim;
    kit.mat.bayWarm[b].emissiveIntensity = 2.2 * smooth(clamp01(level * 1.2 - 0.2)) * dim;
    kit.mat.ceilWarm[b].emissiveIntensity = 1.5 * level * dim;
  }
  kit.mat.chipGlow.emissiveIntensity = 2.4 * s.signal;
  const u = kit.mat.signal.uniforms;
  u.uLevel.value = s.signal;
  u.uFront.value = s.pulse * 1.3;
  void elapsed;
}
