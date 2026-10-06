import type { Texture } from "three";

/**
 * Environment-lighting source for scene.environment. The world prefilters it (PMREM) and owns the
 * GENERATED prefiltered target only; a source texture belongs to whoever loaded it (asset cache).
 *  - none:            no image-based lighting
 *  - procedural-room: three's RoomEnvironment, generated in code (calibration / placeholder; no asset)
 *  - equirect:        an already-loaded equirectangular texture (future HDRI via the asset system)
 */
export type EnvironmentSource =
  | { kind: "none" }
  | { kind: "procedural-room" }
  | { kind: "equirect"; texture: Texture };
