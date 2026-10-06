# VERIFICATION GUIDE

## Verification snapshot — 2026-10-06

The repository has now been checked after a focused compile/lint fix pass. Source/build verification is green, while browser/WebGL/device verification remains open.

| Check | Command | Result |
|---|---|---|
| TypeScript | ./node_modules/.bin/tsc --noEmit --pretty false --incremental false | PASS |
| ESLint | ./node_modules/.bin/eslint . --no-color | PASS — 0 errors, 0 warnings |
| Production build | ./node_modules/.bin/next build --webpack | PASS |
| Default production build | ./node_modules/.bin/next build | FAIL — Turbopack `Invalid symlink` after dependency reinstall |
| Browser / WebGL | dev server + browser | NOT PERFORMED |
| Mobile / performance | device calibration | NOT PERFORMED |

### What was fixed

1. **Lifecycle typing**
   `planResidency()` is now generic over the lifecycle key type. This preserves the concrete `SceneId` type when `sceneOrder` is passed to `SceneHost`, fixing the `TS2345` mismatch between `LifecycleKey` and `SceneId`.

2. **React Compiler / Three.js mutation boundaries**
   React 19/Next ESLint rules correctly flagged intentional imperative Three.js mutations inside `useFrame`. The fix keeps those mutations imperative, but accesses mutable Three/R3F resources through refs or `useThree((s) => s.get)` rather than mutating hook-returned values directly.

   Affected areas:
   - `HeroDriver.tsx`
   - `MachineDriver.tsx`
   - `HeroParticles.tsx`
   - `AgencyScene.tsx`
   - `NetworkField.tsx`
   - `PointField.tsx`
   - `useSceneWorld.ts`
   - `WorldEnvironment.tsx`

3. **Unused imports**
   Removed unused `HERO_COLORS` and `OPEN_FRAMING`.

4. **TypeScript include scope**
   `tsconfig.json` no longer scans every generated/runtime TypeScript file through broad `**/*.ts` / `**/*.tsx` globs. It explicitly includes `src/**/*.ts`, `src/**/*.tsx`, `next.config.ts`, and the relevant generated Next type paths.

## 1. Reproducible source checks

After dependencies are available:

```
./node_modules/.bin/tsc --noEmit --pretty false --incremental false
./node_modules/.bin/eslint . --no-color
./node_modules/.bin/next build --webpack
```

These exact checks passed on 2026-10-06.

The package scripts remain:

```
pnpm typecheck
pnpm lint
pnpm build
pnpm dev
```

However, the pnpm wrapper itself is currently affected by local supply-chain/build-script policy during dependency reconciliation. This is not a source-code failure. Do not weaken repository security policy or change dependency versions just to hide that environment issue.

## 2. Dependency / package-manager findings

- `pnpm-lock.yaml` is present and resolves the declared dependency graph.
- The local pnpm environment rejected several very recently published transitive packages under its active `minimumReleaseAge` policy.
- A local install using `--config.minimumReleaseAge=0 --frozen-lockfile` was able to satisfy the lockfile, but pnpm then reported `ERR_PNPM_IGNORED_BUILDS` for `unrs-resolver@1.12.2`.
- The installed toolchain is usable for the verified direct checks: TypeScript 5.9.3, ESLint 9.39.5 and Next.js 16.3.8.
- This environment issue should be tracked separately from application correctness.

## 3. Build finding: Turbopack vs Webpack

The default `next build` currently fails with:

```
TurbopackInternalError: Invalid symlink
```

The failure occurs while Turbopack resolves package JSON / entrypoints after the dependency tree was recreated. It is not accompanied by a TypeScript or ESLint failure.

The equivalent production build with Webpack passes completely:

```
./node_modules/.bin/next build --webpack
```

Therefore:
- application source compiles successfully;
- TypeScript generation succeeds;
- static page generation succeeds;
- the remaining build issue is currently isolated to Turbopack/dependency-layout behavior in this local environment.

Do not rewrite application code to work around this Turbopack panic until the symlink layout/toolchain is investigated.

## 4. Browser / WebGL checklist — still required

Run:

```
pnpm dev
```

Open:

```
http://localhost:3000/?debug=all
```

Then verify:

1. Exactly one persistent `<canvas>`.
2. The active scene and neighbouring warm scene render without duplicate canvases.
3. Calibration/dev world behavior is correct where enabled.
4. Camera framing stays correct across resize/orientation changes.
5. Quality tier and DPR diagnostics are sensible.
6. Reduced-motion disables continuous animation where intended.
7. WebGL-disabled fallback preserves the semantic narrative.
8. Chapter/scene transitions do not pop, flash or expose stale world/post state.
9. Fast forward/reverse scrolling remains stable across all 11 scenes.
10. No console errors from shaders, loaders, R3F, GSAP or Three.
11. Audio remains gesture-gated and off by default.
12. Mobile typography and chapter content remain readable.
13. Frame time, draw calls, triangles, geometry count and texture count are measured on at least one desktop and one phone.
14. Refresh/navigation cycles do not accumulate GPU resources.
15. Real asset loading and decoder serving are tested when production assets are added.

Record numeric/device findings in `CURRENT_STATE.md`.

## 5. Remaining engineering risks

- Scene choreography values are authored and still need visual calibration.
- Particle counts, light budgets, fog, environment intensity, DPR ranges and shadow settings are still uncalibrated placeholders.
- Real GLB/HDR/texture/audio assets have not been validated end-to-end.
- Loader UI, idle render throttling, runtime quality adaptation and automated scene tests remain open.
- Default Turbopack should be revisited once the local symlink/package-manager state is understood.

## 6. Tuning order

Fix source/build regressions first -> verify browser/WebGL -> verify scroll/scene handoffs -> calibrate camera -> tune lighting/bloom/DOF -> calibrate quality-tier counts -> tune audio -> final performance pass.
