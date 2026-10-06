import type { LifecycleKey } from "@/types/experience";

/**
 * ACTIVE  - rendered, updating, full quality.
 * WARM    - resident but hidden/paused (neighbours), ready to become active without a load hitch.
 * COLD    - not mounted; assets released.
 * Pure function so it can be unit-tested. warmRadius default is UNVERIFIED (ARCHITECTURE: "active +/- 1").
 * `incomingId` keeps the destination of an in-flight transition ACTIVE alongside the current scene.
 */
export type Residency = "active" | "warm" | "cold";

export const DEFAULT_WARM_RADIUS = 1;

export function planResidency<T extends LifecycleKey>(
  order: readonly T[],
  activeId: T | null,
  options: { warmRadius?: number; incomingId?: T | null } = {},
): Map<T, Residency> {
  const radius = options.warmRadius ?? DEFAULT_WARM_RADIUS;
  const plan = new Map<T, Residency>(order.map((id) => [id, "cold"]));
  const activeIndex = activeId ? order.indexOf(activeId) : -1;
  if (activeIndex >= 0) {
    order.forEach((id, i) => {
      if (Math.abs(i - activeIndex) <= radius) plan.set(id, "warm");
    });
    plan.set(order[activeIndex], "active");
  }
  if (options.incomingId && plan.has(options.incomingId)) plan.set(options.incomingId, "active");
  return plan;
}
