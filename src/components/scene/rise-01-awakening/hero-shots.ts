import { compileTrack, type CameraFraming, type CameraKey } from "@/lib/choreography/camera-track";
import type { ViewportClass } from "@/lib/choreography/viewport";
import type { Vec3 } from "@/types/camera";
import { HERO } from "./hero-constants";

/**
 * CameraShotDefinitions for the Hero. World units ~ meters; machine core at (0, 9, 0), machine ~28 m tall.
 * Values are authored by reasoning about the geometry (clearance from columns at r=17.5 and rings), NOT tuned
 * visually in a browser: expect to adjust after the first run (UNVERIFIED).
 *
 *   shot-01-far      far / obscured          long lens, deep fog
 *   shot-02-push     slow forward push       the signal is noticed
 *   shot-03-reveal   partial reveal          structure edges emerge, off-axis
 *   shot-04-orbit    structural orbit        lateral arc, outside the column ring
 *   shot-05-core     core inspection         higher, macro lens, looks through the +Z service aperture
 *   shot-06-wide     wide hero reveal        low angle for monumental scale
 *   shot-07-title    title framing           machine right of frame (title is left-aligned in DOM); last key = handoff pull-back
 */
export const HERO_SHOT_KEYS: readonly CameraKey[] = [
  { id: "shot-01-far", at: 0, position: [6, 12, 96], target: [0, 9, 0], fov: 30 },
  { id: "shot-02-push", at: 0.14, position: [3, 11, 70], target: [0, 9, -2], fov: 30 },
  { id: "shot-03-reveal", at: 0.3, position: [-20, 14, 52], target: [0, 10, 0], fov: 32 },
  { id: "shot-04-orbit", at: 0.46, position: [-34, 19, 28], target: [0, 11, 0], fov: 36 },
  { id: "shot-04-orbit", at: 0.58, position: [30, 17, 32], target: [0, 11, 0], fov: 36 },
  { id: "shot-05-core", at: 0.7, position: [5, 19, 19], target: [0, 10.5, 0], fov: 26 },
  { id: "shot-06-wide", at: 0.84, position: [0, 6, 62], target: [0, 13, 0], fov: 34 },
  { id: "shot-07-title", at: 0.92, position: [-4, 8, 74], target: [-9, 14, 0], fov: 32 },
  { id: "shot-07-title", at: 1, position: [-4, 10, 100], target: [-9, 14, -4], fov: 30 },
];

/** Reduced motion: minimal travel, three poses only. */
export const HERO_SHOT_KEYS_REDUCED: readonly CameraKey[] = [
  { id: "shot-01-far", at: 0, position: [6, 12, 84], target: [0, 9, 0], fov: 30 },
  { id: "shot-06-wide", at: 0.6, position: [-6, 12, 66], target: [0, 11, 0], fov: 32 },
  { id: "shot-07-title", at: 1, position: [-4, 9, 76], target: [-9, 14, 0], fov: 32 },
];

export const HERO_TRACK = compileTrack(HERO_SHOT_KEYS);
export const HERO_TRACK_REDUCED = compileTrack(HERO_SHOT_KEYS_REDUCED);

/**
 * Responsive framing is a cinematic REFRAMING, not a scaled desktop crop. Mobile moves in and biases the
 * look target to the core so CORE + SILHOUETTE + LIGHT carry the frame instead of the whole machine.
 */
export const HERO_FRAMING: Readonly<Record<ViewportClass, CameraFraming>> = {
  desktop: { distance: 1, focusBias: 0, fovAdd: 0 },
  tablet: { distance: 0.78, focusBias: 0.35, fovAdd: 0 },
  mobile: { distance: 0.5, focusBias: 0.8, fovAdd: 2 },
};

export const HERO_FOCUS: Vec3 = [0, HERO.coreY, 0];
export const HERO_CAMERA_LENS = { near: 0.5, far: 320, damping: 5 } as const;
