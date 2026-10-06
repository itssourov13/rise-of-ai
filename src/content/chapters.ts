import type { ChapterDefinition, SceneId } from "@/types/experience";

/**
 * Chapter order = narrative order. Scene IDs are stable (Phase 01 SCENE_MAP.md).
 * Titles/subtitles are the Phase 01 theme lines, NOT final copy.
 * `narrative` tags are provisional until real copy is written.
 * Adding RISE-12-NEW-CONCEPT = append an entry here (+ a scene definition in
 * components/scene/scene-definitions.ts once its scene exists).
 * This module must stay server-safe: no browser APIs, no Three.js, no GSAP.
 */
export const chapters: readonly ChapterDefinition[] = [
  { id: "awakening", title: "The Awakening", subtitle: "The machine comes alive.", narrative: "artistic", sceneId: "RISE-01-AWAKENING" },
  { id: "machine", title: "The Machine", subtitle: "Mechanical and computational infrastructure.", narrative: "fact", sceneId: "RISE-02-MACHINE" },
  { id: "computation", title: "Computation", subtitle: "Numbers become patterns.", narrative: "fact", sceneId: "RISE-03-COMPUTATION" },
  { id: "perception", title: "Perception", subtitle: "Machines begin processing the world around them.", narrative: "fact", sceneId: "RISE-04-PERCEPTION" },
  { id: "learning", title: "Learning", subtitle: "Patterns become models.", narrative: "fact", sceneId: "RISE-05-LEARNING" },
  { id: "language", title: "Language", subtitle: "Machines process tokens, words and meaning-like representations.", narrative: "fact", sceneId: "RISE-06-LANGUAGE" },
  { id: "generation", title: "Generation", subtitle: "Models begin producing new media and artifacts.", narrative: "fact", sceneId: "RISE-07-GENERATION" },
  { id: "reasoning", title: "Reasoning", subtitle: "The system moves from response toward multi-step problem solving.", narrative: "fact", sceneId: "RISE-08-REASONING" },
  { id: "agency", title: "Agency", subtitle: "Models interact with external tools and environments.", narrative: "fact", sceneId: "RISE-09-AGENCY" },
  { id: "intelligence", title: "Intelligence", subtitle: "Many computational systems become interconnected.", narrative: "artistic", sceneId: "RISE-10-INTELLIGENCE" },
  { id: "unknown", title: "The Unknown", subtitle: "The future remains open.", narrative: "speculative", sceneId: "RISE-11-UNKNOWN" },
];

export function getChapter(id: string): ChapterDefinition | undefined {
  return chapters.find((c) => c.id === id);
}

/** Scene IDs in narrative order (derived; single source of truth is `chapters`). */
export const sceneOrder: readonly SceneId[] = chapters.map((c) => c.sceneId);
