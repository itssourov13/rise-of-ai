import { beatWindows, createSceneChoreography, keys, makeState, OPEN_FRAMING } from "@/lib/choreography/scene-factory";

/** RISE-04-PERCEPTION: a scanning sweep reveals a procedural world as a depth-coloured point cloud; it then reorganizes into layer sheets. */
export const { state: perceptionState, reset: resetPerception } = makeState({ visible: 0.3, sweep: 0, mix: 0, handoff: 0 });

export const perceptionChoreography = createSceneChoreography({
  sceneId: "RISE-04-PERCEPTION",
  state: perceptionState,
  reset: resetPerception,
  channels: {
    visible: [[0, 0.3], [0.2, 1], [1, 1]],
    sweep: [[0, 0], [0.06, 0], [0.58, 1], [1, 1]],
    mix: [[0, 0], [0.8, 0], [1, 1]],
    handoff: [[0, 0], [0.92, 0], [1, 1]],
  },
  post: { bloom: [[0, 0.3], [0.5, 0.5], [1, 0.4]], dof: [[0, 0], [1, 0]] },
  focus: [0, 2, -30],
  shots: keys("p-shot", [
    [0, 0, 6, 18, 0, 3, -30, 42],
    [0.3, 0, 5, -8, 0, 3, -50, 42],
    [0.55, -8, 9, -30, 4, 3, -60, 40],
    [0.75, 14, 12, -40, 0, 3, -40, 40],
    [0.88, 0, 8, 6, 0, 0, -18, 36],
    [1, -16, 6, 20, 0, 0, -18, 36],
  ]),
  shotsReduced: keys("p-shot-r", [[0, 0, 6, 18, 0, 3, -30, 42], [0.6, 0, 8, -10, 0, 3, -50, 42], [1, -10, 6, 18, 0, 0, -18, 38]]),
  framing: OPEN_FRAMING,
  beats: beatWindows(["sense", "depth", "layers"], 0.1, 0.92),
  titleOut: [0.05, 0.1],
  nextIn: [0.95, 1],
  handoff: [0.9, 1],
});
