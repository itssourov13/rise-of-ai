"use client";

import type { Object3D } from "three";
import { Instances, type PlaceFn } from "@/components/scene/shared/Instances";
import { BAYS, BAY_LENGTH, HALL, HALL_START_Z, bayCentreZ, bayStartZ } from "./machine-constants";
import type { MachineKit } from "./machine-kit";

const COLUMN_ROWS = Array.from({ length: BAYS + 1 }, (_, i) => bayStartZ(i));
const placeColumn: PlaceFn = (i, o: Object3D) => {
  const row = Math.floor(i / 2);
  o.position.set(i % 2 === 0 ? -HALL.halfWidth : HALL.halfWidth, HALL.columnHeight / 2, COLUMN_ROWS[row]);
};
const placeBeam: PlaceFn = (i, o: Object3D) => o.position.set(0, HALL.beamY, COLUMN_ROWS[i]);
const placeTray = (x: number): PlaceFn => (_i, o: Object3D) => {
  o.position.set(x, HALL.beamY - 1.0, HALL_START_Z - HALL.lengthZ / 2);
  o.scale.set(0.9, 1, HALL.lengthZ);
};
const placeCeilStrip = (bay: number): PlaceFn => (i, o: Object3D) => {
  o.position.set(i === 0 ? -10 : 10, HALL.beamY - 0.55, bayCentreZ(bay));
  o.scale.set(0.2, 0.06, BAY_LENGTH - 2);
};
const placeFloorStrip = (bay: number): PlaceFn => (i, o: Object3D) => {
  o.position.set(i === 0 ? -2.4 : 2.4, 0.03, bayCentreZ(bay));
  o.scale.set(0.08, 0.03, BAY_LENGTH - 2);
};

/** Hall shell: raised floor, columns, ceiling beams, cable trays, per-bay ceiling + aisle light strips (flow bus). No walls: darkness is the room. */
export function Hall({ kit }: { kit: MachineKit }) {
  const { geo, mat } = kit;
  return (
    <group name="hall">
      <mesh geometry={geo.floor} material={mat.floor} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, HALL_START_Z - HALL.lengthZ / 2]} />
      <Instances geometry={geo.column} material={mat.steel} count={(BAYS + 1) * 2} place={placeColumn} />
      <Instances geometry={geo.beam} material={mat.steel} count={BAYS + 1} place={placeBeam} />
      <Instances geometry={geo.tray} material={mat.chassis} count={1} place={placeTray(-3)} />
      <Instances geometry={geo.tray} material={mat.chassis} count={1} place={placeTray(3)} />
      {Array.from({ length: BAYS }, (_, b) => (
        <group key={b}>
          <Instances geometry={geo.unit} material={mat.ceilWarm[b]} count={2} place={placeCeilStrip(b)} />
          <Instances geometry={geo.unit} material={mat.bayCool[b]} count={2} place={placeFloorStrip(b)} />
        </group>
      ))}
    </group>
  );
}
