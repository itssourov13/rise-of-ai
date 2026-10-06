"use client";

import { useLayoutEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Object3D, type InstancedMesh } from "three";
import { engineTime } from "@/lib/animation/time";
import { Instances, type PlaceFn } from "@/components/scene/shared/Instances";
import { HALL, bayCentreZ } from "./machine-constants";
import type { MachineKit } from "./machine-kit";
import { machineState } from "./machine-state";

const UNIT_BAYS = [1, 3, 5, 7];
const UNIT_COUNT = UNIT_BAYS.length * 2;
const FANS_PER_UNIT = 2;
const BLADES = 6;
const TAU = Math.PI * 2;
const unitX = (i: number) => (i % 2 === 0 ? -(HALL.halfWidth - 1.4) : HALL.halfWidth - 1.4);
const unitZ = (i: number) => bayCentreZ(UNIT_BAYS[Math.floor(i / 2)]);
const faceDir = (i: number) => (i % 2 === 0 ? 1 : -1);

const placeUnit: PlaceFn = (i, o) => o.position.set(unitX(i), 4.85, unitZ(i));
const fanCentre = (n: number) => {
  const unit = Math.floor(n / FANS_PER_UNIT);
  const k = n % FANS_PER_UNIT;
  return { x: unitX(unit) + faceDir(unit) * 1.35, y: 4.85, z: unitZ(unit) + (k === 0 ? -1.5 : 1.5), dir: (unit + k) % 2 === 0 ? 1 : -1 };
};
const placeRing: PlaceFn = (n, o: Object3D) => {
  const f = fanCentre(n);
  o.position.set(f.x, f.y, f.z);
  o.rotation.z = Math.PI / 2;
};
const placeHub: PlaceFn = (n, o: Object3D) => {
  const f = fanCentre(n);
  o.position.set(f.x, f.y, f.z);
  o.rotation.z = Math.PI / 2;
};
const dummy = new Object3D();

/** Cooling units against the side walls with fan arrays facing the hall. Fans engage with `mechanical` (progress-driven) plus slow free-spin; static in reduced motion. */
export function CoolingUnits({ kit, reduced }: { kit: MachineKit; reduced: boolean }) {
  const blades = useRef<InstancedMesh>(null);
  const last = useRef(NaN);
  const total = UNIT_COUNT * FANS_PER_UNIT * BLADES;

  const write = (mesh: InstancedMesh, angle: number) => {
    let i = 0;
    for (let n = 0; n < UNIT_COUNT * FANS_PER_UNIT; n += 1) {
      const f = fanCentre(n);
      for (let b = 0; b < BLADES; b += 1) {
        const a = f.dir * angle + (b / BLADES) * TAU;
        dummy.position.set(f.x, f.y + Math.cos(a) * 0.55, f.z + Math.sin(a) * 0.55);
        dummy.rotation.set(a, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        i += 1;
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  };

  useLayoutEffect(() => {
    if (blades.current) write(blades.current, 0);
  });

  useFrame(() => {
    const mesh = blades.current;
    if (!mesh) return;
    const e = machineState.mechanical;
    const angle = e * 5 + (reduced ? 0 : engineTime.elapsed * 6 * e);
    if (angle === last.current) return;
    last.current = angle;
    write(mesh, angle);
  });

  return (
    <group name="cooling-units">
      <Instances geometry={kit.geo.cooler} material={kit.mat.rack} count={UNIT_COUNT} place={placeUnit} />
      <Instances geometry={kit.geo.fanRing} material={kit.mat.chassis} count={UNIT_COUNT * FANS_PER_UNIT} place={placeRing} />
      <Instances geometry={kit.geo.fanHub} material={kit.mat.rackDeep} count={UNIT_COUNT * FANS_PER_UNIT} place={placeHub} />
      <instancedMesh ref={blades} args={[kit.geo.fanBlade, kit.mat.chassis, total]} frustumCulled={false} />
    </group>
  );
}
