import type { LoadingManager, WebGLRenderer } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

/**
 * glTF loading path. Draco and KTX2 support are OPT-IN and loaded lazily, so a plain GLB pays for
 * neither. Decoder/transcoder files are static assets that must be served by the app, e.g. copied
 * from three's examples/jsm/libs/{draco/gltf,basis} into public/experience/decoders/ by the human
 * (not done in Phase 03; no files were copied or downloaded).
 *
 * Capability: KTX2Loader.detectSupport(renderer) picks a GPU-compressed format for THIS device, so do not
 * assume every device supports every format. Meshopt is not wired (future, if assets use it).
 * NOT RUNTIME VERIFIED.
 */
export interface GltfLoaderOptions {
  manager: LoadingManager;
  draco?: { decoderPath: string };
  ktx2?: { transcoderPath: string; renderer: WebGLRenderer };
}

export interface GltfLoaderHandle {
  loader: GLTFLoader;
  /** Releases decoder workers/transcoder resources. Call when the loader is replaced or the engine tears down. */
  dispose(): void;
}

export async function createGltfLoader(options: GltfLoaderOptions): Promise<GltfLoaderHandle> {
  const loader = new GLTFLoader(options.manager);
  const disposers: Array<() => void> = [];

  if (options.draco) {
    const { DRACOLoader } = await import("three/addons/loaders/DRACOLoader.js");
    const draco = new DRACOLoader(options.manager);
    draco.setDecoderPath(options.draco.decoderPath);
    loader.setDRACOLoader(draco);
    disposers.push(() => draco.dispose());
  }

  if (options.ktx2) {
    const { KTX2Loader } = await import("three/addons/loaders/KTX2Loader.js");
    const ktx2 = new KTX2Loader(options.manager);
    ktx2.setTranscoderPath(options.ktx2.transcoderPath);
    ktx2.detectSupport(options.ktx2.renderer);
    loader.setKTX2Loader(ktx2);
    disposers.push(() => ktx2.dispose());
  }

  return { loader, dispose: () => disposers.forEach((d) => d()) };
}
