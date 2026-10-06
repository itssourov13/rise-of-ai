import type { DebugFlag } from "./debug-flags";
import { checkLightingBudget, lightCensus } from "@/lib/three/world/lighting-budget";
import type { QualityTier } from "@/lib/performance/quality";

/**
 * Mutable diagnostics snapshot, written each frame by components/engine/DiagnosticsProbe (dev only)
 * and polled by the DOM overlay. Never React state. Numbers come from renderer.info and R3F state;
 * frame time is only meaningful while frameloop === "always".
 */
export interface DiagnosticsSnapshot {
  backend: string;
  tier: QualityTier;
  frameloop: string;
  dpr: number;
  width: number;
  height: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  frameMs: number;
  sceneLabel: string;
  cameraPosition: [number, number, number];
  cameraDirection: [number, number, number];
  /** Hero debug values (development only; written by hero choreography / scene). */
  heroProgress: number;
  heroBeat: string;
  heroShot: string;
  heroStage: string;
  heroBloom: number;
  heroObjects: number;
  heroInstances: number;
  particleCount: number;
  postState: string;
}

export const diagnosticsSnapshot: DiagnosticsSnapshot = {
  backend: "webgl",
  tier: "HIGH",
  frameloop: "demand",
  dpr: 1,
  width: 0,
  height: 0,
  drawCalls: 0,
  triangles: 0,
  geometries: 0,
  textures: 0,
  frameMs: 0,
  sceneLabel: "-",
  cameraPosition: [0, 0, 0],
  cameraDirection: [0, 0, -1],
  heroProgress: 0,
  heroBeat: "-",
  heroShot: "-",
  heroStage: "-",
  heroBloom: 0,
  heroObjects: 0,
  heroInstances: 0,
  particleCount: 0,
  postState: "off",
};

const f = (n: number) => n.toFixed(2);
const v = (a: readonly number[]) => a.map(f).join(", ");

export function formatDiagnostics(s: DiagnosticsSnapshot, flags: ReadonlySet<DebugFlag>): string {
  const lines: string[] = [];
  if (flags.has("scene")) lines.push(`scene   ${s.sceneLabel}`);
  if (flags.has("quality")) lines.push(`quality ${s.tier}  backend ${s.backend}  dpr ${f(s.dpr)}  loop ${s.frameloop}`);
  if (flags.has("stats")) {
    const fps = s.frameloop === "always" && s.frameMs > 0 ? `${s.frameMs.toFixed(1)}ms (~${Math.round(1000 / s.frameMs)}fps)` : "n/a (demand)";
    lines.push(`canvas  ${s.width}x${s.height}  frame ${fps}`);
    lines.push(`render  calls ${s.drawCalls}  tris ${s.triangles}  geo ${s.geometries}  tex ${s.textures}`);
    const over = checkLightingBudget(lightCensus, s.tier);
    lines.push(`lights  E${lightCensus.essential} S${lightCensus.support} A${lightCensus.accent} shadow ${lightCensus.shadowCasters}${over.length ? `  OVER BUDGET (UNVERIFIED): ${over.join(", ")}` : ""}`);
  }
  if (flags.has("hero")) {
    lines.push(`hero    p=${s.heroProgress.toFixed(3)}  beat ${s.heroBeat}  shot ${s.heroShot}  energy ${s.heroStage}`);
    lines.push(`hero    meshes ${s.heroObjects}  instances ${s.heroInstances}  particles ${s.particleCount}  bloom x${s.heroBloom.toFixed(2)}`);
    lines.push(`post    ${s.postState}`);
  }
  if (flags.has("camera")) {
    lines.push(`cam pos ${v(s.cameraPosition)}`);
    lines.push(`cam dir ${v(s.cameraDirection)}`);
  }
  return lines.join("\n");
}
