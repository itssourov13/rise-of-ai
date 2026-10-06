/**
 * Future audio cue identifiers. Phase 04 implements NO audio: cues are events only.
 * Later phases subscribe here; the choreography never imports an audio engine.
 * Cues are one-way notifications and must never define critical visual state (use progress for that).
 */
export type AudioCueId = "hero:signal" | "hero:activation" | "hero:peak" | "hero:title";

type CueListener = (cue: AudioCueId) => void;
const listeners = new Set<CueListener>();

export function emitCue(cue: AudioCueId): void {
  listeners.forEach((l) => l(cue));
}

export function subscribeCues(listener: CueListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
