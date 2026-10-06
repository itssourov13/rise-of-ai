# TECHNICAL BASELINE (Phase 02 + verification amendments)

The original Phase 02 statements below are preserved as architectural history. The repository was installed and verified on 2026-10-06: TypeScript and ESLint pass, and the production Webpack build passes. Browser/WebGL/device verification remains open. Package resolution is managed by pnpm with a checked-in lockfile.

## 1. Stack, dependency rationale, versions declared

| Package | Declared | Type | Core/Optional | Purpose |
|---|---|---|---|---|
| next | ~16.3.8 | runtime | core | App Router shell, server/client split, metadata. Version from the Phase 02 spec ("Active LTS"); existence of 16.3.8 not verified by me. |
| react, react-dom | ~19.2.8 | runtime | core | **Held at 19.2.x**: search results (npm page / GitHub issues, 2026-10) indicate @react-three/fiber 9.x peers `react >=19 <19.3` and a reported runtime break with React 19.3.0. Lift only after `npm view @react-three/fiber peerDependencies.react` shows 19.3 support. |
| three | 0.186.1 (exact) | runtime | core | 3D engine. Exact pin because Three has no semver stability across minors. R3F 9.8.1 notes mention requiring three >= 0.185. r187 not targeted. |
| @types/three | 0.186.0 (exact) | dev | core | Types matching three 0.186. |
| @react-three/fiber | ~9.8.1 | runtime | core | React renderer for Three. 9.8.1 seen as latest on npm (search snippet). |
| @react-three/drei | ^10.7.9 | runtime | core | Helpers. **Declared but unused in Phase 02**; consumed from Phase 03. |
| gsap | ~3.15.0 | runtime | core | Deterministic animation/choreography (spec version). Not yet used by any component. |
| @gsap/react | ^2.1.2 | runtime | core | `useGSAP` lifecycle-safe integration. Not yet used by any component. |
| lenis | ~1.3.0 | runtime | core | Single smooth-scroll driver (spec version). |
| zustand | ^5.0.0 | runtime | core | Typed discrete experience state. |
| typescript | ^5.9.0 | dev | core | |
| eslint, eslint-config-next | ^9 / ~16.3.8 | dev | core | Flat config per Next 16 template convention (unverified). |
| @types/node, @types/react, @types/react-dom | see package.json | dev | core | |

**Not added:** Tailwind (greenfield but not needed: tokens + semantic classes in `globals.css`; can be added later without conflict), postprocessing libs, other animation/scroll/state/3D libraries, CDN scripts, remote assets.

Package manager: **pnpm**. `pnpm-lock.yaml` is present and was used for the verified dependency installation. No dependency-version changes were made during the 2026-10-06 fix pass.

## 2. Runtime boundaries

```
Server:  layout.tsx, page.tsx, ExperienceShell, SemanticNarrative, InterfaceOverlay, content/chapters.ts, lib/config/*
Client:  ExperienceMount (boundary) -> [dynamic, ssr:false] ExperienceCanvas -> CameraRig, SceneHost
         state/experience-store, lib/{capabilities,scroll,animation,three,performance,assets}
```
Rules: server modules never import Three/GSAP/Lenis/R3F; `content/chapters.ts` stays plain data; no barrel files pulling the scene system; Three/R3F are fetched only when `renderMode === "active"`.

## 3. Renderer strategy
`lib/three/renderer-backend.ts`: `RendererBackend { id, getCanvasProps(profile) }`, WebGL only. Scene content must not import renderer-specific code. Materials/post-processing will sit behind factories taking the backend. WebGPU is not initialized, referenced, or assumed compatible with GLSL `ShaderMaterial`.

## 4. State strategy
`state/experience-store.ts` (Zustand): `currentChapterId`, `currentSceneId`, `reducedMotion`, `qualityTier`, `capabilities`, `renderMode`. **Deviation from the spec's conceptual list:** global/scene progress is *not* in Zustand; `lib/scroll/scroll-state.ts` holds a mutable non-reactive `ScrollState` (progress, velocity, direction, scrollY, viewport, isScrolling) because it changes every frame. Scene progress will be computed by the Phase 03 choreographer into a similar mutable structure. UI-only state gets a separate store when it exists.

## 5. Scroll strategy
`lib/scroll/lenis-driver.ts`: `startScrollDriver({smooth})` — one driver at a time, previous torn down first (Strict Mode safe). `smooth: true` → one Lenis instance (`autoRaf: true`); `smooth: false` (reduced motion) → native listener. Both only mirror into `scrollState`. Lenis↔GSAP ticker/ScrollTrigger sync, `scrollerProxy` decisions, chapter resolution: Phase 03.

## 6. GSAP strategy
`lib/animation/gsap.ts` is the only place plugins register (`ensureGsap()`, idempotent, browser-guarded). Phase 03 uses `useGSAP({ scope })` and per-scene timeline factories nested by the choreographer.

## 7. Camera
`types/camera.ts` `CameraIntent` (declarative). `CameraRig` is the only camera writer; it reads the active chapter's `camera` or `DEFAULT_CAMERA_INTENT`. `transition` is reserved. User-controlled camera later = another intent source into the same rig.

## 8. Performance model
`lib/performance/quality.ts`: tiers ULTRA/HIGH/MEDIUM/LOW/MOBILE; `QualityProfile` semantic controls (pixelRatio range, particleDensity, shadowQuality, textureScale, postProcessing, environmentDetail, modelDetail, effectIntensity). All values **uncalibrated placeholders**. `selectInitialTier` is a heuristic (coarse pointer + short side ≤ 820 → MOBILE; low-power hint → LOW; coarse pointer → MEDIUM; else HIGH; ULTRA never auto). No runtime adaptation yet. Canvas `frameloop="demand"` until animation exists. Note: `gl` options (e.g. antialias) apply at context creation; tier is fixed before mount.

## 9. Capability detection
`lib/capabilities/detect.ts`: WebGL none/1/2 probe (probe contexts are released), reduced motion, coarse pointer, DPR, viewport, coarse `lowPowerHint` (deviceMemory/hardwareConcurrency where exposed; raw values not stored). Local only, nothing transmitted. Software-rendered WebGL is not distinguished (no `failIfMajorPerformanceCaveat`).

## 10. Asset model
`lib/assets`: `AssetDefinition {id, kind, priority, src (string | per-tier variants), manifestId}`; `resolveAssetUrl(id, tier)` → URL or `undefined` (caller falls back). Registry is **empty**. Base URL: `NEXT_PUBLIC_ASSET_BASE_URL` or `/experience`. Convention when assets arrive: `public/experience/{models,textures,hdr,audio,images,fonts}` (create folders on first real file). `AssetLoadStatus` type is declared; loading/preload/retry logic is Phase 03.

## 11. Fallback model
`renderMode`: `pending` (SSR/first paint) → `active` | `disabled` (no WebGL) | `failed` (3D threw; caught by `ExperienceErrorBoundary`). Non-active modes render only `FallbackNotice` (`role="status"`); the semantic narrative is unaffected. Not a visual equivalent.

## 12. Chapters and scenes
`content/chapters.ts` (server-safe data) + `components/scene/scene-definitions.ts` (client, lazy loaders, empty). IDs `RISE-01-AWAKENING`…`RISE-11-UNKNOWN` unchanged; `SceneId` is `RISE-${string}` so `RISE-12-…` needs no type change.

## 13. Shader convention (no files created)
Future location `src/lib/three/shaders/<category>/` with categories `particles, environment, transition, energy, holographic, atmosphere, distortion, post`; one folder per backend-specific implementation if WebGPU arrives; uniform vocabulary from ARCHITECTURE §10.

## 14. Environment variables
Only `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_ASSET_BASE_URL` (both optional, see `.env.example`). No secrets, keys, or service credentials.

## 15. Design tokens / typography / metadata
Tokens in `globals.css`: `--bg-base --bg-surface --fg-primary --fg-muted --accent-primary --border-subtle --glow --focus-ring --selection-bg` (provisional values). Roles: `.t-display .t-headline .t-subheadline .t-body .t-technical .t-micro`, system font stacks only. Metadata: title/description/Open Graph via `layout.tsx`; canonical only when `NEXT_PUBLIC_SITE_URL` is set; no OG image yet.

## 16. Phase 02 runtime contract (what Phase 03 may rely on — once the user confirms it builds)
Server-rendered semantic shell · client-only boundary (`ExperienceMount`) · one persistent Canvas · typed store · renderer backend seam · capability + quality-profile abstractions · asset-ID resolution · chapter/scene identity + registries · error containment · accessibility foundation (landmarks, skip link, focus, chapter anchors) · reduced-motion single source (`store.reducedMotion`) · scroll/GSAP/Lenis boundaries.

## 17. Future-scenario check
| Scenario | Answer |
|---|---|
| A new chapter | Yes: one entry in `chapters.ts` (+ one `scene-definitions.ts` entry). |
| B compressed GLB | Yes: change `src` in the asset registry; scenes use IDs. |
| C ULTRA vs MOBILE | Yes: scenes read `QualityProfile` levels. |
| D WebGPU | Partly: seam exists (`RendererBackend`, factories planned); materials/post must be written per backend. Canvas creation would need a backend-aware path (unverified R3F WebGPU support). |
| E motion disabled | Yes: store flag + native scroll path; DOM narrative untouched. Per-system reduction is Phase 03+. |
| F asset fails | Yes at the contract level (`undefined` from resolver, error boundary); per-scene fallbacks come with scenes. |
| G saved state | Yes: discrete store can be serialized; progress is derivable from scroll. |
| H user camera | Yes: additional intent source into `CameraRig`. |

## 18. Upgrade notes / things to verify at first install
1. `next@~16.3.8`, `gsap@~3.15`, `lenis@~1.3`, `@react-three/fiber@~9.8.1` resolvable; no peer-dependency conflicts (especially React range).
2. Lenis: `new Lenis({ autoRaf: true })`, `lenis.on("scroll", …)`, properties `scroll/progress/velocity/direction`, `destroy()`.
3. Whether `eslint-config-next` 16.3 exposes `core-web-vitals` and `typescript` entry points as used in `eslint.config.mjs`, and whether its React-hooks rules flag any file.
4. `dynamic(..., { ssr: false })` inside a client component (intended pattern for Next 15+/16).
5. R3F `Canvas` surfaces errors to `ExperienceErrorBoundary`.
6. `npm run typecheck` may require `next typegen`/a prior `next build`/`next dev` to generate `.next/types`.

## 2026-10-06 verification and fix amendments
- `tsconfig.json` include scope was tightened to source/config paths plus generated Next type directories.
- `lib/three/lifecycle/residency.ts` was made generic over the lifecycle key type so `SceneId` is preserved through residency planning.
- Imperative Three.js mutations flagged by `react-hooks/immutability` were moved behind refs or `useThree((s) => s.get)` in the scene drivers/world/material systems; behavior remains per-frame and imperative by design.
- Unused imports were removed.
- Direct TypeScript, ESLint and Webpack production build checks pass.
- Default Turbopack currently fails locally with `Invalid symlink`; this is tracked as a toolchain/dependency-layout issue, not a source compile failure.
- Browser/WebGL/mobile/performance verification remains open.

## Phase 03 amendments
- §10 asset kinds: `hdr` → `environment`; added `shader`; see 3D_ENGINE §11.
- §3/§8 renderer & quality: now implemented as `lib/three/renderer/*` + `lib/performance/render-controls.ts` (all values UNVERIFIED).
- §9 capability: **WebGL 2 required** for the active 3D layer (three r186).
- §7 camera: intent bus + pose machinery (supersedes "applies instantly").
- `@react-three/drei` is still declared but **unused**; three's `three/addons/*` loaders/environments are used directly. No dependency was added or removed in Phase 03.
- Historical Phase 03 note: package.json and lockfile were not changed in that phase. The repository now has `pnpm-lock.yaml`; the 2026-10-06 fix pass did not change dependency declarations or the lockfile.
