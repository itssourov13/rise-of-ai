import { compileTrack, type CameraFraming, type CameraKey } from "@/lib/choreography/camera-track";
import type { ViewportClass } from "@/lib/choreography/viewport";
import { BOARD, CROSS_Z } from "./machine-constants";

/**
 * Machine camera shots: dolly down the centre aisle, lateral travel through the cross aisle, vertical reveal
 * above the beams, then a push into the circuit board. The first key continues the Hero's end pose direction
 * (the scene swap happens in darkness). Authored by reasoning from the layout, not tuned visually (UNVERIFIED).
 */
const BZ = BOARD.z;
export const MACHINE_SHOT_KEYS: readonly CameraKey[] = [
  { id: "m-01-approach", at: 0, position: [0, 9, 60], target: [0, 8, -40], fov: 32 },
  { id: "m-02-aisle-enter", at: 0.14, position: [0, 6, 12], target: [0, 7, -60], fov: 36 },
  { id: "m-03-aisle-dolly", at: 0.34, position: [0, 5.5, -55], target: [0, 7, -125], fov: 38 },
  { id: "m-04-lateral", at: 0.5, position: [-9, 6.5, CROSS_Z], target: [4, 7, CROSS_Z - 22], fov: 36 },
  { id: "m-04-lateral", at: 0.58, position: [9, 6.5, CROSS_Z], target: [-4, 7, CROSS_Z - 22], fov: 36 },
  { id: "m-05-vertical", at: 0.72, position: [0, 17, -125], target: [0, 6, -175], fov: 34 },
  { id: "m-06-board-wide", at: 0.84, position: [0, 9, BZ + 40], target: [0, 12, BZ], fov: 30 },
  { id: "m-07-circuit", at: 0.94, position: [0, 12.5, BZ + 14], target: [0, 12.5, BZ], fov: 24 },
  { id: "m-07-circuit", at: 1, position: [0, 12.6, BZ + 11], target: [0, 12.6, BZ], fov: 22 },
];

export const MACHINE_SHOT_KEYS_REDUCED: readonly CameraKey[] = [
  { id: "m-01-approach", at: 0, position: [0, 8, 30], target: [0, 8, -60], fov: 34 },
  { id: "m-05-vertical", at: 0.55, position: [0, 12, -110], target: [0, 7, -170], fov: 34 },
  { id: "m-07-circuit", at: 1, position: [0, 12.5, BZ + 16], target: [0, 12.5, BZ], fov: 26 },
];

export const MACHINE_TRACK = compileTrack(MACHINE_SHOT_KEYS);
export const MACHINE_TRACK_REDUCED = compileTrack(MACHINE_SHOT_KEYS_REDUCED);

/** Corridor scene: framing mostly widens the lens on small screens instead of moving the camera. */
export const MACHINE_FRAMING: Readonly<Record<ViewportClass, CameraFraming>> = {
  desktop: { distance: 1, focusBias: 0, fovAdd: 0 },
  tablet: { distance: 0.95, focusBias: 0, fovAdd: 3 },
  mobile: { distance: 0.9, focusBias: 0, fovAdd: 7 },
};

export const MACHINE_FOCUS = [0, 12.5, BZ] as const;
export const MACHINE_CAMERA_LENS = { near: 0.4, far: 360, damping: 5 } as const;
