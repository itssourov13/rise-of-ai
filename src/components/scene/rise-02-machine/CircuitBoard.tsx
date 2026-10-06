"use client";

import type { Object3D } from "three";
import { Instances, type PlaceFn } from "@/components/scene/shared/Instances";
import { BOARD } from "./machine-constants";
import type { MachineKit, TraceField } from "./machine-kit";

/**
 * The circuit-board wall at the end of the hall: base, chip, instanced pads and signal traces. Local origin = board
 * centre, facing +Z. The traces' glow is the "structure dissolves into signal" payoff (state.signal / state.pulse).
 */
export function CircuitBoard({ kit, field }: { kit: MachineKit; field: TraceField }) {
  const { geo, mat } = kit;
  const front = BOARD.thickness / 2;
  const placeTrace: PlaceFn = (i, o: Object3D) => {
    const s = field.segments[i];
    o.position.set(s.x, s.y, front + 0.03);
    if (s.vertical) o.scale.set(0.16, s.length, 0.06);
    else o.scale.set(s.length, 0.16, 0.06);
  };
  const placePad: PlaceFn = (i, o: Object3D) => o.position.set(field.pads[i].x, field.pads[i].y, front + 0.06);
  return (
    <group name="circuit-board" position={[0, BOARD.y, BOARD.z]}>
      <mesh geometry={geo.boardBase} material={mat.boardBase} />
      <Instances geometry={geo.trace} material={mat.signal} count={field.segments.length} place={placeTrace} />
      <Instances geometry={geo.pad} material={mat.pad} count={field.pads.length} place={placePad} />
      <mesh geometry={geo.chipRim} material={mat.chipGlow} position={[0, 0, front + 0.12]} />
      <mesh geometry={geo.chip} material={mat.chipTop} position={[0, 0, front + 0.5]} />
    </group>
  );
}
