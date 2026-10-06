import type { QualityTier } from "@/lib/performance/quality";
import { prefersReducedMotion } from "./reduced-motion";

export type WebGLLevel = "none" | "webgl1" | "webgl2";

/**
 * Local rendering-capability snapshot. Browser-only. Never transmitted anywhere.
 * Deliberately coarse: no raw GPU strings, memory or core counts are retained.
 */
export interface Capabilities {
  webgl: WebGLLevel;
  reducedMotion: boolean;
  coarsePointer: boolean;
  devicePixelRatio: number;
  viewport: { width: number; height: number };
  /** Heuristic from coarse, optionally-exposed hints. Unvalidated. */
  lowPowerHint: boolean;
}

function probeWebGL(): WebGLLevel {
  try {
    const gl2 = document.createElement("canvas").getContext("webgl2");
    if (gl2) {
      gl2.getExtension("WEBGL_lose_context")?.loseContext();
      return "webgl2";
    }
    const gl1 = document.createElement("canvas").getContext("webgl");
    if (gl1) {
      gl1.getExtension("WEBGL_lose_context")?.loseContext();
      return "webgl1";
    }
  } catch {
    // fall through
  }
  return "none";
}

function lowPowerHint(): boolean {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const lowMemory = typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4;
  const fewCores = typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 4;
  return lowMemory || fewCores;
}

export function detectCapabilities(): Capabilities {
  return {
    webgl: probeWebGL(),
    reducedMotion: prefersReducedMotion(),
    coarsePointer: window.matchMedia("(pointer: coarse)").matches,
    devicePixelRatio: window.devicePixelRatio || 1,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    lowPowerHint: lowPowerHint(),
  };
}

/** Initial tier only. ULTRA is never auto-selected until calibrated. Runtime adaptation is Phase 03+/15. */
export function selectInitialTier(caps: Capabilities): QualityTier {
  const shortSide = Math.min(caps.viewport.width, caps.viewport.height);
  if (caps.coarsePointer && shortSide <= 820) return "MOBILE";
  if (caps.lowPowerHint) return "LOW";
  if (caps.coarsePointer) return "MEDIUM";
  return "HIGH";
}
