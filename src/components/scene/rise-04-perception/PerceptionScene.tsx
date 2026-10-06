"use client";

import { useMemo } from "react";
import type { SceneProps } from "@/components/scene/scene-definitions";
import { PointField } from "@/components/scene/shared/PointField";
import { useDensityCount } from "@/components/scene/shared/useDensityCount";
import { useSceneWorld } from "@/components/scene/shared/useSceneWorld";
import { layerSheets, perceivedWorld } from "@/lib/three/data/generators";
import { perceptionState as s } from "./perception-spec";

const COUNTS = { off: 0, low: 4000, medium: 7000, high: 11000, ultra: 15000 } as const;

/** Point-cloud perception: scanning sweep reveals the world; depth colouring; ends reorganizing into layered sheets. */
export default function PerceptionScene({ active }: SceneProps) {
  const reduced = useSceneWorld(active, { environment: { kind: "none" }, atmosphere: null });
  const count = useDensityCount(COUNTS);
  const data = useMemo(() => ({ a: perceivedWorld(count, 401, 40), b: layerSheets(count, 402, 5, 22, 14, 9) }), [count]);
  return (
    <PointField
      {...data}
      seed={403}
      colorA="#5aa6ff"
      colorB="#ffd9a0"
      size={0.14}
      active={active}
      update={(u) => {
        u.uSweepOn.value = 1;
        u.uSweepAxis.value = [0, 0, -1];
        u.uSweep.value = s.sweep * 90;
        u.uSweepWidth.value = 3.5;
        u.uDepthColor.value = 1;
        u.uNear.value = 4;
        u.uFar.value = 95;
        u.uMix.value = s.mix;
        u.uFlow.value = reduced ? 0 : 0.12;
        u.uVisible.value = s.visible;
        u.uOpacity.value = 1 - 0.85 * s.handoff;
      }}
    />
  );
}
