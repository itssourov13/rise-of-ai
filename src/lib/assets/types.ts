import type { QualityTier } from "@/lib/performance/quality";

export type AssetId = string;
/** `environment` replaces Phase 02's `hdr` (nothing referenced it; registry was empty). */
export type AssetKind = "model" | "texture" | "environment" | "image" | "audio" | "shader" | "font";
/** Load ORDER hint. Not the same as criticality. */
export type AssetPriority = "critical" | "high" | "normal" | "low";
/**
 * Failure policy. critical: failure activates the owning scene's fallback.
 * optional: failure degrades gracefully (scene renders without it).
 */
export type AssetCriticality = "critical" | "optional";
export type AssetLoadStatus = "idle" | "loading" | "loaded" | "error";
export type LodLevel = "high" | "medium" | "low";

/** What a texture MEANS; decides its color space. There is deliberately no default. */
export type TextureRole = "color" | "emissive" | "normal" | "roughness" | "metalness" | "ao" | "data";

/** Paths are relative to the asset base URL (see resolve.ts). A tier variant overrides `default`. */
export type AssetSource = string | ({ default: string } & Partial<Record<QualityTier, string>>);

export interface AssetDefinition {
  id: AssetId;
  kind: AssetKind;
  priority: AssetPriority;
  criticality: AssetCriticality;
  src: AssetSource;
  /** Optional distance-detail variants; selected via resolveAssetUrl(..., { lod }). */
  lods?: Partial<Record<LodLevel, string>>;
  /** Required for kind "texture". */
  textureRole?: TextureRole;
  /** Row ID in docs/ASSET_MANIFEST.md (source/license tracking lives there). */
  manifestId?: string;
}
