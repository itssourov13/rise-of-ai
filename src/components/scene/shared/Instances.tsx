"use client";

import { useLayoutEffect, useRef } from "react";
import { Object3D, type BufferGeometry, type InstancedMesh, type Material } from "three";

const dummy = new Object3D();

export type PlaceFn = (index: number, target: Object3D) => void;

/**
 * Static InstancedMesh: ONE shared geometry + material, N placements written once (deterministic).
 * `place` must be a stable function (module-level or memoized): it only runs when `count`/`place` change.
 * Frustum culling is off because instance bounds are not computed (the whole machine is on screen anyway).
 * Geometry and material belong to the HeroKit; this component never disposes them.
 */
export function Instances({
  geometry,
  material,
  count,
  place,
  castShadow = false,
  receiveShadow = false,
}: {
  geometry: BufferGeometry;
  material: Material;
  count: number;
  place: PlaceFn;
  castShadow?: boolean;
  receiveShadow?: boolean;
}) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    for (let i = 0; i < count; i += 1) {
      dummy.position.set(0, 0, 0);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      place(i, dummy);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [count, place]);
  return <instancedMesh ref={ref} args={[geometry, material, count]} castShadow={castShadow} receiveShadow={receiveShadow} frustumCulled={false} />;
}
