"use client";

import { useLayoutEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Object3D, type InstancedMesh } from "three";
import { Instances } from "@/components/scene/shared/Instances";
import { HERO, TAU, columnAngle } from "./hero-constants";
import type { HeroKit } from "./hero-kit";
import { heroState } from "./hero-state";

const N = HERO.columns.count;
const R = HERO.columns.radius;

function placeColumn(i: number, o: Object3D) {
  const a = columnAngle(i);
  o.position.set(Math.cos(a) * R, HERO.columns.height / 2 + HERO.base.thickness / 2, Math.sin(a) * R);
  o.rotation.y = -a;
}
/** Thin inset light channel on the inward column face, scaled to length via the instance matrix. */
function placeColumnStrip(i: number, o: Object3D) {
  const a = columnAngle(i);
  const r = R - HERO.columns.size / 2 - 0.02;
  o.position.set(Math.cos(a) * r, 13, Math.sin(a) * r);
  o.rotation.y = -a;
  o.scale.set(0.1, 20, 0.05);
}
function placeArm(i: number, o: Object3D) {
  const a = columnAngle(i);
  const r = (HERO.arms.from + HERO.arms.to) / 2;
  o.position.set(Math.cos(a) * r, HERO.arms.y, Math.sin(a) * r);
  o.rotation.y = -a;
}
function placeArmStrip(i: number, o: Object3D) {
  const a = columnAngle(i);
  const r = (HERO.arms.from + HERO.arms.to) / 2;
  o.position.set(Math.cos(a) * r, HERO.arms.y + 0.62, Math.sin(a) * r);
  o.rotation.y = -a;
  o.scale.set(HERO.arms.to - HERO.arms.from - 0.6, 0.04, 0.08);
}
function placeStrut(i: number, o: Object3D) {
  const a = columnAngle(i) + TAU / (N * 2);
  o.position.set(Math.cos(a) * 10.2, 3.0, Math.sin(a) * 10.2);
  o.rotation.y = -a;
}
function placeBeam(i: number, o: Object3D) {
  o.position.set(0, HERO.gantry.y, 0);
  o.rotation.y = (i / 3) * Math.PI;
}
function placeBeamStrip(i: number, o: Object3D) {
  placeBeam(i, o);
  o.position.y += 0.52;
  o.scale.set(HERO.gantry.outer * 1.7, 0.04, 0.08);
}
function placeTile(i: number, o: Object3D) {
  const a = (i / 24) * TAU;
  o.position.set(Math.cos(a) * 17.1, HERO.base.thickness / 2 + 0.07, Math.sin(a) * 17.1);
  o.rotation.y = -a;
}

const SHUTTERS_PER_COLUMN = 3;
const dummy = new Object3D();

/** Energy shutters: panels on the inward column faces that slide as `mechanical` progresses (matrices updated only when it changes). */
function ShutterBank({ kit, microDetail }: { kit: HeroKit; microDetail: boolean }) {
  const ref = useRef<InstancedMesh>(null);
  const last = useRef(-1);
  const count = N * SHUTTERS_PER_COLUMN;

  const write = (mesh: InstancedMesh, slide: number) => {
    for (let c = 0; c < N; c += 1) {
      const a = columnAngle(c);
      const r = R - HERO.columns.size / 2 - 0.1;
      for (let k = 0; k < SHUTTERS_PER_COLUMN; k += 1) {
        const side = (k - 1) * 0.0;
        dummy.position.set(Math.cos(a) * r - Math.sin(a) * side, 7 + k * 6.4 + slide * (k % 2 === 0 ? 2.2 : -2.2), Math.sin(a) * r + Math.cos(a) * side);
        dummy.rotation.set(0, -a, 0);
        dummy.scale.set(1, 0.9, 0.7);
        dummy.updateMatrix();
        mesh.setMatrixAt(c * SHUTTERS_PER_COLUMN + k, dummy.matrix);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  };

  useLayoutEffect(() => {
    if (ref.current) write(ref.current, heroState.mechanical);
  });

  useFrame(() => {
    const mesh = ref.current;
    if (!mesh || Math.abs(heroState.mechanical - last.current) < 1e-4) return;
    last.current = heroState.mechanical;
    write(mesh, heroState.mechanical);
  });

  if (!microDetail) return null;
  return <instancedMesh ref={ref} args={[kit.geo.shutter, kit.mat.panel, count]} castShadow frustumCulled={false} />;
}

/** Base, floor, columns, arms, struts, gantry: the SECONDARY structure that makes the machine read as enormous. */
export function SupportStructure({ kit, microDetail }: { kit: HeroKit; microDetail: boolean }) {
  const { geo, mat } = kit;
  return (
    <group name="support-structure">
      <mesh geometry={geo.floor} material={mat.floor} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow />
      <mesh geometry={geo.baseSlab} material={mat.alloyDeep} position={[0, HERO.base.thickness / 2, 0]} rotation={[0, Math.PI / 8, 0]} castShadow receiveShadow />
      <mesh geometry={geo.platform} material={mat.alloyDark} position={[0, HERO.base.thickness + HERO.base.platformHeight / 2, 0]} castShadow receiveShadow />
      <Instances geometry={geo.tile} material={mat.panel} count={24} place={placeTile} receiveShadow />
      <Instances geometry={geo.column} material={mat.alloyDark} count={N} place={placeColumn} castShadow receiveShadow />
      <Instances geometry={geo.unit} material={mat.strips[3]} count={N} place={placeColumnStrip} />
      <Instances geometry={geo.arm} material={mat.alloyDeep} count={N} place={placeArm} castShadow receiveShadow />
      <Instances geometry={geo.unit} material={mat.strips[2]} count={N} place={placeArmStrip} />
      <Instances geometry={geo.strut} material={mat.alloyDeep} count={N} place={placeStrut} castShadow receiveShadow />
      <mesh geometry={geo.gantry} material={mat.alloyBrushed} position={[0, HERO.gantry.y, 0]} castShadow receiveShadow />
      <mesh geometry={geo.gantryStrip} material={mat.strips[3]} position={[0, HERO.gantry.y + HERO.gantry.height / 2 + 0.015, 0]} />
      <Instances geometry={geo.beam} material={mat.alloyDark} count={3} place={placeBeam} castShadow receiveShadow />
      <Instances geometry={geo.unit} material={mat.strips[3]} count={3} place={placeBeamStrip} />
      <ShutterBank kit={kit} microDetail={microDetail} />
    </group>
  );
}
