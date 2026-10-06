# RISE OF AI — From Machine to Intelligence

Scroll-driven cinematic 3D web experience (Next.js App Router, React Three Fiber, GSAP, Lenis, Zustand).

**Status: Phase 03 (3D engine foundation) authored, NOT yet installed, built, or run.**
Start with `docs/AI_HANDOFF.md`, `docs/CURRENT_STATE.md` and `docs/3D_ENGINE.md`. In development, open `/?debug=all` for the diagnostics overlay and calibration world.

## Run (no lockfile yet; pnpm recommended, npm equivalent works)
```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm build
pnpm dev        # http://localhost:3000
```
Requires Node >= 20.9.

## Layout
```
docs/                     project docs (read order in docs/AI_HANDOFF.md)
src/app/                  Next.js routes, layout, globals.css (tokens)
src/components/           experience shell, camera rig, scene host, fallback
src/content/              chapter data (server-safe)
src/lib/                  three, animation, scroll, performance, assets, capabilities, config
src/state/                Zustand experience store
src/types/                shared types
```
