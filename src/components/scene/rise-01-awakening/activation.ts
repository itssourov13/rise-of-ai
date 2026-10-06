import { clamp01 } from "@/lib/animation/math";
import { HERO } from "./hero-constants";
import type { HeroKit } from "./hero-kit";
import type { HeroState } from "./hero-state";

/**
 * Activation system: turns the Hero state channels into material/uniform values. Pure functions + one
 * imperative apply (called from ActivationSystem's useFrame). All gains are authored (UNVERIFIED).
 *
 * Energy travels CORE(0) -> INNER RING(1) -> STRUCTURE(2) -> OUTER MODULES(3):
 *   layerLevel(l)  steady power-up of layer l, staged by the `power` channel
 *   layerBump(l)   a bell that passes layer l when the pulse front reaches it
 */
const smooth = (t: number) => t * t * (3 - 2 * t);

export const STRIP_BASE = [2.6, 2.2, 2.0, 1.8] as const;
const PULSE_GAIN = 2.6;
const LAYER_DELAY = 0.22;
const BUMP_WIDTH = 0.25;
const SPAN = 1 + 3 * LAYER_DELAY + BUMP_WIDTH;

export function layerLevel(power: number, layer: number): number {
  return smooth(clamp01((power - 0.12 * layer) / 0.55));
}

export function layerBump(front: number, layer: number): number {
  const centre = layer * LAYER_DELAY + BUMP_WIDTH / 2;
  const u = (front * SPAN - centre) / (BUMP_WIDTH / 2);
  const b = Math.max(0, 1 - u * u);
  return b * b;
}

/** Indicator group k switches on in stages after the layers (power thresholds). */
export function indicatorLevel(power: number, group: number): number {
  return smooth(clamp01((power - (0.3 + 0.2 * group)) / 0.15));
}

export function applyActivation(kit: HeroKit, s: HeroState, elapsed: number, reduced: boolean): void {
  const { mat } = kit;
  // Slow breathing on the core only once it is alive; disabled in reduced motion. Time-based but history-independent.
  const breath = reduced ? 0 : Math.sin(elapsed * 0.9) * 0.04 * s.energy;
  for (let l = 0; l < 4; l += 1) {
    const level = layerLevel(l === 0 ? Math.max(s.power, s.energy * 1.2) : s.power, l);
    const bump = layerBump(s.pulse, l);
    mat.strips[l].emissiveIntensity = STRIP_BASE[l] * level * (0.7 + 0.3 * s.energy) * (1 - 0.9 * s.handoff) + PULSE_GAIN * bump * s.energy;
  }
  for (let k = 0; k < 3; k += 1) {
    mat.indicators[k].emissiveIntensity = 2.2 * indicatorLevel(s.power, k) * (1 - 0.9 * s.handoff);
  }
  const u = mat.core.uniforms;
  u.uTime.value = elapsed;
  u.uMotion.value = reduced ? 0.15 : 1;
  u.uEnergy.value = Math.max(0, s.energy * (1 - 0.6 * s.handoff) + breath);
  u.uPulse.value = layerBump(s.pulse, 0) * s.energy;
}

/** Light intensities derived from state (UNVERIFIED physical-unit placeholders). */
export const LIGHT_GAIN = {
  key: 2.6,
  rim: 2.2,
  core: 900,
  scan: 160,
  environment: 0.5,
} as const;

export function fogDensity(s: HeroState): number {
  const clear = HERO.fog.max + (HERO.fog.min - HERO.fog.max) * smooth(s.atmosphere);
  return clear * (1 + 0.5 * s.handoff);
}
