"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { Camera } from "three";
import { ease, type EasingName } from "@/lib/animation/math";
import { MAX_FRAME_DELTA } from "@/lib/animation/time";
import { getChapter } from "@/content/chapters";
import {
  clearCameraIntent,
  getCameraIntentVersion,
  resolveCameraIntent,
  submitCameraIntent,
  subscribeCameraIntent,
} from "@/lib/three/camera/intent-bus";
import {
  applyLens,
  applyPoseToCamera,
  copyPose,
  createPose,
  dampPose,
  lerpPose,
  posesNearlyEqual,
  setPoseFromIntent,
  type CameraPose,
} from "@/lib/three/camera/pose";
import { useExperienceStore } from "@/state/experience-store";
import type { CameraIntent } from "@/types/camera";

type Mode = "idle" | "timed" | "damped";

interface RigState {
  current: CameraPose;
  goal: CameraPose;
  from: CameraPose;
  mode: Mode;
  elapsed: number;
  duration: number;
  ease: EasingName | undefined;
  damping: number;
  /** Last intent-bus version consumed (-1 forces the first resolve). */
  version: number;
  dirty: boolean;
}

function createRigState(): RigState {
  return {
    current: createPose(),
    goal: createPose(),
    from: createPose(),
    mode: "idle",
    elapsed: 0,
    duration: 0,
    ease: undefined,
    damping: 0,
    version: -1,
    dirty: false,
  };
}

function beginMove(rig: RigState, camera: Camera, intent: CameraIntent, reducedMotion: boolean, first: boolean): void {
  setPoseFromIntent(rig.goal, intent);
  applyLens(camera, intent);
  const duration = intent.transition?.duration ?? 0;
  if (first || reducedMotion || (duration <= 0 && !intent.damping)) {
    copyPose(rig.current, rig.goal);
    rig.mode = "idle";
    rig.dirty = true;
  } else if (duration > 0) {
    copyPose(rig.from, rig.current);
    rig.mode = "timed";
    rig.elapsed = 0;
    rig.duration = duration;
    rig.ease = intent.transition?.ease;
  } else {
    rig.mode = "damped";
    rig.damping = intent.damping ?? 0;
  }
}

/** Returns true when the camera pose changed this frame (and a further frame may be needed). */
function advance(rig: RigState, delta: number): boolean {
  let moved = rig.dirty;
  rig.dirty = false;
  if (rig.mode === "timed") {
    rig.elapsed += delta;
    const t = rig.elapsed / rig.duration;
    if (t >= 1) {
      copyPose(rig.current, rig.goal);
      rig.mode = "idle";
    } else {
      lerpPose(rig.current, rig.from, rig.goal, ease(rig.ease, t));
    }
    moved = true;
  } else if (rig.mode === "damped") {
    dampPose(rig.current, rig.goal, rig.damping, delta);
    if (posesNearlyEqual(rig.current, rig.goal)) {
      copyPose(rig.current, rig.goal);
      rig.mode = "idle";
    }
    moved = true;
  }
  return moved;
}

/**
 * The ONLY writer of the real camera. Input sources (cinematic shot, choreography, transition, user)
 * submit CameraIntent data to lib/three/camera/intent-bus.ts; the rig reads the arbitrated winner and
 * applies it as snap / timed transition / damped follow (reduced motion -> snap). Runs at priority -1
 * (before scene updates) and never takes over rendering.
 * Chapter camera intents are submitted here as the "cinematic" source.
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  const chapterId = useExperienceStore((s) => s.currentChapterId);
  const rigRef = useRef<RigState | null>(null);
  if (rigRef.current === null) rigRef.current = createRigState();

  useLayoutEffect(() => {
    submitCameraIntent("cinematic", (chapterId ? getChapter(chapterId)?.camera : undefined) ?? null);
    invalidate();
    return () => clearCameraIntent("cinematic");
  }, [chapterId, invalidate]);

  // Wake a demand-mode loop whenever any source submits a new intent.
  useEffect(() => subscribeCameraIntent(invalidate), [invalidate]);

  useFrame((_, delta) => {
    const rig = rigRef.current;
    if (!rig) return;
    const dt = Math.min(delta, MAX_FRAME_DELTA);
    const busVersion = getCameraIntentVersion();
    if (busVersion !== rig.version) {
      const first = rig.version === -1;
      rig.version = busVersion;
      beginMove(rig, camera, resolveCameraIntent(), useExperienceStore.getState().reducedMotion, first);
    }
    if (advance(rig, dt)) {
      applyPoseToCamera(camera, rig.current);
      invalidate();
    }
  }, -1);

  return null;
}
