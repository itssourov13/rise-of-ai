"use client";

import { useLayoutEffect, useRef } from "react";
import type { Group, InstancedMesh, Mesh } from "three";
import { diagnosticsSnapshot } from "@/lib/three/diagnostics/snapshot";
import { CoolingModules } from "./CoolingModules";
import { CoreSystem } from "./CoreSystem";
import type { HeroKit } from "./hero-kit";
import { MicroDetails } from "./MicroDetails";
import { OuterRings } from "./OuterRings";
import { SupportStructure } from "./SupportStructure";

/**
 * HeroMachine: composition root of the procedural industrial apparatus.
 *   MACRO      housing, columns, gantry, rings, base
 *   SECONDARY  arms, struts, cooling stations, shutters, fans
 *   MICRO      bolts, vent slats, ladders, rails, indicators, cable runs (instanced patterns)
 *   EMISSIVE   inset channels + core shader (ActivationSystem animates them)
 * Replacement path: a production GLB can replace this component's children behind the same scene definition.
 */
export function HeroMachine({ kit, reduced, microDetail }: { kit: HeroKit; reduced: boolean; microDetail: boolean }) {
  const ref = useRef<Group>(null);

  useLayoutEffect(() => {
    if (process.env.NODE_ENV === "production" || !ref.current) return;
    let meshes = 0;
    let instances = 0;
    ref.current.traverse((o) => {
      if ((o as InstancedMesh).isInstancedMesh) {
        meshes += 1;
        instances += (o as InstancedMesh).count;
      } else if ((o as Mesh).isMesh) meshes += 1;
    });
    diagnosticsSnapshot.heroObjects = meshes;
    diagnosticsSnapshot.heroInstances = instances;
  });

  return (
    <group ref={ref} name="hero-machine">
      <CoreSystem kit={kit} />
      <OuterRings kit={kit} reduced={reduced} microDetail={microDetail} />
      <SupportStructure kit={kit} microDetail={microDetail} />
      <CoolingModules kit={kit} reduced={reduced} microDetail={microDetail} />
      {microDetail && <MicroDetails kit={kit} />}
    </group>
  );
}
