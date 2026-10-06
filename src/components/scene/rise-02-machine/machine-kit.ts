import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  InstancedBufferAttribute,
  MeshStandardMaterial,
  PlaneGeometry,
  type Material,
  type ShaderMaterial,
  type Texture,
} from "three";
import { createSeededRandom } from "@/lib/random/seeded";
import { createBeveledBox } from "@/lib/three/geometry/procedural";
import { createSignalMaterial } from "@/lib/three/shaders/signal-traces";
import { createBrushedRoughness } from "@/lib/three/textures/brushed";
import { BAYS, BOARD, MACHINE_COLORS, RACK } from "./machine-constants";

/**
 * Shared geometry, materials and procedural textures of the Machine hall. Created once per scene mount and
 * disposed by MachineScene. Per-bay emissive materials (cool strips, warm LEDs, warm ceiling strips) are the
 * "power flow" bus: the driver lights bay i when the flow front reaches it. All values authored (UNVERIFIED).
 */

export interface TraceSegment {
  x: number;
  y: number;
  length: number;
  vertical: boolean;
  dist: number;
}
export interface TraceField {
  segments: TraceSegment[];
  pads: { x: number; y: number }[];
}

/** Seeded Manhattan traces radiating from the chip to the board edge. Deterministic (module-level, once). */
export function buildTraceField(): TraceField {
  const rand = createSeededRandom(7788);
  const segments: TraceSegment[] = [];
  const pads: { x: number; y: number }[] = [];
  const half = BOARD.chip / 2;
  const maxDist = 40;
  const TRACES = 200;
  for (let i = 0; i < TRACES; i += 1) {
    const side = Math.floor(rand() * 4); // 0 right, 1 left, 2 top, 3 bottom
    const t = (rand() - 0.5) * (BOARD.chip - 1);
    let x = side === 0 ? half : side === 1 ? -half : t;
    let y = side === 2 ? half : side === 3 ? -half : t;
    let travelled = 0;
    const legs = 2 + Math.floor(rand() * 2);
    let vertical = side >= 2;
    for (let l = 0; l < legs; l += 1) {
      const dir = vertical ? (side === 3 ? -1 : side === 2 ? 1 : rand() > 0.5 ? 1 : -1) : side === 1 ? -1 : side === 0 ? 1 : rand() > 0.5 ? 1 : -1;
      const length = 2 + rand() * 6;
      const nx = vertical ? x : x + dir * length;
      const ny = vertical ? y + dir * length : y;
      if (Math.abs(nx) > BOARD.width / 2 - 1 || Math.abs(ny) > BOARD.height / 2 - 1) break;
      segments.push({ x: (x + nx) / 2, y: (y + ny) / 2, length, vertical, dist: Math.min(1, (travelled + length / 2) / maxDist) });
      travelled += length;
      x = nx;
      y = ny;
      vertical = !vertical;
    }
    pads.push({ x, y });
  }
  return { segments, pads };
}

export function createMachineKit(detail: number, field: TraceField) {
  const seg = (n: number) => Math.max(12, Math.round(n * detail));
  const brushed = createBrushedRoughness(2, 2, 3301);
  const floorRough = createBrushedRoughness(30, 90, 4409);

  const emissive = (color: string) => new MeshStandardMaterial({ color: "#07090c", roughness: 0.55, metalness: 0.2, emissive: color, emissiveIntensity: 0 });
  const perBay = (color: string) => Array.from({ length: BAYS }, () => emissive(color));

  const mat = {
    rack: new MeshStandardMaterial({ color: "#16181c", metalness: 0.8, roughness: 0.5 }),
    rackDeep: new MeshStandardMaterial({ color: "#0e1013", metalness: 0.7, roughness: 0.62 }),
    chassis: new MeshStandardMaterial({ color: "#3a3f47", metalness: 0.9, roughness: 1, roughnessMap: brushed }),
    steel: new MeshStandardMaterial({ color: "#1f2227", metalness: 0.85, roughness: 0.45 }),
    floor: new MeshStandardMaterial({ color: "#0b0d10", metalness: 0.8, roughness: 1, roughnessMap: floorRough }),
    boardBase: new MeshStandardMaterial({ color: "#0d1013", metalness: 0.35, roughness: 0.62 }),
    pad: new MeshStandardMaterial({ color: "#8a7650", metalness: 1, roughness: 0.4 }),
    chipTop: new MeshStandardMaterial({ color: "#2b2f36", metalness: 0.9, roughness: 1, roughnessMap: brushed }),
    chipGlow: emissive(MACHINE_COLORS.cool),
    bayCool: perBay(MACHINE_COLORS.cool),
    bayWarm: perBay(MACHINE_COLORS.warm),
    ceilWarm: perBay(MACHINE_COLORS.warm),
    signal: createSignalMaterial(MACHINE_COLORS.cool, MACHINE_COLORS.hot) as ShaderMaterial,
  };

  const traceGeometry = new BoxGeometry(1, 1, 1);
  traceGeometry.setAttribute("aDist", new InstancedBufferAttribute(new Float32Array(field.segments.map((s) => s.dist)), 1));

  const pad = new CylinderGeometry(0.35, 0.35, 0.12, 12);
  pad.rotateX(Math.PI / 2);

  const geo = {
    unit: new BoxGeometry(1, 1, 1),
    rack: createBeveledBox(RACK.depth, RACK.height, RACK.width, 0.06),
    vent: createBeveledBox(0.08, 0.5, 0.9, 0.015),
    led: new BoxGeometry(0.06, 0.16, 0.16),
    floor: new PlaneGeometry(64, 240),
    column: createBeveledBox(1.2, 15, 1.2, 0.08),
    beam: createBeveledBox(36, 0.9, 0.9, 0.06),
    tray: createBeveledBox(1, 0.4, 1, 0.04),
    cooler: createBeveledBox(2.6, 9.5, 6, 0.1),
    fanRing: new CylinderGeometry(1.15, 1.15, 0.12, seg(32), 1, true),
    fanHub: new CylinderGeometry(0.28, 0.28, 0.2, 12),
    fanBlade: new BoxGeometry(0.04, 0.9, 0.26),
    boardBase: createBeveledBox(BOARD.width, BOARD.height, BOARD.thickness, 0.08),
    chip: createBeveledBox(BOARD.chip, BOARD.chip, 1.2, 0.1),
    chipRim: createBeveledBox(BOARD.chip + 0.5, BOARD.chip + 0.5, 0.3, 0.05),
    trace: traceGeometry as BufferGeometry,
    pad: pad as BufferGeometry,
  };

  const textures: Texture[] = [brushed, floorRough];
  const materials = (): Material[] => [
    mat.rack, mat.rackDeep, mat.chassis, mat.steel, mat.floor, mat.boardBase, mat.pad, mat.chipTop, mat.chipGlow, mat.signal,
    ...mat.bayCool, ...mat.bayWarm, ...mat.ceilWarm,
  ];

  return {
    geo,
    mat,
    dispose() {
      Object.values(geo).forEach((g) => g.dispose());
      materials().forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
    },
  };
}

export type MachineKit = ReturnType<typeof createMachineKit>;
