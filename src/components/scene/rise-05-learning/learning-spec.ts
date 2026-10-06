import { beatWindows, createSceneChoreography, keys, makeState } from "@/lib/choreography/scene-factory";

/** RISE-05-LEARNING: layered network; forward activation passes; connection weights strengthen. */
export const { state: learningState, reset: resetLearning } = makeState({ reveal: 0, weights: 0, front: 0, handoff: 0 });

export const learningChoreography = createSceneChoreography({
  sceneId: "RISE-05-LEARNING",
  state: learningState,
  reset: resetLearning,
  channels: {
    reveal: [[0, 0], [0.1, 0.3], [0.3, 0.8], [0.5, 1], [1, 1]],
    weights: [[0, 0], [0.3, 0.1], [0.6, 0.6], [0.9, 1], [1, 1]],
    handoff: [[0, 0], [0.92, 0], [1, 1]],
  },
  pulse: { key: "front", waves: [[0.3, 0.4], [0.45, 0.55], [0.6, 0.7], [0.75, 0.85]] },
  post: { bloom: [[0, 0.3], [0.5, 0.7], [0.85, 0.9], [1, 0.5]] },
  focus: [0, 0, 0],
  shots: keys("l-shot", [
    [0, 0, 4, 64, 0, 0, 0, 34],
    [0.3, -26, 8, 36, 0, 0, 0, 36],
    [0.55, 0, 3, 26, 4, 0, 0, 36],
    [0.78, 22, 10, 32, 0, 0, 0, 36],
    [1, 0, 0, 56, 0, 0, 0, 38],
  ]),
  shotsReduced: keys("l-shot-r", [[0, 0, 4, 58, 0, 0, 0, 36], [1, 0, 0, 52, 0, 0, 0, 38]]),
  framing: { desktop: { distance: 1, focusBias: 0, fovAdd: 0 }, tablet: { distance: 1.1, focusBias: 0, fovAdd: 3 }, mobile: { distance: 1.35, focusBias: 0, fovAdd: 8 } },
  beats: beatWindows(["layers", "signal", "model"], 0.1, 0.92),
  titleOut: [0.05, 0.1],
  nextIn: [0.95, 1],
  handoff: [0.92, 1],
});
