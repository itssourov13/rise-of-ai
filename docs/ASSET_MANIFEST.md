# ASSET MANIFEST

**Status at Phase 01: no assets obtained, downloaded, created, or verified.** Every row is `PLANNED`. Source and License are intentionally `TBD`; do not fill them without a real, documented origin. Never mark an asset anything beyond PLANNED without a real file in the repo and a recorded source/license.

## Classification

`CORE` · `SUPPORTING` · `DECORATIVE` · `PROCEDURAL` · `SHADER-GENERATED` · `OPTIONAL` · `MOBILE-SIMPLIFIED`

## Status values

`PLANNED` → `SOURCING` → `ACQUIRED` → `OPTIMIZED` → `INTEGRATED` → `VERIFIED` (user-confirmed). Only PLANNED is used now.

## Table

Format/compression columns state the *intended* pipeline, not something applied.

| Asset ID | Name | Scene | Type | Importance | Source | License | Format | Compression | Desktop quality | Mobile quality | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A-01-HERO-MACHINE | Awakening hero machine | RISE-01-AWAKENING | 3D model | CORE | TBD | TBD | GLB | Draco/Meshopt (TBD) + KTX2 (TBD) | High-detail PBR | Reduced-poly variant | PLANNED | Could be modeled or licensed; undecided |
| A-02-RACK-SERVER | Server rack unit | RISE-02-MACHINE | 3D model | CORE | TBD | TBD | GLB | TBD | Detailed, instanced | Simplified, fewer instances | PLANNED | Instance-friendly |
| A-02-COOLING-CABLES | Cooling/cabling kit | RISE-02-MACHINE | 3D model | SUPPORTING | TBD | TBD | GLB | TBD | Detailed | Simplified | PLANNED | |
| A-02-CIRCUIT-MACRO | Circuit/board macro | RISE-02-MACHINE | 3D model/texture | SUPPORTING | TBD | TBD | GLB + textures | KTX2 (TBD) | High-res textures | Lower-res | PLANNED | Macro close-up needs texture detail |
| A-03-DATA-FIELDS | Vector/matrix fields | RISE-03-COMPUTATION | Procedural/shader | CORE | n/a (in-code) | n/a | GLSL/JS | n/a | Full | Reduced density | PLANNED | PROCEDURAL / SHADER-GENERATED |
| A-04-POINTCLOUD | Scanned-space point cloud | RISE-04-PERCEPTION | Point data | CORE | TBD | TBD | TBD (GLB/binary) | TBD | High point count | Low point count | PLANNED | Procedural vs captured undecided |
| A-04-SENSOR | Sensor hardware | RISE-04-PERCEPTION | 3D model | SUPPORTING | TBD | TBD | GLB | TBD | Detailed | Simplified | PLANNED | |
| A-05-NEURAL-NET | Layered node structure | RISE-05-LEARNING | Procedural/instanced | CORE | n/a (in-code) | n/a | JS/GLSL | n/a | Full layers | Fewer layers/nodes | PLANNED | PROCEDURAL |
| A-06-TOKEN-TYPE | Token typography | RISE-06-LANGUAGE | Font/text | CORE | TBD | TBD | TBD (font/SDF) | TBD | Full | Reduced count | PLANNED | Font license must be confirmed first |
| A-07-GEN-FORMS | Generated geometry/media forms | RISE-07-GENERATION | Procedural | CORE | n/a (in-code) | n/a | JS/GLSL | n/a | Full | Reduced | PLANNED | No third-party imagery unless licensed |
| A-08-REASONING-GRAPH | Branching path structure | RISE-08-REASONING | Procedural | CORE | n/a (in-code) | n/a | JS/GLSL | n/a | Full | Simplified | PLANNED | |
| A-09-TOOL-NODES | Tool/API/DB abstractions | RISE-09-AGENCY | 3D/procedural | SUPPORTING | TBD | TBD | TBD | TBD | Full | Reduced | PLANNED | Avoid real brand logos |
| A-10-EARTH-ABSTRACT | Planetary-scale abstraction | RISE-10-INTELLIGENCE | 3D/texture | CORE | TBD | TBD | TBD | TBD | High | Low | PLANNED | Source/license undecided |
| A-10-NETWORK-FABRIC | Large network fabric | RISE-10-INTELLIGENCE | Procedural/instanced | CORE | n/a (in-code) | n/a | JS/GLSL | n/a | Full | Heavily reduced | PLANNED | |
| A-11-UNKNOWN-FORM | Ambiguous final form | RISE-11-UNKNOWN | Procedural/3D | OPTIONAL | TBD | TBD | TBD | TBD | Minimal | Minimal | PLANNED | Concept undecided |
| A-ENV-HDRI | Environment lighting maps | Multiple | HDRI | SUPPORTING | TBD | TBD | TBD (HDR/KTX2) | TBD | Per scene | Smaller | PLANNED | Source/license TBD |
| A-FX-PARTICLES | Particle base system | Multiple | Procedural | SUPPORTING | n/a (in-code) | n/a | JS/GLSL | n/a | Full budget | Reduced budget | PLANNED | PROCEDURAL |
| A-AUDIO-BED | Audio beds/cues | Multiple | Audio | OPTIONAL | TBD | TBD | TBD | TBD | Full | Lower bitrate | PLANNED | Phase 14 |
| A-FALLBACK-VISUALS | Static fallback visuals | All | Image/video | SUPPORTING | TBD | TBD | TBD | TBD | n/a | n/a | PLANNED | Needed for no-WebGL path |

## Engine notes (Phase 03)

- Runtime format: GLB/glTF. Asset IDs in this manifest map to `AssetDefinition` entries in `src/lib/assets/registry.ts` (still **empty**: no real file exists). Registry entries need `criticality` (`critical` | `optional`), textures need `textureRole`, optional `lods`/tier variants.
- Folder convention (create on first real file): `public/experience/{models,textures,environment,audio,images,fonts,decoders}`. (`hdr/` from Phase 02 is now `environment/`.)
- Draco/KTX2 decoder files, if used, are served from `public/experience/decoders/` and enabled explicitly (not done; nothing copied or downloaded).
- Environment lighting in Phase 03 is procedural (`RoomEnvironment`, code-only); **A-ENV-HDRI remains PLANNED**; no HDRI committed.
- The dev calibration world uses no assets.

## Rules

1. Don't invent sources or licenses.
2. Every asset needs a fallback behavior defined by its scene (see SCENE_MAP/ARCHITECTURE).
3. Mobile variants are separate rows' columns or separate files, never an afterthought.
4. Record file size and texture memory estimates here once real files exist.
5. Add new assets by appending rows with stable IDs; don't renumber.

## Phase 04 additions: procedural assets (no external assets)

External assets required for Phase 04: **NONE REQUIRED FOR PHASE 04**. Nothing was downloaded; no sources or licenses are claimed.

| ID | Class | Scene | Description | Status |
|---|---|---|---|---|
| PROC-HERO-MACHINE | PROCEDURAL | RISE-01 | Industrial computational apparatus built from shared bevelled/lathe geometry, instanced patterns (`components/scene/rise-01-awakening/*`) | implemented, not runtime verified |
| PROC-HERO-MATERIALS | PROCEDURAL | RISE-01 | Dark anodized / brushed / deep alloy + matte panel PBR materials; seeded procedural roughness DataTexture (128x128 x2, NoColorSpace) | implemented, not runtime verified |
| PROC-HERO-PARTICLES | PROCEDURAL | RISE-01 | One seeded `Points` field (350-2200 points by tier), shader drift | implemented, not runtime verified |
| PROC-HERO-ENERGY-CORE | PROCEDURAL | RISE-01 | `ShaderMaterial` energy column (`lib/three/shaders/energy-core.ts`) | implemented, not runtime verified |

Replacement path: a production GLB can replace `HeroMachine` behind the same scene definition via the asset registry; the HeroKit disposal contract then shrinks to whatever remains procedural.

## Phase 05 additions: procedural assets (no external assets)
External assets required for Phase 05: **NONE REQUIRED FOR PHASE 05**.

| ID | Class | Scene | Description | Status |
|---|---|---|---|---|
| PROC-MACHINE-HALL | PROCEDURAL | RISE-02 | Hall shell, racks (instanced), cooling units, cable trays | implemented, not runtime verified |
| PROC-MACHINE-BOARD | PROCEDURAL | RISE-02 | Circuit board: chip, seeded instanced traces/pads, signal shader | implemented, not runtime verified |
| PROC-MACHINE-TEXTURES | PROCEDURAL | RISE-02 | Two seeded brushed-roughness DataTextures (NoColorSpace) | implemented, not runtime verified |

## Phases 06-15: procedural assets (no external assets)
External assets required: **NONE**. Procedural data: seeded point/graph generators (`lib/three/data/generators.ts`), canvas-sampled text (system font, no font file), synthesized audio (Web Audio oscillators + generated noise, no audio files).
