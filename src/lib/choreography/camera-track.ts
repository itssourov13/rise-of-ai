import type { CameraIntent, Vec3 } from "@/types/camera";

/**
 * Camera shot definitions + sampler. Pure math, no Three.js import (keeps three out of the main bundle).
 * A track is a list of keyed poses over NORMALIZED scene progress. Sampling uses cubic Hermite interpolation
 * with finite-difference tangents, so velocity is continuous through shots (no stop/start at every key) and
 * speed varies with key spacing. Track ends have zero tangent (eased start/stop).
 * Any progress value yields a valid pose.
 */
export interface CameraKey {
  /** Shot identifier (a shot may span several keys, e.g. an orbit). */
  id: string;
  at: number;
  position: Vec3;
  target: Vec3;
  fov: number;
}

export interface CameraSample {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  /** Index of the key segment start (for debug: current shot). */
  index: number;
}

export interface CompiledTrack {
  keys: readonly CameraKey[];
  at: readonly number[];
  /** rows of [px,py,pz,tx,ty,tz,fov] */
  values: readonly (readonly number[])[];
}

export function compileTrack(keys: readonly CameraKey[]): CompiledTrack {
  return {
    keys,
    at: keys.map((k) => k.at),
    values: keys.map((k) => [...k.position, ...k.target, k.fov]),
  };
}

const COMPONENTS = 7;
const scratch = new Array<number>(COMPONENTS).fill(0);

function hermite(p0: number, p1: number, m0: number, m1: number, t: number, h: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * p0 + (t3 - 2 * t2 + t) * h * m0 + (-2 * t3 + 3 * t2) * p1 + (t3 - t2) * h * m1;
}

function tangent(track: CompiledTrack, i: number, c: number): number {
  const last = track.at.length - 1;
  if (i <= 0 || i >= last) return 0;
  return (track.values[i + 1][c] - track.values[i - 1][c]) / (track.at[i + 1] - track.at[i - 1]);
}

export function sampleCameraTrack(track: CompiledTrack, progress: number, out: CameraSample): CameraSample {
  const last = track.at.length - 1;
  const p = Math.min(track.at[last], Math.max(track.at[0], progress));
  let i = 0;
  while (i < last - 1 && p >= track.at[i + 1]) i += 1;
  const h = track.at[i + 1] - track.at[i];
  const t = h > 0 ? (p - track.at[i]) / h : 0;
  for (let c = 0; c < COMPONENTS; c += 1) {
    scratch[c] = hermite(track.values[i][c], track.values[i + 1][c], tangent(track, i, c), tangent(track, i + 1, c), t, h);
  }
  out.position[0] = scratch[0];
  out.position[1] = scratch[1];
  out.position[2] = scratch[2];
  out.target[0] = scratch[3];
  out.target[1] = scratch[4];
  out.target[2] = scratch[5];
  out.fov = scratch[6];
  out.index = t >= 1 ? i + 1 : i;
  return out;
}

export const createCameraSample = (): CameraSample => ({ position: [0, 0, 0], target: [0, 0, 0], fov: 45, index: 0 });

/** Responsive framing: pull the camera in/out and bias the look target toward a focal point. */
export interface CameraFraming {
  /** Multiplier on camera-to-target distance. */
  distance: number;
  /** 0..1: how far the look target moves toward `focus` (core-focused compositions). */
  focusBias: number;
  fovAdd: number;
}

export function applyFraming(sample: CameraSample, framing: CameraFraming, focus: Vec3): void {
  const { position: p, target: t } = sample;
  for (let a = 0; a < 3; a += 1) {
    t[a] = t[a] + (focus[a] - t[a]) * framing.focusBias;
  }
  for (let a = 0; a < 3; a += 1) {
    p[a] = t[a] + (p[a] - t[a]) * framing.distance;
  }
  sample.fov += framing.fovAdd;
}

/**
 * Writes samples into one of TWO preallocated intents (ping-pong), because the intent bus ignores
 * re-submission of the same object. No per-frame allocation. `damped=false` snaps (first/activation),
 * `damped=true` lets the CameraRig follow with exponential damping.
 */
export function createCameraIntentWriter(options: { damping: number; near: number; far: number }) {
  interface MutableIntent {
    position: [number, number, number];
    target: [number, number, number];
    fov: number;
    near: number;
    far: number;
    damping?: number;
  }
  const make = (): MutableIntent => ({
    position: [0, 0, 0],
    target: [0, 0, 0],
    fov: 45,
    near: options.near,
    far: options.far,
  });
  const a = make();
  const b = make();
  let flip = false;
  return {
    write(sample: CameraSample, damped: boolean): CameraIntent {
      flip = !flip;
      const intent = flip ? a : b;
      intent.position[0] = sample.position[0];
      intent.position[1] = sample.position[1];
      intent.position[2] = sample.position[2];
      intent.target[0] = sample.target[0];
      intent.target[1] = sample.target[1];
      intent.target[2] = sample.target[2];
      intent.fov = sample.fov;
      intent.damping = damped ? options.damping : undefined;
      return intent;
    },
  };
}
