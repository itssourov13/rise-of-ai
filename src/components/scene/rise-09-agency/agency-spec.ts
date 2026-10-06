import { beatWindows, createSceneChoreography, keys, makeState } from "@/lib/choreography/scene-factory";

/** RISE-09-AGENCY: a core reaches out to tool modules; limited holographic panels; systems link into a fabric. */
export const { state: agencyState, reset: resetAgency } = makeState({ reveal: 0, hub: 0, flow: 0, panels: 0, fabric: 0, handoff: 0 });

export const agencyChoreography = createSceneChoreography({
  sceneId: "RISE-09-AGENCY",
  state: agencyState,
  reset: resetAgency,
  channels: {
    reveal: [[0, 0], [0.12, 1], [1, 1]],
    hub: [[0, 0], [0.1, 0.5], [0.4, 0.8], [0.7, 1], [1, 0.8]],
    flow: [[0, 0], [0.3, 0], [0.5, 1], [1, 1]],
    panels: [[0, 0], [0.45, 0], [0.55, 1], [0.8, 1], [0.9, 0.3], [1, 0]],
    fabric: [[0, 0], [0.7, 0], [0.92, 1], [1, 1]],
    handoff: [[0, 0], [0.95, 0], [1, 0.3]],
  },
  post: { bloom: [[0, 0.3], [0.5, 0.7], [1, 0.6]] },
  focus: [0, 0, 0],
  shots: keys("a-shot", [
    [0, 0, 6, 54, 0, 0, 0, 36],
    [0.3, -30, 10, 30, 0, 0, 0, 36],
    [0.55, -10, 16, -14, 0, 0, 0, 34],
    [0.8, 24, 8, 30, 0, 0, 0, 36],
    [1, 0, 22, 62, 0, 0, 0, 38],
  ]),
  shotsReduced: keys("a-shot-r", [[0, 0, 6, 52, 0, 0, 0, 36], [1, 0, 20, 58, 0, 0, 0, 38]]),
  framing: { desktop: { distance: 1, focusBias: 0, fovAdd: 0 }, tablet: { distance: 1.1, focusBias: 0, fovAdd: 3 }, mobile: { distance: 1.3, focusBias: 0, fovAdd: 7 } },
  beats: beatWindows(["hub", "reach", "fabric"], 0.1, 0.95),
  titleOut: [0.05, 0.1],
  nextIn: [0.95, 1],
  handoff: [0.95, 1],
});
