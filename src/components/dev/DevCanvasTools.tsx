"use client";

import { DebugHelpers } from "@/components/engine/DebugHelpers";
import { DiagnosticsProbe } from "@/components/engine/DiagnosticsProbe";
import type { DebugFlag } from "@/lib/three/diagnostics/debug-flags";
import CalibrationWorld from "./CalibrationWorld";

/**
 * DEV ONLY. Loaded lazily from ExperienceCanvas behind `process.env.NODE_ENV !== "production"`, so the
 * calibration world and diagnostics are not part of production bundles (bundle contents NOT verified).
 */
export default function DevCanvasTools({
  flags,
  diagnostics,
  showCalibration,
}: {
  flags: ReadonlySet<DebugFlag>;
  diagnostics: boolean;
  showCalibration: boolean;
}) {
  return (
    <>
      {showCalibration && <CalibrationWorld />}
      <DebugHelpers flags={flags} />
      {diagnostics && <DiagnosticsProbe />}
    </>
  );
}
