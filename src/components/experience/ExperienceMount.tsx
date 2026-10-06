"use client";

import dynamic from "next/dynamic";
import { ExperienceErrorBoundary } from "@/components/fallback/ExperienceErrorBoundary";
import { ChoreographyMount } from "@/components/choreography/ChoreographyMount";
import { FallbackNotice } from "@/components/fallback/FallbackNotice";
import { useExperienceStore } from "@/state/experience-store";
import { useExperienceBootstrap } from "./useExperienceBootstrap";

// Three.js/R3F load only here, client-side, and only when WebGL 2 is available.
const ExperienceCanvas = dynamic(() => import("./ExperienceCanvas"), { ssr: false });

/** The client boundary. Server-rendered narrative lives outside it. */
export function ExperienceMount() {
  useExperienceBootstrap();
  const mode = useExperienceStore((s) => s.renderMode);
  const setRenderMode = useExperienceStore((s) => s.setRenderMode);

  return (
    <>
      <FallbackNotice />
      {mode === "active" && <ChoreographyMount />}
      {mode === "active" && (
        <ExperienceErrorBoundary onError={(error) => setRenderMode("failed", error.message)}>
          <ExperienceCanvas />
        </ExperienceErrorBoundary>
      )}
    </>
  );
}
