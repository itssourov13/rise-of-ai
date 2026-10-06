"use client";

import { useMemo } from "react";
import type { SceneProps } from "@/components/scene/scene-definitions";
import { PointField } from "@/components/scene/shared/PointField";
import { useDensityCount } from "@/components/scene/shared/useDensityCount";
import { useSceneWorld } from "@/components/scene/shared/useSceneWorld";
import { boxCloud, waveSheets } from "@/lib/three/data/generators";
import { computationState as s } from "./computation-spec";

const COUNTS = { off: 0, low: 2500, medium: 4500, high: 7000, ultra: 9000 } as const;

/** Numbers -> patterns: one shared GPU point field morphing a noise cloud into layered wave sheets. */
export default function ComputationScene({ active }: SceneProps) {
  const reduced = useSceneWorld(active, { environment: { kind: "none" }, atmosphere: null });
  const count = useDensityCount(COUNTS);
  const data = useMemo(() => ({ a: boxCloud(count, 301, [38, 22, 38]), b: waveSheets(count, 302, 34, 4, 3.5) }), [count]);
  return (
    <PointField
      {...data}
      seed={303}
      colorA="#6fa8d8"
      colorB="#ffc07a"
      size={0.2}
      active={active}
      update={(u) => {
        u.uMix.value = s.mix;
        u.uFlow.value = s.flow;
        u.uVisible.value = s.reveal;
        u.uSpeed.value = reduced ? 0.1 : 0.6;
        u.uOpacity.value = 0.9 * (1 - 0.85 * s.handoff);
      }}
    />
  );
}
