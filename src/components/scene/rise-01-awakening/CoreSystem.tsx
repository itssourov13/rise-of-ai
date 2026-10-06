"use client";

import type { Object3D } from "three";
import { Instances } from "@/components/scene/shared/Instances";
import { HERO, TAU } from "./hero-constants";
import type { HeroKit } from "./hero-kit";

/** Fin angles around the housing; fins facing +Z (the camera side) are omitted: the service aperture that exposes the core. */
const APERTURE_CENTRE = Math.PI / 2; // +Z in the XZ plane (x=cos, z=sin)
const FIN_ANGLES: number[] = Array.from({ length: HERO.housing.fins }, (_, i) => (i / HERO.housing.fins) * TAU).filter((a) => {
  const d = Math.abs(((a - APERTURE_CENTRE + Math.PI * 3) % TAU) - Math.PI);
  return d > HERO.housing.apertureHalfAngle;
});

function placeFin(i: number, o: Object3D) {
  const a = FIN_ANGLES[i];
  o.position.set(Math.cos(a) * HERO.housing.radius, (HERO.housing.y0 + HERO.housing.y1) / 2, Math.sin(a) * HERO.housing.radius);
  o.rotation.y = -a;
}
const placeCap = (i: number, o: Object3D) => o.position.set(0, i === 0 ? HERO.core.y0 - 0.15 : HERO.core.y1 + 0.15, 0);
const COLLAR_Y = [6.2, 9, 11.8];
const placeCollar = (i: number, o: Object3D) => o.position.set(0, COLLAR_Y[i], 0);

/** CoreHousing + InnerCore: ventilated fin housing around a contained energy column. Layer 0/1. */
export function CoreSystem({ kit }: { kit: HeroKit }) {
  const { geo, mat } = kit;
  return (
    <group name="core-system">
      <mesh geometry={geo.coreCylinder} material={mat.core} position={[0, HERO.coreY, 0]} />
      <Instances geometry={geo.coreCap} material={mat.alloyDeep} count={2} place={placeCap} />
      <Instances geometry={geo.coreCollar} material={mat.strips[0]} count={COLLAR_Y.length} place={placeCollar} />
      <Instances geometry={geo.fin} material={mat.alloyDark} count={FIN_ANGLES.length} place={placeFin} castShadow receiveShadow />
      <mesh geometry={geo.collarTop} material={mat.alloyBrushed} position={[0, HERO.housing.y1 + 0.4, 0]} castShadow receiveShadow />
      <mesh geometry={geo.collarBottom} material={mat.alloyBrushed} position={[0, HERO.housing.y0 - 0.5, 0]} castShadow receiveShadow />
      <mesh geometry={geo.collarStrip} material={mat.strips[1]} position={[0, HERO.housing.y1 + 0.82, 0]} />
    </group>
  );
}
