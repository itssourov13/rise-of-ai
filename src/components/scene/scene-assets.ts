import { requestAsset, type AssetContext, type AssetHandle } from "@/lib/three/assets/asset-cache";
import { sceneLifecycle } from "@/lib/three/lifecycle/scene-lifecycle";
import type { AssetId } from "@/lib/assets/types";
import type { LifecycleKey } from "@/types/experience";

/**
 * Scene-owned asset references. A scene holds its handles from PRELOAD until it is released, so shared
 * assets stay alive while any scene uses them and are disposed by the cache when the last scene lets go.
 */
const handles = new Map<LifecycleKey, AssetHandle[]>();
const inflight = new Map<LifecycleKey, Promise<boolean>>();

/**
 * registered/released -> preload -> ready (or failed). Idempotent while in flight. Returns true when
 * the scene is usable. A failed CRITICAL asset fails the scene (fallback: scene is not mounted, the world
 * keeps running); a failed OPTIONAL asset only degrades (it is logged by the asset cache).
 */
export function preloadScene(id: LifecycleKey, assets: readonly AssetId[], ctx: AssetContext): Promise<boolean> {
  const existing = inflight.get(id);
  if (existing) return existing;
  const state = sceneLifecycle.get(id);
  if (state && state !== "registered" && state !== "released") return Promise.resolve(true);
  if (state === undefined || state === "released") sceneLifecycle.register(id);

  const run = (async () => {
    sceneLifecycle.transition(id, assets.length ? "preload" : "ready");
    if (assets.length) {
      const results = await Promise.all(assets.map((a) => requestAsset(a, ctx)));
      const held: AssetHandle[] = [];
      let criticalFailure: unknown;
      for (const r of results) {
        if (r.ok) held.push(r.handle);
        else if (r.error.critical) criticalFailure = r.error;
      }
      if (criticalFailure) {
        held.forEach((h) => h.release());
        sceneLifecycle.fail(id, criticalFailure);
        return false;
      }
      handles.set(id, held);
      sceneLifecycle.transition(id, "ready");
    }
    return true;
  })().finally(() => inflight.delete(id));

  inflight.set(id, run);
  return run;
}

export function releaseScene(id: LifecycleKey): void {
  handles.get(id)?.forEach((h) => h.release());
  handles.delete(id);
  sceneLifecycle.transition(id, "released");
}
