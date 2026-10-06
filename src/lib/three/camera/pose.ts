import { Euler, PerspectiveCamera, Vector3, type Camera } from "three";
import { dampFactor, lerp } from "@/lib/animation/math";
import type { CameraIntent } from "@/types/camera";

/**
 * Camera pose math. Orientation is expressed as a look TARGET (lookAt), so interpolating
 * position + target + fov is stable (no gimbal issues, no quaternion hemisphere flips) and needs
 * no custom quaternion abstraction. Rotation-only intents are converted to a target once.
 * Functions mutate `out` and use module scratch objects: no per-frame allocation.
 */
export interface CameraPose {
  position: Vector3;
  target: Vector3;
  fov: number;
}

export const createPose = (): CameraPose => ({ position: new Vector3(0, 0, 6), target: new Vector3(), fov: 45 });

const scratchEuler = new Euler();
const scratchForward = new Vector3();

export function setPoseFromIntent(out: CameraPose, intent: CameraIntent): void {
  out.position.set(...intent.position);
  if (intent.target) {
    out.target.set(...intent.target);
  } else if (intent.rotation) {
    scratchEuler.set(...intent.rotation);
    scratchForward.set(0, 0, -1).applyEuler(scratchEuler);
    out.target.copy(out.position).add(scratchForward);
  } else {
    out.target.set(out.position.x, out.position.y, out.position.z - 1);
  }
  out.fov = intent.fov;
}

export function copyPose(out: CameraPose, src: CameraPose): void {
  out.position.copy(src.position);
  out.target.copy(src.target);
  out.fov = src.fov;
}

export function lerpPose(out: CameraPose, a: CameraPose, b: CameraPose, t: number): void {
  out.position.lerpVectors(a.position, b.position, t);
  out.target.lerpVectors(a.target, b.target, t);
  out.fov = lerp(a.fov, b.fov, t);
}

/** Frame-rate independent exponential follow of `goal`. */
export function dampPose(current: CameraPose, goal: CameraPose, lambda: number, delta: number): void {
  const f = dampFactor(lambda, delta);
  current.position.lerp(goal.position, f);
  current.target.lerp(goal.target, f);
  current.fov = lerp(current.fov, goal.fov, f);
}

export function posesNearlyEqual(a: CameraPose, b: CameraPose, epsilon = 1e-4): boolean {
  return (
    a.position.distanceToSquared(b.position) < epsilon &&
    a.target.distanceToSquared(b.target) < epsilon &&
    Math.abs(a.fov - b.fov) < epsilon
  );
}

/** Writes the pose to the real camera. Called only from CameraRig. */
export function applyPoseToCamera(camera: Camera, pose: CameraPose): void {
  camera.position.copy(pose.position);
  camera.lookAt(pose.target);
  if (camera instanceof PerspectiveCamera && camera.fov !== pose.fov) {
    camera.fov = pose.fov;
    camera.updateProjectionMatrix();
  }
}

/** Near/far are not interpolated: applied when an intent begins. Called only from CameraRig. */
export function applyLens(camera: Camera, intent: CameraIntent): void {
  if (camera instanceof PerspectiveCamera && (camera.near !== intent.near || camera.far !== intent.far)) {
    camera.near = intent.near;
    camera.far = intent.far;
    camera.updateProjectionMatrix();
  }
}
