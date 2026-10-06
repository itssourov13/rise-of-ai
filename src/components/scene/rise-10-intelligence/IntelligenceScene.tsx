"use client";

import { useMemo } from "react";
import type { SceneProps } from "@/components/scene/scene-definitions";
import { NetworkField } from "@/components/scene/shared/NetworkField";
import { PointField } from "@/components/scene/shared/PointField";
import { useDensityCount } from "@/components/scene/shared/useDensityCount";
import { useSceneWorld } from "@/components/scene/shared/useSceneWorld";
import { organicGraph, sphereCloud } from "@/lib/three/data/generators";
import { intelligenceState as s } from "./intelligence-spec";

const NODES = { off: 0, low: 350, medium: 700, high: 1200, ultra: 1800 } as const;
const DUST = { off: 0, low: 200, medium: 350, high: 500, ultra: 700 } as const;

/** Largest scene: organic network (radial layers; activation front sweeps outward) + faint dust for atmospheric depth. */
export default function IntelligenceScene({ active }: SceneProps) {
  useSceneWorld(active, { environment: { kind: "none" }, atmosphere: null });
  const nodeCount = useDensityCount(NODES);
  const dustCount = useDensityCount(DUST);
  const graph = useMemo(() => organicGraph(Math.max(60, nodeCount), 2, 30, 1001), [nodeCount]);
  const dust = useMemo(() => sphereCloud(dustCount, 1002, 90, 1), [dustCount]);
  return (
    <group>
      <NetworkField
        graph={graph}
        colorBase="#4a82c0"
        colorPulse="#ffe2b8"
        nodeSize={0.45}
        active={active}
        updateEdges={(u) => {
          u.uLevel.value = s.reveal * (1 - 0.6 * s.handoff);
          u.uFront.value = s.front * 1.3;
          u.uBase.value = 0.16;
          u.uFlowSpeed.value = 0.3;
        }}
        updateNodes={(u) => {
          u.uFront.value = s.front * 1.3;
          u.uVisible.value = s.reveal;
          u.uOpacity.value = 0.9 * (1 - 0.6 * s.handoff);
        }}
        seed={1003}
      />
      <PointField
        a={dust}
        seed={1004}
        colorA="#5f86b0"
        colorB="#9fb8d6"
        size={0.2}
        active={active}
        update={(u) => {
          u.uOpacity.value = 0.35 * s.dust;
          u.uSpeed.value = 0.2;
          u.uFlow.value = 0.6;
        }}
      />
    </group>
  );
}
