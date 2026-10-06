# 3D ENGINE (Phase 03 + later scene additions)

Status: **IMPLEMENTED; source/build verified on 2026-10-06, runtime/device verification still open.** TypeScript and ESLint pass, and the production Webpack build succeeds. Default Turbopack currently fails locally with `Invalid symlink`; browser, WebGL, GPU, mobile and asset-loading verification remain open. All numeric thresholds marked UNVERIFIED are still placeholders.

## 1. Rendering architecture

```
EXPERIENCE (ExperienceShell, server)
 ├─ DOM layer: SemanticNarrative, InterfaceOverlay, FallbackNotice
 └─ ExperienceMount (client) → ExperienceErrorBoundary → ExperienceCanvas  (THE one Canvas)
      <Canvas dpr/gl/shadows from RendererConfig, frameloop from policy>
        RendererPolicy      renderer layer (tone mapping, exposure, color space, context-loss listeners)
        EngineClock         writes engineTime        (useFrame -2)
        CameraRig           sole camera writer       (useFrame -1)
        ExperienceWorld     background · atmosphere · environment
          SceneHost         scene residency + lifecycle + per-scene error boundary
          [dev] DevCanvasTools → CalibrationWorld · DebugHelpers · DiagnosticsProbe
        RenderPipeline      post-processing seam (no adapter registered)
      [dev] DiagnosticsOverlay (DOM, ?debug=...)
```
Update order inside a frame: EngineClock (-2) → CameraRig (-1) → scene `useFrame` (0) → render (R3F) → diagnostics read the previous frame's `renderer.info`. There is exactly one render loop (R3F's). Only a post-processing adapter may take over rendering (priority > 0).

## 2. Ownership model

| System | Owns | Files |
|---|---|---|
| Experience root | existence of the interactive layer, render mode | `ExperienceMount`, `experience-store` |
| Canvas/R3F root | the one Three.js context | `ExperienceCanvas` |
| Renderer layer | WebGL params, color output, tone mapping, exposure, shadow-map policy, DPR range, context loss | `lib/three/renderer/*`, `RendererPolicy` |
| Camera rig | the real camera; arbitrates intents | `CameraRig`, `lib/three/camera/*` |
| World | background, fog, `scene.environment`, conventions | `components/world/*`, `lib/three/world/*` |
| Scene host | mounting, visibility, lifecycle, per-scene failure | `components/scene/*`, `lib/three/lifecycle/*` |
| Asset system | registry, URL resolution, loading, cache, disposal, errors | `lib/assets/*`, `lib/three/assets/*` |
| Animation | math, engine time, progress read-model | `lib/animation/*` |
| Scroll | scroll input only (engine never touches Lenis) | `lib/scroll/*` |
| Performance | tiers → renderer controls, lighting budget | `lib/performance/*`, `lighting-budget.ts` |

Rule: no system casually mutates another's state. Scenes configure the world/camera only through the engine store (`setEnvironment`, `setAtmosphere`, `setExposureScale`, `acquireContinuous`) and the camera intent bus, and restore on exit.

## 3. Renderer configuration (WebGL; three r186 is WebGL 2 only)

`createRendererConfig(profile)` → `{ canvas: {dpr, gl, shadows}, policy, controls }`. `gl`: `antialias` per tier (fixed at context creation), `alpha:false`, `depth:true`, `stencil:false`, `logarithmicDepthBuffer:false`, `powerPreference:"high-performance"`. Shadows: `PCFShadowMap` only when the tier enables them. Tone mapping ACES Filmic (R3F default, provisional), exposure 1 × a clamped scene scale. Not tuned for the final look.

**Logarithmic depth is deliberately off** (it writes `gl_FragDepth`, defeating early-z). Use local coordinate domains for large worlds (§6).

Resize: handled once by R3F's Canvas (ResizeObserver on the container) which updates renderer size, DPR and the default camera aspect. No other resize listener touches the canvas. Future post-processing reads `useThree` size/dpr (see `RenderPipeline`). `lib/scroll/lenis-driver.ts` keeps its own cleaned-up resize listener for scroll viewport metrics only.

## 4. Color management

Working space Linear-sRGB; CSS/hex colors given to three are sRGB-interpreted and converted automatically; renderer outputs sRGB. Texture roles decide source color space (`color`/`emissive` = sRGB; `normal`/`roughness`/`metalness`/`ao`/`data` = none). `AssetDefinition.textureRole` is **required** for textures and has no default. HDR/environment inputs are linear data prefiltered via PMREM. Shader color uniforms are linear unless a shader documents otherwise. Details: `lib/three/renderer/color-policy.ts`.

## 5. Camera

Sources: `cinematic`, `choreography`, `transition`, `user` → `submitCameraIntent(source, intent|null)` → arbitration (winner-take-all: transition > user > choreography > cinematic > default) → `CameraRig` → three camera. The rig applies an intent as **snap**, **timed transition** (`intent.transition.duration` + easing, from the current pose, no GSAP) or **damped follow** (`intent.damping`). Reduced motion forces snap. Orientation is a look target; position + target + fov are interpolated (no quaternion abstraction needed). `near/far` apply when an intent begins. Utilities: pose lerp/damp, `distanceToFit`, easing, `damp`, `normalizeProgress`. Chapter `camera` data feeds the `cinematic` slot. Additive blending of user input over a cinematic shot is a future rig extension (documented, not built). Final cinematic shots are Phase 04+.

## 6. Coordinates and large worlds

1 unit ≈ 1 m (approximation). +Y up, −Z forward, each scene has a local origin, geometry within ≈ ±1000 units, near 0.1 / far 200 default (`lib/three/world/conventions.ts`).
Future large-scale strategy (NOT implemented): segmented environments with separate scale domains; local scene coordinate spaces; floating origin if a domain needs travel; camera-relative environments for distant/huge objects; Earth-scale imagery as a scaled backdrop domain rather than real-scale coordinates. Do not enable logarithmic depth merely because a scene is large.

## 7. World, environment, atmosphere

`ExperienceWorld` hosts global background, `WorldAtmosphere` (`Fog` / `FogExp2` from `AtmosphereConfig`; no volumetrics) and `WorldEnvironment` (owns `scene.environment`; sources: `none`, `procedural-room` (RoomEnvironment, code-only), `equirect` (future HDRI texture from the asset system); PMREM-prefiltered; the world disposes only what it generated). No HDRI is committed. No chapter-specific content lives in the world.

## 8. Lighting foundation and budget

Primitives in `components/world/lights.tsx`: `KeyLight` (optional shadow), `RimLight`, `AccentPoint`. They register with a census compared against `LIGHTING_BUDGET` (diagnostics only). Roles: **essential** (defines the shot) / **support** / **accent**. Prefer emissive materials + environment lighting over dynamic lights; shadow-casting lights are chosen per scene. All budget numbers UNVERIFIED. No final rigs exist.

## 9. Quality system

`QualityProfile` (Phase 02, uncalibrated) → `createRenderControls()` → `{dpr, antialias, shadows{enabled,mapSize}, environmentSize, textureScale, geometryDetail, effectsEnabled}`. DPR is centralized (range comes from the tier; R3F clamps it to the real device ratio). Antialiasing is fixed at context creation, so runtime adaptation may change DPR/shadows/effects but not AA. `environmentSize`, `textureScale` have no consumer until environment/texture variant selection exists (contract only). Every number is UNVERIFIED. Mobile = same architecture, different parameters.

## 10. Render loop modes

`resolveFrameloop({continuousRequests, paused})`: `demand` by default; `always` while something holds `acquireContinuous()`; `never` when paused. The Calibration world acquires continuous rendering only while animating and not under reduced motion. No per-frame values go through React state or Zustand; use refs, mutable modules (`engineTime`, `sceneProgress`, `scrollState`), direct three mutation and `delta` (`x += speed * delta`).

## 11. Asset lifecycle

`AssetId → registry (AssetDefinition) → resolveAssetUrl(id, tier, {lod}) → URL`. Scene code never contains URLs. `AssetDefinition` adds `criticality` (`critical` | `optional`), `lods`, `textureRole`. One shared `LoadingManager` (`assetLoadingManager`) exposes a real snapshot `{requested, completed, failed, isLoading}` (cumulative; no byte progress; no cancellation: a `LoadingManager` limit). `createGltfLoader()` lazily adds Draco / KTX2 only when configured (decoder files must be served from `public/`; not done). `requestAsset()` never throws: it returns `{ok, handle}` or `{ok:false, error}` with `error.critical`. Cache is reference-counted: load → use → release → dispose on the last release unless retained. Loaders implemented: model (glTF) and texture; other kinds return `unsupported-kind`. Consumers mount `gltf.scene.clone()` (shares geometry/materials) and never dispose cache-owned data.
Failure: CRITICAL asset failure → `sceneLifecycle.fail(id)` (scene not mounted, world keeps running). OPTIONAL failure → logged, scene renders without it. Unknown IDs warn in dev. No placeholder assets hide failures.
Texture pipeline boundary: roles above; KTX2/mipmaps/resolution variants plug into the loader + `textureScale` later.

## 12. Scene lifecycle and residency

States: `registered → preload → ready → active ⇄ warm ⇄ hidden → released` (`lib/three/lifecycle/scene-lifecycle.ts`, validated transitions). `planResidency(order, activeId, {warmRadius, incomingId})` → `active | warm | cold` (default radius 1, UNVERIFIED). `SceneHost` keeps active + neighbours **mounted** (neighbours `visible={false}`), releases cold scenes' assets, and wraps each scene in `SceneBoundary`. A scene can preload without becoming active (`preloadScene`). Scenes receive `{ active }` and must skip per-frame work when false (R3F still runs `useFrame` for hidden objects). Keys: production `RISE-01-…RISE-11-…`; development testbeds use `DEV-*` (the calibration world is `DEV-CALIBRATION`, never a RISE ID).
Scene definition (kept small): `id`, lazy `load`, optional `assets`. Chapter data (`content/chapters.ts`) carries id/title/subtitle/narrative/sceneId/camera. Fallback-per-scene = not mounting a failed scene; richer fallback fields are added when a scene needs them.

## 13. Instancing and LOD strategy

Instancing: use `InstancedMesh` for repeated shared geometry/material (cables, bolts, nodes, markers, particles). The calibration world's falloff row is the reference pattern (one geometry, one material, N instances, deterministic seeded layout). No particle engine yet.
LOD: assets may declare `lods` (`high|medium|low`); `resolveAssetUrl(..., {lod})` selects a file. In-scene switching by distance should use three's `LOD` (or drei `Detailed`). No LOD assets exist; no CSS-scaling fakes.

## 14. Shadows, transparency, materials

Shadows are centrally enabled/disabled by tier and opt-in per light; never maximum-resolution everywhere. Transparency is costly (sorting, overdraw): prefer opaque, emissive or shader-masked solutions. Use `MeshStandardMaterial` by default; `MeshPhysicalMaterial` only where its features are justified.

## 15. Post-processing, WebGPU, shaders, transitions

Post-processing seam: `PostProcessingAdapter` + `resolvePostProcessing` + `<RenderPipeline/>` (base → optional post → output). No adapter, no effect. WebGPU: not initialised or referenced; `RendererBackend` (`createConfig`, `applyPolicy`) is the boundary and its `applyPolicy` currently takes a `WebGLRenderer`. Shaders: no `shaders/` directory created (no consumer); convention in TECHNICAL_BASELINE §13. Transitions: `transitionState` + `TransitionKind` (types/state only; the choreographer will write them; `planResidency` supports `incomingId`). No transition effect exists.

## 16. Scroll/progress boundary and time

Engine reads `sceneProgress`/`transitionState` (`lib/animation/progress.ts`) written by the choreography layer; it never calls Lenis. `lib/choreography/choreographer.ts` owns scene activation and calls `setActiveChapter(...)` for the active scene. Time: `engineTime` (elapsed, clamped delta, frame) written only by `EngineClock`. Do not put continuous time in React state.

## 17. Pointer interaction

The canvas wrapper is `pointer-events:none`, so it never blocks DOM interaction. Future 3D pointer input: opt in by pointing R3F's `eventSource` at a document element with `eventPrefix="client"`, and attach handlers only to objects that need them (each handler adds raycast cost). Not enabled.

## 18. Error containment

Outer: `ExperienceErrorBoundary` → `renderMode:"failed"` + dev-visible reason; narrative DOM stays. Inner: `SceneBoundary` per scene; critical asset failure fails only that scene. WebGL context loss: `preventDefault` + warn, `invalidate` on restore (restore behaviour NOT RUNTIME VERIFIED). Errors are logged, never silently swallowed. `renderMode` is `disabled` unless WebGL **2** is available (reconciliation fix, see CURRENT_STATE).

## 19. Resource ownership and disposal

Global/shared → asset cache; scene-owned → scene lifecycle; transition-owned → transition lifecycle; render targets → the pipeline that created them. `disposeObject3D(root, {geometries, materials, textures})` (textures off by default), `disposeMaterial`, `disposeRenderTarget`. R3F auto-disposes objects created from JSX it unmounts, but NOT objects passed in as props (the calibration world disposes its shared geometry itself). Never dispose what another active scene may use. Review done for listeners/subscriptions in this phase: see CURRENT_STATE "Memory-leak review".

## 20. Diagnostics and debug mode (development only)

`?debug=all` (or a list of `axes,grid,camera,scene,quality,stats`) enables a DOM overlay (updated at 4 Hz via direct `textContent`) fed by `DiagnosticsProbe` (`renderer.info`: calls, triangles, geometries, textures; DPR; canvas size; frame time only while `always`; camera pose; scene lifecycle states; light census vs budget) plus axes / coarse grid helpers. `?calibration=off` hides the calibration world. Production: `readDebugConfig()` returns off and the dev modules sit behind `NODE_ENV !== "production"` lazy imports (bundle exclusion NOT verified). Not implemented: target marker, bounding boxes.

## 21. Calibration world (dev testbed)

Procedural only: floor + neutral grid, metallic / rough-metal / semi-gloss spheres, matte cube, emissive box, 1 m wireframe cube, 1.8 m pole with ticks, orbiting point light, instanced falloff row, exponential fog, procedural environment, shadow-casting key light, camera via the intent bus, lifecycle `DEV-CALIBRATION`. Shown in development when no production scene is active. It is an engineering lab, not a chapter.

## 22. Performance rules

Share geometry/materials; instance repeats; avoid per-frame allocation (reuse vectors); keep `useFrame` slim; no setState/Zustand per frame; no unnecessary pointer handlers, lights, transparency or giant textures; don't render hidden scenes at full cost; LOD for large scenes; progressive loading; measure before tuning.

## 23. Future WebGPU / upgrade boundary

Renderer-specific code lives in `lib/three/renderer*`, material/post factories and `PostProcessingAdapter`s. Scenes import none of it. WebGPU is a later track (separate adapters/factories, backend-aware Canvas creation, R3F support unverified).

## 24. Out-of-plan items (documented, not built)

Feature/architecture extensions noticed: additive user-over-cinematic camera blending; byte-level load progress and cancellable loading; Meshopt decoding; texture optimizer/KTX2 pipeline; token→three color bridge (`WORLD_BACKGROUND` is a manual mirror of `--bg-base`); runtime quality adaptation with hysteresis; bounding-box/target debug helpers; unit tests for pure modules (`math`, `residency`, `intent-bus`, `render-controls`, `asset resolve`). The choreography/Lenis↔GSAP foundation is implemented; remaining work is runtime calibration and further polish.

## Phase 04 addendum: production scene + post-processing

- **Post-processing integration:** see ARCHITECTURE addendum. Composer renders in linear HalfFloat; `ToneMapping(ACES_FILMIC)` is the single tone-mapping step while the composer is active (renderer tone mapping applies only when the plan is disabled). ACES variants differ slightly and `exposureScale` does not affect the composer path (UNVERIFIED visual match).
- **Quality:** LOW/MOBILE now map to `postProcessing: "low"` (minimal bloom, no MSAA); change back to `"off"` in `quality.ts` if measurement shows a problem.
- **Hero resource ownership:** `HeroScene` owns the `HeroKit` (geometries, materials, DataTextures) and disposes it on unmount/detail change; it restores environment, atmosphere, `scene.environmentIntensity` and its continuous-render hold. Scene-owned `Points` geometry/material are disposed by `HeroParticles`.
- **Lifecycle:** procedural, no assets -> becomes ready immediately; activated by the choreographer (`setActiveChapter`).
- **Camera:** Hero poses are submitted through the `choreography` intent slot (ping-pong preallocated intents, damped), never bypassing CameraRig.
- **Performance notes / Hero budget (all UNVERIFIED):** draw calls: not measured (target: low hundreds; instancing used for repeated parts; see `?debug=hero,stats`) · triangles: not measured · particles: 350-2200 · lights: 4-6 (1 shadow map) · shadow map: tier-based · DPR: tier range · post resolution: bloom 0.5-1x, DOF 0.5-0.75x · textures: 2 small procedural DataTextures · memory: not measured. Continuous rendering while active (no idle throttling yet).
- **Hero debug:** `?debug=hero` (progress, beat, shot, energy stage, mesh/instance/particle counts, bloom, post state); `?hero=0.62` freezes the Hero at a progress; dev console `__rise.seek(p)`, `__rise.release()`.

## Phases 06-15 addendum
Shared GPU primitives: `PointField` (point-field shader: morph A->B, staggered/quantized, flow, sweep, layer front) and `NetworkField` (edge flow shader + layer-lit nodes). Both own/dispose their geometry+material. Scenes write uniforms in an `update` callback from mutable state. Scenes apply world config only via `useSceneWorld(active, ...)`. Draw calls per point/network scene are small (1-4) but vertex counts are not measured (UNVERIFIED).
