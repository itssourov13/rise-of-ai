"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { EdgesGeometry, LineBasicMaterial, MeshBasicMaterial, SphereGeometry, type ShaderMaterial } from "three";
import type { SceneProps } from "@/components/scene/scene-definitions";
import { NetworkField } from "@/components/scene/shared/NetworkField";
import { useSceneWorld } from "@/components/scene/shared/useSceneWorld";
import { engineTime } from "@/lib/animation/time";
import { createBeveledBox } from "@/lib/three/geometry/procedural";
import { createEnergyCoreMaterial } from "@/lib/three/shaders/energy-core";
import type { GraphData } from "@/lib/three/data/generators";
import { agencyState as s } from "./agency-spec";

/** Tool modules around the hub: [x, y, z, size]. Authored (UNVERIFIED). */
const TOOLS: readonly (readonly [number, number, number, number])[] = [
  [-24, 6, 4, 4], [-14, -9, -12, 3], [12, 11, -6, 3.4], [25, 2, 8, 4.2], [8, -12, 12, 3], [-6, 14, -20, 3.6], [30, -8, -14, 3],
];

function buildGraphs(): { spokes: GraphData; fabric: GraphData } {
  const n = TOOLS.length + 1;
  const nodes = new Float32Array(n * 3);
  const nodeLayers = new Float32Array(n);
  TOOLS.forEach(([x, y, z], i) => {
    nodes.set([x, y, z], (i + 1) * 3);
    nodeLayers[i + 1] = 0.5;
  });
  const spokes: [number, number][] = TOOLS.map((_, i) => [0, i + 1]);
  const fabric: [number, number][] = [];
  for (let i = 1; i < n; i += 1) fabric.push([i, i === n - 1 ? 1 : i + 1]);
  fabric.push([1, 4], [2, 5], [3, 6], [2, 7]);
  return { spokes: { nodes, nodeLayers, edges: spokes }, fabric: { nodes, nodeLayers, edges: fabric } };
}
const GRAPHS = buildGraphs();

export default function AgencyScene({ active }: SceneProps) {
  useSceneWorld(active, { environment: { kind: "none" }, atmosphere: null });
  const hubMat = useMemo(() => createEnergyCoreMaterial("#7fc8ff", "#ffe8c4"), []);
  const hubGeo = useMemo(() => new SphereGeometry(2.3, 48, 32), []);
  const toolGeos = useMemo(() => TOOLS.map(([, , , sz]) => new EdgesGeometry(createBeveledBox(sz * 1.4, sz, sz, 0.15))), []);
  const toolMat = useMemo(() => new LineBasicMaterial({ color: "#8fc4ff", transparent: true, opacity: 0 }), []);
  const panelMat = useMemo(() => new MeshBasicMaterial({ color: "#7fc8ff", transparent: true, opacity: 0, depthWrite: false }), []);
  const panelEdge = useMemo(() => new LineBasicMaterial({ color: "#bfe4ff", transparent: true, opacity: 0 }), []);
  const panelGeo = useMemo(() => new EdgesGeometry(createBeveledBox(9, 5.5, 0.05, 0.02)), []);
  const hubMatRef = useRef<ShaderMaterial | null>(null);
  const toolMatRef = useRef<LineBasicMaterial | null>(null);
  const panelMatRef = useRef<MeshBasicMaterial | null>(null);
  const panelEdgeRef = useRef<LineBasicMaterial | null>(null);

  useEffect(() => {
    hubMatRef.current = hubMat;
    toolMatRef.current = toolMat;
    panelMatRef.current = panelMat;
    panelEdgeRef.current = panelEdge;
    return () => {
      hubMatRef.current = null;
      toolMatRef.current = null;
      panelMatRef.current = null;
      panelEdgeRef.current = null;
      hubMat.dispose();
      hubGeo.dispose();
      toolGeos.forEach((g) => g.dispose());
      toolMat.dispose();
      panelMat.dispose();
      panelEdge.dispose();
      panelGeo.dispose();
    };
  }, [hubMat, hubGeo, toolGeos, toolMat, panelMat, panelEdge, panelGeo]);

  useFrame(() => {
    if (!active) return;
    const currentHubMat = hubMatRef.current;
    const currentToolMat = toolMatRef.current;
    const currentPanelMat = panelMatRef.current;
    const currentPanelEdge = panelEdgeRef.current;
    if (!currentHubMat || !currentToolMat || !currentPanelMat || !currentPanelEdge) return;
    const u = currentHubMat.uniforms;
    u.uTime.value = engineTime.elapsed;
    u.uEnergy.value = s.hub * (1 - 0.6 * s.handoff);
    u.uPulse.value = 0;
    currentToolMat.opacity = 0.75 * s.reveal * (1 - 0.7 * s.handoff);
    currentPanelMat.opacity = 0.07 * s.panels;
    currentPanelEdge.opacity = 0.6 * s.panels;
  });

  return (
    <group>
      <mesh geometry={hubGeo} material={hubMat} />
      {TOOLS.map(([x, y, z], i) => (
        <lineSegments
          key={i}
          geometry={toolGeos[i]}
          material={toolMat}
          position={[x, y, z]}
        />
      ))}
      {/* limited holographic panels: two only, decorative */}
      {[
        [-24, 13, 4],
        [25, 9, 8],
      ].map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]} rotation={[0, i === 0 ? 0.5 : -0.5, 0]}>
          <mesh material={panelMat}>
            <planeGeometry args={[9, 5.5]} />
          </mesh>
          <lineSegments geometry={panelGeo} material={panelEdge} />
        </group>
      ))}
      <NetworkField
        graph={GRAPHS.spokes}
        colorBase="#4f8fd0"
        colorPulse="#ffe0b0"
        nodeSize={0.9}
        active={active}
        updateEdges={(u) => {
          u.uLevel.value = s.flow * (1 - 0.7 * s.handoff);
          u.uFront.value = 1.3;
          u.uBase.value = 0.3;
          u.uFlowSpeed.value = 0.55;
        }}
        updateNodes={(u) => {
          u.uFront.value = 1.3;
          u.uVisible.value = s.reveal;
          u.uOpacity.value = 0.9 * s.flow;
        }}
        seed={901}
      />
      <NetworkField
        graph={GRAPHS.fabric}
        colorBase="#6aa0d8"
        colorPulse="#ffe8c8"
        nodeSize={0.01}
        active={active}
        updateEdges={(u) => {
          u.uLevel.value = s.fabric * (1 - 0.6 * s.handoff);
          u.uFront.value = 1.3;
          u.uBase.value = 0.35;
          u.uFlowSpeed.value = 0.25;
        }}
        updateNodes={(u) => {
          u.uOpacity.value = 0;
        }}
        seed={911}
      />
    </group>
  );
}
