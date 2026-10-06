"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BufferAttribute, BufferGeometry, type ShaderMaterial } from "three";
import { engineTime } from "@/lib/animation/time";
import { createSeededRandom } from "@/lib/random/seeded";
import type { GraphData } from "@/lib/three/data/generators";
import { createLineFlowMaterial } from "@/lib/three/shaders/line-flow";
import { PointField } from "./PointField";

export interface NetworkFieldProps {
  graph: GraphData;
  colorBase: string;
  colorPulse: string;
  nodeSize?: number;
  active: boolean;
  /** Edge uniforms (uLevel, uFront, uHiOnly, ...). */
  updateEdges?: (u: ShaderMaterial["uniforms"], elapsed: number) => void;
  /** Node uniforms (point-field shader; uLayerMode/uFront/uVisible/uOpacity...). */
  updateNodes?: (u: ShaderMaterial["uniforms"], elapsed: number) => void;
  seed?: number;
}

/** Nodes (shared PointField, layer-lit) + edges (one LineSegments, flow shader). Owns and disposes the edge resources. */
export function NetworkField({ graph, colorBase, colorPulse, nodeSize = 0.5, active, updateEdges, updateNodes, seed = 11 }: NetworkFieldProps) {
  const geometry = useMemo(() => {
    const e = graph.edges.length;
    const pos = new Float32Array(e * 6);
    const t = new Float32Array(e * 2);
    const layer = new Float32Array(e * 2);
    const phase = new Float32Array(e * 2);
    const hi = new Float32Array(e * 2);
    const r = createSeededRandom(seed);
    graph.edges.forEach(([i, j], k) => {
      for (let a = 0; a < 3; a += 1) {
        pos[k * 6 + a] = graph.nodes[i * 3 + a];
        pos[k * 6 + 3 + a] = graph.nodes[j * 3 + a];
      }
      t[k * 2] = 0;
      t[k * 2 + 1] = 1;
      const l = Math.max(graph.nodeLayers[i], graph.nodeLayers[j]);
      layer[k * 2] = l;
      layer[k * 2 + 1] = l;
      const ph = r();
      phase[k * 2] = ph;
      phase[k * 2 + 1] = ph;
      const h = graph.edgeHi?.[k] ?? 0;
      hi[k * 2] = h;
      hi[k * 2 + 1] = h;
    });
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(pos, 3));
    g.setAttribute("aT", new BufferAttribute(t, 1));
    g.setAttribute("aLayer", new BufferAttribute(layer, 1));
    g.setAttribute("aPhase", new BufferAttribute(phase, 1));
    g.setAttribute("aHi", new BufferAttribute(hi, 1));
    return g;
  }, [graph, seed]);
  const material = useMemo(() => createLineFlowMaterial(colorBase, colorPulse), [colorBase, colorPulse]);
  const materialRef = useRef<ShaderMaterial | null>(null);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => {
    materialRef.current = material;
    return () => {
      materialRef.current = null;
      material.dispose();
    };
  }, [material]);

  useFrame(() => {
    if (!active) return;
    const currentMaterial = materialRef.current;
    if (!currentMaterial) return;
    currentMaterial.uniforms.uTime.value = engineTime.elapsed;
    updateEdges?.(currentMaterial.uniforms, engineTime.elapsed);
  });

  return (
    <group>
      <lineSegments geometry={geometry} material={material} frustumCulled={false} renderOrder={3} />
      <PointField
        a={graph.nodes}
        layers={graph.nodeLayers}
        seed={seed + 3}
        colorA={colorBase}
        colorB={colorPulse}
        size={nodeSize}
        active={active}
        update={(u, t) => {
          u.uLayerMode.value = 1;
          updateNodes?.(u, t);
        }}
        renderOrder={5}
      />
    </group>
  );
}
