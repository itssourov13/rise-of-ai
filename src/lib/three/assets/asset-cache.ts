import { TextureLoader, type Texture, type WebGLRenderer } from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";
import { getAssetDefinition, resolveAssetUrl } from "@/lib/assets/resolve";
import type { AssetDefinition, AssetId, LodLevel } from "@/lib/assets/types";
import type { QualityTier } from "@/lib/performance/quality";
import { colorSpaceForTextureRole } from "@/lib/three/renderer/color-policy";
import { disposeObject3D } from "@/lib/three/lifecycle/dispose";
import { createGltfLoader, type GltfLoaderHandle, type GltfLoaderOptions } from "./gltf-loader";
import { assetLoadingManager } from "./loading-manager";

/**
 * Shared, reference-counted asset cache. Lifecycle: load -> use -> retain if shared -> release -> dispose
 * when the last reference is released. The cache OWNS what it loads; consumers must not dispose it.
 * Model payloads are shared: consumers mount `gltf.scene.clone()` (clones share geometry/materials).
 *
 * Loaders implemented: model (glTF), texture. Other kinds reject with "unsupported-kind" until a
 * phase needs them. NOT RUNTIME VERIFIED (no asset exists yet, nothing has been loaded).
 */
export type AssetPayload = { kind: "model"; gltf: GLTF } | { kind: "texture"; texture: Texture };

export type AssetErrorCode = "unknown-asset" | "unsupported-kind" | "missing-texture-role" | "load-failed";

export class AssetError extends Error {
  readonly code: AssetErrorCode;
  readonly assetId: AssetId;
  /** True when the registry marks the asset critical: the owning scene should use its fallback. */
  readonly critical: boolean;
  constructor(code: AssetErrorCode, assetId: AssetId, critical: boolean, message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "AssetError";
    this.code = code;
    this.assetId = assetId;
    this.critical = critical;
  }
}

export interface AssetContext {
  tier: QualityTier;
  lod?: LodLevel;
  /** Needed only for KTX2 transcoder capability detection. */
  renderer?: WebGLRenderer;
  /** Opt-in compression support (see gltf-loader.ts). Omitted -> plain GLB/glTF only. */
  decoders?: { draco?: GltfLoaderOptions["draco"]; ktx2?: { transcoderPath: string } };
}

export interface AssetHandle {
  readonly id: AssetId;
  readonly payload: AssetPayload;
  /** Idempotent. Drops this reference; the last release disposes unless the asset is retained. */
  release(): void;
}

export type AssetResult = { ok: true; handle: AssetHandle } | { ok: false; error: AssetError };

interface Entry {
  promise: Promise<AssetPayload>;
  refs: number;
  retain: boolean;
}

const entries = new Map<string, Entry>();
let gltfHandle: { renderer: WebGLRenderer | undefined; handle: Promise<GltfLoaderHandle> } | null = null;

function getGltfLoader(ctx: AssetContext): Promise<GltfLoaderHandle> {
  if (!gltfHandle || gltfHandle.renderer !== ctx.renderer) {
    void gltfHandle?.handle.then((h) => h.dispose());
    const ktx2 = ctx.decoders?.ktx2;
    gltfHandle = {
      renderer: ctx.renderer,
      handle: createGltfLoader({
        manager: assetLoadingManager,
        draco: ctx.decoders?.draco,
        ktx2: ktx2 && ctx.renderer ? { transcoderPath: ktx2.transcoderPath, renderer: ctx.renderer } : undefined,
      }),
    };
  }
  return gltfHandle.handle;
}

async function loadPayload(def: AssetDefinition, url: string, ctx: AssetContext): Promise<AssetPayload> {
  const critical = def.criticality === "critical";
  try {
    switch (def.kind) {
      case "model": {
        const { loader } = await getGltfLoader(ctx);
        return { kind: "model", gltf: await loader.loadAsync(url) };
      }
      case "texture": {
        if (!def.textureRole) {
          throw new AssetError("missing-texture-role", def.id, critical, `Texture asset "${def.id}" needs a textureRole (no default color space).`);
        }
        const texture = await new TextureLoader(assetLoadingManager).loadAsync(url);
        texture.colorSpace = colorSpaceForTextureRole(def.textureRole);
        return { kind: "texture", texture };
      }
      default:
        throw new AssetError("unsupported-kind", def.id, critical, `No loader implemented for asset kind "${def.kind}".`);
    }
  } catch (e) {
    if (e instanceof AssetError) throw e;
    throw new AssetError("load-failed", def.id, critical, `Failed to load asset "${def.id}" (${url}).`, e);
  }
}

function disposePayload(payload: AssetPayload): void {
  if (payload.kind === "model") disposeObject3D(payload.gltf.scene, { textures: true });
  else payload.texture.dispose();
}

/**
 * Requests an asset by ID. Never throws: failures return { ok:false, error } and the caller decides
 * using error.critical (critical -> scene fallback, optional -> render without it). Failures are logged
 * in development; they are never silently swallowed.
 */
export async function requestAsset(id: AssetId, ctx: AssetContext, options: { retain?: boolean } = {}): Promise<AssetResult> {
  const def = getAssetDefinition(id);
  const url = def ? resolveAssetUrl(id, ctx.tier, { lod: ctx.lod }) : undefined;
  if (!def || !url) {
    const error = new AssetError("unknown-asset", id, false, `Unknown asset ID "${id}" (not in the asset registry).`);
    if (process.env.NODE_ENV !== "production") console.warn("[assets]", error.message);
    return { ok: false, error };
  }

  const key = `${id}|${url}`;
  let entry = entries.get(key);
  if (!entry) {
    entry = { promise: loadPayload(def, url, ctx), refs: 0, retain: false };
    entries.set(key, entry);
  }
  entry.refs += 1;
  if (options.retain) entry.retain = true;
  const mine = entry;

  try {
    const payload = await mine.promise;
    let released = false;
    return {
      ok: true,
      handle: {
        id,
        payload,
        release() {
          if (released) return;
          released = true;
          mine.refs -= 1;
          if (mine.refs <= 0 && !mine.retain && entries.get(key) === mine) {
            entries.delete(key);
            disposePayload(payload);
          }
        },
      },
    };
  } catch (e) {
    if (entries.get(key) === mine) entries.delete(key);
    const error = e instanceof AssetError ? e : new AssetError("load-failed", id, def.criticality === "critical", `Failed to load asset "${id}".`, e);
    if (process.env.NODE_ENV !== "production") console.warn("[assets]", error.message, error.cause);
    return { ok: false, error };
  }
}

/** Disposes retained assets that no longer have references. */
export function purgeUnreferencedAssets(): void {
  for (const [key, entry] of entries) {
    if (entry.refs <= 0) {
      entries.delete(key);
      void entry.promise.then(disposePayload, () => undefined);
    }
  }
}

/** Engine teardown: releases decoder resources. Does not dispose cached assets. */
export function resetAssetLoaders(): void {
  void gltfHandle?.handle.then((h) => h.dispose());
  gltfHandle = null;
}

export const getAssetCacheStats = (): { entries: number; references: number } => ({
  entries: entries.size,
  references: [...entries.values()].reduce((n, e) => n + e.refs, 0),
});
