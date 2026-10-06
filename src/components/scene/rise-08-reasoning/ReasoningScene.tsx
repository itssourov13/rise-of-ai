"use client";

import { useMemo } from "react";
import type { SceneProps } from "@/components/scene/scene-definitions";
import { NetworkField } from "@/components/scene/shared/NetworkField";
import { PointField } from "@/components/scene/shared/PointField";
import { useSceneWorld } from "@/components/scene/shared/useSceneWorld";
import { decisionTree, sphereCloud } from "@/lib/three/data/generators";
import { reasoningState as s } from "./reasoning-spec";

/** Sparse tree with one highlighted path; distant external structures (sparse points) appear at the end. Low motion by design. */
export default function ReasoningScene({ active }: SceneProps) {
  useSceneWorld(active, { environment: { kind: "none" }, atmosphere: null });
  const graph = useMemo(() => decisionTree(6, 9, 20, 801), []);
  const far = useMemo(() => sphereCloud(260, 802, 14, 0.4, [92, 0, 0]), []);
  return (
    <group>
      <NetworkField
        graph={graph}
        colorBase="#4d86c4"
        colorPulse="#ffe6bd"
        nodeSize={0.55}
        active={active}
        updateEdges={(u) => {
          u.uLevel.value = s.reveal * (1 - 0.7 * s.handoff);
          u.uFront.value = s.front;
          u.uHiOnly.value = s.hi * 0.85;
          u.uBase.value = 0.3;
          u.uFlowSpeed.value = 0.12;
        }}
        updateNodes={(u) => {
          u.uFront.value = s.front;
          u.uVisible.value = s.reveal;
          u.uOpacity.value = 0.9 * (1 - 0.7 * s.handoff);
        }}
      />
      <PointField
        a={far}
        seed={803}
        colorA="#6a98c8"
        colorB="#ffe0b8"
        size={0.3}
        active={active}
        update={(u) => {
          u.uVisible.value = s.ext;
          u.uOpacity.value = 0.8 * s.ext;
          u.uSpeed.value = 0.15;
          u.uFlow.value = 0.15;
        }}
      />
    </group>
  );
}
