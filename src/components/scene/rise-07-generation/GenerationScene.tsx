"use client";

import { useMemo } from "react";
import type { SceneProps } from "@/components/scene/scene-definitions";
import { PointField } from "@/components/scene/shared/PointField";
import { useDensityCount } from "@/components/scene/shared/useDensityCount";
import { useSceneWorld } from "@/components/scene/shared/useSceneWorld";
import { sphereCloud, torusKnot } from "@/lib/three/data/generators";
import { generationState as s } from "./generation-spec";

const COUNTS = { off: 0, low: 4000, medium: 7000, high: 10000, ultra: 14000 } as const;

/** Noise -> form in 8 discrete denoising steps (uQuant) on the shared point field; a torus-knot surface is the generated form. */
export default function GenerationScene({ active }: SceneProps) {
  const reduced = useSceneWorld(active, { environment: { kind: "none" }, atmosphere: null });
  const count = useDensityCount(COUNTS);
  const data = useMemo(() => ({ a: sphereCloud(count, 701, 34, 1), b: torusKnot(count, 702, 12, 2.6) }), [count]);
  return (
    <PointField
      {...data}
      seed={703}
      colorA="#7aa8d6"
      colorB="#ffd8a8"
      size={0.15}
      active={active}
      update={(u) => {
        u.uQuant.value = 8;
        u.uMix.value = s.mix;
        u.uFlow.value = s.flow;
        u.uVisible.value = s.reveal;
        u.uSpeed.value = reduced ? 0.1 : 0.5;
        u.uOpacity.value = 0.95 * (1 - 0.3 * s.handoff);
      }}
    />
  );
}
