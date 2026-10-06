import { createSceneChoreography, keys, makeState } from "@/lib/choreography/scene-factory";

/** RISE-11-UNKNOWN: restraint. Almost nothing, one distant glimmer, slow drift, closing line. Deterministic calm end state. */
export const { state: unknownState, reset: resetUnknown } = makeState({ reveal: 0, glimmer: 0 });

export const unknownChoreography = createSceneChoreography({
  sceneId: "RISE-11-UNKNOWN",
  state: unknownState,
  reset: resetUnknown,
  channels: {
    reveal: [[0, 0], [0.2, 0.7], [1, 0.6]],
    glimmer: [[0, 0], [0.5, 0], [0.9, 1], [1, 1]],
  },
  post: { bloom: [[0, 0.2], [1, 0.3]], vignette: [[0, 1.1], [1, 1.35]] },
  focus: [0, 8, -80],
  shots: keys("u-shot", [
    [0, 0, 2, 30, 0, 6, -80, 40],
    [0.5, 0, 10, 26, 0, 8, -80, 40],
    [1, 0, 22, 12, 0, 8, -80, 42],
  ]),
  shotsReduced: keys("u-shot-r", [[0, 0, 2, 30, 0, 6, -80, 40], [1, 0, 14, 22, 0, 8, -80, 42]]),
  framing: { desktop: { distance: 1, focusBias: 0, fovAdd: 0 }, tablet: { distance: 1, focusBias: 0, fovAdd: 2 }, mobile: { distance: 1, focusBias: 0, fovAdd: 5 } },
  beats: {
    open: { in: [0.1, 0.16], out: [0.4, 0.5] },
    closing: { in: [0.58, 0.72] }, // never fades out: the final state
  },
  titleOut: [0.05, 0.1],
  scrub: 1.0,
});
