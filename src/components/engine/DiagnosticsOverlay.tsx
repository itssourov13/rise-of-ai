"use client";

import { useEffect, useRef } from "react";
import { formatDiagnostics, diagnosticsSnapshot } from "@/lib/three/diagnostics/snapshot";
import type { DebugFlag } from "@/lib/three/diagnostics/debug-flags";

/**
 * DEV ONLY DOM overlay (never imported in production builds). Polls the mutable snapshot at 4 Hz and
 * writes textContent directly, so it never causes React renders. Enabled only by ?debug=...
 */
export default function DiagnosticsOverlay({ flags }: { flags: ReadonlySet<DebugFlag> }) {
  const ref = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (ref.current) ref.current.textContent = formatDiagnostics(diagnosticsSnapshot, flags);
    }, 250);
    return () => window.clearInterval(id);
  }, [flags]);

  return (
    <pre
      ref={ref}
      style={{
        position: "fixed",
        top: "3.5rem",
        left: "1rem",
        zIndex: 20,
        margin: 0,
        padding: "0.5rem 0.75rem",
        background: "rgb(0 0 0 / 0.7)",
        color: "#9ad8ff",
        font: "11px/1.4 ui-monospace, Menlo, Consolas, monospace",
        pointerEvents: "none",
        whiteSpace: "pre",
      }}
    />
  );
}
