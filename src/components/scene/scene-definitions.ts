import type { ComponentType } from "react";
import type { AssetId } from "@/lib/assets/types";
import type { SceneId } from "@/types/experience";

/** Props every production scene component receives from the SceneHost. */
export interface SceneProps {
  /** True only for the ACTIVE scene. Warm scenes are mounted but hidden: skip per-frame work when false. */
  active: boolean;
}

export interface SceneDefinition {
  id: SceneId;
  /** Lazy loader so each scene is its own chunk and never loads up front. */
  load: () => Promise<{ default: ComponentType<SceneProps> }>;
  /** Asset IDs requested during PRELOAD (before the scene becomes ready). Criticality comes from the asset registry. */
  assets?: readonly AssetId[];
}

/**
 * Client-only scene list. Phases 04-13: RISE-01 .. RISE-11. Each scene's choreography module registers separately (lib/choreography).
 * Adding a scene = a ChapterDefinition (content/chapters.ts) + one entry here. No engine change.
 * Chapter/scene IDs and order live in content/chapters.ts.
 */
const definitions: readonly SceneDefinition[] = [
  // Phase 04: procedural, no external assets (assets omitted on purpose; see docs/ASSET_MANIFEST.md).
  { id: "RISE-01-AWAKENING", load: () => import("./rise-01-awakening/HeroScene") },
  { id: "RISE-02-MACHINE", load: () => import("./rise-02-machine/MachineScene") },
  { id: "RISE-03-COMPUTATION", load: () => import("./rise-03-computation/ComputationScene") },
  { id: "RISE-04-PERCEPTION", load: () => import("./rise-04-perception/PerceptionScene") },
  { id: "RISE-05-LEARNING", load: () => import("./rise-05-learning/LearningScene") },
  { id: "RISE-06-LANGUAGE", load: () => import("./rise-06-language/LanguageScene") },
  { id: "RISE-07-GENERATION", load: () => import("./rise-07-generation/GenerationScene") },
  { id: "RISE-08-REASONING", load: () => import("./rise-08-reasoning/ReasoningScene") },
  { id: "RISE-09-AGENCY", load: () => import("./rise-09-agency/AgencyScene") },
  { id: "RISE-10-INTELLIGENCE", load: () => import("./rise-10-intelligence/IntelligenceScene") },
  { id: "RISE-11-UNKNOWN", load: () => import("./rise-11-unknown/UnknownScene") },
];

export const sceneRegistry: ReadonlyMap<SceneId, SceneDefinition> = new Map(definitions.map((d) => [d.id, d]));

export const getSceneDefinition = (id: SceneId): SceneDefinition | undefined => sceneRegistry.get(id);
