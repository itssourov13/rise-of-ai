import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

/**
 * The only module that imports/registers GSAP plugins. Browser-only: import it from client
 * components or lib code that only runs in the browser — never from server components.
 * Phase 04: timelines are built by per-scene choreography modules (e.g. rise-01-awakening/hero-choreography.ts)
 * and ATTACHED to ScrollTriggers only by lib/choreography/choreographer.ts, inside gsap.context() objects that
 * the choreographer reverts on cleanup. Lenis<->ticker sync lives in lib/scroll/lenis-driver.ts.
 */
let registered = false;

export function ensureGsap(): typeof gsap {
  if (!registered && typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger, useGSAP);
    // Mobile browser chrome show/hide fires resize events; do not rebuild every time (UNVERIFIED benefit).
    ScrollTrigger.config({ ignoreMobileResize: true });
    registered = true;
  }
  return gsap;
}

export { gsap, ScrollTrigger, useGSAP };
