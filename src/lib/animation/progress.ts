import type { LifecycleKey } from "@/types/experience";

/**
 * Engine-side read model for scene progress and transitions. The 3D engine consumes these values;
 * it never talks to Lenis/scroll directly:
 *
 *   scroll driver -> scrollState -> choreographer -> sceneProgress / transitionState -> engine
 *
 * Writer: lib/choreography/choreographer.ts ONLY (Phase 04). Values stay at rest until a scene is mounted.
 * Mutable and non-reactive on purpose: they change every frame.
 */
export interface SceneProgressState {
  sceneId: LifecycleKey | null;
  /** 0..1 within the active scene. */
  value: number;
  /** 0..1 over the whole experience (copy of the choreographer's global progress). */
  global: number;
}

export const sceneProgress: SceneProgressState = { sceneId: null, value: 0, global: 0 };

/** Conceptual transition kinds. Boundary only: no transition effect is implemented. */
export type TransitionKind = "none" | "dissolve" | "morph" | "camera-travel" | "particle" | "shader" | "environment";

export interface TransitionState {
  kind: TransitionKind;
  from: LifecycleKey | null;
  to: LifecycleKey | null;
  /** 0..1 */
  progress: number;
}

export const transitionState: TransitionState = { kind: "none", from: null, to: null, progress: 0 };
