# RISE OF AI — From Machine to Intelligence
## Project Overview (Phase 01)

> Status: **Historical Phase 01 planning document.** The concepts here seeded the later implementation. Current implementation and verification status are tracked in `CURRENT_STATE.md`, `VERIFICATION.md`, and the later phase addenda in this docs folder.

## 1. Identity

- **Name:** RISE OF AI — From Machine to Intelligence
- **Form:** A scroll-driven cinematic 3D web experience. An interactive digital film / digital museum, not a landing page.
- **Planned stack (not yet installed or verified):** React, Next.js, TypeScript, Three.js, React Three Fiber, GSAP + ScrollTrigger, Lenis, custom GLSL, glTF/GLB assets.

## 2. Purpose

Make the viewer feel they are traveling through the evolution of artificial intelligence rather than browsing a page. Success = one continuous evolving world with deliberate pacing, readable typography, and graceful degradation on weaker devices.

**Guiding principle:** *The user should feel like they are traveling through the evolution of artificial intelligence, not browsing a webpage.*

## 3. Target audience

- Primary: technically curious general audience, designers, developers, recruiters/clients evaluating craft.
- Secondary: AI-literate viewers who will notice sloppy claims. Content must stay conceptually grounded.
- Devices: desktop (full fidelity), laptop, tablet (reduced density), mobile (reframed, simplified). Story is identical on all.

## 4. Experience concept

One continuous world that mutates as the user scrolls:

```
MACHINE → COMPUTATION → PERCEPTION → LEARNING → LANGUAGE
→ GENERATION → REASONING → AGENCY → INTELLIGENCE → THE UNKNOWN
```

Anti-goals: unrelated sections, SaaS landing page, generic AI-marketing site, template site, dashboard, a gallery of WebGL demos, brain illustrations, neon overload.

## 5. Creative direction (summary — details in DESIGN_SYSTEM.md)

Realistic, cinematic, dark, premium, spatial, physically inspired. Blend of cinematic sci-fi, industrial design, advanced computing, scientific visualization, editorial design. Realism comes from composition, lighting, materials, scale, depth, camera, atmosphere — before decorative effects.

## 6. Core narrative

Eleven chapters, each a cinematic environment (not an educational slide). Full detail in SCENE_MAP.md.

| # | Scene ID | Theme |
|---|---|---|
| 01 | RISE-01-AWAKENING | The machine comes alive |
| 02 | RISE-02-MACHINE | Mechanical and computational infrastructure |
| 03 | RISE-03-COMPUTATION | Numbers become patterns |
| 04 | RISE-04-PERCEPTION | Machines begin processing the world |
| 05 | RISE-05-LEARNING | Patterns become models |
| 06 | RISE-06-LANGUAGE | Tokens, words, meaning-like representations |
| 07 | RISE-07-GENERATION | Models produce new media and artifacts |
| 08 | RISE-08-REASONING | From response toward multi-step problem solving |
| 09 | RISE-09-AGENCY | Models interact with tools and environments |
| 10 | RISE-10-INTELLIGENCE | Many systems become interconnected |
| 11 | RISE-11-UNKNOWN | The future remains open |

### Acts and pacing

| Act | Chapters | Mood |
|---|---|---|
| I — Origin | 01–03 | industrial, cold, mechanical, mysterious |
| II — Emergence | 03–06 | rising complexity, discovery, energy |
| III — Creation | 06–08 | fluid, dynamic, creative, high-energy |
| IV — Agency | 08–10 | power, scale, interconnection |
| V — Unknown | 10–11 | awe, space, uncertainty, reflection |

Boundary chapters (03, 06, 08, 10) are shared across acts and serve as transitions. Intensity must vary: quiet beats are mandatory (e.g. late 02, 08 opening, all of 11).

### Content honesty rule

Every piece of narrative content must be tagged in its source as one of:
- **FACT** — historical/conceptual, verifiable.
- **ARTISTIC** — visual metaphor.
- **SPECULATIVE** — future concept.

The UI must never present ARTISTIC or SPECULATIVE content in the register of FACT. No unsupported scientific claims (e.g. no claims that models "understand" or "are conscious"). Chapter 06 uses "meaning-like representations" deliberately.

## 7. Experience philosophy

1. Scroll is the primary and sufficient input. Pointer/click/orientation are optional enhancements.
2. The camera is a storytelling tool, choreographed per beat.
3. Pacing over constant intensity.
4. Minimal text; hierarchy survives intense scenes.
5. Performance is a design constraint from day one.
6. Audio is optional; the story works silent.
7. Failure degrades gracefully (no WebGL, failed asset, low-end GPU).
8. No fake progress, no fake assets, no fabricated verification.

## 8. 15-phase roadmap (working roadmap — do not silently add phases)

| Phase | Title |
|---|---|
| 01 | Vision, Story & Experience Architecture |
| 02 | Technical Foundation |
| 03 | 3D Engine & Cinematic World Infrastructure |
| 04 | Hero — The Machine Awakens |
| 05 | The Age of Machines |
| 06 | Computation |
| 07 | Perception |
| 08 | Learning / Neural Network |
| 09 | Language |
| 10 | Generative Intelligence |
| 11 | Reasoning & Agents |
| 12 | The Intelligence World |
| 13 | The Unknown / Final Experience |
| 14 | Audio & Cinematic Sound Design |
| 15 | Performance, Responsive Optimization & Final QA |

The roadmap may be refined later, only with explicit user approval.

## 9. Out-of-plan change policy

- **Category A — Micro polish** (a11y fixes, responsive fixes, spacing, typography, easing, shader tuning, perf tuning, bug fixes, UX improvements): may be folded into the active phase.
- **Category B — Feature extension** (new interaction mode, new scene, new visual system, advanced audio interaction, extra navigation mode, new data-viz system): do **not** implement silently. Record in the "Proposed future work" list in CURRENT_STATE.md.
- **Category C — Architectural expansion** (WebGPU backend, VR/XR, multiplayer, live AI API, CMS/editor, persistent user state, procedural asset pipeline, remote asset streaming, server-side data): treated as separate upgrade tracks. Not added to the 15 phases unless the user explicitly expands the roadmap.

## 10. Document map

Read order for a new session: PROJECT_OVERVIEW → ARCHITECTURE → SCENE_MAP → CURRENT_STATE → AI_HANDOFF → DESIGN_SYSTEM → ASSET_MANIFEST (plus README if present).
