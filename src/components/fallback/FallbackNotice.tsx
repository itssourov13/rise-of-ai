"use client";

import { useExperienceStore } from "@/state/experience-store";

/** Shown only when the 3D layer is unavailable. Functional notice, not a visual substitute. */
export function FallbackNotice() {
  const mode = useExperienceStore((s) => s.renderMode);
  const reason = useExperienceStore((s) => s.failureReason);
  if (mode !== "disabled" && mode !== "failed") return null;
  return (
    <p role="status" className="fallback-notice t-technical">
      The interactive 3D view is unavailable on this device. The full narrative is below.
      {process.env.NODE_ENV !== "production" && reason ? (
        <>
          <br />
          <code>[dev] {mode}: {reason}</code>
        </>
      ) : null}
    </p>
  );
}
