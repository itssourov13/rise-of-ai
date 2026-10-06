"use client";

import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import { sceneLifecycle } from "@/lib/three/lifecycle/scene-lifecycle";
import { diagnosticsSnapshot as snap } from "@/lib/three/diagnostics/snapshot";
import { useExperienceStore } from "@/state/experience-store";

const direction = new Vector3();

/**
 * DEV ONLY (mounted via the lazily imported dev tools). Copies renderer.info + R3F state into a mutable
 * snapshot each frame. Reads values from the previous frame (info resets at render start). No allocation, no React state.
 */
export function DiagnosticsProbe() {
  useFrame((state, delta) => {
    const info = state.gl.info;
    snap.drawCalls = info.render.calls;
    snap.triangles = info.render.triangles;
    snap.geometries = info.memory.geometries;
    snap.textures = info.memory.textures;
    snap.dpr = state.gl.getPixelRatio();
    snap.width = state.size.width;
    snap.height = state.size.height;
    snap.frameloop = state.frameloop;
    snap.frameMs = snap.frameMs === 0 ? delta * 1000 : snap.frameMs * 0.9 + delta * 1000 * 0.1;
    snap.tier = useExperienceStore.getState().qualityTier;
    const p = state.camera.position;
    snap.cameraPosition[0] = p.x;
    snap.cameraPosition[1] = p.y;
    snap.cameraPosition[2] = p.z;
    state.camera.getWorldDirection(direction);
    snap.cameraDirection[0] = direction.x;
    snap.cameraDirection[1] = direction.y;
    snap.cameraDirection[2] = direction.z;
    const active = useExperienceStore.getState().currentSceneId;
    const states: string[] = [];
    sceneLifecycle.entries().forEach((st, id) => states.push(`${id}:${st}`));
    snap.sceneLabel = `${active ?? "none (no production scene)"}${states.length ? `  [${states.join(" ")}]` : ""}`;
  });
  return null;
}
