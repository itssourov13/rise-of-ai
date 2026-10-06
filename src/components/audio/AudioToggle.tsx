"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { subscribeCues } from "@/lib/choreography/cues";
import { disableAudio, enableAudio, isAudioSupported, playCue, setSceneMood } from "@/lib/audio/engine";
import { useExperienceStore } from "@/state/experience-store";

/** Sound toggle. Audio is OFF by default and starts only from this user action (autoplay policy). Hidden if unsupported. */
export function AudioToggle() {
  const [on, setOn] = useState(false);
  // false on the server and during hydration; the real value after (no setState-in-effect)
  const supported = useSyncExternalStore(
    () => () => {},
    isAudioSupported,
    () => false,
  );
  const sceneId = useExperienceStore((s) => s.currentSceneId);

  useEffect(() => setSceneMood(sceneId), [sceneId]);
  useEffect(() => (on ? subscribeCues(playCue) : undefined), [on]);
  useEffect(() => () => disableAudio(), []);

  if (!supported) return null;
  return (
    <button
      type="button"
      className="audio-toggle t-micro"
      aria-pressed={on}
      onClick={async () => {
        if (on) {
          disableAudio();
          setOn(false);
        } else {
          setOn(await enableAudio());
        }
      }}
    >
      Sound {on ? "on" : "off"}
    </button>
  );
}
