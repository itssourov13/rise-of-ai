import { beatWindows, createSceneChoreography, keys, makeState } from "@/lib/choreography/scene-factory";

/** RISE-10-INTELLIGENCE: a large interconnected network; activation waves travel outward; then it thins to quiet. */
export const { state: intelligenceState, reset: resetIntelligence } = makeState({ reveal: 0, front: 0, dust: 0, handoff: 0 });

export const intelligenceChoreography = createSceneChoreography({
  sceneId: "RISE-10-INTELLIGENCE",
  state: intelligenceState,
  reset: resetIntelligence,
  channels: {
    reveal: [[0, 0], [0.1, 0.5], [0.4, 1], [0.82, 1], [1, 0.2]],
    dust: [[0, 0.3], [0.5, 0.8], [1, 0.4]],
    handoff: [[0, 0], [0.88, 0], [1, 1]],
  },
  pulse: { key: "front", waves: [[0.2, 0.4], [0.45, 0.65], [0.7, 0.88]] },
  post: { bloom: [[0, 0.3], [0.5, 0.7], [0.82, 0.8], [1, 0.3]], vignette: [[0, 1], [1, 1.2]] },
  focus: [0, 0, 0],
  shots: keys("i-shot", [
    [0, 0, 10, 92, 0, 0, 0, 36],
    [0.3, -16, 6, 56, 0, 0, 0, 36],
    [0.6, 40, 10, 42, 0, 0, 0, 36],
    [0.85, 0, 30, 100, 0, 0, 0, 38],
    [1, 0, 36, 118, 0, 0, 0, 40],
  ]),
  shotsReduced: keys("i-shot-r", [[0, 0, 10, 88, 0, 0, 0, 36], [1, 0, 28, 108, 0, 0, 0, 40]]),
  framing: { desktop: { distance: 1, focusBias: 0, fovAdd: 0 }, tablet: { distance: 1.1, focusBias: 0, fovAdd: 3 }, mobile: { distance: 1.3, focusBias: 0, fovAdd: 7 } },
  beats: beatWindows(["many", "scale", "thin"], 0.1, 0.95),
  titleOut: [0.05, 0.1],
  nextIn: [0.95, 1],
  handoff: [0.88, 1],
});
