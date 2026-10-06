/**
 * Frame-loop policy. R3F modes: "always" (continuous), "demand" (render on invalidate), "never".
 * Default is "demand"; anything that animates by itself acquires continuous rendering through the
 * engine store (acquireContinuous) and releases it when done. "never" is for explicit pause.
 */
export type FrameloopMode = "always" | "demand" | "never";

export function resolveFrameloop(input: { continuousRequests: number; paused?: boolean }): FrameloopMode {
  if (input.paused) return "never";
  return input.continuousRequests > 0 ? "always" : "demand";
}
