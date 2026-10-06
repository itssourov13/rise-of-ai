import type { AudioCueId } from "@/lib/choreography/cues";
import type { SceneId } from "@/types/experience";

/**
 * Procedural ambient audio (Phase 14). NO audio files: everything is synthesized with the Web Audio API
 * (oscillators + filtered noise), so nothing is downloaded and no licenses are involved.
 * Rules: starts ONLY from a user gesture (enableAudio), defaults to OFF, fades in/out, suspends the context when off.
 * Layers: hum (two slightly detuned sines, lowpassed), air (looped filtered noise), shimmer (very quiet high sine).
 * Scene moods retune the layers smoothly (setTargetAtTime); cues are short enveloped blips.
 * All gains/frequencies are authored placeholders (UNVERIFIED, never listened to by the author).
 */
interface Mood {
  hum: number;
  humHz: number;
  air: number;
  airHz: number;
  shimmer: number;
}

const MOODS: Record<string, Mood> = {
  "RISE-01-AWAKENING": { hum: 0.05, humHz: 48, air: 0.015, airHz: 300, shimmer: 0 },
  "RISE-02-MACHINE": { hum: 0.08, humHz: 55, air: 0.06, airHz: 900, shimmer: 0.004 },
  "RISE-03-COMPUTATION": { hum: 0.06, humHz: 58, air: 0.03, airHz: 1200, shimmer: 0.006 },
  "RISE-04-PERCEPTION": { hum: 0.05, humHz: 62, air: 0.025, airHz: 1500, shimmer: 0.006 },
  "RISE-05-LEARNING": { hum: 0.05, humHz: 65, air: 0.02, airHz: 1700, shimmer: 0.008 },
  "RISE-06-LANGUAGE": { hum: 0.045, humHz: 69, air: 0.02, airHz: 1800, shimmer: 0.008 },
  "RISE-07-GENERATION": { hum: 0.05, humHz: 73, air: 0.025, airHz: 2000, shimmer: 0.01 },
  "RISE-08-REASONING": { hum: 0.03, humHz: 82, air: 0.01, airHz: 1200, shimmer: 0.004 },
  "RISE-09-AGENCY": { hum: 0.05, humHz: 73, air: 0.025, airHz: 1600, shimmer: 0.008 },
  "RISE-10-INTELLIGENCE": { hum: 0.06, humHz: 55, air: 0.035, airHz: 1400, shimmer: 0.01 },
  "RISE-11-UNKNOWN": { hum: 0.025, humHz: 41, air: 0.008, airHz: 400, shimmer: 0.002 },
};
const DEFAULT_MOOD: Mood = MOODS["RISE-01-AWAKENING"];

interface Graph {
  ctx: AudioContext;
  master: GainNode;
  humGain: GainNode;
  humOscs: OscillatorNode[];
  airGain: GainNode;
  airFilter: BiquadFilterNode;
  shimmerGain: GainNode;
  sources: AudioScheduledSourceNode[];
}

let graph: Graph | null = null;
let enabled = false;
let mood: Mood = DEFAULT_MOOD;

const MASTER_LEVEL = 0.6;

export function isAudioSupported(): boolean {
  return typeof window !== "undefined" && typeof window.AudioContext !== "undefined";
}

function build(): Graph {
  const ctx = new AudioContext();
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  const humGain = ctx.createGain();
  humGain.gain.value = 0;
  const humFilter = ctx.createBiquadFilter();
  humFilter.type = "lowpass";
  humFilter.frequency.value = 220;
  humFilter.connect(humGain);
  humGain.connect(master);
  const humOscs = [0, 0.35].map((detune) => {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = DEFAULT_MOOD.humHz + detune;
    o.connect(humFilter);
    o.start();
    return o;
  });

  const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  let seed = 12345; // deterministic noise (no Math.random)
  for (let i = 0; i < data.length; i += 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    data[i] = (seed / 0xffffffff) * 2 - 1;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  noise.loop = true;
  const airFilter = ctx.createBiquadFilter();
  airFilter.type = "bandpass";
  airFilter.frequency.value = DEFAULT_MOOD.airHz;
  airFilter.Q.value = 0.6;
  const airGain = ctx.createGain();
  airGain.gain.value = 0;
  noise.connect(airFilter);
  airFilter.connect(airGain);
  airGain.connect(master);
  noise.start();

  const shimmer = ctx.createOscillator();
  shimmer.type = "sine";
  shimmer.frequency.value = 1320;
  const shimmerGain = ctx.createGain();
  shimmerGain.gain.value = 0;
  shimmer.connect(shimmerGain);
  shimmerGain.connect(master);
  shimmer.start();

  return { ctx, master, humGain, humOscs, airGain, airFilter, shimmerGain, sources: [...humOscs, noise, shimmer] };
}

function applyMood(g: Graph, m: Mood): void {
  const t = g.ctx.currentTime;
  const k = 1.2; // seconds-ish smoothing
  g.humGain.gain.setTargetAtTime(m.hum, t, k);
  g.humOscs[0].frequency.setTargetAtTime(m.humHz, t, k);
  g.humOscs[1].frequency.setTargetAtTime(m.humHz + 0.35, t, k);
  g.airGain.gain.setTargetAtTime(m.air, t, k);
  g.airFilter.frequency.setTargetAtTime(m.airHz, t, k);
  g.shimmerGain.gain.setTargetAtTime(m.shimmer, t, k);
}

/** Must be called from a user gesture (click/keypress). */
export async function enableAudio(): Promise<boolean> {
  if (!isAudioSupported()) return false;
  try {
    graph ??= build();
    await graph.ctx.resume();
    enabled = true;
    graph.master.gain.setTargetAtTime(MASTER_LEVEL, graph.ctx.currentTime, 0.6);
    applyMood(graph, mood);
    return true;
  } catch {
    enabled = false;
    return false;
  }
}

export function disableAudio(): void {
  enabled = false;
  if (!graph) return;
  const g = graph;
  g.master.gain.setTargetAtTime(0, g.ctx.currentTime, 0.25);
  window.setTimeout(() => {
    if (!enabled) void g.ctx.suspend();
  }, 900);
}

export function setSceneMood(sceneId: SceneId | null): void {
  mood = (sceneId && MOODS[sceneId]) || DEFAULT_MOOD;
  if (graph && enabled) applyMood(graph, mood);
}

/** Short enveloped blip for choreography cues (hero:*). */
export function playCue(cue: AudioCueId): void {
  if (!graph || !enabled) return;
  const { ctx, master } = graph;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  const base = cue === "hero:peak" ? 220 : cue === "hero:activation" ? 330 : cue === "hero:signal" ? 660 : 440;
  o.type = "sine";
  o.frequency.setValueAtTime(base, t);
  o.frequency.exponentialRampToValueAtTime(base * 1.5, t + 0.5);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(cue === "hero:peak" ? 0.12 : 0.05, t + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
  o.connect(g);
  g.connect(master);
  o.start(t);
  o.stop(t + 1);
}

export function isAudioEnabled(): boolean {
  return enabled;
}
