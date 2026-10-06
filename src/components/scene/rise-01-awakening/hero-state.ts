/**
 * Hero scene state. MUTABLE and NON-REACTIVE: written by the Hero timeline (hero-choreography.ts),
 * read every frame by the R3F components. Never React state / Zustand (high-frequency rule).
 * Only fields with a real consumer exist. Every channel is a pure function of Hero progress
 * (keyframe tables in hero-choreography.ts), so any progress value renders a valid state.
 */
export interface HeroState {
  /** 0..1 how readable the structure is: key/rim light, environment light, fill. */
  reveal: number;
  /** 0..1 power-up of emissive systems layer by layer (strips, indicators). */
  power: number;
  /** 0..1 core energy (drives core shader, core light, bloom coupling). */
  energy: number;
  /** 0..1 mechanical progression (ring rotation angle, shutter slide, locking). */
  mechanical: number;
  /** 0..1 position of the energy pulse front (core -> inner ring -> structure -> outer modules). */
  pulse: number;
  /** 0..1 particle intensity. */
  particles: number;
  /** 0..1 atmosphere clearing (0 thick haze, 1 clear). */
  atmosphere: number;
  /** 0..1 end-of-chapter handoff (dim + pull-back). */
  handoff: number;
}

const REST: Readonly<HeroState> = {
  reveal: 0,
  power: 0,
  energy: 0,
  mechanical: 0,
  pulse: 0,
  particles: 0.2,
  atmosphere: 0,
  handoff: 0,
};

export const heroState: HeroState = { ...REST };

export function resetHeroState(): void {
  Object.assign(heroState, REST);
}

/** Visual energy state machine: OFF -> STANDBY -> CHARGING -> ACTIVE -> PEAK. Thresholds are design values (UNVERIFIED). */
export type EnergyStage = "OFF" | "STANDBY" | "CHARGING" | "ACTIVE" | "PEAK";

export function energyStage(energy: number): EnergyStage {
  if (energy < 0.02) return "OFF";
  if (energy < 0.25) return "STANDBY";
  if (energy < 0.6) return "CHARGING";
  if (energy < 0.92) return "ACTIVE";
  return "PEAK";
}

/** Narrative guideposts over normalized Hero progress. NOT final scroll distances. */
export const HERO_BEATS = [
  { id: "void", at: 0 },
  { id: "signal", at: 0.1 },
  { id: "structure", at: 0.22 },
  { id: "power", at: 0.42 },
  { id: "awakening", at: 0.62 },
  { id: "peak", at: 0.82 },
  { id: "title", at: 0.92 },
  { id: "handoff", at: 1 },
] as const;

export function beatIndexAt(progress: number): number {
  let index = 0;
  for (let i = 0; i < HERO_BEATS.length; i += 1) {
    if (progress >= HERO_BEATS[i].at) index = i;
  }
  return index;
}
