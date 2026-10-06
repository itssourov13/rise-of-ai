import { ACESFilmicToneMapping, NoColorSpace, SRGBColorSpace, type ColorSpace, type ToneMapping } from "three";
import type { TextureRole } from "@/lib/assets/types";

/**
 * Centralized color-management and tone-mapping policy. Scenes never set these on the renderer.
 *
 * Model (three.js ColorManagement, enabled by default):
 *  - Working space is Linear-sRGB. Material colors, light colors and shader math are linear.
 *  - Hex/CSS strings given to THREE.Color / JSX `color="#rrggbb"` are interpreted as sRGB and converted
 *    to the working space automatically. Do not convert them manually.
 *  - Output is converted to sRGB by the renderer (OUTPUT_COLOR_SPACE).
 *  - Textures declare their SOURCE color space: color/emissive maps are sRGB; data maps
 *    (normal/roughness/metalness/ao) are NoColorSpace. Never treat every image as sRGB.
 *  - HDR/environment inputs are linear data; their loaders set the right space. Environments are prefiltered
 *    with PMREMGenerator (see components/world/WorldEnvironment.tsx).
 *  - Custom shader color uniforms are expected in the LINEAR working space unless a shader documents otherwise.
 *
 * Tone mapping: ACES Filmic is the R3F default and is kept as the provisional policy so the renderer
 * agrees with R3F's own configure step. Final cinematic exposure/curve is NOT tuned in Phase 03.
 * If this is ever changed away from ACES Filmic, verify R3F's reconfigure does not override it (UNVERIFIED).
 */
export const OUTPUT_COLOR_SPACE: ColorSpace = SRGBColorSpace;
export const TONE_MAPPING: ToneMapping = ACESFilmicToneMapping;
export const BASE_EXPOSURE = 1;
/** Scenes may scale exposure only through the engine store, within this range. */
export const EXPOSURE_SCALE_RANGE = [0.25, 4] as const;

export function colorSpaceForTextureRole(role: TextureRole): ColorSpace {
  return role === "color" || role === "emissive" ? SRGBColorSpace : NoColorSpace;
}
