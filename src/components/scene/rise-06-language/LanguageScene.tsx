"use client";

import { useMemo } from "react";
import type { SceneProps } from "@/components/scene/scene-definitions";
import { PointField } from "@/components/scene/shared/PointField";
import { useDensityCount } from "@/components/scene/shared/useDensityCount";
import { useSceneWorld } from "@/components/scene/shared/useSceneWorld";
import { clusterCloud, sampleText } from "@/lib/three/data/generators";
import { languageState as s } from "./language-spec";

const COUNTS = { off: 0, low: 3000, medium: 5500, high: 8000, ultra: 11000 } as const;
const CENTRES: [number, number, number][] = [[-22, 8, 0], [-8, -10, 6], [8, 9, -4], [22, -6, 4], [0, 0, -12], [-30, -8, -6]];

/** Text-to-particle: the word is rasterized once on a canvas (system font, no download) and sampled into targets. */
export default function LanguageScene({ active }: SceneProps) {
  const reduced = useSceneWorld(active, { environment: { kind: "none" }, atmosphere: null });
  const count = useDensityCount(COUNTS);
  const data = useMemo(() => ({ a: clusterCloud(count, 601, CENTRES, 9), b: sampleText("LANGUAGE", count, 602, 19, 3) }), [count]);
  return (
    <PointField
      {...data}
      seed={603}
      colorA="#7fb2e6"
      colorB="#fff0d6"
      size={0.17}
      active={active}
      update={(u) => {
        u.uMix.value = s.mix;
        u.uFlow.value = s.flow;
        u.uVisible.value = s.reveal;
        u.uSpeed.value = reduced ? 0.1 : 0.5;
        u.uOpacity.value = 0.95 * (1 - 0.5 * s.handoff);
      }}
    />
  );
}
