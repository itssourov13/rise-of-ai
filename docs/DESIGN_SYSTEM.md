# DESIGN SYSTEM (direction — Phase 01)

This remains the historical visual-direction document. The semantic rules below informed later implementation; some tokens and motion/accessibility rules are now implemented, while exact visual calibration, final palette/type choices and licensing remain open.

## 1. Visual principles

1. Realistic, cinematic, dark, premium, spatial, physically inspired.
2. Composition, lighting, materials, scale, depth, camera, atmosphere come before decorative effects.
3. One evolving world, not separate sections.
4. Every animation has narrative purpose.
5. Avoid: neon overload, random glowing lines, cyberpunk clichés, generic AI-brain imagery, heavy gradients, noisy backgrounds, gratuitous glassmorphism, cards everywhere.
6. Realism via believable proportions, PBR response, correct lighting, depth layering, controlled post-processing — not via polygon count.

## 2. Color semantics (tokenized)

Colors are consumed only through semantic tokens so a scene can change mood by swapping a token set, never by editing component styles.

| Token | Role | Direction |
|---|---|---|
| `--bg-base` | Primary background | near-black |
| `--bg-surface` | Raised surfaces | graphite / deep charcoal |
| `--bg-metal` | Metallic neutral | controlled metallic neutrals |
| `--fg-primary` | Main text | high-contrast off-white |
| `--fg-muted` | Secondary text | reduced-contrast neutral (must still meet contrast) |
| `--accent-primary` | Main accent | cool technological light, controlled cyan/blue |
| `--accent-secondary` | Supporting accent | restrained electric violet, only when narratively appropriate |
| `--accent-emissive` | Emissive/light sources | bright, used sparingly |
| `--state-energy` | Energy/transition | occasional warm tone during transitions |
| `--state-holo` | Holographic state | translucent cool tint, only where environment justifies |
| `--state-danger` / `--state-warn` | Danger / warning | reserved, rarely used in this narrative |

Rules: per-scene token overrides are defined in scene definitions; the same tokens are exposed to shaders as `uColor`-style uniforms so DOM and 3D stay in sync. Accent usage budget: accents are exceptions against a dark neutral field.

## 3. Typography hierarchy

Roles (families/sizes TBD, must work in DOM and in 3D/hybrid contexts such as SDF/mesh text):

| Role | Use |
|---|---|
| Display | Chapter titles; cinematic, large, sparing |
| Section | Subtitles, key statements |
| Body | Short narrative copy |
| Micro-label | Chapter index, small captions |
| Technical metadata | Monospaced/technical readouts (coordinates, labels) |

Principles: editorial and cinematic; minimal text per beat; hierarchy remains legible when the scene is intense (use scrims/contrast control, not bigger glow); font loading must not block first render and needs a defined fallback stack. Licensing of chosen fonts must be recorded before use.

## 4. Spacing philosophy

Generous negative space; asymmetric editorial layouts over centered-card layouts; spacing from a small token scale (defined in Phase 02); text blocks anchored to the composition of the 3D frame, not to a generic grid of sections.

## 5. UI principles

- UI is minimal and environmental: navigation, chapter indicator, audio toggle, quality/motion settings.
- No card grids, dashboards, or marketing patterns.
- All controls keyboard-operable, visibly focused, not hover-dependent.
- Chrome fades back during intense beats.

## 6. Holographic UI principles

Use only when the in-world environment motivates it (e.g. AGENCY tool panels). It must feel physically placed in the scene (depth, occlusion where feasible, light interaction), be sparse, and never carry essential content that the DOM does not also provide. Avoid blanket glass panels.

## 7. Motion principles

- Scroll-driven, choreographed by the central timeline; eased with intent.
- Vary pacing across acts (see PROJECT_OVERVIEW).
- Camera moves come from the shot vocabulary (ARCHITECTURE §5).
- Idle micro-motion is subtle and pausable.
- `prefers-reduced-motion`: replace travel with crossfades/static compositions; no auto-looping large motion.

## 8. Cinematic composition principles

Clear focal subject per beat; layered depth (foreground/mid/background); controlled depth of field and atmosphere; lighting motivated by in-world sources; deliberate silhouettes; scale cues to sell size; leave frame area quiet for typography.

## 9. Accessibility principles

Semantic HTML; DOM text equivalent for every chapter; keyboard navigation and skip; visible focus; sufficient contrast (target WCAG AA for text; verify with tooling later); reduced-motion mode; no hover-only controls; no flashing content beyond safe thresholds; graceful non-WebGL experience.

## 10. Responsive visual strategy

Desktop: full detail. Tablet: reduced density, same story. Mobile: simplified geometry/effects, separately composed vertical framing, DOM text larger and primary. Layout and camera framing are defined per breakpoint class; quality tier (`ULTRA/HIGH/MEDIUM/LOW/MOBILE`) governs render cost independently of breakpoint.

## 11. Open decisions

Exact palette values, type families and licenses, spacing scale, text-in-3D technique (DOM overlay vs SDF vs mesh), HDRI/environment approach.

## Phase 04 additions (reusable rules from the Hero)

- **Emissive accent usage:** cool technological light is the primary emissive; one warm accent is reserved for status indicators. Hero emissive colors live in `hero-constants.ts` and are NOT global tokens.
- **Cinematic title treatment:** one DOM title card, opacity + transform + tracking + blur reduction, only after the visual reveal lands. The 3D subject stays dominant; titles never glow.
- **Chapter label:** `NN / 11` + chapter name in the micro style, bottom-left, secondary.
- **Holographic micro-label:** small mono readout (status / power / core), decorative (`aria-hidden`), never the only carrier of information, never dashboard-like.
- **Motion intensity hierarchy:** camera > major mechanics > energy/lights > particles/indicators. Stillness -> activity -> stillness -> activation -> peak -> calm.
- **Emphasis rule:** geometry, light and composition carry the identity; post effects (bloom/DOF/vignette/noise) must stay subtle.
