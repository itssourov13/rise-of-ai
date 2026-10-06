/**
 * Pure animation math. No browser or Three.js dependency, so it is server-safe and unit-testable.
 * Time-based motion must use frame delta: `x += speed * delta`, or `damp()` for smoothing.
 */
export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
export const clamp01 = (value: number): number => clamp(value, 0, 1);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Frame-rate independent smoothing factor for exponential damping (higher lambda = snappier). */
export const dampFactor = (lambda: number, delta: number): number => 1 - Math.exp(-lambda * delta);
export const damp = (current: number, target: number, lambda: number, delta: number): number =>
  lerp(current, target, dampFactor(lambda, delta));

/** Maps `value` from [start, end] to a clamped 0..1 progress. A degenerate range is a step. */
export function normalizeProgress(value: number, start: number, end: number): number {
  if (end === start) return value >= end ? 1 : 0;
  return clamp01((value - start) / (end - start));
}

export type EasingName = "linear" | "easeInOutCubic" | "easeOutCubic" | "smoothstep";

export const easings: Readonly<Record<EasingName, (t: number) => number>> = {
  linear: (t) => t,
  easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
  smoothstep: (t) => t * t * (3 - 2 * t),
};

/** Easing adapter. Defaults to easeInOutCubic. Input is clamped to 0..1. */
export const ease = (name: EasingName | undefined, t: number): number =>
  easings[name ?? "easeInOutCubic"](clamp01(t));
