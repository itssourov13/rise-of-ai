/**
 * Machine hall layout (world units ~ meters). Hall runs along -Z from the entrance (z ~ -6) to the circuit
 * board wall (z = BOARD.z). Authored values, never checked against a render (UNVERIFIED).
 *
 *   x:  [wall -17.5] [side aisle] [row B x=±7 faces out] [row A x=±5 faces centre aisle] [centre aisle] ...
 *   Rows A and B are back-to-back (rack depth 2). A cross aisle (no racks) cuts bay CROSS_BAY for lateral travel.
 */
export const BAYS = 8;
export const BAY_LENGTH = 24;
export const HALL_START_Z = -6;
export const CROSS_BAY = 3;
export const RACK = { pitch: 1.3, depth: 2, width: 1.2, height: 8.5 } as const;
export const HALL = { halfWidth: 17.5, beamY: 14, columnHeight: 15, lengthZ: BAYS * BAY_LENGTH } as const;

export const bayStartZ = (bay: number) => HALL_START_Z - bay * BAY_LENGTH;
export const bayCentreZ = (bay: number) => bayStartZ(bay) - BAY_LENGTH / 2;
export const CROSS_Z = bayCentreZ(CROSS_BAY);

export const BOARD = { z: bayStartZ(BAYS) - 10, y: 13, width: 44, height: 26, thickness: 0.8, chip: 9 } as const;
export const BOARD_FRONT_Z = BOARD.z + BOARD.thickness / 2;

export const MACHINE_COLORS = {
  cool: "#7fc8ff",
  hot: "#e4f4ff",
  warm: "#ffb468",
  background: "#05060a",
} as const;
