"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, Object3D } from "three";
import { engineTime } from "@/lib/animation/time";
import { Instances } from "@/components/scene/shared/Instances";
import { HERO, TAU } from "./hero-constants";
import type { HeroKit } from "./hero-kit";
import { heroState } from "./hero-state";

const BOLTS = 40;
const VENTS = 24;
const SLATS_PER_VENT = 2;
const TURNS = 1.4 * Math.PI;

/** OuterRings: three counter-rotating chamfered rings (rotation is progress-derived; locks at full mechanical progress). */
export function OuterRings({ kit, reduced, microDetail }: { kit: HeroKit; reduced: boolean; microDetail: boolean }) {
  const refs = useRef<(Group | null)[]>([]);

  useFrame(() => {
    const idleBase = reduced ? 0 : engineTime.elapsed * 0.02 * heroState.energy;
    HERO.rings.forEach((ring, i) => {
      const group = refs.current[i];
      if (group) group.rotation.y = ring.direction * ring.speed * (heroState.mechanical * TURNS + idleBase);
    });
  });

  return (
    <group name="outer-rings">
      {HERO.rings.map((ring, i) => {
        const boltR = ring.outer - 0.35;
        const placeBolt = (n: number, o: Object3D) => {
          const a = (n / BOLTS) * TAU;
          o.position.set(Math.cos(a) * boltR, ring.height / 2 + 0.04, Math.sin(a) * boltR);
        };
        const placeSlat = (n: number, o: Object3D) => {
          const unit = Math.floor(n / SLATS_PER_VENT);
          const a = ((unit + 0.5) / VENTS) * TAU;
          o.position.set(Math.cos(a) * (ring.outer + 0.01), (n % SLATS_PER_VENT === 0 ? 0.18 : -0.18) * ring.height, Math.sin(a) * (ring.outer + 0.01));
          o.rotation.y = Math.PI / 2 - a;
        };
        return (
          <group
            key={ring.id}
            ref={(g) => {
              refs.current[i] = g;
            }}
            position={[0, ring.y, 0]}
          >
            <mesh geometry={kit.geo.ringBodies[i]} material={kit.mat.alloyBrushed} castShadow receiveShadow />
            <mesh geometry={kit.geo.ringStrips[i]} material={kit.mat.strips[ring.layer]} position={[0, ring.height / 2 + 0.015, 0]} />
            {microDetail && <Instances geometry={kit.geo.bolt} material={kit.mat.alloyDeep} count={BOLTS} place={placeBolt} />}
            {microDetail && <Instances geometry={kit.geo.slat} material={kit.mat.alloyDeep} count={VENTS * SLATS_PER_VENT} place={placeSlat} />}
          </group>
        );
      })}
    </group>
  );
}
