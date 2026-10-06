import { sceneOrder } from "@/content/chapters";
import { gsap } from "@/lib/animation/gsap";
import { normalizeProgress } from "@/lib/animation/math";
import { applyFraming, createCameraIntentWriter, createCameraSample, sampleCameraTrack } from "@/lib/choreography/camera-track";
import { addChannelTweens, type Keyframe } from "@/lib/choreography/keyframes";
import { postParams } from "@/lib/choreography/post-params";
import type { ChoreographyContext, SceneChoreography } from "@/lib/choreography/types";
import { diagnosticsSnapshot } from "@/lib/three/diagnostics/snapshot";
import { machineBeatAt, machineState, resetMachineState, type MachineState } from "./machine-state";
import {
  MACHINE_CAMERA_LENS,
  MACHINE_FOCUS,
  MACHINE_FRAMING,
  MACHINE_SHOT_KEYS,
  MACHINE_SHOT_KEYS_REDUCED,
  MACHINE_TRACK,
  MACHINE_TRACK_REDUCED,
} from "./machine-shots";

/**
 * MachineChoreography (RISE-02-MACHINE). Same contract as the Hero: one paused timeline of duration 1 = normalized
 * scene progress, every channel a pure function of progress (explicit fromTo segments), camera sampled from the
 * same smoothed progress and submitted through the intent bus, post parameters copied only while ACTIVE.
 * Pacing: darkness -> aisle -> power flow -> lateral travel -> vertical reveal -> circuit macro -> structure dissolves to signal.
 * Keyframe values are authored design values (UNVERIFIED).
 */
const CHANNELS: Partial<Record<keyof MachineState, readonly Keyframe[]>> = {
  reveal: [[0, 0], [0.1, 0.03], [0.3, 0.2], [0.55, 0.5], [0.72, 0.8], [0.84, 0.9], [1, 0.9]],
  flow: [[0, 0], [0.16, 0], [0.32, 0.12], [0.55, 0.55], [0.78, 1], [1, 1]],
  mechanical: [[0, 0], [0.2, 0], [0.5, 0.7], [0.8, 1], [1, 1]],
  signal: [[0, 0], [0.76, 0], [0.88, 0.6], [0.95, 1], [1, 1]],
  handoff: [[0, 0], [0.88, 0], [1, 1]],
};

const PULSE_WAVES: readonly (readonly [number, number])[] = [
  [0.8, 0.88],
  [0.9, 0.96],
];

const machinePost = { bloom: 0.3, dof: 0 };
const POST_CHANNELS: Partial<Record<keyof typeof machinePost, readonly Keyframe[]>> = {
  bloom: [[0, 0.3], [0.5, 0.5], [0.84, 0.7], [0.96, 1], [1, 1]],
  dof: [[0, 0], [0.86, 0], [0.93, 0.8], [1, 1]],
};

const BEAT_WINDOWS: Record<string, { in?: readonly [number, number]; out?: readonly [number, number] }> = {
  "physical": { in: [0.12, 0.16], out: [0.24, 0.28] },
  "racks": { in: [0.3, 0.34], out: [0.44, 0.48] },
  "energy": { in: [0.5, 0.54], out: [0.64, 0.68] },
  "circuit": { in: [0.88, 0.92], out: [0.98, 1] },
};

function fade(tl: gsap.core.Timeline, el: Element | null, w: { in?: readonly [number, number]; out?: readonly [number, number] }, rise: boolean) {
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

export const machineChoreography: SceneChoreography = {
  sceneId: "RISE-02-MACHINE",
  regionSelector: "#machine",
  scrub: 0.6,

  build(ctx: ChoreographyContext) {
    const reduced = ctx.reducedMotion;
    const tl = gsap.timeline({ paused: true, defaults: { ease: "none" } });
    resetMachineState();

    addChannelTweens(tl, machineState, CHANNELS);
    addChannelTweens(tl, machinePost, POST_CHANNELS);
    PULSE_WAVES.forEach(([a, b], i) => {
      tl.fromTo(machineState, { pulse: 0 }, { pulse: 1, duration: b - a, ease: "power2.inOut", immediateRender: i === 0 }, a);
    });
    machineState.pulse = 0;

    Object.entries(BEAT_WINDOWS).forEach(([id, w]) => fade(tl, ctx.query(`[data-machine-beat="${id}"]`), w, !reduced));
    // Title card is visible at the start (fully visible without JS), then yields to the scene.
    fade(tl, ctx.query('[data-machine="title"]'), { out: [0.08, 0.14] }, false);
    fade(tl, ctx.query('[data-machine="next"]'), { in: [0.95, 1] }, false);
    tl.set({}, {}, 1);

    const track = reduced ? MACHINE_TRACK_REDUCED : MACHINE_TRACK;
    const keys = reduced ? MACHINE_SHOT_KEYS_REDUCED : MACHINE_SHOT_KEYS;
    const sample = createCameraSample();
    const writer = createCameraIntentWriter(MACHINE_CAMERA_LENS);
    const next = sceneOrder[2] ?? null;
    let last = 0;
    let snap = true;

    const updateCamera = (p: number) => {
      sampleCameraTrack(track, p, sample);
      applyFraming(sample, MACHINE_FRAMING[ctx.viewportClass()], MACHINE_FOCUS);
      ctx.submitCamera(writer.write(sample, !snap));
      snap = false;
    };

    return {
      timeline: tl,
      onProgress: (p: number) => {
        last = p;
        postParams.bloom = machinePost.bloom;
        postParams.dof = machinePost.dof;
        postParams.vignette = 1;
        postParams.focus[0] = MACHINE_FOCUS[0];
        postParams.focus[1] = MACHINE_FOCUS[1];
        postParams.focus[2] = MACHINE_FOCUS[2];
        updateCamera(p);
        ctx.writeTransition(next, normalizeProgress(p, 0.9, 1));
        if (process.env.NODE_ENV !== "production") {
          diagnosticsSnapshot.heroProgress = p;
          diagnosticsSnapshot.heroBeat = machineBeatAt(p);
          diagnosticsSnapshot.heroShot = keys[Math.min(sample.index, keys.length - 1)].id;
          diagnosticsSnapshot.heroStage = `flow ${machineState.flow.toFixed(2)}`;
          diagnosticsSnapshot.heroBloom = postParams.bloom;
        }
      },
      onRefresh: () => updateCamera(last),
      onActivate: () => {
        snap = true;
      },
      dispose: resetMachineState,
    };
  },
};
