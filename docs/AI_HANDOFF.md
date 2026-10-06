# AI HANDOFF

Read order: PROJECT_OVERVIEW → ARCHITECTURE (incl. Phase 02 + Phase 03 addenda) → SCENE_MAP → DESIGN_SYSTEM → **3D_ENGINE** → CURRENT_STATE → AI_HANDOFF → ASSET_MANIFEST (TECHNICAL_BASELINE for stack details). Don't assume prior conversation context.

## 1. Project
RISE OF AI — From Machine to Intelligence: scroll-driven cinematic 3D web experience, 11 chapters (`RISE-01-AWAKENING` … `RISE-11-UNKNOWN`), 15 phases.

## 2. History
- **Phase 01:** documentation/architecture only.
- **Phase 02:** technical foundation (Next.js App Router shell, client-only persistent R3F Canvas, state/scroll/GSAP/Lenis/quality/capability/renderer/asset/registry boundaries).
- **Phase 03:** reusable 3D engine foundation + dev calibration world. At that historical point the inspected archive had no lockfile and no `public/`; the repository has since acquired `pnpm-lock.yaml` and later phases added the production scene code documented below.

## 3. Current verification status
The repository was installed and verified on 2026-10-06 after a focused compile/lint fix pass.

- Direct TypeScript check: PASS.
- Direct ESLint check: PASS — 0 errors, 0 warnings.
- Production Webpack build: PASS.
- Default Turbopack build: currently fails locally with `Invalid symlink` after dependency-tree recreation; treat this as a toolchain/dependency-layout issue until disproven.
- Browser/WebGL/GPU/mobile/performance verification: still NOT PERFORMED.

Do not reopen already-fixed TypeScript/lint issues unless a new regression appears. See `docs/VERIFICATION.md` for the exact checks and remaining runtime checklist.

## 4. What Phase 03 established (do NOT rebuild unless a documented bug requires it)
Canvas · renderer foundation & policy · color/tone-mapping policy · frame-loop policy · CameraRig + intent bus · world (background/atmosphere/environment) · lighting primitives & budget · asset registry/resolver/cache/LoadingManager/glTF path · scene registry, lifecycle, residency, SceneHost · quality→renderer controls · engine store · engine time/progress/transition read-models · diagnostics & debug flags · post-processing seam · calibration world.

## 5. How scenes plug in (for Phase 04+)
1. Add/adjust the `ChapterDefinition` (`content/chapters.ts`) incl. `camera` if wanted.
2. Add one `SceneDefinition` (`components/scene/scene-definitions.ts`): lazy `load` returning a component of `SceneProps {active}`, plus `assets` (IDs).
3. Register assets in `lib/assets/registry.ts` (real file under `public/experience/…` + `ASSET_MANIFEST.md` row first). Textures need `textureRole`; mark `criticality`.
4. In the scene: use refs/`useFrame` with `delta`; read `engineTime`/`sceneProgress`; configure the world via `useEngineStore` actions and restore on unmount; request continuous rendering with `acquireContinuous()` only while animating; submit camera intent via `submitCameraIntent(...)`; use `KeyLight`/`RimLight`/`AccentPoint`; respect `reducedMotion` and `useRenderControls()`.
5. Scene activation is now driven by the choreography layer: `lib/choreography/choreographer.ts` calls `setActiveChapter(...)` as scene choreography activates/deactivates. `SceneHost` consumes `currentSceneId` to plan residency. Preserve this single ownership path; do not add competing scene-selection state.

## 6. Must NOT be redesigned or changed without explicit user approval
Scene IDs/order; 15-phase roadmap; out-of-plan policy (A/B/C); single canvas + single scroll driver + camera-rig-only writer; server/client split; React held <19.3 until R3F supports it; no per-frame values in React/Zustand; no logarithmic depth by default; calibration world is never a RISE scene; no fake assets/progress/verification.

## 7. Still not built / still open
Loader UI, final runtime quality adaptation and idle render throttling, pointer interaction polish, WebGPU, automated per-scene tests, final production assets/compression, device calibration, and full browser/WebGL/performance verification. Production scenes, choreographer, Lenis↔GSAP sync, particles, shaders, post-processing and audio are implemented in later phases.

## 8. Unresolved questions
Browser/WebGL behavior, scene transition quality, shader/runtime behavior, device performance, real asset loading, runtime quality adaptation, final budgets, asset licensing, copy sourcing, loop-back/credits, and Draco/KTX2 decoder serving remain open. Source compile/lint and Webpack production build are no longer unresolved.

## 9. Verification commands
With dependencies available:
```bash
./node_modules/.bin/tsc --noEmit --pretty false --incremental false
./node_modules/.bin/eslint . --no-color
./node_modules/.bin/next build --webpack
pnpm dev
```
Then open `http://localhost:3000/?debug=all` and complete `docs/VERIFICATION.md` section 4. The pnpm wrapper may trigger environment-specific dependency policy/build-script handling; do not change repository dependencies just to bypass that.

## 10. Next session
Continue from **PHASES 06-15 IMPLEMENTED**. First priority is browser/WebGL/mobile/runtime verification and performance calibration; do not restart Phase 04/05 unless a documented regression requires it.


## Phase 04 handoff (read first)
Phase 04 completed the first production cinematic scene (RISE-01-AWAKENING) plus the central choreographer and Lenis<->GSAP sync. NOTHING was runtime-verified (no install/dev/build/typecheck was run): expect first-run type or visual bugs.

Do NOT rebuild: Canvas, renderer, CameraRig, asset registry, scene registry, quality system, post-processing boundary (PostStack/RenderPipeline), choreographer, Lenis/GSAP sync, unless a bug requires it.

Add a scene: (1) scene component + registration in `scene-definitions.ts`; (2) a `SceneChoreography` (copy the Hero pattern: state module, shot track, one paused timeline of duration 1, `onProgress` -> camera intent) added to `SCENES` in `ChoreographyMount.tsx`; (3) a region element with `data-scene-id` and an id matching `regionSelector`. Do not create ScrollTriggers or Lenis instances elsewhere. Write per-frame values to mutable objects, never Zustand.

Hero end state (progress 1): dimmed, pulled back, title visible, `transitionState` progress 1 toward RISE-02. Phase 05 should take over from it. The Hero stays the active scene until another scene activates.
Next session focus: RISE-02-MACHINE.

## Phase 05 handoff
Phase 05 added RISE-02-MACHINE using the Phase 04 recipe (see docs/ROADMAP.md "Per-scene recipe"). Still NOTHING runtime-verified; ask the user for their typecheck/lint/build/dev results first and fix those before Phase 06.
Rules learned: scenes must not write shared post params or world config unless active; state objects are per scene; use `components/scene/shared/Instances`. Next session: RISE-03-COMPUTATION (extract a reusable GPU particle primitive from HeroParticles).

## Phases 06-15 handoff
All 11 scenes + audio exist but NOTHING is verified. First action next session: get the user's typecheck/lint/build/dev output and fix errors; then follow docs/VERIFICATION.md. New scenes should use `createSceneChoreography` + `PointField`/`NetworkField`; do not duplicate the Hero/Machine patterns. Chapter copy in `content/scenes.ts` is provisional and fact chapters need sourced content.
