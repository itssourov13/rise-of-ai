import Lenis from "lenis";
import { ensureGsap, gsap, ScrollTrigger } from "@/lib/animation/gsap";
import { scrollState } from "./scroll-state";

/**
 * The single scroll driver. Exactly one source writes scrollState at a time:
 *   smooth=true  -> ONE Lenis instance, driven by the GSAP ticker (see below)
 *   smooth=false -> native scroll listener (reduced motion); ScrollTrigger reads native scroll itself
 * Calling startScrollDriver again tears down the previous driver first
 * (React Strict Mode double-effects, reduced-motion toggles).
 *
 * Lenis <-> GSAP synchronization (Phase 04, the pattern from Lenis' GSAP guidance):
 *   - Lenis runs with autoRaf:false; its raf() is called from gsap.ticker (one shared tick, no extra rAF loop)
 *   - lenis "scroll" -> ScrollTrigger.update() so scrubbed timelines follow the smoothed scroll position
 *   - gsap.ticker.lagSmoothing(0) so GSAP time does not jump against Lenis' own easing
 * R3F keeps its own render loop (the engine's single render loop); it reads mutable state, not Lenis.
 * NOT RUNTIME VERIFIED.
 */
let stop: (() => void) | null = null;

function readViewport() {
  scrollState.viewport.width = window.innerWidth;
  scrollState.viewport.height = window.innerHeight;
}

function startLenis(): () => void {
  ensureGsap();
  const lenis = new Lenis({ autoRaf: false });
  const sync = () => {
    scrollState.scrollY = lenis.scroll;
    scrollState.progress = lenis.progress;
    scrollState.velocity = lenis.velocity;
    scrollState.direction = lenis.direction as -1 | 0 | 1;
    scrollState.isScrolling = lenis.velocity !== 0;
  };
  const onScroll = () => {
    sync();
    ScrollTrigger.update();
  };
  const tick = (time: number) => lenis.raf(time * 1000);
  lenis.on("scroll", onScroll);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  sync();
  return () => {
    gsap.ticker.remove(tick);
    gsap.ticker.lagSmoothing(500, 33); // GSAP defaults
    lenis.destroy();
  };
}

function startNative(): () => void {
  let lastY = window.scrollY;
  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  const sync = () => {
    const y = window.scrollY;
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    scrollState.velocity = y - lastY;
    scrollState.direction = y > lastY ? 1 : y < lastY ? -1 : 0;
    scrollState.scrollY = y;
    scrollState.progress = Math.min(1, Math.max(0, y / max));
    scrollState.isScrolling = true;
    lastY = y;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      scrollState.isScrolling = false;
      scrollState.velocity = 0;
    }, 150);
  };
  window.addEventListener("scroll", sync, { passive: true });
  sync();
  return () => {
    window.removeEventListener("scroll", sync);
    clearTimeout(idleTimer);
  };
}

export function startScrollDriver(options: { smooth: boolean }): () => void {
  stop?.();
  readViewport();
  const onResize = () => readViewport();
  window.addEventListener("resize", onResize, { passive: true });
  const stopDriver = options.smooth ? startLenis() : startNative();
  const teardown = () => {
    window.removeEventListener("resize", onResize);
    stopDriver();
    if (stop === teardown) stop = null;
  };
  stop = teardown;
  return teardown;
}
