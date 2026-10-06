import { publicEnv } from "@/lib/config/env";
import type { QualityTier } from "@/lib/performance/quality";
import { assetRegistry } from "./registry";
import type { AssetDefinition, AssetId, LodLevel } from "./types";

const BASE = (publicEnv.assetBaseUrl ?? "/experience").replace(/\/+$/, "");

export function getAssetDefinition(id: AssetId): AssetDefinition | undefined {
  return assetRegistry.get(id);
}

/**
 * Asset ID -> registry metadata -> resolved runtime URL. Returns undefined for unknown IDs so callers
 * can degrade (a missing asset must never break the narrative). Scene code never builds paths itself,
 * so replacing a GLB, adding a mobile variant/LOD, or moving to a CDN is a registry/env change only.
 */
export function resolveAssetUrl(id: AssetId, tier: QualityTier, options?: { lod?: LodLevel }): string | undefined {
  const def = assetRegistry.get(id);
  if (!def) return undefined;
  const lodPath = options?.lod ? def.lods?.[options.lod] : undefined;
  const path = lodPath ?? (typeof def.src === "string" ? def.src : (def.src[tier] ?? def.src.default));
  return `${BASE}/${path.replace(/^\/+/, "")}`;
}
