# CURRENT STATE

**Current phase:** PHASES 06-15 IMPLEMENTED. Source-level verification was performed on 2026-10-06 after a focused fix pass: TypeScript and ESLint are clean, and a production Webpack build succeeds. The default Turbopack build still has a local dependency/symlink failure after reinstall (`Invalid symlink`), so Turbopack and browser/WebGL runtime verification remain open. Package-manager policy also rejects the current lockfile's newly published transitive packages unless the local `minimumReleaseAge` policy is overridden.

**Verification snapshot (2026-10-06):**
- `tsc --noEmit --pretty false --incremental false`: PASS.
- `eslint . --no-color`: PASS — 0 errors, 0 warnings.
- `next build --webpack`: PASS — production compilation, TypeScript, static generation and build traces completed.
- `next build` (default Turbopack): FAILS in Turbopack with `TurbopackInternalError: Invalid symlink` after dependency reinstall; no source TypeScript/lint error accompanied the failure.
- `pnpm typecheck`: not currently a reliable verification command in this environment because pnpm attempts dependency reconciliation and the active supply-chain policy rejects several very recent lockfile entries; the direct compiler command above is the verified typecheck.
- Browser/WebGL/mobile/performance/runtime verification: NOT PERFORMED.

**Fix pass completed:** lifecycle typing, React/Three imperative-mutation lint boundaries, unused imports, and TypeScript include scope were corrected. See `docs/VERIFICATION.md` for the detailed verification record and `docs/AI_HANDOFF.md` for the current handoff rules.

## Phases 06-15 summary (implemented; source/build verified, browser/WebGL runtime verification still open)
- **Scenes 03-11** exist (see SCENE_MAP) on shared infrastructure: `components/scene/shared/{PointField,NetworkField,useSceneWorld,useDensityCount}`, `lib/three/shaders/{point-field,line-flow,signal-traces}`, `lib/three/data/generators.ts`, `lib/choreography/scene-factory.ts`, `content/scenes.ts`, `components/scene-section/SceneSection.tsx`.
- **Audio (Phase 14):** `lib/audio/engine.ts` + `components/audio/AudioToggle.tsx` (procedural, default off, gesture-gated).
- **Fix:** DepthOfField target handling (research-backed).
- **Not done / future:** calibration on devices, idle render throttling, loader, sourced facts for "fact" chapters, GLB assets, volumetrics, `__rise` helpers for non-Hero scenes, per-scene unit tests.
- **Known risks:** see `docs/VERIFICATION.md` for the current verification matrix, especially Turbopack/symlink behavior and browser/WebGL checks.
- **Next step:** perform browser/WebGL/mobile/performance verification, then tune scene visuals and runtime budgets.

## Phase 05 summary (implemented; runtime verification: NOT PERFORMED)
- **Scene:** RISE-02-MACHINE (data hall + cooling + circuit board). Details in SCENE_MAP. Files: `components/scene/rise-02-machine/*`, `components/machine/MachineSection.tsx`, `content/machine.ts`, `lib/three/shaders/signal-traces.ts`.
- **Shared refactors (from Phase 04):** `Instances` -> `components/scene/shared/`, geometry helpers -> `lib/three/geometry/procedural.ts`, brushed texture -> `lib/three/textures/brushed.ts`.
- **Handoff fixes:** scenes write post params only while active (local post objects); world config (environment/atmosphere) applied only while active; Hero handoff now dims almost to black so the scene swap is hidden.
- **Roadmap:** `docs/ROADMAP.md` (Phases 05-15, per-scene recipe).
- **Known risks:** both scene kits resident at once; ~560 racks; authored camera; no heat shimmer/steam; chapter nav `#machine` now targets the Machine region.
- **Next phase:** PHASE 06 — RISE-03-COMPUTATION.

## Phase 04 summary (implemented; runtime verification: NOT PERFORMED)
- **First production scene:** RISE-01-AWAKENING (procedural industrial machine, 6+ beats, DOM title card, chapter label, decorative readout).
- **Choreography:** `lib/choreography/*` (choreographer, camera track, keyframes, cues, post params, viewport class); Hero modules in `components/scene/rise-01-awakening/`. One Lenis (GSAP-ticker driven), one ScrollTrigger per scene region, cleanup via gsap.context.
- **Post-processing:** `@react-three/postprocessing` 3.1.3 + `postprocessing` 6.39.5 declared in package.json (NOT installed). Bloom/DOF/Vignette/Noise/ToneMapping by tier.
- **Procedural assets:** machine, materials, particles, energy-core shader (see ASSET_MANIFEST).
- **Known issues / risks:** no browser run ever; DOF/Bloom/Vignette ref property names and ACES match unverified; camera/lighting values authored by reasoning only; continuous render loop; sticky pin instead of ScrollTrigger pin; Hero text overlap with machine at some viewports unchecked.
- **Future work (not implemented):** real GLB, volumetric light, scanned textures, cable simulation, GPU particles, chromatic aberration peak, audio (cue IDs exist), idle render throttling.
- **Next phase:** PHASE 05 — THE AGE OF MACHINES (RISE-02-MACHINE).


## Historical Phase 03 baseline
Phase 03 established the reusable 3D engine, renderer policy, lifecycle/residency system, diagnostics and calibration world. The verification statements in that original baseline are historical; the repository has since been compiled, linted and production-built as recorded at the top of this file. Browser/WebGL/GPU/performance/mobile verification remains open.

## Repository reconciliation
- **Real repository inspected (Phase 03):** yes — the uploaded `rise-of-ai.zip`. It contains exactly the Phase 02 scaffold (config files, `src/`, `docs/`, README); **no lockfile, no `node_modules`, no `public/`**, no `.git` in the archive. Phase 02 had been authored greenfield; it is now confirmed to be the real repo.
- **Compatible:** Phase 02 structure was kept and extended in place (same folders, ids, stores, scroll driver, GSAP module, backend seam, asset-ID indirection, error boundary).
- **Differences / decisions (Phase 03):**
  1. **WebGL 2 is now required** for `renderMode:"active"`. Phase 02 allowed WebGL 1; three r186 is WebGL 2-only (upstream removed WebGL 1), so WebGL 1-only devices now take the fallback path (`useExperienceBootstrap.ts`). Basis: knowledge of three's release notes, not verified by running.
  2. `AssetKind` `"hdr"` → `"environment"` (nothing referenced it; registry empty); added `"shader"`, `AssetCriticality`, `LodLevel`, `TextureRole`.
  3. `applyCameraIntent` (instant apply) was **removed** and replaced by the rig's pose machinery; `CameraIntent` gained `damping` and typed `transition.ease`.
  4. `RendererBackend.getCanvasProps` → `createConfig` + `applyPolicy`.
  5. Phase 02's global ambient/directional lights and wireframe `DevMarker` were removed from the Canvas (world carries no lights; the dev calibration world replaces the marker).
  6. `Canvas frameloop` is now computed (`demand` default, `always` while something holds `acquireContinuous`).
  7. Phase 02's handoff proposed a "choreographer, Lenis↔GSAP sync, timeline factories" scope for Phase 03; the Phase 03 prompt scoped it to the 3D engine, so those remain **not built**.

## 3D engine completed (implemented; source/build verified, runtime/device verification still open)
Persistent single Canvas · centralized WebGL renderer config (WebGL2, no log-depth, tier-driven AA/DPR/shadows) · color + tone-mapping policy · exposure scale (clamped) · frame-loop policy (`always/demand/never`) · context-loss listeners · CameraRig with intent bus (4 sources, arbitration), snap/timed/damped moves, reduced-motion snap · pose/damp/framing math · world container (background, fog/atmosphere, PMREM environment) · lighting primitives + lighting budget census · asset types/registry/resolver (+LOD, criticality, texture roles) · shared `LoadingManager` snapshot · lazy Draco/KTX2-capable glTF loader · ref-counted asset cache with disposal · disposal helpers · scene lifecycle + residency planner + per-scene error boundary + preload/release · engine store · engine time + progress/transition read-models · seeded RNG · post-processing seam · dev diagnostics (probe, overlay, helpers, debug flags) · calibration world.
Files and details: `docs/3D_ENGINE.md`.

## Calibration environment
`components/dev/CalibrationWorld.tsx` (+ `DevCanvasTools`). Dev only, lifecycle key `DEV-CALIBRATION`, no assets, never a RISE ID. Visible in development unless `?calibration=off`, and only while no production scene is active (`currentSceneId === null`).

## Renderer / Camera / Assets / Lifecycle / Performance / Diagnostics
See `docs/3D_ENGINE.md` §3, §5, §11, §12, §9/§22, §20. The asset registry is still intentionally empty for real production assets. The choreographer now drives `setActiveChapter(...)`, so `currentChapterId/currentSceneId` can be populated as scene choreography activates; `SceneHost` resolves the active residency plan from that state.

## Memory-leak review (code review only, not tested)
Cleaned up: context-loss listeners (`RendererPolicy`), camera-intent subscription (`CameraRig`), intent-bus listener set, diagnostics `setInterval`, scroll driver listeners/Lenis (Phase 02), `SceneHost` effect cancel flag, `useSyncExternalStore` subscriptions, PMREM target/generator/room (`WorldEnvironment`), calibration geometry and engine-store holds (`acquireContinuous` release, environment/atmosphere restore). No GSAP timelines, ResizeObservers, rAF loops or object URLs are created by engine code. `subscribeLoading` has no subscriber yet (callers must unsubscribe). Decoder workers are released via `resetAssetLoaders()` (not yet called by any teardown path).

## Not completed / still open
- Browser/WebGL/mobile/performance runtime verification and device calibration.
- Idle render throttling and final runtime quality adaptation.
- Loader UI and asset-loading verification.
- Sourced references for chapters marked `narrative: "fact"`.
- Production GLB assets, volumetrics, scanned textures and other final visual assets/effects.
- `__rise` helpers for non-Hero scenes and per-scene automated tests.
- WebGPU path, pointer interaction polish, OG image, and final asset compression/budget tuning.

## Known uncertainties
- Browser/WebGL behavior, scene transitions, camera tracks, shader compilation, reduced-motion behavior, asset loading and memory/performance budgets are still unverified on real devices.
- Exact DPR, particle, shadow, light, fog and environment thresholds remain authored values pending calibration.
- Asset loading, Draco/KTX2 decoder serving and real GLB/HDR/texture assets are not yet exercised end-to-end.
- The source code now passes TypeScript, ESLint and a Webpack production build; those checks no longer belong in the unresolved list.
- Default Turbopack currently panics with `Invalid symlink` after dependency reinstall; this is tracked as a tooling/dependency-layout issue, not a source compile error.
- pnpm's active supply-chain policy currently rejects some very recently published transitive lockfile entries; this is an environment/package-manager concern and should not be solved by weakening repository security policy without a deliberate decision.

## Next action
Do not restart earlier phases. Continue from the implemented PHASES 06-15 state: run browser/WebGL/mobile/runtime verification, record device findings, then tune performance and cinematic polish.

## Runtime verification still required
A `pnpm-lock.yaml` is present and pnpm is the canonical package-manager workflow for this repo. Source/build verification already passed with the direct binaries and Webpack builder; the remaining user-facing verification is runtime/device testing:
```bash
pnpm dev
# then open http://localhost:3000/?debug=all
```
If pnpm attempts a dependency reconciliation, resolve the local pnpm policy/build-script issue first; do not change repository dependency versions just to bypass it.

Open `http://localhost:3000/?debug=all` in development, then check:
1. Canvas mounts (exactly one `<canvas>` in the DOM).
2. Calibration world renders (spheres, cube, emissive box, floor/grid, scale markers, instanced row).
3. Camera sits at the calibration pose; no other system moves it.
4. Resize the window: canvas, aspect and framing stay correct.
5. DPR/quality: overlay shows tier and DPR; try other tiers by emulating mobile/coarse pointer.
6. Debug overlay appears only with `?debug=…` and only in `pnpm dev` (not in `pnpm build && pnpm start`).
7. Overlay values are sensible (draw calls, triangles, geometries, textures, canvas size, lights vs budget).
8. Disable WebGL (browser flag) → fallback notice, narrative still readable; dev shows the reason.
9. OS reduced-motion on → orbiting light stops, no continuous rendering (overlay `loop demand`), native scroll.
10. Scroll through the page: still one canvas; no duplicate canvases.
11. Console: no errors/warnings beyond expected dev notices.
12. Navigate away/refresh and watch the overlay's geometry/texture counts for leaks; disposal of calibration resources is expected on unmount (e.g. via `?calibration=off`, compare counts).
Report results here so they can be recorded.
