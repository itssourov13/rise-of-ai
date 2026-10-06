import { beatWindows, createSceneChoreography, keys, makeState } from "@/lib/choreography/scene-factory";

/** RISE-07-GENERATION: diffusion-style metaphor. Noise is removed in discrete steps until a coherent form remains. */
export const { state: generationState, reset: resetGeneration } = makeState({ reveal: 0.3, mix: 0, flow: 2.2, handoff: 0 });

export const generationChoreography = createSceneChoreography({
  sceneId: "RISE-07-GENERATION",
  state: generationState,
  reset: resetGeneration,
  channels: {
    reveal: [[0, 0.3], [0.1, 1], [1, 1]],
    mix: [[0, 0], [0.15, 0], [0.8, 1], [1, 1]],
    flow: [[0, 2.2], [0.3, 2], [0.8, 0.3], [1, 0.15]],
    handoff: [[0, 0], [0.95, 0], [1, 0.3]],
  },
  post: { bloom: [[0, 0.3], [0.8, 0.6], [1, 0.5]], dof: [[0, 0], [0.8, 0], [0.95, 0.5], [1, 0.5]] },
  focus: [0, 0, 0],
  shots: keys("n-shot", [
    [0, 0, 6, 56, 0, 0, 0, 38],
    [0.25, -40, 10, 34, 0, 0, 0, 38],
    [0.5, -32, -2, -36, 0, 0, 0, 38],
    [0.75, 38, 12, -20, 0, 0, 0, 38],
    [1, 0, 8, 46, 0, 0, 0, 36],
  ]),
  shotsReduced: keys("n-shot-r", [[0, 0, 6, 54, 0, 0, 0, 38], [1, 14, 8, 44, 0, 0, 0, 36]]),
  framing: { desktop: { distance: 1, focusBias: 0, fovAdd: 0 }, tablet: { distance: 1.1, focusBias: 0, fovAdd: 3 }, mobile: { distance: 1.35, focusBias: 0, fovAdd: 6 } },
  beats: beatWindows(["noise", "steps", "form"], 0.1, 0.95),
  titleOut: [0.05, 0.1],
  nextIn: [0.95, 1],
  handoff: [0.95, 1],
});
