import { create } from "zustand";
import { EXPOSURE_SCALE_RANGE } from "@/lib/three/renderer/color-policy";
import type { AtmosphereConfig } from "@/lib/three/world/atmosphere";
import type { EnvironmentSource } from "@/lib/three/world/environment";

/**
 * Low-frequency ENGINE state only (world configuration + render-loop demand). The engine reads it;
 * scenes write it through these actions and restore on exit. Per-frame values never live here
 * (see lib/animation/time.ts, progress.ts).
 */
interface EngineState {
  /** >0 -> frameloop "always". Acquire while something animates by itself; release when done. */
  continuousRequests: number;
  exposureScale: number;
  environment: EnvironmentSource;
  /** Scene override of the world atmosphere; null -> world default. */
  atmosphere: AtmosphereConfig | null;
  acquireContinuous: () => () => void;
  setExposureScale: (scale: number) => void;
  setEnvironment: (source: EnvironmentSource) => void;
  setAtmosphere: (atmosphere: AtmosphereConfig | null) => void;
}

export const useEngineStore = create<EngineState>()((set) => ({
  continuousRequests: 0,
  exposureScale: 1,
  environment: { kind: "none" },
  atmosphere: null,
  acquireContinuous: () => {
    set((s) => ({ continuousRequests: s.continuousRequests + 1 }));
    let released = false;
    return () => {
      if (released) return;
      released = true;
      set((s) => ({ continuousRequests: Math.max(0, s.continuousRequests - 1) }));
    };
  },
  setExposureScale: (scale) =>
    set({ exposureScale: Math.min(EXPOSURE_SCALE_RANGE[1], Math.max(EXPOSURE_SCALE_RANGE[0], scale)) }),
  setEnvironment: (environment) => set({ environment }),
  setAtmosphere: (atmosphere) => set({ atmosphere }),
}));
