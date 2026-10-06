"use client";

import { useMemo } from "react";
import type { SceneProps } from "@/components/scene/scene-definitions";
import { PointField } from "@/components/scene/shared/PointField";
import { useDensityCount } from "@/components/scene/shared/useDensityCount";
import { useSceneWorld } from "@/components/scene/shared/useSceneWorld";
import { sphereCloud } from "@/lib/three/data/generators";
import { unknownState as s } from "./unknown-spec";

const COUNTS = { off: 0, low: 150, medium: 250, high: 350, ultra: 450 } as const;
const GLIMMER = new Float32Array([0, 10, -130]);

/** Final scene: sparse drifting points and one distant light. Almost nothing, on purpose. */
export default function UnknownScene({ active }: SceneProps) {
  const reduced = useSceneWorld(active, { environment: { kind: "none" }, atmosphere: null });
  const count = useDensityCount(COUNTS);
  const dust = useMemo(() => sphereCloud(count, 1101, 100, 1), [count]);
  return (
    <group>
      <PointField
        a={dust}
        seed={1102}
        colorA="#5d7ea6"
        colorB="#a9c0dc"
        size={0.22}
        active={active}
        update={(u) => {
          u.uOpacity.value = 0.55 * s.reveal;
          u.uSpeed.value = reduced ? 0.05 : 0.15;
          u.uFlow.value = 0.8;
        }}
      />
      <PointField
        a={GLIMMER}
        seed={1103}
        colorA="#cfe4ff"
        colorB="#ffffff"
        size={2.2}
        active={active}
        update={(u) => {
          u.uVisible.value = 1.01;
          u.uOpacity.value = 0.85 * s.glimmer;
          u.uMaxSize.value = 22;
        }}
        renderOrder={6}
      />
    </group>
  );
}
