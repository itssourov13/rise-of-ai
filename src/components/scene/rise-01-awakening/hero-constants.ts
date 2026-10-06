/**
 * Hero machine layout constants (world units ~ meters). Local origin: centre of the base plate, +Y up.
 * Shared by geometry, placement and camera shots so they stay consistent. All dimensions are authored
 * values, not measured against references (UNVERIFIED as "believable scale").
 *
 * Pulse layers (energy propagates 0 -> 3):
 *   0 core + core collars · 1 housing collars + inner ring · 2 mid/upper rings + arms · 3 columns, gantry, cooling, indicators
 */
export const HERO = {
  coreY: 9,
  base: { radius: 22, thickness: 1.2, platformRadius: 14, platformHeight: 1 },
  core: { radius: 1.1, y0: 4.5, y1: 13.5 },
  housing: { radius: 3.4, y0: 3, y1: 15, fins: 14, apertureHalfAngle: 0.5 },
  rings: [
    { id: "inner", y: 9, inner: 5.2, outer: 6.8, height: 1.0, direction: 1, speed: 1.0, layer: 1 },
    { id: "lower", y: 5.2, inner: 8.4, outer: 10.6, height: 1.2, direction: -1, speed: 0.6, layer: 2 },
    { id: "upper", y: 13.2, inner: 7.6, outer: 9.6, height: 0.9, direction: 1, speed: 0.45, layer: 2 },
  ],
  gantry: { y: 26.4, inner: 16.4, outer: 18.6, height: 1.4 },
  columns: { count: 6, radius: 17.5, height: 28, size: 2 },
  arms: { y: 9, from: 10.9, to: 16.6 },
  cooling: { stations: 6, radius: 12.2 },
  fog: { max: 0.014, min: 0.0055 },
} as const;

/** Emissive palette. Hero-local on purpose (not global tokens): cool technological light, one warm status accent. */
export const HERO_COLORS = {
  emissiveCool: "#7fd3ff",
  coreHot: "#d9f3ff",
  statusWarm: "#ffb25e",
  background: "#06070a",
  keyLight: "#dfe8f5",
  rimLight: "#6fb8ff",
} as const;

export const TAU = Math.PI * 2;

export function columnAngle(i: number): number {
  return (i / HERO.columns.count) * TAU;
}
