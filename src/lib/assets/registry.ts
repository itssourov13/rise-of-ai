import type { AssetDefinition, AssetId } from "./types";

/**
 * Asset registry. Scene code references asset IDs, never raw paths.
 * Intentionally EMPTY in Phase 02: no assets exist. Add an entry only when a real file exists in
 * public/experience/ (or a documented remote host) and its row in ASSET_MANIFEST.md is updated.
 */
const definitions: readonly AssetDefinition[] = [];

export const assetRegistry: ReadonlyMap<AssetId, AssetDefinition> = new Map(
  definitions.map((d) => [d.id, d]),
);
