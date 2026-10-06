/**
 * World atmosphere (distance fog only). No volumetrics. Scenes override through the engine store
 * (setAtmosphere) and restore with null on exit. Colors are CSS/sRGB strings (see color-policy).
 */
export type AtmosphereConfig =
  | { kind: "none" }
  | { kind: "linear"; color: string; near: number; far: number }
  | { kind: "exp2"; color: string; density: number };

export const DEFAULT_ATMOSPHERE: AtmosphereConfig = { kind: "none" };
