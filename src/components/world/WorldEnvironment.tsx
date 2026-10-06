"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { PMREMGenerator, type WebGLRenderTarget } from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { useEngineStore } from "@/state/engine-store";

/**
 * Owns scene.environment. Prefilters the chosen source with PMREMGenerator (roughness-aware IBL) and
 * disposes ONLY what it generated (the PMREM target + generator). A source texture belongs to its loader.
 * NOT RUNTIME VERIFIED (RoomEnvironment/PMREM API surface checked from memory against r18x, not installed).
 */
export function WorldEnvironment() {
  const source = useEngineStore((s) => s.environment);
  const gl = useThree((s) => s.gl);
  const get = useThree((s) => s.get);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    const scene = get().scene;
    if (source.kind === "none") {
      scene.environment = null;
      invalidate();
      return;
    }
    const pmrem = new PMREMGenerator(gl);
    let target: WebGLRenderTarget;
    let room: RoomEnvironment | undefined;
    if (source.kind === "procedural-room") {
      room = new RoomEnvironment();
      target = pmrem.fromScene(room, 0.04);
    } else {
      target = pmrem.fromEquirectangular(source.texture);
    }
    scene.environment = target.texture;
    invalidate();
    return () => {
      if (scene.environment === target.texture) scene.environment = null;
      target.dispose();
      pmrem.dispose();
      room?.dispose();
      invalidate();
    };
  }, [source, gl, get, invalidate]);

  return null;
}
