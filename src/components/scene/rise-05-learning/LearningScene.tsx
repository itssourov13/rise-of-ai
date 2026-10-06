"use client";

import { useMemo } from "react";
import type { SceneProps } from "@/components/scene/scene-definitions";
import { NetworkField } from "@/components/scene/shared/NetworkField";
import { useSceneWorld } from "@/components/scene/shared/useSceneWorld";
import { layeredGraph } from "@/lib/three/data/generators";
import { learningState as s } from "./learning-spec";

/** Layered network (6-10-10-8-4): nodes light layer by layer as forward passes travel; weights (edge base level) grow. */
export default function LearningScene({ active }: SceneProps) {
  useSceneWorld(active, { environment: { kind: "none" }, atmosphere: null });
  const graph = useMemo(() => layeredGraph([6, 10, 10, 8, 4], 14, 3.4, 501), []);
  return (
    <NetworkField
      graph={graph}
      colorBase="#4f8fd0"
      colorPulse="#ffe0b0"
      nodeSize={0.75}
      active={active}
      updateEdges={(u) => {
        u.uLevel.value = s.reveal * (1 - 0.85 * s.handoff);
        u.uFront.value = s.front * 1.3;
        u.uBase.value = 0.12 + 0.5 * s.weights;
        u.uFlowSpeed.value = 0.35;
      }}
      updateNodes={(u) => {
        u.uFront.value = s.front * 1.3 + (s.weights > 0.95 ? 0.3 : 0);
        u.uVisible.value = s.reveal;
        u.uOpacity.value = 1.1 * (1 - 0.85 * s.handoff);
      }}
    />
  );
}
