import { PCFShadowMap, type ColorSpace, type ToneMapping, type WebGLRenderer } from "three";
import type { CanvasProps } from "@react-three/fiber";
import type { QualityProfile } from "@/lib/performance/quality";
import { createRenderControls, type RenderControls } from "@/lib/performance/render-controls";
import { BASE_EXPOSURE, EXPOSURE_SCALE_RANGE, OUTPUT_COLOR_SPACE, TONE_MAPPING } from "./color-policy";

export interface RendererPolicy {
  toneMapping: ToneMapping;
  baseExposure: number;
  outputColorSpace: ColorSpace;
}

export interface RendererConfig {
  /** Props handed to the single persistent <Canvas>. */
  canvas: Pick<CanvasProps, "dpr" | "gl" | "shadows">;
  /** Applied imperatively to the renderer after creation (RendererPolicy component). */
  policy: RendererPolicy;
  controls: RenderControls;
}

/**
 * WebGL renderer policy (three r186 is WebGL 2 only).
 *  - alpha:false  -> opaque canvas; the world owns the background.
 *  - stencil:false -> saves memory; revisit if a future effect needs stencil (UNVERIFIED need).
 *  - logarithmicDepthBuffer:false -> deliberately OFF. It disables early-z via gl_FragDepth and costs
 *    performance. Large worlds use local coordinate domains instead (docs/3D_ENGINE.md).
 *  - shadows: PCFShadowMap only when the tier enables them; light-level opt-in is separate.
 *  - antialias is fixed at context creation.
 */
export function createRendererConfig(profile: QualityProfile): RendererConfig {
  const controls = createRenderControls(profile);
  return {
    canvas: {
      dpr: [controls.dpr[0], controls.dpr[1]],
      gl: {
        antialias: controls.antialias,
        alpha: false,
        depth: true,
        stencil: false,
        logarithmicDepthBuffer: false,
        powerPreference: "high-performance",
      },
      shadows: controls.shadows.enabled ? { enabled: true, type: PCFShadowMap } : false,
    },
    policy: { toneMapping: TONE_MAPPING, baseExposure: BASE_EXPOSURE, outputColorSpace: OUTPUT_COLOR_SPACE },
    controls,
  };
}

/** Imperative part of the policy. Called only by components/engine/RendererPolicy.tsx. */
export function applyRendererPolicy(renderer: WebGLRenderer, config: RendererConfig, exposureScale: number): void {
  const [min, max] = EXPOSURE_SCALE_RANGE;
  renderer.outputColorSpace = config.policy.outputColorSpace;
  renderer.toneMapping = config.policy.toneMapping;
  renderer.toneMappingExposure = config.policy.baseExposure * Math.min(max, Math.max(min, exposureScale));
}
