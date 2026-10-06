import type { LifecycleKey } from "@/types/experience";

/**
 * Scene lifecycle (tracking + validation; it does not mount anything by itself):
 *   registered -> preload -> ready -> active <-> warm <-> hidden -> released
 * Principle: do not destroy/recreate expensive 3D resources because a scroll boundary was crossed.
 * "warm" scenes stay resident (hidden but alive); "released" scenes have dropped their assets.
 * Which scenes are active/warm/cold is decided by lib/three/lifecycle/residency.ts.
 */
export type SceneLifecycleState = "registered" | "preload" | "ready" | "active" | "warm" | "hidden" | "released";

const ALLOWED: Record<SceneLifecycleState, readonly SceneLifecycleState[]> = {
  registered: ["preload", "ready", "released"],
  preload: ["ready", "released"],
  ready: ["active", "warm", "hidden", "released"],
  active: ["warm", "hidden", "released"],
  warm: ["active", "hidden", "released"],
  hidden: ["active", "warm", "released"],
  released: ["registered", "preload"],
};

export interface SceneLifecycle {
  /** Idempotent. A released key returns to "registered". */
  register(id: LifecycleKey): void;
  get(id: LifecycleKey): SceneLifecycleState | undefined;
  /** Validates the step. Same-state is a no-op (true). Invalid step: warns in dev, returns false. */
  transition(id: LifecycleKey, next: SceneLifecycleState): boolean;
  /** Marks a scene failed (critical asset / render error): it is released and not remounted. */
  fail(id: LifecycleKey, error: unknown): void;
  isFailed(id: LifecycleKey): boolean;
  entries(): ReadonlyMap<LifecycleKey, SceneLifecycleState>;
  getVersion(): number;
  subscribe(listener: () => void): () => void;
}

export function createSceneLifecycle(): SceneLifecycle {
  const states = new Map<LifecycleKey, SceneLifecycleState>();
  const failedIds = new Set<LifecycleKey>();
  const listeners = new Set<() => void>();
  let version = 0;
  const bump = () => {
    version += 1;
    listeners.forEach((l) => l());
  };

  return {
    register(id) {
      const current = states.get(id);
      if (current === undefined || current === "released") {
        states.set(id, "registered");
        bump();
      }
    },
    get: (id) => states.get(id),
    transition(id, next) {
      const current = states.get(id);
      if (current === undefined) return false;
      if (current === next) return true;
      if (!ALLOWED[current].includes(next)) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(`[lifecycle] invalid transition for ${id}: ${current} -> ${next}`);
        }
        return false;
      }
      states.set(id, next);
      bump();
      return true;
    },
    fail(id, error) {
      console.error(`[lifecycle] scene failed: ${id}`, error);
      failedIds.add(id);
      if (states.get(id) !== undefined) states.set(id, "released");
      bump();
    },
    isFailed: (id) => failedIds.has(id),
    entries: () => states,
    getVersion: () => version,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/** The engine's single lifecycle instance. */
export const sceneLifecycle: SceneLifecycle = createSceneLifecycle();
