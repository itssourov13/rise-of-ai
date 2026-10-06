"use client";

import { lazy, Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { CameraRig } from "@/components/camera/CameraRig";
import { EngineClock } from "@/components/engine/EngineClock";
import { RenderPipeline } from "@/components/engine/RenderPipeline";
import { RendererPolicy } from "@/components/engine/RendererPolicy";
import { SceneHost } from "@/components/scene/SceneHost";
import { ExperienceWorld } from "@/components/world/ExperienceWorld";
import { QUALITY_PROFILES } from "@/lib/performance/quality";
import { readDebugConfig } from "@/lib/three/diagnostics/debug-flags";
import { activeBackend } from "@/lib/three/renderer-backend";
import { resolveFrameloop } from "@/lib/three/renderer/frameloop";
import { useEngineStore } from "@/state/engine-store";
import { useExperienceStore } from "@/state/experience-store";
import { DEFAULT_CAMERA_INTENT } from "@/types/camera";

// Development-only tooling. The constant condition lets the bundler drop these imports in production.
const DevCanvasTools = process.env.NODE_ENV !== "production" ? lazy(() => import("@/components/dev/DevCanvasTools")) : null;
const DiagnosticsOverlay =
  process.env.NODE_ENV !== "production" ? lazy(() => import("@/components/engine/DiagnosticsOverlay")) : null;

/**
 * THE one persistent Canvas. Chapters never mount their own Canvas.
 * Composition order mirrors ownership/update order:
 *   renderer policy -> engine clock -> camera rig -> world { scene host, dev tools } -> render pipeline seam
 * The semantic DOM stays outside; the wrapper is pointer-events:none so the Canvas never blocks the DOM
 * (pointer interaction is a future opt-in, see docs/3D_ENGINE.md).
 */
export default function ExperienceCanvas() {
  const tier = useExperienceStore((s) => s.qualityTier);
  const currentSceneId = useExperienceStore((s) => s.currentSceneId);
  const continuousRequests = useEngineStore((s) => s.continuousRequests);
  const config = useMemo(() => activeBackend.createConfig(QUALITY_PROFILES[tier]), [tier]);
  const debug = useMemo(() => readDebugConfig(), []);
  const frameloop = resolveFrameloop({ continuousRequests });

  return (
    <div className="experience-canvas" aria-hidden="true">
      <Canvas
        {...config.canvas}
        frameloop={frameloop}
        camera={{
          position: [...DEFAULT_CAMERA_INTENT.position],
          fov: DEFAULT_CAMERA_INTENT.fov,
          near: DEFAULT_CAMERA_INTENT.near,
          far: DEFAULT_CAMERA_INTENT.far,
        }}
      >
        <RendererPolicy config={config} />
        <EngineClock />
        <CameraRig />
        <ExperienceWorld>
          <SceneHost />
          {DevCanvasTools && (
            <Suspense fallback={null}>
              <DevCanvasTools flags={debug.flags} diagnostics={debug.enabled} showCalibration={debug.calibration && currentSceneId === null} />
            </Suspense>
          )}
        </ExperienceWorld>
        <RenderPipeline />
      </Canvas>
      {DiagnosticsOverlay && debug.enabled && (
        <Suspense fallback={null}>
          <DiagnosticsOverlay flags={debug.flags} />
        </Suspense>
      )}
    </div>
  );
}
