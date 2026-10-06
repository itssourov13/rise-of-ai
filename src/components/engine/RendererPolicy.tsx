"use client";

import { useEffect, useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import { activeBackend } from "@/lib/three/renderer-backend";
import type { RendererConfig } from "@/lib/three/renderer/webgl-config";
import { useEngineStore } from "@/state/engine-store";

/**
 * Renderer layer owner (imperative half). Applies output color space / tone mapping / exposure and owns
 * the WebGL context-loss listeners. Resize and DPR are handled by R3F's Canvas (ResizeObserver on its
 * container + the `dpr` prop from the same RendererConfig); no other resize listeners exist for the canvas.
 */
export function RendererPolicy({ config }: { config: RendererConfig }) {
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  const exposureScale = useEngineStore((s) => s.exposureScale);

  useLayoutEffect(() => {
    activeBackend.applyPolicy(gl, config, exposureScale);
    invalidate();
  }, [gl, config, exposureScale, invalidate]);

  useEffect(() => {
    const canvas = gl.domElement;
    const onLost = (event: Event) => {
      // preventDefault lets the browser attempt a restore; three re-creates GPU resources on restore.
      event.preventDefault();
      console.warn("[renderer] WebGL context lost; waiting for restore");
    };
    const onRestored = () => {
      console.warn("[renderer] WebGL context restored");
      invalidate();
    };
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);
    return () => {
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
    };
  }, [gl, invalidate]);

  return null;
}
