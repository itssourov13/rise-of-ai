/**
 * Machine scene state: MUTABLE, non-reactive; written by the Machine timeline, read per frame by components.
 *   reveal      0..1 lighting / readability
 *   flow        0..1 power front travelling through the hall bays (front -> back)
 *   mechanical  0..1 fan engagement
 *   signal      0..1 circuit-trace glow
 *   pulse       0..1 signal pulse front along the traces
 *   handoff     0..1 hall dims, the board's signal remains (structure -> signal, toward RISE-03)
 */
export interface MachineState {
  reveal: number;
  flow: number;
  mechanical: number;
  signal: number;
  pulse: number;
  handoff: number;
}

const REST: Readonly<MachineState> = { reveal: 0, flow: 0, mechanical: 0, signal: 0, pulse: 0, handoff: 0 };
export const machineState: MachineState = { ...REST };
export const resetMachineState = (): void => void Object.assign(machineState, REST);

export const MACHINE_BEATS = [
  { id: "dark", at: 0 },
  { id: "aisle", at: 0.14 },
  { id: "flow", at: 0.3 },
  { id: "lateral", at: 0.5 },
  { id: "reveal", at: 0.72 },
  { id: "circuit", at: 0.9 },
  { id: "handoff", at: 1 },
] as const;

export function machineBeatAt(progress: number): string {
  let id: string = MACHINE_BEATS[0].id;
  for (const b of MACHINE_BEATS) if (progress >= b.at) id = b.id;
  return id;
}
