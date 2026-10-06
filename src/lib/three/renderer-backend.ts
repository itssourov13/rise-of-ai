import type { WebGLRenderer } from "three";
import type { QualityProfile } from "@/lib/performance/quality";
import { applyRendererPolicy, createRendererConfig, type RendererConfig } from "./renderer/webgl-config";

export type RendererBackendId = "webgl" | "webgpu";

/**
 * Renderer boundary. Scene/narrative/camera/choreography code must not import renderer-specific
 * code. Renderer-specific materials and post-processing live behind factories/adapters.
 * WebGPU is NOT implemented or initialised; do not assume GLSL ShaderMaterial paths work under it.
 * (`applyPolicy` takes a WebGLRenderer today; a WebGPU backend would widen this type in its own track.)
 */
export interface RendererBackend {
  id: RendererBackendId;
  createConfig(profile: QualityProfile): RendererConfig;
  applyPolicy(renderer: WebGLRenderer, config: RendererConfig, exposureScale: number): void;
}

export const webglBackend: RendererBackend = {
  id: "webgl",
  createConfig: createRendererConfig,
  applyPolicy: applyRendererPolicy,
};

export const activeBackend: RendererBackend = webglBackend;
