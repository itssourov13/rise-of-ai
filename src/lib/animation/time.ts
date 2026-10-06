/**
 * One consistent engine time reference. Written ONLY by <EngineClock /> (components/engine) once
 * per rendered frame; everything else reads it. Never mirror it into React state or Zustand.
 *
 * Distinct concepts (do not conflate):
 *   absolute time  -> engineTime.elapsed (seconds since the Canvas clock started)
 *   delta time     -> engineTime.delta   (seconds since the previous rendered frame, clamped)
 *   scroll progress / scene progress -> lib/animation/progress.ts
 */
export const MAX_FRAME_DELTA = 0.1;

export interface EngineTime {
  elapsed: number;
  delta: number;
  frame: number;
}

export const engineTime: EngineTime = { elapsed: 0, delta: 0, frame: 0 };

export function writeEngineTime(elapsed: number, delta: number): void {
  engineTime.elapsed = elapsed;
  // Clamp so a background tab / demand-mode gap never produces a huge simulation step.
  engineTime.delta = Math.min(delta, MAX_FRAME_DELTA);
  engineTime.frame += 1;
}
