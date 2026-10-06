/**
 * Development-only debug mode. Controlled by URL query, e.g. ?debug=all or ?debug=stats,axes ;
 * ?calibration=off hides the calibration world. In production builds this always returns "off"
 * (NODE_ENV is inlined, so the branches below are removed from the production bundle).
 * Hero scrub debugger (Phase 04): ?hero=0.62 freezes the Hero timeline at that normalized progress
 * (scroll scrub detached); ?debug=hero shows progress/beat/shot/energy/post values in the overlay.
 * In dev the console also exposes window.__rise.seek(p) / window.__rise.release().
 * Browser-only: call from client components after mount.
 */
export type DebugFlag = "axes" | "grid" | "camera" | "scene" | "quality" | "stats" | "hero";

const ALL_FLAGS: readonly DebugFlag[] = ["axes", "grid", "camera", "scene", "quality", "stats", "hero"];

export interface DebugConfig {
  enabled: boolean;
  flags: ReadonlySet<DebugFlag>;
  /** Show the procedural calibration world (dev only; not a production scene). */
  calibration: boolean;
  /** Development only: freeze the Hero at this normalized progress. null = normal scroll-driven. */
  heroSeek: number | null;
}

const OFF: DebugConfig = { enabled: false, flags: new Set(), calibration: false, heroSeek: null };

export function readDebugConfig(): DebugConfig {
  if (process.env.NODE_ENV === "production") return OFF;
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("debug");
  const flags = new Set<DebugFlag>();
  if (raw) {
    if (raw === "1" || raw === "true" || raw === "all") ALL_FLAGS.forEach((f) => flags.add(f));
    else raw.split(",").forEach((f) => ALL_FLAGS.includes(f as DebugFlag) && flags.add(f as DebugFlag));
  }
  const seekRaw = params.get("hero");
  const seek = seekRaw !== null && seekRaw !== "" && Number.isFinite(Number(seekRaw)) ? Math.min(1, Math.max(0, Number(seekRaw))) : null;
  return { enabled: flags.size > 0, flags, calibration: params.get("calibration") !== "off", heroSeek: seek };
}
