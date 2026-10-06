"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BufferAttribute, BufferGeometry, PerspectiveCamera, type ShaderMaterial } from "three";
import { engineTime } from "@/lib/animation/time";
import { makeSeeds, zeroLayers } from "@/lib/three/data/generators";
import { createPointFieldMaterial } from "@/lib/three/shaders/point-field";

export interface PointFieldProps {
  /** State A positions (xyz triples). */
  a: Float32Array;
  /** State B positions; defaults to A (no morph). */
  b?: Float32Array;
  layers?: Float32Array;
  seed?: number;
  colorA: string;
  colorB: string;
  size?: number;
  active: boolean;
  /** Called every frame while active (write uniforms here; read mutable scene state, never React state). */
  update?: (u: ShaderMaterial["uniforms"], elapsed: number) => void;
  renderOrder?: number;
}

/**
 * Shared GPU point field. Owns (and disposes) its geometry + material. The scene supplies seeded data and a per-frame
 * `update` writing uniforms from its mutable state. Time + pixel-scale uniforms are handled here.
 */
export function PointField({ a, b, layers, seed = 1, colorA, colorB, size = 0.12, active, update, renderOrder = 4 }: PointFieldProps) {
  const count = a.length / 3;
  const geometry = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(a, 3));
    g.setAttribute("aTarget", new BufferAttribute(b ?? a, 3));
    g.setAttribute("aSeed", new BufferAttribute(makeSeeds(count, seed), 1));
    g.setAttribute("aLayer", new BufferAttribute(layers ?? zeroLayers(count), 1));
    return g;
  }, [a, b, layers, seed, count]);
  const material = useMemo(() => {
    const m = createPointFieldMaterial(colorA, colorB);
    m.uniforms.uSize.value = size;
    return m;
  }, [colorA, colorB, size]);
  const materialRef = useRef<ShaderMaterial | null>(null);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => {
    materialRef.current = material;
    return () => {
      materialRef.current = null;
      material.dispose();
    };
  }, [material]);

  useFrame((state) => {
    if (!active) return;
    const currentMaterial = materialRef.current;
    if (!currentMaterial) return;
    const u = currentMaterial.uniforms;
    const cam = state.camera as PerspectiveCamera;
    u.uTime.value = engineTime.elapsed;
    u.uScale.value = state.gl.domElement.height / (2 * Math.tan((cam.fov * Math.PI) / 360));
    u.uFar.value = cam.far * 0.5;
    update?.(u, engineTime.elapsed);
  });

  if (count === 0) return null;
  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={renderOrder} />;
}
