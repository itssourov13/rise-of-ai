"use client";

import type { DebugFlag } from "@/lib/three/diagnostics/debug-flags";

/** DEV ONLY in-canvas helpers (axes, coarse 10 m grid). Target markers / bounding boxes are not implemented. */
export function DebugHelpers({ flags }: { flags: ReadonlySet<DebugFlag> }) {
  return (
    <>
      {flags.has("axes") && <axesHelper args={[2]} />}
      {flags.has("grid") && <gridHelper args={[100, 10, "#3a4656", "#222a34"]} position={[0, -0.002, 0]} />}
    </>
  );
}
