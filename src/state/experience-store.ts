import { create } from "zustand";
import type { Capabilities } from "@/lib/capabilities/detect";
import type { QualityTier } from "@/lib/performance/quality";
import type { ChapterId, SceneId } from "@/types/experience";

/**
 * pending  — before capability detection (SSR and first client render)
 * active   — 3D canvas may mount
 * disabled — WebGL unavailable; semantic narrative only
 * failed   — 3D layer threw at runtime; semantic narrative only
 */
export type RenderMode = "pending" | "active" | "disabled" | "failed";

/**
 * Discrete, low-frequency experience state only.
 * High-frequency values (scroll progress, velocity, per-frame animation values) live in
 * lib/scroll/scroll-state.ts (mutable, non-reactive) so they never trigger React re-renders.
 */
interface ExperienceState {
  currentChapterId: ChapterId | null;
  currentSceneId: SceneId | null;
  reducedMotion: boolean;
  qualityTier: QualityTier;
  capabilities: Capabilities | null;
  renderMode: RenderMode;
  /** Why the 3D layer failed/was disabled. Shown in development only. */
  failureReason: string | null;
  setActiveChapter: (chapterId: ChapterId | null, sceneId: SceneId | null) => void;
  setReducedMotion: (reduced: boolean) => void;
  setQualityTier: (tier: QualityTier) => void;
  setCapabilities: (caps: Capabilities) => void;
  setRenderMode: (mode: RenderMode, reason?: string) => void;
}

export const useExperienceStore = create<ExperienceState>()((set) => ({
  currentChapterId: null,
  currentSceneId: null,
  reducedMotion: false,
  qualityTier: "HIGH",
  capabilities: null,
  renderMode: "pending",
  failureReason: null,
  setActiveChapter: (currentChapterId, currentSceneId) => set({ currentChapterId, currentSceneId }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setQualityTier: (qualityTier) => set({ qualityTier }),
  setCapabilities: (capabilities) => set({ capabilities }),
  setRenderMode: (renderMode, reason) => set({ renderMode, failureReason: reason ?? null }),
}));
