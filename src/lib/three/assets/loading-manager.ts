import { LoadingManager } from "three";

/**
 * The single shared THREE.LoadingManager. All engine loaders receive it, so loading state is tracked
 * centrally from real loader events (no fake percentages).
 *
 * Semantics (three.js): counters are cumulative for the page lifetime; a failed item is reported via
 * onError and ALSO counts as settled, so completed = settled - failed. Byte-level progress is not available
 * from LoadingManager. It does not support cancellation (documented limitation; AbortController-based
 * loading would need FileLoader changes and is a future track).
 */
export interface LoadingSnapshot {
  requested: number;
  completed: number;
  failed: readonly string[];
  isLoading: boolean;
}

const failed = new Set<string>();
let snapshot: LoadingSnapshot = { requested: 0, completed: 0, failed: [], isLoading: false };
const listeners = new Set<() => void>();

function publish(settled: number, total: number, isLoading: boolean): void {
  snapshot = { requested: total, completed: settled - failed.size, failed: [...failed], isLoading };
  listeners.forEach((l) => l());
}

export const assetLoadingManager = new LoadingManager();
assetLoadingManager.onStart = (_url, settled, total) => publish(settled, total, true);
assetLoadingManager.onProgress = (_url, settled, total) => publish(settled, total, true);
assetLoadingManager.onLoad = () => publish(snapshot.requested, snapshot.requested, false);
assetLoadingManager.onError = (url) => {
  failed.add(url);
  publish(snapshot.completed + failed.size, snapshot.requested, true);
};

/** useSyncExternalStore-compatible. Snapshot identity changes only when state changes. */
export const getLoadingSnapshot = (): LoadingSnapshot => snapshot;
export function subscribeLoading(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
