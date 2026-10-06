import type gsap from "gsap";

/** [progress, value] or [progress, value, easeForTheSegmentEndingHere]. Progress is normalized 0..1 (scene timeline). */
export type Keyframe = readonly [at: number, value: number] | readonly [at: number, value: number, ease: string];

const DEFAULT_EASE = "power1.inOut";

/**
 * Turns keyframe tables into sequential fromTo tweens on a plain object inside a paused scene timeline.
 * Every segment has explicit from/to values (immediateRender only on the first), so ANY progress value renders a
 * valid state regardless of how the playhead got there (jumps, reverse scroll). Timeline positions are
 * normalized progress (the timeline has total duration 1).
 */
export function addChannelTweens<T extends object>(
  timeline: gsap.core.Timeline,
  target: T,
  channels: Partial<Record<keyof T & string, readonly Keyframe[]>>,
): void {
  const record = target as Record<string, number>;
  for (const [key, frames] of Object.entries(channels) as [string, readonly Keyframe[] | undefined][]) {
    if (!frames || frames.length === 0) continue;
    record[key] = frames[0][1];
    for (let i = 0; i < frames.length - 1; i += 1) {
      const [at0, v0] = frames[i];
      const next = frames[i + 1];
      const [at1, v1] = next;
      const duration = at1 - at0;
      if (duration <= 0) continue;
      timeline.fromTo(
        record,
        { [key]: v0 },
        { [key]: v1, duration, ease: next[2] ?? DEFAULT_EASE, immediateRender: i === 0 },
        at0,
      );
    }
  }
}
