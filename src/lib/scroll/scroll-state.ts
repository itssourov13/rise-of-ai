export type ScrollDirection = -1 | 0 | 1;

export interface ScrollState {
  /** 0..1 over the whole document. */
  progress: number;
  /** Signed, driver-defined units per frame/event. Treat as relative magnitude only. */
  velocity: number;
  direction: ScrollDirection;
  scrollY: number;
  viewport: { width: number; height: number };
  isScrolling: boolean;
}

/**
 * Mutable, non-reactive scroll snapshot. Written ONLY by the scroll driver (lenis-driver.ts).
 * Read it from the animation/render loop (useFrame, GSAP ticker). Do not mirror it into
 * React state or Zustand: it changes every frame.
 */
export const scrollState: ScrollState = {
  progress: 0,
  velocity: 0,
  direction: 0,
  scrollY: 0,
  viewport: { width: 0, height: 0 },
  isScrolling: false,
};
