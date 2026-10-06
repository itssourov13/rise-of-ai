import type { CameraIntent } from "./camera";

/** Stable scene identifier, e.g. "RISE-01-AWAKENING". IDs are never renamed without a documented migration. */
export type SceneId = `RISE-${string}`;

/**
 * Key for engine lifecycle tracking. Production scenes use SceneId. Development-only testbeds use a
 * `DEV-` key (e.g. "DEV-CALIBRATION") and must NEVER be given a RISE-xx production scene ID.
 */
export type LifecycleKey = SceneId | `DEV-${string}`;

/** Stable chapter slug used for DOM anchors and state, e.g. "awakening". */
export type ChapterId = string;

/** Content honesty tag from Phase 01: how a chapter's content should be read. */
export type NarrativeKind = "fact" | "artistic" | "speculative";

/**
 * Data-addressable chapter. Server-safe (plain data only — no components, no Three.js).
 * Fields are added only when a consumer exists. Candidates for later phases: assets, audio,
 * quality overrides, fallback, transition.
 */
export interface ChapterDefinition {
  id: ChapterId;
  title: string;
  subtitle: string;
  narrative: NarrativeKind;
  sceneId: SceneId;
  camera?: CameraIntent;
}
