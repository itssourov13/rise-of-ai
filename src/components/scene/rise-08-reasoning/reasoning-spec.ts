import { beatWindows, createSceneChoreography, keys, makeState } from "@/lib/choreography/scene-factory";

/** RISE-08-REASONING: deliberately calm. A sparse decision tree; one chain of steps is followed, the rest recede. */
export const { state: reasoningState, reset: resetReasoning } = makeState({ reveal: 0, front: 0, hi: 0, ext: 0, handoff: 0 });

export const reasoningChoreography = createSceneChoreography({
  sceneId: "RISE-08-REASONING",
  state: reasoningState,
  reset: resetReasoning,
  channels: {
    reveal: [[0, 0], [0.1, 0.6], [0.4, 0.9], [1, 0.9]],
    front: [[0, 0], [0.25, 0], [0.82, 1.3], [1, 1.3]],
    hi: [[0, 0], [0.45, 0], [0.8, 1], [1, 1]],
    ext: [[0, 0], [0.7, 0], [1, 1]],
    handoff: [[0, 0], [0.92, 0], [1, 0.3]],
  },
  post: { bloom: [[0, 0.2], [0.8, 0.45], [1, 0.4]], vignette: [[0, 1.1], [1, 1.2]] },
  focus: [30, 0, 0],
  shots: keys("r-shot", [
    [0, -10, 4, 40, 10, 0, 0, 36],
    [0.3, 10, 2, 34, 22, 0, 0, 36],
    [0.6, 34, 6, 30, 40, 0, 0, 36],
    [0.85, 56, 4, 30, 62, 0, 0, 36],
    [1, 80, 2, 34, 82, 0, 0, 38],
  ]),
  shotsReduced: keys("r-shot-r", [[0, -6, 4, 40, 12, 0, 0, 36], [1, 50, 4, 34, 56, 0, 0, 38]]),
  framing: { desktop: { distance: 1, focusBias: 0, fovAdd: 0 }, tablet: { distance: 1.15, focusBias: 0, fovAdd: 3 }, mobile: { distance: 1.4, focusBias: 0, fovAdd: 7 } },
  beats: beatWindows(["slow", "branches", "path"], 0.1, 0.95, 0.05),
  titleOut: [0.06, 0.12],
  nextIn: [0.95, 1],
  handoff: [0.92, 1],
  scrub: 0.9, // slower smoothing = calmer pacing
});
