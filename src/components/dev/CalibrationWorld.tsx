"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Object3D, SphereGeometry, type Group, type InstancedMesh } from "three";
import { useRenderControls } from "@/components/engine/useRenderControls";
import { AccentPoint, KeyLight, RimLight } from "@/components/world/lights";
import { engineTime } from "@/lib/animation/time";
import { createSeededRandom } from "@/lib/random/seeded";
import { clearCameraIntent, submitCameraIntent } from "@/lib/three/camera/intent-bus";
import { sceneLifecycle } from "@/lib/three/lifecycle/scene-lifecycle";
import { HUMAN_REFERENCE_HEIGHT, WORLD_BACKGROUND } from "@/lib/three/world/conventions";
import { useEngineStore } from "@/state/engine-store";
import { useExperienceStore } from "@/state/experience-store";
import type { CameraIntent } from "@/types/camera";

/**
 * DEVELOPMENT-ONLY engineering testbed. NOT a chapter, NOT a production scene: it uses the lifecycle key
 * "DEV-CALIBRATION" and must never be given a RISE-xx ID. Procedural geometry only; no assets.
 * Exercises: scale (1 m cube, 1.8 m pole), PBR response (metal/rough/semi-gloss/matte/emissive), light
 * falloff (point light + instanced row), fog, environment, shadows, depth, resize/DPR, lifecycle, instancing,
 * delta-time animation. Every numeric value here is a UNVERIFIED test setting.
 */
const KEY = "DEV-CALIBRATION" as const;
const ROW_COUNT = 12;

/** Submitted through the camera intent bus (exercises arbitration); the CameraRig is still the only camera writer. */
const CALIBRATION_CAMERA: CameraIntent = { position: [0, 3.2, 10], target: [0, 0.6, 0], fov: 45, near: 0.1, far: 200 };

export default function CalibrationWorld() {
  const controls = useRenderControls();
  const reducedMotion = useExperienceStore((s) => s.reducedMotion);
  const invalidate = useThree((s) => s.invalidate);
  const orbit = useRef<Group>(null);
  const row = useRef<InstancedMesh>(null);

  // Lifecycle: exercise registered -> ready -> active -> released.
  useLayoutEffect(() => {
    sceneLifecycle.register(KEY);
    sceneLifecycle.transition(KEY, "ready");
    sceneLifecycle.transition(KEY, "active");
    return () => {
      sceneLifecycle.transition(KEY, "released");
    };
  }, []);

  useLayoutEffect(() => {
    submitCameraIntent("choreography", CALIBRATION_CAMERA);
    return () => clearCameraIntent("choreography");
  }, []);

  // World configuration: procedural environment + light exponential fog. Restored on exit.
  useEffect(() => {
    const store = useEngineStore.getState();
    store.setEnvironment({ kind: "procedural-room" });
    store.setAtmosphere({ kind: "exp2", color: WORLD_BACKGROUND, density: 0.035 });
    return () => {
      const s = useEngineStore.getState();
      s.setEnvironment({ kind: "none" });
      s.setAtmosphere(null);
    };
  }, []);

  // Continuous rendering only while something animates (and never under reduced motion).
  useEffect(() => {
    if (reducedMotion) return;
    return useEngineStore.getState().acquireContinuous();
  }, [reducedMotion]);

  // Shared geometry (owned here -> disposed here). Segment count follows the quality controls.
  const sphereGeometry = useMemo(() => {
    const segments = Math.max(8, Math.round(48 * controls.geometryDetail));
    return new SphereGeometry(0.5, segments, Math.max(6, Math.round(segments / 2)));
  }, [controls.geometryDetail]);
  useEffect(() => () => sphereGeometry.dispose(), [sphereGeometry]);

  // Instanced falloff row: deterministic layout from a seed.
  useLayoutEffect(() => {
    const mesh = row.current;
    if (!mesh) return;
    const random = createSeededRandom(1337);
    const dummy = new Object3D();
    for (let i = 0; i < ROW_COUNT; i += 1) {
      const s = 0.3 + random() * 0.2;
      dummy.position.set(-5.5 + i, s / 2, -3);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
    invalidate();
  }, [invalidate]);

  // Delta/time-based motion via engineTime (no React state). Static under reduced motion.
  useFrame(() => {
    const g = orbit.current;
    if (!g) return;
    const angle = reducedMotion ? 0 : engineTime.elapsed * 0.4;
    g.position.set(Math.cos(angle) * 3, 2.2, Math.sin(angle) * 3 - 1);
  });

  return (
    <group>
      <KeyLight position={[4, 6, 5]} castShadow />
      <RimLight position={[-5, 3, -6]} />
      <group ref={orbit}>
        <AccentPoint />
        <mesh>
          <sphereGeometry args={[0.08, 12, 8]} />
          <meshBasicMaterial color="#ffd9a8" toneMapped={false} />
        </mesh>
      </group>

      {/* Floor + neutral grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color="#15181d" roughness={0.85} metalness={0} />
      </mesh>
      <gridHelper args={[24, 24, "#2a3340", "#1a2028"]} position={[0, 0.002, 0]} />

      {/* Material vocabulary (sphere = 1 m diameter) */}
      <mesh geometry={sphereGeometry} position={[-3, 0.5, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#c8d0da" metalness={1} roughness={0.15} />
      </mesh>
      <mesh geometry={sphereGeometry} position={[-1.5, 0.5, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#c8d0da" metalness={1} roughness={0.6} />
      </mesh>
      <mesh geometry={sphereGeometry} position={[0, 0.5, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#8a97a8" metalness={0} roughness={0.35} />
      </mesh>
      <mesh position={[1.5, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#8a97a8" metalness={0} roughness={0.95} />
      </mesh>
      <mesh position={[3, 0.5, 0]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#05080c" emissive="#6cc8ff" emissiveIntensity={3} roughness={0.5} />
      </mesh>

      {/* Scale markers: 1 m wireframe cube and a 1.8 m reference pole with 0.5 m ticks */}
      <mesh position={[-4.8, 0.5, 2]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial wireframe color="#6cc8ff" />
      </mesh>
      <mesh position={[-4.8, HUMAN_REFERENCE_HEIGHT / 2, 3.5]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, HUMAN_REFERENCE_HEIGHT, 12]} />
        <meshStandardMaterial color="#c8d0da" metalness={0.2} roughness={0.5} />
      </mesh>
      {[0.5, 1, 1.5].map((y) => (
        <mesh key={y} position={[-4.8, y, 3.5]}>
          <boxGeometry args={[0.25, 0.02, 0.02]} />
          <meshBasicMaterial color="#6cc8ff" />
        </mesh>
      ))}

      {/* Instanced light-falloff row (one geometry, one material, ROW_COUNT instances) */}
      <instancedMesh ref={row} args={[undefined, undefined, ROW_COUNT]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#9aa5b4" metalness={0} roughness={0.6} />
      </instancedMesh>
    </group>
  );
}
