import { sceneOrder } from "@/content/chapters";
import { gsap } from "@/lib/animation/gsap";
import { normalizeProgress } from "@/lib/animation/math";
import { diagnosticsSnapshot } from "@/lib/three/diagnostics/snapshot";
import type { Vec3 } from "@/types/camera";
import type { SceneId } from "@/types/experience";
import {
  applyFraming,
  compileTrack,
  createCameraIntentWriter,
  createCameraSample,
  sampleCameraTrack,
  type CameraFraming,
  type CameraKey,
} from "./camera-track";
import { addChannelTweens, type Keyframe } from "./keyframes";
import { postParams } from "./post-params";
import type { ChoreographyContext, SceneChoreography } from "./types";
import type { ViewportClass } from "./viewport";

type Window2 = readonly [number, number];

/**
 * Declarative scene choreography (Phase 06+). A scene supplies DATA; this factory builds the standard contract:
 * one paused timeline (duration 1 = normalized scene progress) with explicit fromTo channel segments (valid at ANY
 * progress, reversible), DOM beat/title/next fades, a Hermite camera track submitted through the intent bus, and
 * scene-local post parameters copied into the shared postParams ONLY while the scene is active.
 * DOM contract (SceneSection): [data-scene-beat="<id>"], [data-scene="title"], [data-scene="next"].
 * Hero and Machine keep their hand-written modules (same contract); new scenes should use this factory.
 */
export interface SceneSpec<S extends object> {
  sceneId: SceneId;
  /** Scene state object (mutable, non-reactive) + its reset function. */
  state: S;
  reset: () => void;
  channels: Partial<Record<keyof S & string, readonly Keyframe[]>>;
  /** Optional pulse channel: key in S tweened 0->1 in each wave (power/energy/flow fronts). */
  pulse?: { key: keyof S & string; waves: readonly Window2[] };
  post: { bloom: readonly Keyframe[]; dof?: readonly Keyframe[]; vignette?: readonly Keyframe[] };
  focus: Vec3;
  shots: readonly CameraKey[];
  shotsReduced: readonly CameraKey[];
  framing: Readonly<Record<ViewportClass, CameraFraming>>;
  lens?: { near: number; far: number; damping: number };
  beats: Record<string, { in?: Window2; out?: Window2 }>;
  titleOut?: Window2;
  nextIn?: Window2;
  /** Progress range over which transitionState advances toward the next scene. */
  handoff?: Window2;
  beatAt?: (progress: number) => string;
  scrub?: number;
}

const DEFAULT_LENS = { near: 0.4, far: 400, damping: 5 } as const;

function fade(tl: gsap.core.Timeline, el: Element | null, w: { in?: Window2; out?: Window2 }, rise: boolean): void {
  if (!el) return;
  if (w.in) {
    const [a, b] = w.in;
    tl.fromTo(el, { opacity: 0, y: rise ? 10 : 0 }, { opacity: 1, y: 0, duration: b - a, ease: "power2.out", immediateRender: true }, a);
  }
  if (w.out) {
    const [a, b] = w.out;
    tl.fromTo(el, { opacity: 1 }, { opacity: 0, duration: b - a, ease: "power2.in", immediateRender: false }, a);
  }
}

export function createSceneChoreography<S extends object>(spec: SceneSpec<S>): SceneChoreography {
  return {
    sceneId: spec.sceneId,
    regionSelector: `[data-scene-id="${spec.sceneId}"]`,
    scrub: spec.scrub ?? 0.6,
    build(ctx: ChoreographyContext) {
      const reduced = ctx.reducedMotion;
      const tl = gsap.timeline({ paused: true, defaults: { ease: "none" } });
      spec.reset();
      addChannelTweens(tl, spec.state, spec.channels);

      if (spec.pulse) {
        const record = spec.state as Record<string, number>;
        spec.pulse.waves.forEach(([a, b], i) => {
          tl.fromTo(record, { [spec.pulse!.key]: 0 }, { [spec.pulse!.key]: 1, duration: b - a, ease: "power2.inOut", immediateRender: i === 0 }, a);
        });
        record[spec.pulse.key] = 0;
      }

      const local = { bloom: 0.3, dof: 0, vignette: 1 };
      addChannelTweens(tl, local, { bloom: spec.post.bloom, dof: spec.post.dof, vignette: spec.post.vignette });

      Object.entries(spec.beats).forEach(([id, w]) => fade(tl, ctx.query(`[data-scene-beat="${id}"]`), w, !reduced));
      if (spec.titleOut) fade(tl, ctx.query('[data-scene="title"]'), { out: spec.titleOut }, false);
      if (spec.nextIn) fade(tl, ctx.query('[data-scene="next"]'), { in: spec.nextIn }, false);
      tl.set({}, {}, 1);

      const track = compileTrack(reduced ? spec.shotsReduced : spec.shots);
      const keys = reduced ? spec.shotsReduced : spec.shots;
      const sample = createCameraSample();
      const writer = createCameraIntentWriter(spec.lens ?? DEFAULT_LENS);
      const idx = sceneOrder.indexOf(spec.sceneId);
      const next = sceneOrder[idx + 1] ?? null;
      let last = 0;
      let snap = true;

      const updateCamera = (p: number) => {
        sampleCameraTrack(track, p, sample);
        applyFraming(sample, spec.framing[ctx.viewportClass()], spec.focus);
        ctx.submitCamera(writer.write(sample, !snap));
        snap = false;
      };

      return {
        timeline: tl,
        onProgress: (p: number) => {
          last = p;
          postParams.bloom = local.bloom;
          postParams.dof = local.dof;
          postParams.vignette = local.vignette;
          postParams.focus[0] = spec.focus[0];
          postParams.focus[1] = spec.focus[1];
          postParams.focus[2] = spec.focus[2];
          updateCamera(p);
          if (spec.handoff) ctx.writeTransition(next, normalizeProgress(p, spec.handoff[0], spec.handoff[1]));
          if (process.env.NODE_ENV !== "production") {
            diagnosticsSnapshot.heroProgress = p;
            diagnosticsSnapshot.heroBeat = spec.beatAt?.(p) ?? "-";
            diagnosticsSnapshot.heroShot = keys[Math.min(sample.index, keys.length - 1)].id;
            diagnosticsSnapshot.heroStage = spec.sceneId;
            diagnosticsSnapshot.heroBloom = postParams.bloom;
          }
        },
        onRefresh: () => updateCamera(last),
        onActivate: () => {
          snap = true;
        },
        dispose: spec.reset,
      };
    },
  };
}

/** Shared helper for state modules: a reset function from a REST snapshot. */
export function makeState<S extends object>(rest: Readonly<S>): { state: S; reset: () => void } {
  const state = { ...rest } as S;
  return { state, reset: () => void Object.assign(state, rest) };
}

/** Shared framing presets for open-space point/network scenes. */
export const OPEN_FRAMING: Readonly<Record<ViewportClass, CameraFraming>> = {
  desktop: { distance: 1, focusBias: 0, fovAdd: 0 },
  tablet: { distance: 1.08, focusBias: 0.1, fovAdd: 2 },
  mobile: { distance: 1.3, focusBias: 0.2, fovAdd: 6 },
};

/** Evenly spaced beat fade windows between `start` and `end` (each beat fades in, holds, fades out). */
export function beatWindows(ids: readonly string[], start: number, end: number, fade = 0.035): Record<string, { in: Window2; out: Window2 }> {
  const seg = (end - start) / ids.length;
  const out: Record<string, { in: Window2; out: Window2 }> = {};
  ids.forEach((id, i) => {
    const s0 = start + i * seg;
    out[id] = { in: [s0, s0 + fade], out: [s0 + seg - fade, s0 + seg] };
  });
  return out;
}

/** Equal-spacing camera keys from compact tuples: [at, px,py,pz, tx,ty,tz, fov]. */
export function keys(id: string, rows: readonly (readonly [number, number, number, number, number, number, number, number])[]): CameraKey[] {
  return rows.map(([at, px, py, pz, tx, ty, tz, fov], i) => ({ id: `${id}-${String(i + 1).padStart(2, "0")}`, at, position: [px, py, pz], target: [tx, ty, tz], fov }));
}
