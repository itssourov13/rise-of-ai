import {
  BoxGeometry,
  BufferGeometry,
  CatmullRomCurve3,
  CircleGeometry,
  CylinderGeometry,
  MeshStandardMaterial,
  Texture,
  TubeGeometry,
  Vector3,
  type Material,
  type ShaderMaterial,
} from "three";
import { createEnergyCoreMaterial } from "@/lib/three/shaders/energy-core";
import { createBrushedRoughness } from "@/lib/three/textures/brushed";
import { createBeveledBox, createRing } from "@/lib/three/geometry/procedural";
import { HERO, HERO_COLORS } from "./hero-constants";

/**
 * All shared Hero geometry, materials and procedural textures, created ONCE per scene mount and disposed by
 * the scene that owns them (kit.dispose()). Repeated parts share one geometry + one material and are drawn
 * with InstancedMesh. No external asset is referenced: the whole machine is procedural and can later be
 * replaced by a GLB through the asset registry (see docs/3D_ENGINE.md, Hero section).
 *
 * `detail` is RenderControls.geometryDetail (0.25..1.25): it scales radial segment counts only.
 * All dimensions/material values are authored, not measured (UNVERIFIED).
 */

function strip(): MeshStandardMaterial {
  // Dark base so the strip reads as an inset light channel; emissive intensity is animated by ActivationSystem.
  return new MeshStandardMaterial({ color: "#07090c", roughness: 0.55, metalness: 0.2, emissive: HERO_COLORS.emissiveCool, emissiveIntensity: 0 });
}

function indicator(color: string): MeshStandardMaterial {
  return new MeshStandardMaterial({ color: "#07090c", roughness: 0.5, metalness: 0.1, emissive: color, emissiveIntensity: 0 });
}

export function createHeroKit(detail: number) {
  const seg = (n: number) => Math.max(12, Math.round(n * detail));
  const brushed = createBrushedRoughness(3, 3, 1101);
  const floorRough = createBrushedRoughness(36, 36, 2207);

  const mat = {
    // Dark anodized alloy: primary macro material.
    alloyDark: new MeshStandardMaterial({ color: "#1b1e23", metalness: 0.85, roughness: 0.42 }),
    // Brushed lighter metal: secondary (collars, rings), roughness varies via the procedural map.
    alloyBrushed: new MeshStandardMaterial({ color: "#3b4048", metalness: 0.9, roughness: 1, roughnessMap: brushed }),
    // Near-black structural alloy.
    alloyDeep: new MeshStandardMaterial({ color: "#101215", metalness: 0.75, roughness: 0.58 }),
    // Non-metal matte panels for material hierarchy.
    panel: new MeshStandardMaterial({ color: "#15171b", metalness: 0.25, roughness: 0.78 }),
    floor: new MeshStandardMaterial({ color: "#0c0e11", metalness: 0.85, roughness: 1, roughnessMap: floorRough }),
    /** Emissive channels, one material per pulse layer (index = layer). */
    strips: [strip(), strip(), strip(), strip()] as MeshStandardMaterial[],
    /** Indicator groups switch on in stages (steady, never random blinking). */
    indicators: [indicator(HERO_COLORS.emissiveCool), indicator(HERO_COLORS.emissiveCool), indicator(HERO_COLORS.statusWarm)] as MeshStandardMaterial[],
    core: createEnergyCoreMaterial(HERO_COLORS.emissiveCool, HERO_COLORS.coreHot) as ShaderMaterial,
  };

  const unit = new BoxGeometry(1, 1, 1);
  const cablePath = new CatmullRomCurve3([new Vector3(14, 2.1, 0), new Vector3(13.6, 4.2, 0.3), new Vector3(12.4, 6.4, -0.2), new Vector3(11.2, 8.4, 0.2)]);

  const geo = {
    unit,
    // core
    coreCylinder: new CylinderGeometry(HERO.core.radius, HERO.core.radius, HERO.core.y1 - HERO.core.y0, seg(40), 1, true),
    coreCap: new CylinderGeometry(1.45, 1.5, 0.3, seg(40)),
    coreCollar: new CylinderGeometry(1.3, 1.3, 0.14, seg(40)),
    // housing
    fin: createBeveledBox(1.0, HERO.housing.y1 - HERO.housing.y0, 0.9, 0.08),
    collarTop: createRing(2.6, 4.6, 0.8, 0.12, seg(64)),
    collarBottom: createRing(2.4, 4.8, 1.0, 0.14, seg(64)),
    collarStrip: createRing(3.5, 3.65, 0.04, 0.01, seg(64)),
    // rings (per ring: body + strip)
    ringBodies: HERO.rings.map((r) => createRing(r.inner, r.outer, r.height, 0.12, seg(96))),
    ringStrips: HERO.rings.map((r) => createRing((r.inner + r.outer) / 2 - 0.09, (r.inner + r.outer) / 2 + 0.09, 0.05, 0.01, seg(96))),
    bolt: new CylinderGeometry(0.11, 0.11, 0.1, 8),
    slat: createBeveledBox(0.7, 0.1, 0.06, 0.015),
    // base / floor / catwalk
    baseSlab: new CylinderGeometry(HERO.base.radius, HERO.base.radius + 0.8, HERO.base.thickness, 8),
    platform: new CylinderGeometry(HERO.base.platformRadius, HERO.base.platformRadius + 0.6, HERO.base.platformHeight, seg(64)),
    floor: new CircleGeometry(130, seg(64)),
    tile: createBeveledBox(2.2, 0.12, 3.2, 0.03),
    catwalk: createRing(15.2, 16.0, 0.12, 0.02, seg(96)),
    railRing: createRing(15.88, 15.96, 0.06, 0.01, seg(96)),
    post: new BoxGeometry(0.05, 1, 0.05),
    // structure
    column: createBeveledBox(HERO.columns.size, HERO.columns.height, HERO.columns.size, 0.12),
    arm: createBeveledBox(HERO.arms.to - HERO.arms.from, 1.2, 1.2, 0.08),
    strut: createBeveledBox(12.6, 0.9, 0.9, 0.06),
    beam: createBeveledBox(HERO.gantry.outer * 2, 1, 1, 0.06),
    gantry: createRing(HERO.gantry.inner, HERO.gantry.outer, HERO.gantry.height, 0.15, seg(96)),
    gantryStrip: createRing((HERO.gantry.inner + HERO.gantry.outer) / 2 - 0.1, (HERO.gantry.inner + HERO.gantry.outer) / 2 + 0.1, 0.05, 0.01, seg(96)),
    shutter: createBeveledBox(0.18, 6, 1.6, 0.03),
    indicator: new BoxGeometry(0.28, 0.28, 0.1),
    rung: new BoxGeometry(0.8, 0.04, 0.04),
    ladderRail: new BoxGeometry(0.05, 12, 0.05),
    // cooling
    coolBlock: createBeveledBox(2.2, 4, 3.2, 0.08),
    coolFin: new BoxGeometry(1.2, 3.2, 0.07),
    fanHousing: createRing(1.0, 1.25, 0.3, 0.05, seg(32)),
    fanHub: new CylinderGeometry(0.3, 0.3, 0.22, 16),
    fanBlade: new BoxGeometry(1, 0.03, 0.3),
    duct: createRing(3.0, 3.5, 5.7, 0.1, seg(64)),
    cable: new TubeGeometry(cablePath, 24, 0.14, 6, false),
  };

  const textures: Texture[] = [brushed, floorRough];

  const allMaterials = (): Material[] => [
    mat.alloyDark, mat.alloyBrushed, mat.alloyDeep, mat.panel, mat.floor, ...mat.strips, ...mat.indicators, mat.core,
  ];

  return {
    geo,
    mat,
    /** Disposes everything this kit created. The scene that owns the kit calls it on unmount. */
    dispose() {
      (Object.values(geo) as (BufferGeometry | BufferGeometry[])[]).forEach((g) => (Array.isArray(g) ? g.forEach((x) => x.dispose()) : g.dispose()));
      allMaterials().forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
    },
  };
}

export type HeroKit = ReturnType<typeof createHeroKit>;
