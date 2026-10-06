# ROADMAP (Phases 05-14)

Status: Phases 01-15 are IMPLEMENTED as code/docs (Phases 06-15 in one autonomous pass), **none runtime verified**. Phase 04/05 code has never been type-checked, built or viewed in a browser: the first job after any new phase is the user's install/typecheck/lint/build/dev pass, and fixing what it finds BEFORE building on top.

## Per-scene recipe (proven by Hero + Machine)
1. `content/<scene>.ts` (server-safe copy) + `components/<x>/<Scene>Section.tsx` (semantic DOM, `data-scene-id`, visible without WebGL, `[data-live]` pin CSS).
2. `components/scene/rise-NN-*/`: `*-state.ts` (mutable channels), `*-shots.ts` (camera track + framing), `*-choreography.ts` (one paused timeline, duration 1; post params copied only when active), kit, components, `*Scene.tsx` default export (applies/restores world config only while `active`).
3. Register in `scene-definitions.ts` and `SCENES` (ChoreographyMount); add CSS region.
4. Dim to a known dark/stable end state; write `transitionState` toward the next scene; start the next scene from that state.
5. Update SCENE_MAP, ASSET_MANIFEST, CURRENT_STATE, AI_HANDOFF. No ScrollTriggers/Lenis outside the choreographer.

## Phases
| Phase | Scene | Core idea (from SCENE_MAP) | Main new technique | Risk |
|---|---|---|---|---|
| 05 | RISE-02-MACHINE | Data hall -> circuit board | Instanced racks, flow bus, signal shader | Draw calls, authored camera |
| 06 | RISE-03-COMPUTATION | Numbers become patterns | GPU particle system (reusable, extract from Hero points), field/flow shader | Particle count budget on mobile |
| 07 | RISE-04-PERCEPTION | Machines process the world | Point-cloud with depth coloring, scanning sweep shader | Generating point data procedurally |
| 08 | RISE-05-LEARNING | Patterns become models | Instanced node/edge network, activation flow driven by scene progress | Edge count / line rendering cost |
| 09 | RISE-06-LANGUAGE | Tokens, meaning | Text-to-particle morph (canvas-sampled text), clusters | Font/text sampling, i18n |
| 10 | RISE-07-GENERATION | Noise to form | Diffusion-style metaphor, geometry generation/distortion | Shader complexity |
| 11 | RISE-08 + RISE-09 | Reasoning (calm), Agency | Sparse path highlights; directed flows; limited holographic panels | Pacing drop after Act III; two scenes in one phase |
| 12 | RISE-10-INTELLIGENCE | Interconnected systems | Large instanced network at scale, atmospheric layers | Biggest perf risk; needs LOD |
| 13 | RISE-11-UNKNOWN | Open future, reflection | Very sparse; atmosphere only; ending | Restraint; deterministic end state |
| 14 | Audio | Hum/fan/electrical layers, cue IDs (`hero:*` exist) | Audio engine subscribing to `subscribeCues` | Autoplay policy, mobile |
| 15 (proposed) | Hardening | Calibrate quality tiers on real devices, idle render throttling, loader, a11y audit, content/fact review | Measurement | Needs real hardware |

## Cross-phase decisions to make early
- Extract a shared GPU particle primitive in Phase 06 (the Hero's `HeroParticles` is the seed) instead of per-scene copies.
- Residency: neighbour scenes stay mounted (hidden); with heavier scenes (10, 12) revisit `planResidency` to keep only the active one resident.
- Replace procedural Hero/Machine with GLBs only if asset budget allows; keep the asset registry path.
- Scroll length per scene (700/600svh) is a placeholder; tune in Phase 15.

## Delivery log (Phases 06-15)
Research notes (web, pmndrs docs): `DepthOfFieldEffect` exposes `bokehScale` and `target` (Vector3, null = autofocus off); the R3F wrapper enables autofocus only when a `target` prop is passed at construction, so PostStack now passes `target` and only moves it. This corrected a Phase 04 assumption.
- 06-13: scenes 03-11 built from shared pieces: `PointField`, `NetworkField`, `point-field.ts`/`line-flow.ts` shaders, data generators, `scene-factory` (declarative choreography), `SceneSection` (generic DOM), `useSceneWorld`.
- 14: procedural Web Audio ambience (no files), per-scene moods, hero cue blips, user-gesture toggle (default off).
- 15: static cross-reference scan, docs, VERIFICATION.md. NOT done: real-device calibration, idle render throttling, loader, content/fact review, real GLBs.
