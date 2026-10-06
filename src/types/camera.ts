import type { EasingName } from "@/lib/animation/math";

export type Vec3 = readonly [x: number, y: number, z: number];

/** Who is asking the camera rig to move. Priority is defined in lib/three/camera/intent-bus.ts. */
export type CameraSource = "cinematic" | "choreography" | "transition" | "user";

/**
 * Declarative camera intent. Systems describe WHAT the camera should do; only the CameraRig
 * (components/camera/CameraRig.tsx) mutates the real camera.
 *
 * `rotation` (euler, radians) is used only when `target` is omitted (converted to a look target).
 * `transition`: timed move from the current pose to this intent. Omitted -> snap (or damp, if `damping`).
 * `damping`: exponential follow rate (lambda, 1/s) for continuously updated intents (e.g. user input).
 * Reduced motion forces snap.
 */
export interface CameraIntent {
  position: Vec3;
  target?: Vec3;
  rotation?: Vec3;
  fov: number;
  near: number;
  far: number;
  transition?: {
    duration: number;
    ease?: EasingName;
  };
  damping?: number;
}

export const DEFAULT_CAMERA_INTENT: CameraIntent = {
  position: [0, 0, 6],
  target: [0, 0, 0],
  fov: 45,
  near: 0.1,
  far: 200,
};
