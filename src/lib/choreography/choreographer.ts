import { chapters, sceneOrder } from "@/content/chapters";
import { ensureGsap, gsap, ScrollTrigger } from "@/lib/animation/gsap";
import { sceneProgress, transitionState } from "@/lib/animation/progress";
import { scrollState } from "@/lib/scroll/scroll-state";
import { clearCameraIntent, submitCameraIntent } from "@/lib/three/camera/intent-bus";
import { useExperienceStore } from "@/state/experience-store";
import type { SceneId } from "@/types/experience";
import { resetPostParams } from "./post-params";
import type {
  ChoreographerMountOptions,
  ChoreographyContext,
  ExperienceChoreographer,
  SceneChoreography,
  SceneChoreographyHandle,
} from "./types";
import { classifyViewport } from "./viewport";

interface Entry {
  def: SceneChoreography;
  region: HTMLElement | null;
  handle: SceneChoreographyHandle | null;
  gsapContext: gsap.Context | null;
  trigger: ScrollTrigger | null;
  progress: number;
}

/**
 * The central choreographer. Data flow:
 *
 *   scroll driver (Lenis, one instance) -> ScrollTrigger (one, per scene region) -> scene timeline (scrubbed)
 *     -> scene progress read-model (sceneProgress) -> scene onProgress (camera intent, DOM readouts, debug)
 *     -> scene mutable state / post params (tweened by the timeline itself)
 *
 * The 3D scene never reads Lenis or ScrollTrigger; it reads mutable state the timeline wrote.
 * Rules: this module is the ONLY writer of sceneProgress / transitionState and the only creator of
 * ScrollTriggers. Active-scene policy: a scene stays active until another scene activates (so the last
 * scene's end state persists), and re-activates when scrolled back into its region.
 * Everything created inside mount() lives in gsap.context() objects reverted by cleanup().
 */
export function createExperienceChoreographer(): ExperienceChoreographer {
  const entries = new Map<SceneId, Entry>();
  const listeners = new Set<() => void>();
  let activeId: SceneId | null = null;
  let current: ChoreographerMountOptions | null = null;
  let onRefresh: (() => void) | null = null;

  const notify = () => listeners.forEach((l) => l());
  const chapterIdFor = (id: SceneId) => chapters.find((c) => c.sceneId === id)?.id ?? null;

  function activateScene(id: SceneId): void {
    if (activeId === id) return;
    const entry = entries.get(id);
    if (!entry) return;
    if (activeId) entries.get(activeId)?.handle?.onDeactivate?.();
    activeId = id;
    sceneProgress.sceneId = id;
    sceneProgress.value = entry.progress;
    useExperienceStore.getState().setActiveChapter(chapterIdFor(id), id);
    entry.handle?.onActivate?.();
    entry.handle?.onProgress?.(entry.progress);
    notify();
  }

  function deactivateScene(id: SceneId): void {
    if (activeId !== id) return;
    entries.get(id)?.handle?.onDeactivate?.();
    activeId = null;
    sceneProgress.sceneId = null;
    useExperienceStore.getState().setActiveChapter(null, null);
    notify();
  }

  function setProgress(sceneId: SceneId, progress: number): void {
    const entry = entries.get(sceneId);
    if (!entry?.handle) return;
    entry.trigger?.disable(false);
    entry.handle.timeline.progress(Math.min(1, Math.max(0, progress)));
  }

  function onTimelineUpdate(entry: Entry): void {
    const progress = entry.handle ? entry.handle.timeline.progress() : 0;
    entry.progress = progress;
    sceneProgress.global = scrollState.progress;
    if (activeId === entry.def.sceneId) {
      sceneProgress.value = progress;
      entry.handle?.onProgress?.(progress);
    }
    notify();
  }

  function createContext(entry: Entry, region: HTMLElement, options: ChoreographerMountOptions): ChoreographyContext {
    const sceneId = entry.def.sceneId;
    return {
      sceneId,
      region,
      reducedMotion: options.reducedMotion,
      tier: options.tier,
      viewportClass: () => classifyViewport(scrollState.viewport.width || window.innerWidth, scrollState.viewport.height || window.innerHeight),
      query: <T extends Element = HTMLElement>(selector: string) => region.querySelector<T>(selector),
      submitCamera: (intent) => submitCameraIntent("choreography", intent),
      writeTransition: (to, progress) => {
        transitionState.kind = progress > 0 ? "camera-travel" : "none";
        transitionState.from = sceneId;
        transitionState.to = to;
        transitionState.progress = progress;
      },
    };
  }

  function cleanup(): void {
    if (onRefresh) ScrollTrigger.removeEventListener("refresh", onRefresh);
    onRefresh = null;
    entries.forEach((entry) => {
      entry.handle?.timeline.eventCallback("onUpdate", null);
      entry.trigger?.kill();
      entry.gsapContext?.revert();
      entry.handle?.dispose?.();
      entry.handle = null;
      entry.gsapContext = null;
      entry.trigger = null;
      entry.region = null;
      entry.progress = 0;
    });
    if (activeId) {
      activeId = null;
      useExperienceStore.getState().setActiveChapter(null, null);
    }
    clearCameraIntent("choreography");
    resetPostParams();
    sceneProgress.sceneId = null;
    sceneProgress.value = 0;
    sceneProgress.global = 0;
    transitionState.kind = "none";
    transitionState.from = null;
    transitionState.to = null;
    transitionState.progress = 0;
    current = null;
    notify();
  }

  return {
    registerScene(def) {
      if (!entries.has(def.sceneId)) {
        entries.set(def.sceneId, { def, region: null, handle: null, gsapContext: null, trigger: null, progress: 0 });
      }
      return () => {
        entries.delete(def.sceneId);
      };
    },

    registerTimeline(sceneId, timeline) {
      const entry = entries.get(sceneId);
      if (!entry) return;
      if (entry.handle) entry.handle.timeline = timeline;
      else entry.handle = { timeline };
    },

    mount(options) {
      cleanup();
      ensureGsap();
      current = options;
      const ordered = sceneOrder.filter((id) => entries.has(id));
      ordered.forEach((id) => {
        const entry = entries.get(id);
        if (!entry) return;
        const region = options.root.querySelector<HTMLElement>(entry.def.regionSelector);
        if (!region) {
          if (process.env.NODE_ENV !== "production") console.warn(`[choreographer] region not found for ${id}: ${entry.def.regionSelector}`);
          return;
        }
        entry.region = region;
        entry.gsapContext = gsap.context(() => {
          const handle = entry.def.build(createContext(entry, region, options));
          entry.handle = handle;
          handle.timeline.eventCallback("onUpdate", () => onTimelineUpdate(entry));
          entry.trigger = ScrollTrigger.create({
            trigger: region,
            start: "top top",
            end: "bottom bottom",
            animation: handle.timeline,
            scrub: options.reducedMotion ? true : (entry.def.scrub ?? 0.6),
            onToggle: (self) => {
              if (self.isActive) activateScene(id);
            },
          });
        }, options.root);
      });

      onRefresh = () => {
        entries.forEach((e) => e.handle?.onRefresh?.());
        notify();
      };
      ScrollTrigger.refresh();
      ScrollTrigger.addEventListener("refresh", onRefresh);

      // Fonts/layout can change section heights after mount. ScrollTrigger already refreshes on load/resize.
      if (typeof document !== "undefined" && document.fonts?.ready) {
        void document.fonts.ready.then(() => {
          if (current === options) ScrollTrigger.refresh();
        });
      }

      const first = ordered.find((id) => entries.get(id)?.region);
      const live = ordered.find((id) => entries.get(id)?.trigger?.isActive);
      if (first) activateScene(live ?? first);

      if (options.seek != null && first) setProgress(first, options.seek);
    },

    setProgress,

    releaseProgress(sceneId) {
      const entry = entries.get(sceneId);
      if (!entry?.trigger) return;
      entry.trigger.enable();
      ScrollTrigger.update();
    },

    getProgress: (sceneId) => entries.get(sceneId)?.progress ?? 0,
    activateScene,
    deactivateScene,
    getActiveScene: () => activeId,

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    refresh() {
      if (current) ScrollTrigger.refresh();
    },

    cleanup,
  };
}

/** The engine's single choreographer instance. */
export const choreographer: ExperienceChoreographer = createExperienceChoreographer();
