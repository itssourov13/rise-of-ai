"use client";

import { useFrame } from "@react-three/fiber";
import { writeEngineTime } from "@/lib/animation/time";

/** The only writer of engineTime. Negative priority: runs before camera/scene updates, does not take over rendering. */
export function EngineClock() {
  useFrame((state, delta) => writeEngineTime(state.clock.elapsedTime, delta), -2);
  return null;
}
