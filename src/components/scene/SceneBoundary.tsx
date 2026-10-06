"use client";

import { Component, type ReactNode } from "react";

interface Props {
  sceneId: string;
  children: ReactNode;
  onFail: (error: unknown) => void;
}

/**
 * Per-scene error containment inside the Canvas. A throwing scene is unmounted and reported;
 * the world, camera and other scenes keep running (the 3D layer is not torn down).
 */
export class SceneBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    this.props.onFail(error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
