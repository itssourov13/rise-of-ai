import { beatWindows, createSceneChoreography, keys, makeState, OPEN_FRAMING } from "@/lib/choreography/scene-factory";

/** RISE-03-COMPUTATION: numbers become patterns. noise cloud -> layered wave sheets. Values authored (UNVERIFIED). */
export const { state: computationState, reset: resetComputation } = makeState({ reveal: 0, mix: 0, flow: 1.6, handoff: 0 });

export const computationChoreography = createSceneChoreography({
  sceneId: "RISE-03-COMPUTATION",
  state: computationState,
  reset: resetComputation,
  channels: {
    reveal: [[0, 0], [0.08, 0.15], [0.3, 0.7], [0.5, 1], [1, 1]],
    mix: [[0, 0], [0.28, 0], [0.64, 1], [1, 1]],
    flow: [[0, 1.6], [0.3, 1.4], [0.64, 0.35], [1, 0.2]],
    handoff: [[0, 0], [0.9, 0], [1, 1]],
  },
  post: { bloom: [[0, 0.3], [0.6, 0.6], [1, 0.4]] },
  focus: [0, -2, 0],
  shots: keys("c-shot", [
    [0, 0, 6, 70, 0, 0, 0, 38],
    [0.3, -30, 14, 45, 0, 0, 0, 38],
    [0.6, 26, 10, 30, 0, -2, 0, 36],
    [0.85, 0, 24, 36, 0, -4, 0, 34],
    [1, 0, 30, 14, 0, -6, -6, 34],
  ]),
  shotsReduced: keys("c-shot-r", [[0, 0, 8, 60, 0, 0, 0, 38], [1, 10, 14, 40, 0, -2, 0, 36]]),
  framing: OPEN_FRAMING,
  beats: beatWindows(["numbers", "noise", "pattern"], 0.1, 0.9),
  titleOut: [0.05, 0.1],
  nextIn: [0.95, 1],
  handoff: [0.9, 1],
});
