"use client";

import { useEffect } from "react";
import { useRenderControls } from "@/components/engine/useRenderControls";
import { registerLight } from "@/lib/three/world/lighting-budget";

type Vec3 = readonly [number, number, number];

/**
 * Reusable light primitives. They register with the lighting census (budget diagnostics) and only cast
 * shadows when BOTH requested and enabled by the current quality tier. These are building blocks,
 * not a final rig. Intensities are in three's physical units; defaults are UNVERIFIED starting points.
 */
export function KeyLight({
  position,
  color = "#ffffff",
  intensity = 2.5,
  castShadow = false,
  shadowExtent = 8,
}: {
  position: Vec3;
  color?: string;
  intensity?: number;
  castShadow?: boolean;
  shadowExtent?: number;
}) {
  const { shadows } = useRenderControls();
  const casts = castShadow && shadows.enabled;
  useEffect(() => registerLight("essential", casts), [casts]);
  return (
    <directionalLight
      position={[...position]}
      color={color}
      intensity={intensity}
      castShadow={casts}
      shadow-mapSize={[shadows.mapSize || 1, shadows.mapSize || 1]}
      shadow-camera-left={-shadowExtent}
      shadow-camera-right={shadowExtent}
      shadow-camera-top={shadowExtent}
      shadow-camera-bottom={-shadowExtent}
      shadow-bias={-0.0004}
    />
  );
}

/** Non-shadowing directional light for edge definition. */
export function RimLight({ position, color = "#6cc8ff", intensity = 1.5 }: { position: Vec3; color?: string; intensity?: number }) {
  useEffect(() => registerLight("support", false), []);
  return <directionalLight position={[...position]} color={color} intensity={intensity} />;
}

/** Small local light with physical falloff (decay 2). Never a shadow caster here. */
export function AccentPoint({
  color = "#ffd9a8",
  intensity = 12,
  distance = 8,
}: {
  color?: string;
  intensity?: number;
  distance?: number;
}) {
  useEffect(() => registerLight("accent", false), []);
  return <pointLight color={color} intensity={intensity} distance={distance} decay={2} />;
}
