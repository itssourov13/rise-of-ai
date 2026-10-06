import { DEFAULT_CAMERA_INTENT, type CameraIntent, type CameraSource } from "@/types/camera";

/**
 * Camera intent arbitration. Any system may SUBMIT an intent for its source slot; only the CameraRig
 * reads the resolved winner and writes the real camera. Winner-take-all by priority (first non-empty):
 *   transition > user > choreography > cinematic > DEFAULT_CAMERA_INTENT
 * Blending user input on top of a cinematic shot (additive offsets) is a future extension of the rig.
 *
 * Mutable module state on purpose (no React state): intents may change every frame.
 */
const PRIORITY: readonly CameraSource[] = ["transition", "user", "choreography", "cinematic"];

const slots: Record<CameraSource, CameraIntent | null> = {
  transition: null,
  user: null,
  choreography: null,
  cinematic: null,
};

let version = 0;
const listeners = new Set<() => void>();

export function submitCameraIntent(source: CameraSource, intent: CameraIntent | null): void {
  if (slots[source] === intent) return;
  slots[source] = intent;
  version += 1;
  listeners.forEach((l) => l());
}

export const clearCameraIntent = (source: CameraSource): void => submitCameraIntent(source, null);

export const getCameraIntentVersion = (): number => version;

/** Returns existing intent objects (no allocation). */
export function resolveCameraIntent(): CameraIntent {
  for (const source of PRIORITY) {
    const intent = slots[source];
    if (intent) return intent;
  }
  return DEFAULT_CAMERA_INTENT;
}

/** Lets the rig wake a demand-mode render loop when an intent changes. Returns an unsubscribe. */
export function subscribeCameraIntent(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
