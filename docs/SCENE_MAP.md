# SCENE MAP

This file originated as the Phase 01 conceptual scene map. The later Phase 04-15 implementation is now present in `src/components/scene/`; IDs remain stable and must not be renamed without updating every doc and registry reference. Runtime/readiness status is tracked in `CURRENT_STATE.md` and `VERIFICATION.md`.

Content tags used in the story: FACT / ARTISTIC / SPECULATIVE (see PROJECT_OVERVIEW.md).

Order and acts:

| Order | Scene ID | Act | Owning phase |
|---|---|---|---|
| 01 | RISE-01-AWAKENING | I | 04 |
| 02 | RISE-02-MACHINE | I | 05 |
| 03 | RISE-03-COMPUTATION | I→II | 06 |
| 04 | RISE-04-PERCEPTION | II | 07 |
| 05 | RISE-05-LEARNING | II | 08 |
| 06 | RISE-06-LANGUAGE | II→III | 09 |
| 07 | RISE-07-GENERATION | III | 10 |
| 08 | RISE-08-REASONING | III→IV | 11 |
| 09 | RISE-09-AGENCY | IV | 11 |
| 10 | RISE-10-INTELLIGENCE | IV→V | 12 |
| 11 | RISE-11-UNKNOWN | V | 13 |

Audio for all scenes lands in Phase 14. Transitions between scenes are owned by the choreographer (ARCHITECTURE.md §6), not by either scene alone.

---

## RISE-01-AWAKENING

**Status: IMPLEMENTED in Phase 04 (production scene). NOT RUNTIME VERIFIED.** IDs unchanged. Narrative title: THE MACHINE AWAKENS. Chapter 01 / 11 "The Awakening".

**Environment.** Near-black void (`#06070a`), exp2 fog (density 0.014 -> 0.0055 as the scene clears), dark brushed floor disc, procedural-room environment at very low intensity (`scene.environmentIntensity` animated from `reveal`).

**Machine (procedural, ~28 m tall; core at y=9).** Macro: base slab + platform, 6 columns (r=17.5), top gantry ring + 3 beams, ventilated fin housing (service aperture facing +Z exposes the core), 3 counter-rotating chamfered rings. Secondary: arms, struts, 6 heat-sink cooling stations, large fan over the core, sliding energy shutters. Micro: bolts, vent slats, ladders (human-scale cue), catwalk + rail posts, cable runs, indicator units, inset emissive channels. Instanced where repeated (shared geometry/material). Not photorealistic: a cinematic procedural interpretation.

**Beats (progress guideposts, not pixel distances).** 0 void · .10 signal · .22 structure · .42 power · .62 awakening · .82 peak · .92 title · 1.0 handoff. Energy pulse waves travel core -> inner ring -> structure -> outer modules (layers 0..3).

**Camera shots (CameraRig via intent bus, Hermite track).** 01 far/obscured · 02 slow push · 03 partial reveal · 04 structural orbit · 05 core inspection (macro lens, DOF) · 06 wide reveal (low angle) · 07 title framing (machine right of frame) + handoff pull-back. Reduced motion: 3 poses.

**Materials.** MeshStandardMaterial: dark anodized alloy, brushed alloy (procedural roughness map), deep alloy, matte panel, floor; emissive strip materials per pulse layer; 3 indicator groups; energy-core ShaderMaterial.

**Lights.** Ambient, 1 shadow-casting key directional, rim directional, core point, warm status point, scanning point (last two skipped on LOW/MOBILE). Single shadow map.

**Particles.** One `Points` object, seeded, count by quality tier (UNVERIFIED), reduced-motion drift ~0.12x.

**Shader use.** energy-core (uEnergy/uPulse/uTime), particles. Linear HDR output, tone-mapping/colorspace chunks included.

**Post-processing.** Bloom + DOF (core inspection only) + ToneMapping + Vignette + Noise by tier; LOW/MOBILE = minimal bloom; chromatic aberration NOT implemented.

**Responsive.** desktop / tablet / mobile camera framing (distance + core focus bias); mobile drops micro details (geometry detail < 0.75), particles, DOF, shadows via the quality tier.

**Fallback.** Semantic DOM Hero (h1, subtitle, chapter label, beat lines, all visible) without the 3D layer.

**Known performance issues / unknowns.** Draw calls, triangles, frame time: UNVERIFIED. Continuous rendering while the Hero is active, even when scroll is idle.

## RISE-02-MACHINE

**Status: IMPLEMENTED in Phase 05. NOT RUNTIME VERIFIED.** Concept (kept): ground the story in physical computation infrastructure.

- **Environment:** open industrial data hall (no walls; darkness is the room): raised floor, 9 column pairs, ceiling beams, cable trays, 8 bays x 24 m, a cross aisle at bay 3. Fog exp2 (~0.0075-0.011). End wall: a large circuit board.
- **Structure:** ~560 racks (instanced, rows back-to-back; MOBILE/LOW: front rows only, no vents/LEDs), vent slats, cooling units with fan arrays against the side walls, procedural board: chip, ~200 seeded Manhattan traces (instanced, signal shader) and pads.
- **Beats:** 0 dark · .14 aisle · .30 power flow · .50 lateral · .72 vertical reveal · .90 circuit macro · 1.0 handoff. Per-bay emissive "flow bus": a power front lights the hall bay by bay.
- **Camera (Hermite track via intent bus):** approach (continuing from the Hero's dark end) · aisle dolly · lateral travel through the cross aisle · rise above the beams · wide to the board · macro push (DOF).
- **Lights:** cool ambient + top fill, camera-following warm and cool practicals, board light (skipped on LOW/MOBILE). No shadow maps. Warm/cool split per the concept.
- **Shaders:** signal-trace shader (travelling pulse). No heat shimmer, steam or status-light flicker (deliberately not implemented; flicker avoided by the "no random blinking" rule).
- **Transition out:** structure dims (`handoff`), the board's signal remains -> RISE-03 starts from signal. Not implemented beyond the dim + transitionState.
- **DOM:** `MachineSection` (h2, subtitle, 4 caption lines, chapter label); copy is provisional and contains no dated claims.
- **Known issues:** layout/camera authored without a render; ~560 racks + ~4k instances: draw calls/triangles UNVERIFIED; Hero and Machine kits are both resident (neighbour warm) so memory is higher; no particles in this scene.

## RISE-03-COMPUTATION

**Status: IMPLEMENTED (not runtime verified). Phase 06. Shared GPU `PointField` (up to 9k points by tier): noise cloud -> layered wave sheets (staggered morph), flow displacement settling as pattern forms. Camera drifts through/around the cloud. Handoff: dims. Files: `rise-03-computation/*`.** Camera/state values are authored, not visually tuned (UNVERIFIED).
- **Purpose:** Numbers become patterns.
- **Environment:** Abstract but spatially coherent data space: grids, vectors, matrices, fields.
- **Visual language:** Scientific visualization; restrained cyan/blue; precise, sparse linework.
- **Camera:** Tunnel traversal and controlled rotation through structures.
- **3D elements:** Matrices as lattices, vector fields, signal traces; typography as data metadata.
- **Particles/shaders:** Particle structures forming patterns from noise; field/flow shaders.
- **Transition out:** Patterns resolve toward sensor-like scanning geometry → 04.
- **Audio:** Digital signals emerging from electrical bed.
- **Mobile:** Reduced particle budget, fewer simultaneous fields.

## RISE-04-PERCEPTION

**Status: IMPLEMENTED (not runtime verified). Phase 07. Procedural world (terrain + blocks) as a depth-coloured point cloud (up to 15k); scanning plane sweep reveals it near-to-far; at the end points reorganize into 5 layer sheets. Files: `rise-04-perception/*`.** Camera/state values are authored, not visually tuned (UNVERIFIED).
- **Purpose:** Machines begin processing the world around them.
- **Environment:** A scanned space reconstructed from sensor data.
- **Visual language:** Scientific/spatial; scan lines used sparingly; depth-driven composition.
- **Camera:** Orbit around a scanned subject; wide environmental reveal as the point cloud resolves.
- **3D elements:** Sensor hardware, point cloud of a real-world-like space, depth layers.
- **Particles/shaders:** Point-cloud rendering with depth coloring; scanning sweep shader.
- **Transition out:** Point cloud's points reorganize into layered node structures → 05.
- **Audio:** Pulse/ping sensor motifs.
- **Mobile:** Lower point count, static orbit arc.
- **Open question:** Source of point-cloud data (procedural vs captured vs licensed) — undecided.

## RISE-05-LEARNING

**Status: IMPLEMENTED (not runtime verified). Phase 08. Layered network 6-10-10-8-4 (~500 edges), edge-flow shader with layer-front activation passes (4 waves), edge base level = weights growing. `NetworkField`.** Camera/state values are authored, not visually tuned (UNVERIFIED).
- **Purpose:** Patterns become models.
- **Environment:** Layered structure of nodes and connections in volumetric space.
- **Visual language:** Restrained electric violet permitted; avoid generic "glowing brain" clichés — treat as engineered structure.
- **Camera:** Dolly along layers; close-up on weight/activation flow; pull-back to reveal full architecture.
- **3D elements:** Instanced nodes, connection geometry, activation pulses.
- **Particles/shaders:** Activation flow along edges; layer emissive gradients driven by `uSceneProgress`.
- **Transition out:** Activations carry symbol-like fragments → 06.
- **Audio:** Neural pulse rhythms.
- **Mobile:** Fewer layers/nodes, simplified connections (lines/instances only).
- **Note:** Neural visualization is an ARTISTIC depiction, not literal model internals; label accordingly.

## RISE-06-LANGUAGE

**Status: IMPLEMENTED (not runtime verified). Phase 09. Token clusters morph into the word LANGUAGE (canvas-rasterized text sampled into targets, system font, no download), then loosen again. Mobile: camera pulled back 1.7x.** Camera/state values are authored, not visually tuned (UNVERIFIED).
- **Purpose:** Tokens, words, meaning-like representations.
- **Environment:** Latent-space metaphor: clusters of tokens arranged by similarity.
- **Visual language:** Editorial typography becomes spatial; high-legibility, restrained palette.
- **Camera:** Lateral travel across clusters; vertical reveal of structure; close-ups of token groups.
- **3D elements:** 3D/hybrid typography, semantic clusters, connecting relations.
- **Particles/shaders:** Text-to-particle morphs; cluster attraction/repulsion.
- **Transition out:** Clusters begin composing new forms rather than just organizing → 07.
- **Audio:** Synthetic soundscape begins.
- **Mobile:** Fewer tokens, larger type, DOM text as primary carrier.
- **Constraint:** Language claims stay conceptual ("meaning-like"), never "understanding".

## RISE-07-GENERATION

**Status: IMPLEMENTED (not runtime verified). Phase 10. Noise sphere -> torus-knot surface in 8 discrete denoising steps (`uQuant`), flow settles; light DOF at the end.** Camera/state values are authored, not visually tuned (UNVERIFIED).
- **Purpose:** Models produce new media and artifacts.
- **Environment:** Fluid, creative space where forms are synthesized from noise.
- **Visual language:** Dynamic, high-energy, warmer energy tones allowed; keep premium, not rainbow.
- **Camera:** Orbit and dolly around forming objects; push into emerging image-like structures.
- **3D elements:** Procedural geometry, image-like planes/volumes, media representations (no copyrighted imagery).
- **Particles/shaders:** Noise-to-form diffusion-style metaphor, geometry generation, distortion.
- **Transition out:** Generated forms begin to chain and branch in sequence → 08.
- **Audio:** Fluid synthetic textures.
- **Mobile:** Reduced particle count, fewer simultaneous generated objects.
- **Open question:** Imagery source; must be original/procedural or licensed.

## RISE-08-REASONING

**Status: IMPLEMENTED (not runtime verified). Phase 11. Deliberately calm: sparse decision tree (depth 6) with one highlighted path, other edges dimmed (`uHiOnly`), slower scrub (0.9), distant sparse structures appear at the end.** Camera/state values are authored, not visually tuned (UNVERIFIED).
- **Purpose:** Response → multi-step problem solving. Deliberate pacing drop after Act III intensity.
- **Environment:** Calmer structured space where paths branch, evaluate, and converge.
- **Visual language:** Precision, clarity, space; lower intensity than 07.
- **Camera:** Controlled rotation and slow lateral travel following a path through a branching structure.
- **3D elements:** Step/branch structures, evaluation nodes, converging path.
- **Particles/shaders:** Sparse path highlights, selective emissive; avoid noise.
- **Transition out:** The path extends outward, reaching toward external structures → 09.
- **Audio:** Sparser textures; rhythmic, measured.
- **Mobile:** Simplified branching with fewer nodes.

## RISE-09-AGENCY

**Status: IMPLEMENTED (not runtime verified). Phase 11. Energy-core hub, 7 wireframe tool modules, spoke edges with outward flow, 2 decorative holographic panels, then a fabric of links between tools.** Camera/state values are authored, not visually tuned (UNVERIFIED).
- **Purpose:** Models interact with tools and environments.
- **Environment:** Systems space with tools, APIs, databases, code, browser-like abstractions as spatial objects.
- **Visual language:** Power and scale; interface-like elements justified by environment (holographic UI only where it supports the world).
- **Camera:** Wide reveal; dolly between tool clusters; close-ups on action/response exchanges.
- **3D elements:** Tool nodes, data stores, code panes (abstract), connection links.
- **Particles/shaders:** Directed data flows; holographic panels (limited).
- **Transition out:** Individual systems begin linking into a larger fabric → 10.
- **Audio:** Dense digital layers building.
- **Mobile:** Fewer tool clusters; DOM-based labels.

## RISE-10-INTELLIGENCE

**Status: IMPLEMENTED (not runtime verified). Phase 12. Organic network (350-1800 nodes, ~2 edges/node) with radial activation waves, faint dust; thins to quiet at the end. Highest performance risk.** Camera/state values are authored, not visually tuned (UNVERIFIED).
- **Purpose:** Many computational systems become interconnected.
- **Environment:** Large interconnected computational environment, planetary-scale in feel.
- **Visual language:** Scale, awe, controlled complexity; widest depth range in the piece.
- **Camera:** Slow pull-back from interior detail to planetary-scale overview.
- **3D elements:** Network fabric, nodes at multiple scales; Earth-scale abstraction (must be original/licensed).
- **Particles/shaders:** Large-scale flows, atmospheric layering, instanced network at scale.
- **Transition out:** Activity fades; density thins into silence → 11.
- **Audio:** Large cinematic environment, then recede.
- **Mobile:** Heavily reduced node count; stronger reliance on composition.
- **Note:** Depiction is ARTISTIC; avoid implying a literal global AI entity.

## RISE-11-UNKNOWN

**Status: IMPLEMENTED (not runtime verified). Phase 13. Sparse drifting points (150-450), one distant glimmer, closing line; slow scrub (1.0); never fades out the closing: deterministic final state.** Camera/state values are authored, not visually tuned (UNVERIFIED).
- **Purpose:** The future remains open. Reflection.
- **Environment:** Near-empty space; minimal elements.
- **Visual language:** Silence, restraint, negative space; lowest intensity.
- **Camera:** Slow, near-still drift or final wide hold.
- **3D elements:** Minimal; possibly a single ambiguous form or horizon.
- **Particles/shaders:** Very sparse; atmosphere only.
- **Transition:** End state; optional loop-back/credits are a Category B decision.
- **Audio:** Fades to silence.
- **Mobile:** Nearly identical (cheap by design).
- **Constraint:** Any statements about the future are tagged SPECULATIVE.
