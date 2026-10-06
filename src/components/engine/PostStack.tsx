"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Bloom, DepthOfField, EffectComposer, Noise, ToneMapping, Vignette } from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import { Vector3 } from "three";
import { postParams } from "@/lib/choreography/post-params";
import { diagnosticsSnapshot } from "@/lib/three/diagnostics/snapshot";
import type { PostPlan } from "@/lib/three/renderer/post-processing";

/** Minimal shapes of the effect instances we tweak per frame (property names from postprocessing 6.x; UNVERIFIED typings). */
interface BloomLike { intensity: number }
interface DofLike { bokehScale: number; target: Vector3 | null }  // postprocessing DepthOfFieldEffect: bokehScale setter + target (null = autofocus off)
interface VignetteLike { darkness: number }

/**
 * THE post-processing boundary (lazy-loaded by RenderPipeline; nothing else imports @react-three/postprocessing).
 * Effect set is fixed by the plan; per-frame animation only scales intensities from `postParams` through refs
 * (no React state, no mounting/unmounting of effects). The composer takes over rendering (renderPriority 1);
 * R3F's loop is still the only loop. NOT RUNTIME VERIFIED.
 */
export default function PostStack({ plan }: { plan: PostPlan }) {
  const bloom = useRef<BloomLike | null>(null);
  const dof = useRef<DofLike | null>(null);
  const vignette = useRef<VignetteLike | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const parts = [plan.bloom && "bloom", plan.dof && "dof", plan.vignette && "vignette", plan.noise && "noise", "tonemap(ACES)"].filter(Boolean);
    diagnosticsSnapshot.postState = `${parts.join("+")}  msaa ${plan.multisampling}`;
    return () => {
      diagnosticsSnapshot.postState = "off";
    };
  }, [plan]);

  useFrame(() => {
    if (bloom.current && plan.bloom) bloom.current.intensity = plan.bloom.intensity * postParams.bloom;
    if (dof.current && plan.dof) {
      dof.current.bokehScale = plan.dof.bokehScale * postParams.dof;
      // The `target` prop below makes the R3F wrapper create the Vector3 (autofocus on); we only move it.
      dof.current.target?.set(postParams.focus[0], postParams.focus[1], postParams.focus[2]);
    }
    if (vignette.current && plan.vignette) vignette.current.darkness = plan.vignette.darkness * postParams.vignette;
  });

  const { bloom: b, dof: d, vignette: v, noise: n } = plan;
  return (
    <EffectComposer multisampling={plan.multisampling} enableNormalPass={false}>
      <>
        {b && (
          <Bloom
            ref={bloom as never}
            intensity={b.intensity * postParams.bloom}
            luminanceThreshold={b.threshold}
            luminanceSmoothing={b.smoothing}
            mipmapBlur
            radius={b.radius}
            levels={b.levels}
          />
        )}
        {d && <DepthOfField ref={dof as never} target={[0, 0, 0]} bokehScale={0} resolutionScale={d.resolutionScale} focusRange={d.focusRange} />}
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        {v && <Vignette ref={vignette as never} offset={v.offset} darkness={v.darkness} eskil={false} blendFunction={BlendFunction.NORMAL} />}
        {n && <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={n.opacity} />}
      </>
    </EffectComposer>
  );
}
