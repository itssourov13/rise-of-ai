const QUERY = "(prefers-reduced-motion: reduce)";

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia(QUERY).matches;
}

/** Subscribes to OS-level changes. The store (state/experience-store.ts) is the single source of truth for consumers. */
export function subscribeReducedMotion(onChange: (reduced: boolean) => void): () => void {
  const mq = window.matchMedia(QUERY);
  const handler = (e: MediaQueryListEvent) => onChange(e.matches);
  mq.addEventListener("change", handler);
  return () => mq.removeEventListener("change", handler);
}
