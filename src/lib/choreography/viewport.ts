/**
 * Viewport class used for CAMERA FRAMING (not for render cost: quality tiers govern that).
 * Pure function, server-safe. Thresholds are design choices, not measured (UNVERIFIED on real devices).
 */
export type ViewportClass = "desktop" | "tablet" | "mobile";

export function classifyViewport(width: number, height: number): ViewportClass {
  if (width < 768 || (height > width && width < 900)) return "mobile";
  if (width < 1100 || height > width) return "tablet";
  return "desktop";
}
