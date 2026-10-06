"use client";

import type { Object3D } from "three";
import { Instances } from "@/components/scene/shared/Instances";
import { HERO, TAU, columnAngle } from "./hero-constants";
import type { HeroKit } from "./hero-kit";

const N = HERO.columns.count;
const R = HERO.columns.radius;
const HALF = HERO.columns.size / 2;

/** Indicator groups sit at three heights on every column; group index = activation stage (0,1 cool; 2 warm status). */
const INDICATOR_Y = [7, 13, 19];
const INDICATORS_PER_COLUMN = 2;
function placeIndicator(group: number) {
  return (n: number, o: Object3D) => {
    const column = Math.floor(n / INDICATORS_PER_COLUMN);
    const side = n % INDICATORS_PER_COLUMN === 0 ? -0.45 : 0.45;
    const a = columnAngle(column);
    const r = R - HALF - 0.03;
    o.position.set(Math.cos(a) * r - Math.sin(a) * side, INDICATOR_Y[group], Math.sin(a) * r + Math.cos(a) * side);
    o.rotation.y = -a;
  };
}
const INDICATOR_PLACERS = [placeIndicator(0), placeIndicator(1), placeIndicator(2)];

const RUNGS = 38;
/** Ladders on the OUTWARD face of each column: a narrow maintenance structure that gives human scale. */
function placeRung(n: number, o: Object3D) {
  const column = Math.floor(n / RUNGS);
  const k = n % RUNGS;
  const a = columnAngle(column);
  const r = R + HALF + 0.12;
  o.position.set(Math.cos(a) * r, 2 + k * 0.3, Math.sin(a) * r);
  o.rotation.y = -a;
}
function placeLadderRail(n: number, o: Object3D) {
  const column = Math.floor(n / 2);
  const side = n % 2 === 0 ? -0.4 : 0.4;
  const a = columnAngle(column);
  const r = R + HALF + 0.12;
  o.position.set(Math.cos(a) * r - Math.sin(a) * side, 2 + 6, Math.sin(a) * r + Math.cos(a) * side);
  o.rotation.y = -a;
}

const POSTS = 36;
function placePost(i: number, o: Object3D) {
  const a = (i / POSTS) * TAU;
  o.position.set(Math.cos(a) * 15.9, HERO.base.thickness + HERO.base.platformHeight + 0.5, Math.sin(a) * 15.9);
}
const GRILLES_PER_COLUMN = 5;
function placeGrille(n: number, o: Object3D) {
  const column = Math.floor(n / GRILLES_PER_COLUMN);
  const k = n % GRILLES_PER_COLUMN;
  const a = columnAngle(column);
  const r = R + HALF + 0.02;
  o.position.set(Math.cos(a) * r, 22 + k * 0.28, Math.sin(a) * r);
  o.rotation.y = Math.PI / 2 - a;
  o.scale.set(1.6, 1, 1);
}
function placeCable(i: number, o: Object3D) {
  // The cable curve lies in the XY plane at +X; rotate around Y to repeat it between columns.
  o.rotation.y = -(columnAngle(i % N) + (i >= N ? 0.18 : 0.52));
}

/** Micro detail layer: reusable patterns only (instanced), no hand-authored one-offs. Skipped on low geometry detail. */
export function MicroDetails({ kit }: { kit: HeroKit }) {
  const { geo, mat } = kit;
  return (
    <group name="micro-details">
      {INDICATOR_PLACERS.map((place, g) => (
        <Instances key={g} geometry={geo.indicator} material={mat.indicators[g]} count={N * INDICATORS_PER_COLUMN} place={place} />
      ))}
      <Instances geometry={geo.rung} material={mat.alloyDeep} count={N * RUNGS} place={placeRung} />
      <Instances geometry={geo.ladderRail} material={mat.alloyDeep} count={N * 2} place={placeLadderRail} />
      <Instances geometry={geo.slat} material={mat.alloyDeep} count={N * GRILLES_PER_COLUMN} place={placeGrille} />
      <mesh geometry={geo.catwalk} material={mat.alloyDeep} position={[0, HERO.base.thickness + HERO.base.platformHeight + 0.06, 0]} receiveShadow />
      <mesh geometry={geo.railRing} material={mat.alloyBrushed} position={[0, HERO.base.thickness + HERO.base.platformHeight + 1.0, 0]} />
      <Instances geometry={geo.post} material={mat.alloyDeep} count={POSTS} place={placePost} />
      <Instances geometry={geo.cable} material={mat.alloyDeep} count={N * 2} place={placeCable} castShadow />
    </group>
  );
}
