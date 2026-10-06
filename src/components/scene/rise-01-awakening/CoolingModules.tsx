"use client";

import { useLayoutEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Object3D, type InstancedMesh } from "three";
import { engineTime } from "@/lib/animation/time";
import { Instances } from "@/components/scene/shared/Instances";
import { HERO, TAU, columnAngle } from "./hero-constants";
import type { HeroKit } from "./hero-kit";
import { heroState } from "./hero-state";

interface Fan {
  x: number;
  y: number;
  z: number;
  r: number;
  blades: number;
  /** rotation direction */
  dir: 1 | -1;
}

const STATION_ANGLE = (i: number) => columnAngle(i) + TAU / (HERO.columns.count * 2);
const STATION_Y = 4.2; // block centre
const FANS: Fan[] = [
  ...Array.from({ length: HERO.cooling.stations }, (_, i): Fan => {
    const a = STATION_ANGLE(i);
    return { x: Math.cos(a) * HERO.cooling.radius, y: STATION_Y + 2.15, z: Math.sin(a) * HERO.cooling.radius, r: 0.9, blades: 6, dir: i % 2 === 0 ? 1 : -1 };
  }),
  { x: 0, y: 20.4, z: 0, r: 2.4, blades: 8, dir: 1 },
];
const BLADE_COUNT = FANS.reduce((n, f) => n + f.blades, 0);
const dummy = new Object3D();

function placeBlock(i: number, o: Object3D) {
  const a = STATION_ANGLE(i);
  o.position.set(Math.cos(a) * HERO.cooling.radius, STATION_Y, Math.sin(a) * HERO.cooling.radius);
  o.rotation.y = -a;
}
const FINS_PER_STATION = 10;
function placeCoolFin(n: number, o: Object3D) {
  const station = Math.floor(n / FINS_PER_STATION);
  const k = n % FINS_PER_STATION;
  const a = STATION_ANGLE(station);
  const radial = HERO.cooling.radius + 1.7; // fins on the outward side of the block
  const tangential = (k - (FINS_PER_STATION - 1) / 2) * 0.3;
  o.position.set(Math.cos(a) * radial - Math.sin(a) * tangential, STATION_Y - 0.1, Math.sin(a) * radial + Math.cos(a) * tangential);
  o.rotation.y = -a;
}
const placeFanHousing = (i: number, o: Object3D) => {
  const f = FANS[i];
  o.position.set(f.x, f.y, f.z);
  o.scale.setScalar(f.r / 1.0);
};
const placeFanHub = (i: number, o: Object3D) => {
  const f = FANS[i];
  o.position.set(f.x, f.y, f.z);
  o.scale.setScalar(Math.max(1, f.r / 0.9));
};

/**
 * CoolingModules: heat-sink stations on the platform + a central intake duct with a large fan above the core.
 * Fan rotation: spins only while the machine is mechanically engaged; slow free-spin at the end (not "everything always rotating").
 * Blade matrices (<= ~44) are rewritten per frame only while the angle changes.
 */
export function CoolingModules({ kit, reduced, microDetail }: { kit: HeroKit; reduced: boolean; microDetail: boolean }) {
  const blades = useRef<InstancedMesh>(null);
  const lastAngle = useRef(NaN);

  const writeBlades = (mesh: InstancedMesh, angle: number) => {
    let n = 0;
    for (const f of FANS) {
      for (let b = 0; b < f.blades; b += 1) {
        const a = f.dir * angle + (b / f.blades) * TAU;
        dummy.position.set(f.x + Math.cos(a) * f.r * 0.62, f.y, f.z + Math.sin(a) * f.r * 0.62);
        dummy.rotation.set(0.35, -a, 0);
        dummy.scale.set(f.r * 0.62, 1, f.r * 0.9);
        dummy.updateMatrix();
        mesh.setMatrixAt(n, dummy.matrix);
        n += 1;
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  };

  useLayoutEffect(() => {
    if (blades.current) writeBlades(blades.current, 0);
  });

  useFrame(() => {
    const mesh = blades.current;
    if (!mesh) return;
    const engaged = Math.min(1, Math.max(0, (heroState.mechanical - 0.3) / 0.5));
    const spin = reduced ? 0 : 3 + 9 * engaged;
    // angle = engagement-driven (progress) + free spin (time). Deterministic from progress except the slow free spin.
    const angle = engaged * 6 + engineTime.elapsed * spin * engaged * 0.35;
    if (angle === lastAngle.current) return;
    lastAngle.current = angle;
    writeBlades(mesh, angle);
  });

  const { geo, mat } = kit;
  const stations = HERO.cooling.stations;
  return (
    <group name="cooling-modules">
      <Instances geometry={geo.coolBlock} material={mat.alloyDeep} count={stations} place={placeBlock} castShadow receiveShadow />
      {microDetail && <Instances geometry={geo.coolFin} material={mat.alloyBrushed} count={stations * FINS_PER_STATION} place={placeCoolFin} castShadow />}
      <mesh geometry={geo.duct} material={mat.alloyDark} position={[0, 18.65, 0]} castShadow receiveShadow />
      <Instances geometry={geo.fanHousing} material={mat.alloyBrushed} count={FANS.length} place={placeFanHousing} />
      <Instances geometry={geo.fanHub} material={mat.alloyDeep} count={FANS.length} place={placeFanHub} />
      <instancedMesh ref={blades} args={[geo.fanBlade, mat.alloyBrushed, BLADE_COUNT]} frustumCulled={false} />
    </group>
  );
}
