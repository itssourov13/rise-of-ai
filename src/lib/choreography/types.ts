import type gsap from "gsap";
import type { QualityTier } from "@/lib/performance/quality";
import type { CameraIntent } from "@/types/camera";
import type { SceneId } from "@/types/experience";
import type { ViewportClass } from "./viewport";

/** What a scene's choreography module receives when the choreographer mounts it. */
export interface ChoreographyContext {
  sceneId: SceneId;
  /** The scene's scroll region (its ScrollTrigger trigger). */
  region: HTMLElement;
  reducedMotion: boolean;
  tier: QualityTier;
  viewportClass: () => ViewportClass;
  query: <T extends Element = HTMLElement>(selector: string) => T | null;
  /** Submit the scene's camera intent through the intent bus ("choreography" source). Null clears it. */
  submitCamera: (intent: CameraIntent | null) => void;
  /** Writes the shared transition read-model for this scene -> `to`. */
  writeTransition: (to: SceneId | null, progress: number) => void;
}

export interface SceneChoreographyHandle {
  /**
   * Paused timeline of total duration 1 (positions are normalized scene progress). The choreographer
   * attaches the single ScrollTrigger to it; the scene must NOT create its own ScrollTrigger.
   */
  timeline: gsap.core.Timeline;
  /** Called after every timeline render with the (smoothed) normalized progress. Active scene only. */
  onProgress?: (progress: number) => void;
  /** Called after ScrollTrigger recalculated layout (resize, fonts, orientation). */
  onRefresh?: () => void;
  onActivate?: () => void;
  onDeactivate?: () => void;
  /** Reset any module state the scene owns (mutable scene state, post params...). Timelines are reverted by the choreographer. */
  dispose?: () => void;
}

/**
 * A scene's choreography module. Owned by the scene (e.g. rise-01-awakening/hero-choreography.ts); the global
 * choreographer only coordinates. Future chapters register themselves the same way.
 */
export interface SceneChoreography {
  sceneId: SceneId;
  /** CSS selector of the scroll region element (the choreographer queries it inside the mount root). */
  regionSelector: string;
  /** Scrub smoothing in seconds (ScrollTrigger scrub). Default 0.6; reduced motion forces direct scrub. */
  scrub?: number;
  build(ctx: ChoreographyContext): SceneChoreographyHandle;
}

export interface ChoreographerMountOptions {
  root: HTMLElement;
  reducedMotion: boolean;
  tier: QualityTier;
  /** Development only: freeze the first registered scene at this normalized progress. */
  seek?: number | null;
}

export interface ExperienceChoreographer {
  registerScene(def: SceneChoreography): () => void;
  /** Binds an externally built timeline to an already registered scene (defaults: build() output is registered automatically). */
  registerTimeline(sceneId: SceneId, timeline: gsap.core.Timeline): void;
  mount(options: ChoreographerMountOptions): void;
  /** Programmatic progress (debug / seeking). Detaches scroll scrub for that scene until releaseProgress(). */
  setProgress(sceneId: SceneId, progress: number): void;
  releaseProgress(sceneId: SceneId): void;
  getProgress(sceneId: SceneId): number;
  activateScene(sceneId: SceneId): void;
  deactivateScene(sceneId: SceneId): void;
  getActiveScene(): SceneId | null;
  /** Fires whenever any registered scene's progress or active scene changes (use to wake demand-mode rendering). */
  subscribe(listener: () => void): () => void;
  refresh(): void;
  cleanup(): void;
}
