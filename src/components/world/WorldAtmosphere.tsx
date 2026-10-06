"use client";

import { DEFAULT_ATMOSPHERE } from "@/lib/three/world/atmosphere";
import { useEngineStore } from "@/state/engine-store";

/** Applies scene.fog from the atmosphere config (scene override > world default). Distance fog only. */
export function WorldAtmosphere() {
  const override = useEngineStore((s) => s.atmosphere);
  const atmosphere = override ?? DEFAULT_ATMOSPHERE;
  switch (atmosphere.kind) {
    case "linear":
      return <fog key="linear" attach="fog" args={[atmosphere.color, atmosphere.near, atmosphere.far]} />;
    case "exp2":
      return <fogExp2 key="exp2" attach="fog" args={[atmosphere.color, atmosphere.density]} />;
    default:
      return null;
  }
}
