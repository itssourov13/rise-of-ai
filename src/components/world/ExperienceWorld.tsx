"use client";

import type { ReactNode } from "react";
import { WORLD_BACKGROUND } from "@/lib/three/world/conventions";
import { WorldAtmosphere } from "./WorldAtmosphere";
import { WorldEnvironment } from "./WorldEnvironment";

/**
 * Global, reusable world: background, atmosphere, environment lighting. Hosts scene content as children.
 * Contains NO chapter-specific assets or lighting. Scenes configure the world only through the engine store.
 */
export function ExperienceWorld({ children }: { children?: ReactNode }) {
  return (
    <>
      <color attach="background" args={[WORLD_BACKGROUND]} />
      <WorldAtmosphere />
      <WorldEnvironment />
      {children}
    </>
  );
}
