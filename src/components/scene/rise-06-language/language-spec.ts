import { beatWindows, createSceneChoreography, keys, makeState } from "@/lib/choreography/scene-factory";

/** RISE-06-LANGUAGE: token clusters attract into a word, then loosen again (set-up for generation). */
export const { state: languageState, reset: resetLanguage } = makeState({ reveal: 0, mix: 0, flow: 1.2, handoff: 0 });

export const languageChoreography = createSceneChoreography({
  sceneId: "RISE-06-LANGUAGE",
  state: languageState,
  reset: resetLanguage,
  channels: {
    reveal: [[0, 0], [0.1, 0.8], [0.2, 1], [1, 1]],
    mix: [[0, 0], [0.3, 0], [0.58, 1], [0.78, 1], [1, 0.1]],
    flow: [[0, 1.2], [0.5, 0.2], [0.78, 0.1], [1, 1.5]],
    handoff: [[0, 0], [0.95, 0], [1, 0.4]],
  },
  post: { bloom: [[0, 0.3], [0.6, 0.55], [1, 0.4]] },
  focus: [0, 0, 0],
  shots: keys("g-shot", [
    [0, 0, 0, 62, 0, 0, 0, 34],
    [0.4, -8, 3, 52, 0, 0, 0, 32],
    [0.62, 0, 0, 44, 0, 0, 0, 30],
    [0.8, 6, -2, 50, 0, 0, 0, 32],
    [1, 0, 4, 70, 0, 0, 0, 34],
  ]),
  shotsReduced: keys("g-shot-r", [[0, 0, 0, 56, 0, 0, 0, 34], [0.6, 0, 0, 46, 0, 0, 0, 30], [1, 0, 2, 60, 0, 0, 0, 34]]),
  framing: { desktop: { distance: 1, focusBias: 0, fovAdd: 0 }, tablet: { distance: 1.2, focusBias: 0, fovAdd: 4 }, mobile: { distance: 1.7, focusBias: 0, fovAdd: 8 } },
  beats: beatWindows(["tokens", "meaning", "word"], 0.1, 0.95),
  titleOut: [0.05, 0.1],
  nextIn: [0.95, 1],
  handoff: [0.95, 1],
});
