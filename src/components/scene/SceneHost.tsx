"use client";

import { lazy, Suspense, useEffect, useMemo, useSyncExternalStore, type ComponentType, type LazyExoticComponent } from "react";
import { useThree } from "@react-three/fiber";
import { sceneOrder } from "@/content/chapters";
import { planResidency } from "@/lib/three/lifecycle/residency";
import { sceneLifecycle } from "@/lib/three/lifecycle/scene-lifecycle";
import { useExperienceStore } from "@/state/experience-store";
import type { SceneId } from "@/types/experience";
import { SceneBoundary } from "./SceneBoundary";
import { preloadScene, releaseScene } from "./scene-assets";
import { sceneRegistry, type SceneProps } from "./scene-definitions";

const lazyScenes = new Map<SceneId, LazyExoticComponent<ComponentType<SceneProps>>>();

function getLazyScene(id: SceneId): LazyExoticComponent<ComponentType<SceneProps>> | undefined {
  const def = sceneRegistry.get(id);
  if (!def) return undefined;
  let component = lazyScenes.get(id);
  if (!component) {
    component = lazy(def.load);
    lazyScenes.set(id, component);
  }
  return component;
}

const RESIDENT_STATES = new Set(["ready", "active", "warm", "hidden"]);

/**
 * Scene host inside the single persistent Canvas. Residency plan: the active scene plus its neighbours
 * stay MOUNTED (neighbours hidden = "warm"), everything else is cold and released. Crossing a scroll
 * boundary toggles visibility; it does not destroy and recreate expensive resources.
 * Scenes without a definition are skipped, so with no production scenes this renders nothing.
 */
export function SceneHost() {
  const currentSceneId = useExperienceStore((s) => s.currentSceneId);
  const tier = useExperienceStore((s) => s.qualityTier);
  const renderer = useThree((s) => s.gl);
  const plan = useMemo(() => planResidency(sceneOrder, currentSceneId), [currentSceneId]);
  useSyncExternalStore(sceneLifecycle.subscribe, sceneLifecycle.getVersion, sceneLifecycle.getVersion);

  useEffect(() => {
    let cancelled = false;
    plan.forEach((residency, id) => {
      const def = sceneRegistry.get(id);
      if (!def) return;
      if (residency === "cold") {
        releaseScene(id);
        return;
      }
      if (sceneLifecycle.isFailed(id)) return;
      void preloadScene(id, def.assets ?? [], { tier, renderer }).then((ok) => {
        if (ok && !cancelled) sceneLifecycle.transition(id, residency === "active" ? "active" : "warm");
      });
    });
    return () => {
      cancelled = true;
    };
  }, [plan, tier, renderer]);

  return (
    <>
      {sceneOrder.map((id) => {
        const residency = plan.get(id);
        const state = sceneLifecycle.get(id);
        if (!residency || residency === "cold" || !state || !RESIDENT_STATES.has(state) || sceneLifecycle.isFailed(id)) return null;
        const Scene = getLazyScene(id);
        if (!Scene) return null;
        const active = residency === "active";
        return (
          <SceneBoundary key={id} sceneId={id} onFail={(error) => sceneLifecycle.fail(id, error)}>
            <group visible={active}>
              <Suspense fallback={null}>
                <Scene active={active} />
              </Suspense>
            </group>
          </SceneBoundary>
        );
      })}
    </>
  );
}
