import { gsap } from "@/lib/animation/gsap";
import { normalizeProgress } from "@/lib/animation/math";
import {
  applyFraming,
  createCameraIntentWriter,
  createCameraSample,
  sampleCameraTrack,
} from "@/lib/choreography/camera-track";
import { emitCue } from "@/lib/choreography/cues";
import { addChannelTweens, type Keyframe } from "@/lib/choreography/keyframes";
import { postParams } from "@/lib/choreography/post-params";
import type { ChoreographyContext, SceneChoreography } from "@/lib/choreography/types";
import { sceneOrder } from "@/content/chapters";
import { diagnosticsSnapshot } from "@/lib/three/diagnostics/snapshot";
import { HERO_BEATS, beatIndexAt, energyStage, heroState, resetHeroState, type HeroState } from "./hero-state";
import {
  HERO_CAMERA_LENS,
  HERO_FOCUS,
  HERO_FRAMING,
  HERO_SHOT_KEYS,
  HERO_SHOT_KEYS_REDUCED,
  HERO_TRACK,
  HERO_TRACK_REDUCED,
} from "./hero-shots";

/**
 * HeroChoreography: the Hero owns its own animation composition. ONE timeline (duration 1 = normalized
 * Hero progress) contains: state channels, post-processing parameters, DOM title/captions/readouts, cues.
 * The choreographer attaches the single ScrollTrigger; camera is sampled from the SAME smoothed progress in
 * onProgress and submitted through the intent bus (CameraRig stays the only camera writer).
 *
 * Pacing: stillness -> activity -> stillness -> activation -> peak -> calm. Guideposts (HERO_BEATS):
 * 0 void · .10 signal · .22 structure · .42 power · .62 awakening · .82 peak · .92 title · 1.0 handoff.
 * Every keyframe value below is an authored design value, not tuned in a browser (UNVERIFIED).
 */

const HERO_CHANNELS: Partial<Record<keyof HeroState, readonly Keyframe[]>> = {
  reveal: [[0, 0], [0.07, 0.015], [0.16, 0.04], [0.22, 0.16], [0.34, 0.34], [0.46, 0.5], [0.62, 0.7], [0.78, 0.92], [0.84, 1], [1, 1]],
  power: [[0, 0], [0.36, 0], [0.44, 0.25], [0.62, 1], [1, 1]],
  energy: [[0, 0], [0.05, 0.03], [0.1, 0.14], [0.18, 0.14], [0.3, 0.16], [0.44, 0.34], [0.62, 0.68], [0.82, 1], [0.9, 0.86], [1, 0.62]],
  mechanical: [[0, 0], [0.3, 0], [0.46, 0.35], [0.66, 0.8], [0.84, 1], [1, 1]],
  particles: [[0, 0.2], [0.1, 0.3], [0.42, 0.5], [0.82, 1], [1, 0.6]],
  atmosphere: [[0, 0], [0.5, 0.5], [0.84, 1], [1, 1]],
  handoff: [[0, 0], [0.92, 0], [1, 1]],
};

/** Hero-local post values. Copied into the shared postParams ONLY while the Hero is the active scene (no cross-scene writes). */
const heroPost = { bloom: 0.15, dof: 0 };
const POST_CHANNELS: Partial<Record<keyof typeof heroPost, readonly Keyframe[]>> = {
  bloom: [[0, 0.15], [0.4, 0.3], [0.62, 0.7], [0.82, 1], [0.92, 0.6], [1, 0.45]],
  // DOF only supports the core inspection; the wide reveal is sharp.
  dof: [[0, 0], [0.5, 0], [0.62, 0.5], [0.7, 1], [0.78, 0.35], [0.84, 0], [1, 0]],
};

/** Energy pulse waves [start, end]: front travels core -> outer layers; between waves it rests at 1 (passed). */
const PULSE_WAVES: readonly (readonly [number, number])[] = [
  [0.4, 0.47],
  [0.55, 0.62],
  [0.66, 0.74],
  [0.78, 0.85],
  [0.9, 0.96],
];

const BEAT_WINDOWS: Record<string, { in?: readonly [number, number]; out?: readonly [number, number] }> = {
  void: { out: [0.07, 0.1] },
  signal: { in: [0.11, 0.14], out: [0.2, 0.23] },
  structure: { in: [0.25, 0.29], out: [0.38, 0.41] },
  power: { in: [0.44, 0.47], out: [0.58, 0.61] },
  awakening: { in: [0.64, 0.68], out: [0.78, 0.82] },
};

function fadeIn(tl: gsap.core.Timeline, el: Element | null, [a, b]: readonly [number, number], from: gsap.TweenVars = {}, to: gsap.TweenVars = {}) {
  if (!el) return;
  tl.fromTo(el, { opacity: 0, ...from }, { opacity: 1, ...to, duration: b - a, ease: "power2.out", immediateRender: true }, a);
}

function fadeOut(tl: gsap.core.Timeline, el: Element | null, [a, b]: readonly [number, number]) {
  if (!el) return;
  tl.fromTo(el, { opacity: 1 }, { opacity: 0, duration: b - a, ease: "power2.in", immediateRender: false }, a);
}

export const heroChoreography: SceneChoreography = {
  sceneId: "RISE-01-AWAKENING",
  regionSelector: "#intro",
  scrub: 0.6,

  build(ctx: ChoreographyContext) {
    const reduced = ctx.reducedMotion;
    const tl = gsap.timeline({ paused: true, defaults: { ease: "none" } });
    resetHeroState();

    // 1. scene state + post parameters (progress-derived, reversible)
    addChannelTweens(tl, heroState, HERO_CHANNELS);
    addChannelTweens(tl, heroPost, POST_CHANNELS);
    PULSE_WAVES.forEach(([a, b], i) => {
      tl.fromTo(heroState, { pulse: 0 }, { pulse: 1, duration: b - a, ease: "power2.inOut", immediateRender: i === 0 }, a);
    });
    heroState.pulse = 0;

    // 2. DOM: captions, title card, readout (semantic content stays in the DOM; opacity/transform only)
    const q = ctx.query;
    Object.entries(BEAT_WINDOWS).forEach(([id, w]) => {
      const el = q(`[data-hero-beat="${id}"]`);
      if (w.in) fadeIn(tl, el, w.in, reduced ? {} : { y: 10 }, reduced ? {} : { y: 0 });
      if (w.out) fadeOut(tl, el, w.out);
    });
    fadeOut(tl, q('[data-hero="scroll-cue"]'), [0.02, 0.06]);
    fadeIn(tl, q('[data-hero="readout"]'), [0.44, 0.5]);
    fadeOut(tl, q('[data-hero="readout"]'), [0.84, 0.88]);
    fadeIn(tl, q('[data-hero="system"]'), [0.84, 0.9]);

    // Title card: opacity + transform + tracking + blur reduction. Restrained; the machine stays dominant.
    fadeIn(
      tl,
      q('[data-hero="title"]'),
      [0.86, 0.93],
      reduced ? {} : { y: 14, filter: "blur(12px)", letterSpacing: "0.14em" },
      reduced ? {} : { y: 0, filter: "blur(0px)", letterSpacing: "-0.02em" },
    );
    fadeIn(
      tl,
      q('[data-hero="subtitle"]'),
      [0.89, 0.95],
      reduced ? {} : { y: 8, filter: "blur(8px)", letterSpacing: "0.5em" },
      reduced ? {} : { y: 0, filter: "blur(0px)", letterSpacing: "0.3em" },
    );
    fadeIn(tl, q('[data-hero="next"]'), [0.96, 1]);

    // 3. audio cue identifiers (events only; one-way, never define visual state)
    tl.call(emitCue, ["hero:signal"], 0.1);
    tl.call(emitCue, ["hero:activation"], 0.44);
    tl.call(emitCue, ["hero:peak"], 0.82);
    tl.call(emitCue, ["hero:title"], 0.9);

    tl.set({}, {}, 1); // makes total duration exactly 1

    // 4. camera + readouts from the same smoothed progress
    const track = reduced ? HERO_TRACK_REDUCED : HERO_TRACK;
    const keys = reduced ? HERO_SHOT_KEYS_REDUCED : HERO_SHOT_KEYS;
    const sample = createCameraSample();
    const writer = createCameraIntentWriter(HERO_CAMERA_LENS);
    const nextScene = sceneOrder[1] ?? null;
    const statusEl = q('[data-hero-readout="status"]');
    const powerEl = q('[data-hero-readout="power"]');
    const coreEl = q('[data-hero-readout="core"]');
    let lastProgress = 0;
    let snapNext = true;
    let lastStatus = "";
    let lastPower = "";
    let lastCore = "";

    const STATUS: Record<string, string> = { OFF: "Offline", STANDBY: "Standby", CHARGING: "Charging", ACTIVE: "Online", PEAK: "Peak" };

    const updateCamera = (progress: number) => {
      sampleCameraTrack(track, progress, sample);
      applyFraming(sample, HERO_FRAMING[ctx.viewportClass()], HERO_FOCUS);
      ctx.submitCamera(writer.write(sample, !snapNext));
      snapNext = false;
    };

    const onProgress = (progress: number) => {
      lastProgress = progress;
      postParams.bloom = heroPost.bloom;
      postParams.dof = heroPost.dof;
      postParams.vignette = 1;
      postParams.focus[0] = HERO_FOCUS[0];
      postParams.focus[1] = HERO_FOCUS[1];
      postParams.focus[2] = HERO_FOCUS[2];
      updateCamera(progress);
      ctx.writeTransition(nextScene, normalizeProgress(progress, 0.92, 1));
      const stage = energyStage(heroState.energy);
      const status = STATUS[stage];
      const power = `${String(Math.round(heroState.energy * 100)).padStart(2, "0")}%`;
      const core = stage === "OFF" || stage === "STANDBY" ? "Inactive" : "Active";
      if (statusEl && status !== lastStatus) statusEl.textContent = (lastStatus = status);
      if (powerEl && power !== lastPower) powerEl.textContent = (lastPower = power);
      if (coreEl && core !== lastCore) coreEl.textContent = (lastCore = core);
      if (process.env.NODE_ENV !== "production") {
        diagnosticsSnapshot.heroProgress = progress;
        diagnosticsSnapshot.heroBeat = HERO_BEATS[beatIndexAt(progress)].id;
        diagnosticsSnapshot.heroShot = keys[Math.min(sample.index, keys.length - 1)].id;
        diagnosticsSnapshot.heroStage = stage;
        diagnosticsSnapshot.heroBloom = postParams.bloom;
      }
    };

    return {
      timeline: tl,
      onProgress,
      onRefresh: () => updateCamera(lastProgress), // viewport class may have changed
      onActivate: () => {
        snapNext = true; // snap to the Hero pose on (re)activation instead of gliding in from elsewhere
      },
      dispose: () => {
        resetHeroState();
      },
    };
  },
};

