"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  onError?: (error: Error) => void;
}

interface State {
  failed: boolean;
}

/**
 * Outer containment: a 3D-layer failure is captured, logged (never swallowed), reported to the store, and the
 * semantic DOM narrative stays up. Finer-grained recovery lives inside the Canvas: SceneBoundary (per scene)
 * and asset criticality (components/scene/scene-assets.ts).
 */
export class ExperienceErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[experience] 3D layer failed", error, info.componentStack);
    this.props.onError?.(error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
