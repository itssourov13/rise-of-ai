"use client";

import type { Object3D } from "three";
import { Instances, type PlaceFn } from "@/components/scene/shared/Instances";
import { BAYS, BAY_LENGTH, CROSS_Z, RACK, bayStartZ } from "./machine-constants";
import type { MachineKit } from "./machine-kit";

interface RackSlot {
  x: number;
  z: number;
  /** +1 front faces +X, -1 front faces -X */
  face: 1 | -1;
}

/** Rows: A (x=±5) face the centre aisle; B (x=±7) are back-to-back with A and face the side aisles. */
const ROWS_A: readonly { x: number; face: 1 | -1 }[] = [
  { x: -5, face: 1 },
  { x: 5, face: -1 },
];
const ROWS_B: readonly { x: number; face: 1 | -1 }[] = [
  { x: -7, face: -1 },
  { x: 7, face: 1 },
];

function buildBays(rows: readonly { x: number; face: 1 | -1 }[]): RackSlot[][] {
  return Array.from({ length: BAYS }, (_, bay) => {
    const slots: RackSlot[] = [];
    for (let k = 0; ; k += 1) {
      const z = bayStartZ(bay) - 0.8 - k * RACK.pitch;
      if (z < bayStartZ(bay) - BAY_LENGTH + 0.8) break;
      if (Math.abs(z - CROSS_Z) < 2.8) continue; // cross aisle
      for (const r of rows) slots.push({ x: r.x, z, face: r.face });
    }
    return slots;
  });
}

const BAYS_FULL = buildBays([...ROWS_A, ...ROWS_B]);
const BAYS_A_ONLY = buildBays(ROWS_A);

const frontX = (s: RackSlot, off: number) => s.x + s.face * (RACK.depth / 2 + off);

const placeRack = (list: RackSlot[]): PlaceFn => (i, o: Object3D) => o.position.set(list[i].x, RACK.height / 2 + 0.15, list[i].z);
const placeStrip = (list: RackSlot[]): PlaceFn => (i, o: Object3D) => {
  o.position.set(frontX(list[i], 0.025), 4.4, list[i].z);
  o.scale.set(0.04, 6.4, 0.14);
};
const placeLed = (list: RackSlot[]): PlaceFn => (i, o: Object3D) => o.position.set(frontX(list[i], 0.03), 7.7, list[i].z + 0.3);
const placeVent = (list: RackSlot[], row: 0 | 1): PlaceFn => (i, o: Object3D) => {
  o.position.set(frontX(list[i], 0.02), row === 0 ? 1.4 : 2.6, list[i].z);
};

const ALL = BAYS_FULL.flat();
const ALL_A = BAYS_A_ONLY.flat();

/** Rack field: ONE InstancedMesh for all rack bodies (+ vents); per-bay InstancedMeshes for the emissive strips/LEDs (flow bus). */
export function RackField({ kit, microDetail }: { kit: MachineKit; microDetail: boolean }) {
  const bays = microDetail ? BAYS_FULL : BAYS_A_ONLY;
  const all = microDetail ? ALL : ALL_A;
  const { geo, mat } = kit;
  return (
    <group name="rack-field">
      <Instances geometry={geo.rack} material={mat.rack} count={all.length} place={placeRack(all)} />
      {microDetail && <Instances geometry={geo.vent} material={mat.rackDeep} count={all.length} place={placeVent(all, 0)} />}
      {microDetail && <Instances geometry={geo.vent} material={mat.rackDeep} count={all.length} place={placeVent(all, 1)} />}
      {bays.map((list, b) => (
        <group key={b}>
          <Instances geometry={geo.unit} material={mat.bayCool[b]} count={list.length} place={placeStrip(list)} />
          {microDetail && <Instances geometry={geo.led} material={mat.bayWarm[b]} count={list.length} place={placeLed(list)} />}
        </group>
      ))}
    </group>
  );
}
