# ARCHITECTURE (target architecture — Phase 01)

> Everything here is a **target**. No code, dependency, or runtime behavior described below exists yet unless CURRENT_STATE.md says so. Verified facts are marked **[VERIFIED]**; none exist at Phase 01.

Rule for every abstraction in this document: it must have a concrete near-term consumer. If it doesn't, don't build it.

## 1. Architecture overview

```
Scroll input (Lenis)
  → Global progress (single source of truth, 0..1)
  → Chapter resolver (which chapter(s) active, local 0..1)
  → Choreographer (composes scene timelines, GSAP-driven)
  → Outputs: Camera rig · Scene objects · Lighting · Particles · Shader uniforms · DOM typography · Audio (later)
```

One scroll driver, one choreographer. No scene attaches its own scroll listener.

## 2. Frontend architecture (Next.js / React / TS)

- Next.js App Router (to be confirmed in Phase 02 against the actual repo state; if the repo already uses Pages Router, document and adapt instead of migrating).
- Single persistent `<Canvas>` for the whole journey, mounted once, hosted in a client-only boundary. Pages/routes do not remount it.
- DOM layer (semantic content, typography, controls) sits above/alongside the canvas and is driven by the same global progress.
- Server-rendered semantic narrative content (headings, chapter text) exists in the DOM regardless of WebGL status — this is the accessibility and fallback base.
- State: a small store for `progress`, `activeChapter`, `qualityTier`, `reducedMotion`, `audioEnabled`. Frequently changing values (scroll progress) must be read in the render loop via refs/transient subscriptions, not through React state that re-renders trees at 60 fps.
- Suggested module layout (proposal, adapt to repo conventions found in Phase 02):

```
src/
  app/                  routes, layout, fallback pages
  experience/
    core/               choreographer, progress store, quality manager, capability detection
    camera/             camera rig, shot library, transition camera
    scenes/             one folder per scene ID (RISE-xx-NAME)
    registry/           sceneRegistry + chapter content definitions
    shared/             shared materials, geometries, particles base, lighting rigs
    shaders/            see §10
    dom/                typography, chapter text, HUD, loader, fallback UI
    audio/              (Phase 14)
  content/              chapter data (text, tags FACT/ARTISTIC/SPECULATIVE)
public/assets/          GLB, KTX2, audio (empty at Phase 01)
docs/
```

## 3. 3D architecture

- R3F for scene graph; Three.js primitives under it. Imperative per-frame work (particles, uniforms) in `useFrame`/a central ticker, not React state.
- Environments, not isolated models: each chapter is a composed world (see SCENE_MAP.md).
- Mount strategy: scenes are **not** naively mounted/unmounted on every chapter boundary. Policy:
  - Active chapter ± 1 neighbor are "warm" (resident, may be hidden/paused).
  - Beyond that, scenes are dormant (GPU resources disposed or never created) with a defined dispose path.
  - Heavy resources are created once and reused; visibility toggles preferred over remounting for short hops.
- Reuse geometries/materials; use `InstancedMesh` for repeated objects (servers, nodes, tokens).
- Dispose geometries, materials, textures, render targets explicitly on scene dormancy.
- Lighting: physically inspired (PBR, environment lighting, limited real-time shadows). Realism from composition/lighting/material/scale/depth/atmosphere before effects.
- Post-processing: controlled, centralized, tier-gated (§9). Scenes request effect parameters; they do not own the composer.

## 4. Scene architecture

```
ChapterScene
├── Camera        (shot definitions for this chapter)
├── Environment
├── HeroObject
├── SecondaryObjects
├── Particles
├── Lighting
├── Typography    (DOM and/or in-scene text)
└── Transition    (in/out rules)
```

Each scene module exports one definition conforming to the scene registry contract (§12). Scenes receive `sceneProgress` (0..1) and `qualityProfile`; they do not read global scroll directly.

## 5. Camera architecture

Three layers, coordinated by one rig:

1. **Global camera state** — the single real camera and rig owner. Only the rig writes to it.
2. **Per-scene camera state** — declarative shot descriptions (position/target/FOV/roll curves or keyframes) contributed by each scene. Scenes never mutate the real camera.
3. **Transition camera state** — during chapter overlaps, the rig blends outgoing and incoming shots (with easing and optional path) so cuts are choreographed rather than snapped.

Reusable shot vocabulary: cinematic push, pull-back, orbit, dolly, lateral travel, vertical reveal, controlled rotation, tunnel traversal, close-up inspection, macro detail, wide environmental reveal.

Constraints: no scene may set `camera.position` directly; FOV changes go through the rig; mobile gets alternate framing per shot (§8), not a scaled desktop shot.

## 6. Animation / scroll choreography architecture

```
GLOBAL TIMELINE
  → CHAPTER TIMELINES
    → SCENE TIMELINES
      → MICRO ANIMATIONS
```

- Lenis provides smoothed scroll; ScrollTrigger (or an equivalent single driver) maps scroll → global progress. Lenis ↔ ScrollTrigger sync wiring is a Phase 02/03 task and must be verified in-browser by the user.
- Each scene builds its own timeline from a factory `(ctx) => gsap.core.Timeline` and the choreographer nests them into chapter ranges on the master timeline. No monolithic single-file timeline.
- Micro-animations (hover, idle loops) are independent of scroll and never required for understanding the story.
- Scrub semantic: master timeline progress is the only scrubbed value; everything else derives from it.
- Reduced motion: choreographer exposes a mode in which motion is replaced by crossfades/static compositions and idle loops are paused.

## 7. Asset architecture

- Format: GLB/glTF with PBR metallic-roughness materials, animations where needed, reusable instances.
- Planned optimization (all **future**, none applied): Draco or Meshopt geometry compression, KTX2/Basis-style GPU textures, texture resizing per tier, LOD, instancing.
- Variants: desktop / mobile (and optional LOD levels) per asset, selected by quality tier.
- Classification: `CORE`, `SUPPORTING`, `DECORATIVE`, `PROCEDURAL`, `SHADER-GENERATED`, `OPTIONAL`, `MOBILE-SIMPLIFIED`. Tracked in ASSET_MANIFEST.md.
- Loading: progressive. CORE assets for the first chapter gate "enter"; later chapters stream in behind the user (neighbor-chapter prefetch). Loader progress must reflect real load state or be explicitly labeled as an artistic sequence.
- Failure policy: a missing asset must not crash a scene; each asset reference has a fallback (procedural stand-in or omission) so the scene composes without it.
- No asset is ever labeled complete unless a real file with known source and license is in the repo.

## 8. Responsive architecture

| Class | Strategy |
|---|---|
| Desktop | Maximum cinematic detail |
| Tablet | Reduced scene density, same narrative |
| Mobile | Simplified geometry/effects; separately authored camera compositions; vertical-aspect framing |

Story identical everywhere; rendering strategy differs. Aspect-ratio-aware shots are part of the shot definition. Touch input never required.

## 9. Performance architecture

- Quality tiers: `ULTRA`, `HIGH`, `MEDIUM`, `LOW`, `MOBILE`.
- Adaptive controls per tier: particle budget, render resolution, device pixel ratio cap, shadow quality/count, texture resolution, post-processing set, effect density, model complexity/LOD, environment detail.
- Tier selection: initial heuristic from device class/GPU capability/memory hints + runtime frame-time monitoring with hysteresis (downgrade fast, upgrade slowly, never oscillate). Heuristic thresholds are **unverified** until measured on real devices.
- Budgets are defined per scene in the registry (max draw calls, max particles, texture memory estimate) and checked manually/with profiling in Phase 15; budgets must exist before scene work starts (Phase 03).
- Principles: reuse geometry/materials, instancing for repeats, controlled particle budgets, adaptive DPR, progressive loading, avoid per-frame allocations, avoid React re-renders from scroll, dispose properly, avoid mounting/unmounting expensive objects unnecessarily.
- `prefers-reduced-motion`, constrained memory, and limited bandwidth (`Save-Data`/slow connection hints) feed the same tier system.

## 10. Shader architecture (future)

```
shaders/
  particles/  environment/  transitions/  distortion/
  holographic/  atmosphere/  energy/  post/
```

Shared uniform vocabulary: `uTime, uProgress, uSceneProgress, uResolution, uPixelRatio, uIntensity, uColor, uNoise, uTransition`.

Rules: shared GLSL chunks for noise/utility; uniforms driven centrally (one time/progress source), not per-material timers; shaders are isolated behind material factories so the renderer can change (§11). Do not assume every GLSL `ShaderMaterial` will work under a WebGPU renderer.

## 11. Renderer abstraction

```
GraphicsBackend
├── WebGL   (production baseline)
└── WebGPU  (future, not implemented)
```

Conceptual boundary, kept thin:
- Scene content (graph, scene logic, choreography, camera, asset loading) must not import renderer-specific code.
- Custom shaders and post-processing live behind factory modules (`createXMaterial(backend, params)`, `createComposer(backend, effects)`), so a WebGPU/node-material implementation can be added without touching scenes.
- Do **not** build a speculative backend interface layer in Phase 02/03 beyond these factory seams. Revisit only if the WebGPU track (Category C) is approved.
- Open question: R3F + WebGPU renderer maturity and post-processing parity must be re-checked at that time against current docs.

## 12. Content model and scene registry (target)

```ts
// target shape — not implemented
type Chapter = {
  id: string; title: string; subtitle: string; theme: string;
  scene: SceneId; duration: number;            // scroll length weight
  visualMode: string; camera: ShotDefinition[];
  audio?: AudioCue[]; assets: AssetRef[];
  performanceProfile: Partial<Record<QualityTier, SceneBudget>>;
};

// sceneRegistry entry
{
  id, title, narrativePurpose,
  assetRequirements, cameraRequirements,
  createTimeline, transitionRules,
  qualityRequirements, fallback
}
```

Goal: adding a scene = register scene + provide assets + define timeline + define fallback, without editing the global application. Final TS types are decided in Phase 02/03 against the real repo.

## 13. Audio architecture (future, Phase 14)

Optional, off by default until user opt-in (also required by browser autoplay policy). Arc: mechanical hum → electrical atmosphere → digital signals → neural pulses → synthetic soundscape → large cinematic environment → silence. Driven by the same chapter progress. Failure or disabled audio never affects visuals. No audio assets in Phase 01.

## 14. Loading, fallback, accessibility

- Loading sequence concept: INITIALIZING → SYSTEM ONLINE → LOADING WORLD → NEURAL SYSTEMS INITIALIZED → ENTER. No fake percentages: bind to real load state, or label as an artistic sequence.
- Fallbacks: 3D unavailable → high-quality static/visual fallback of the narrative; asset failed → scene stays coherent; audio unavailable → continue; WebGL limited → reduced profile; mobile constraints → adaptive scene.
- Accessibility requirements: semantic HTML, keyboard navigation (chapter jump, skip), visible focus, screen-reader-readable narrative content in the DOM, reduced-motion mode, adequate contrast over 3D backgrounds (text scrims where needed), no hover-only controls, graceful no-WebGL path.

## 15. Future upgrade points (extension points only; do not build)

WebGPU backend · WebXR/AR · spatial audio · live AI APIs/interactive demos · procedural world generation · real-time data · CMS · scene/timeline editor · user-controlled camera · save/share state · multiplayer/shared worlds · generative visual systems · more chapters · localization · offline/PWA.

Preserved seams: content-driven chapter/scene registry, backend factories for materials/post, camera rig separation, store-based state, asset reference indirection. Later phases build the production scene/choreography layer on top of these seams; current status is recorded in `CURRENT_STATE.md`.

## 16. Constraints (non-negotiable)

The following constraints apply to the implemented system; Phase 01/02 paragraphs elsewhere in this file are historical snapshots.

1. One scroll driver; no per-scene scroll listeners.
2. Only the camera rig writes the camera.
3. No monolithic timeline file.
4. Scenes don't import renderer-specific code or own the composer.
5. High-frequency values bypass React state.
6. Every asset has a fallback; every scene has a fallback.
7. Story must work with scroll only, with audio off, with reduced motion.
8. No claim of verification (build, perf, WebGL/WebGPU, browser) without user-confirmed evidence recorded in CURRENT_STATE.md.
9. Prefer existing repo conventions over this document's suggested layout if they conflict; document the conflict.

---

# PHASE 02 ADDENDUM — Technical foundation

Details live in `TECHNICAL_BASELINE.md`. This section is the historical Phase 02 baseline; later Phase 03-15 additions and the 2026-10-06 verification snapshot are recorded in `CURRENT_STATE.md`, `3D_ENGINE.md`, and `VERIFICATION.md`.

## Amendments to the Phase 01 text above (historical Phase 02 baseline; authoritative where they differ)
- **Module layout:** Phase 01 §2 suggested `src/experience/{core,camera,scenes,registry,shared,shaders,dom,audio}`. Phase 02 uses the spec's layout instead: `src/{app,components/{experience,scene,camera,fallback},lib/{three,animation,scroll,performance,assets,capabilities,config},state,types,content}`. Reason: it was the explicit Phase 02 instruction and the repository had no conflicting structure visible. Treat the Phase 01 tree as superseded.
- **Progress state:** Phase 01 listed `progress` in the store. Now: discrete state in Zustand; per-frame progress in a mutable `scrollState`.
- **Chapter model:** Phase 01 target `Chapter` had `duration, visualMode, audio, assets, performanceProfile`. Phase 02 `ChapterDefinition` has only fields with consumers (`id, title, subtitle, narrative, sceneId, camera?`).
- **Registry split:** chapter data is server-safe (`content/chapters.ts`); scene loaders are client-only (`components/scene/scene-definitions.ts`).

## Established boundaries
Server shell vs client `ExperienceMount`; one persistent Canvas (`ExperienceCanvas`, `frameloop="demand"`); `CameraRig` sole camera writer with declarative `CameraIntent`; `RendererBackend` seam (WebGL only); quality tiers + `QualityProfile`; capability detection; asset-ID resolution; chapter + scene registries; error boundary around the 3D layer; one scroll driver; central GSAP registration module.

## Constraints added
1. Server modules must not import Three/R3F/GSAP/Lenis.
2. Only `lenis-driver.ts` writes `scrollState`; only `CameraRig` writes the camera; only `lib/animation/gsap.ts` registers GSAP plugins.
3. Scenes reference assets by ID; missing asset ⇒ resolver returns `undefined` ⇒ scene renders without it.
4. No per-frame values in React state or Zustand.
5. No `Canvas` anywhere except `ExperienceCanvas`.

---

# PHASE 03 ADDENDUM — 3D engine foundation

Full detail: `3D_ENGINE.md`. Implemented, not runtime verified.

## Amendments (authoritative where they differ)
- **Camera:** `CameraRig` is still the only camera writer, but now arbitrates `CameraIntent`s submitted through `lib/three/camera/intent-bus.ts` (sources: cinematic, choreography, transition, user). Moves: snap / timed / damped. `applyCameraIntent` was removed.
- **Renderer:** `RendererBackend` = `createConfig` + `applyPolicy`. WebGL 2 required (three r186). Log-depth off. Tone mapping/color policy centralized.
- **State split:** discrete experience state in `experience-store`; engine/world state in `engine-store`; per-frame values in mutable modules (`scrollState`, `engineTime`, `sceneProgress`, `transitionState`).
- **Scenes:** `SceneProps {active}`; scenes stay mounted while warm; lifecycle/residency are explicit; per-scene error boundary.
- **Assets:** `hdr` kind renamed `environment`; `criticality`, `lods`, `textureRole` added; shared loading manager, glTF path, ref-counted cache.
- **Lights:** no global lights in the Canvas; scenes bring their own (primitives provided).
- **Dev tooling:** diagnostics + calibration world are development-only (`DEV-*` lifecycle keys).

## Constraints added
1. Only `RendererPolicy` configures the renderer; only `CameraRig` writes the camera; only `EngineClock` writes `engineTime`; only the (future) choreographer writes `sceneProgress`/`transitionState`.
2. Scenes restore any world configuration they change (environment, atmosphere, exposure, camera intent, continuous-render holds).
3. Never dispose a resource you don't own; cache-owned assets are released via handles, never disposed by consumers.
4. Calibration/dev testbeds never receive a RISE scene ID.
5. Every new numeric quality/budget value is marked UNVERIFIED until profiled.

## Phase 04 addendum: choreography, scroll sync, post-processing

**Data flow:** Lenis (one instance) -> `ScrollTrigger.update()` + GSAP ticker -> one ScrollTrigger per scene region (created only by `lib/choreography/choreographer.ts`) -> scene timeline (paused, duration 1 = normalized scene progress) -> `sceneProgress` / `transitionState` read-models -> scene `onProgress` (camera intent via intent bus) -> mutable scene state / post params (tweened by the timeline). The 3D scene never reads Lenis.

**Lenis <-> GSAP:** `lib/scroll/lenis-driver.ts` runs Lenis with `autoRaf:false`, calls `lenis.raf()` from `gsap.ticker`, forwards Lenis scroll to `ScrollTrigger.update()`, sets `lagSmoothing(0)`. Reduced motion: native scroll, no Lenis. R3F keeps its own render loop (reads mutable state only).

**Ownership:** the global choreographer coordinates (`registerScene`, `registerTimeline`, `setProgress`, `releaseProgress`, `getProgress`, `activateScene`, `deactivateScene`, `subscribe`, `refresh`, `cleanup`). Each scene owns its choreography module (`SceneChoreography.build(ctx)`), state (`hero-state.ts`), and shot definitions (`hero-shots.ts`). Future scene: add a `SceneChoreography` to `SCENES` in `components/choreography/ChoreographyMount.tsx` + a region with `data-scene-id`.

**Scene-progress contract:** progress is normalized 0..1 per scene; every visual value is a pure function of it (fromTo tweens with explicit start values; camera sampled from a track), so any jump or reverse scroll renders a valid state. The Hero's end state (progress 1) is deterministic. Active-scene policy: a scene stays active until another activates.

**Pinning:** CSS `position: sticky` viewport inside a tall region instead of ScrollTrigger `pin` (nothing animates the pinned element; no pin-spacer wrappers fighting Lenis). Decision recorded; revisit if sticky proves unreliable.

**Post-processing boundary:** `lib/three/renderer/post-processing.ts` (tier -> plan, pure data) + `components/engine/PostStack.tsx` (only importer of `@react-three/postprocessing`, lazy-loaded by `RenderPipeline`). Scenes write `postParams` multipliers only. The Phase 03 adapter-interface seam was replaced by this declarative plan because R3F's composer is declarative.

## Phase 05 addendum: multi-scene rules
Scene timelines for ALL registered scenes are scrubbed by the choreographer, but only the ACTIVE scene's `onProgress` runs. Therefore: (1) shared mutable outputs (`postParams`, camera intent) are written only from `onProgress`; (2) timelines tween scene-local state objects only; (3) scene components apply/restore world config (environment, atmosphere, environmentIntensity, continuous-render hold) only while `active`. Scene order, region ids and chapter ids come from `content/chapters.ts`; adding a scene = recipe in ROADMAP.md.
