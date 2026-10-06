/**
 * World-space conventions. Future scenes must follow them. They are conventions, not physical laws.
 *
 *  - Unit:    1 world unit ~ 1 meter for physical-scale environments (an approximation).
 *  - Up:      +Y.   Right: +X.   Forward (default camera look direction): -Z (three.js default).
 *  - Origin:  each scene owns a LOCAL coordinate space centred near its focal point; the global origin
 *             is not a shared "map". Scenes do not place themselves relative to each other in one space.
 *  - Scale:   human reference height 1.8; typical hero object 0.5-5 units; keep geometry within roughly
 *             +/-1000 units of the scene origin to avoid float precision artifacts.
 *  - Camera clipping: near 0.1 / far 200 default (types/camera.ts). Raise near as far grows; keep
 *             far/near under ~1e5. Logarithmic depth is NOT used.
 */
export const WORLD_UNIT_METERS = 1;
export const WORLD_UP = [0, 1, 0] as const;
export const WORLD_FORWARD = [0, 0, -1] as const;
export const HUMAN_REFERENCE_HEIGHT = 1.8;

/** Mirrors --bg-base in globals.css (no token->three bridge yet; keep in sync manually). */
export const WORLD_BACKGROUND = "#06070a";
