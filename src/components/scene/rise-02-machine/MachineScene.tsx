"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import type { Group, InstancedMesh, Mesh } from "three";
import { useRenderControls } from "@/components/engine/useRenderControls";
import type { SceneProps } from "@/components/scene/scene-definitions";
import { choreographer } from "@/lib/choreography/choreographer";
import { diagnosticsSnapshot } from "@/lib/three/diagnostics/snapshot";
import { useEngineStore } from "@/state/engine-store";
import { useExperienceStore } from "@/state/experience-store";
import { CircuitBoard } from "./CircuitBoard";
import { CoolingUnits } from "./CoolingUnits";
import { Hall } from "./Hall";
import { MACHINE_COLORS } from "./machine-constants";
import { buildTraceField, createMachineKit } from "./machine-kit";
import { MachineDriver } from "./MachineDriver";
import { MachineLights } from "./MachineLights";
import { RackField } from "./RackField";

const TRACE_FIELD = buildTraceField();

/**
 * RISE-02-MACHINE scene root (procedural, no assets). Owns its MachineKit and, like the Hero, applies/restores
 * the world configuration (environment, atmosphere, environmentIntensity, continuous-render hold) only while ACTIVE.
 * Reads machineState (timeline-written), never Lenis/ScrollTrigger.
 */
export default function MachineScene({ active }: SceneProps) {
  const reduced = useExperienceStore((s) => s.reducedMotion);
  const controls = useRenderControls();
  const scene = useThree((s) => s.scene);
  const invalidate = useThree((s) => s.invalidate);
  const microDetail = controls.geometryDetail >= 0.75; // UNVERIFIED threshold: fewer racks/details on LOW/MOBILE
  const root = useRef<Group>(null);

  const kit = useMemo(() => createMachineKit(controls.geometryDetail, TRACE_FIELD), [controls.geometryDetail]);
  useEffect(() => () => kit.dispose(), [kit]);

  useEffect(() => {
    if (!active) return;
    const engine = useEngineStore.getState();
    engine.setEnvironment({ kind: "procedural-room" });
    engine.setAtmosphere({ kind: "exp2", color: MACHINE_COLORS.background, density: 0.011 });
    return () => {
      const s = useEngineStore.getState();
      s.setEnvironment({ kind: "none" });
      s.setAtmosphere(null);
      scene.environmentIntensity = 1;
      invalidate();
    };
  }, [active, scene, invalidate]);

  useEffect(() => {
    if (!active) return;
    if (!reduced) return useEngineStore.getState().acquireContinuous();
    return choreographer.subscribe(invalidate);
  }, [active, reduced, invalidate]);

  useLayoutEffect(() => {
    if (process.env.NODE_ENV === "production" || !root.current || !active) return;
    let meshes = 0;
    let instances = 0;
    root.current.traverse((o) => {
      if ((o as InstancedMesh).isInstancedMesh) {
        meshes += 1;
        instances += (o as InstancedMesh).count;
      } else if ((o as Mesh).isMesh) meshes += 1;
    });
    diagnosticsSnapshot.heroObjects = meshes;
    diagnosticsSnapshot.heroInstances = instances;
  }, [active, microDetail]);

  return (
    <group ref={root} name="rise-02-machine">
      <MachineLights active={active} />
      <Hall kit={kit} />
      <RackField kit={kit} microDetail={microDetail} />
      <CoolingUnits kit={kit} reduced={reduced} />
      <CircuitBoard kit={kit} field={TRACE_FIELD} />
      <MachineDriver kit={kit} active={active} />
    </group>
  );
}
