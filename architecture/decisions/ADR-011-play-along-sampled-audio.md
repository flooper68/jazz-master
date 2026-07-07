---
id: ADR-011
title: smplr-backed sampled guitar playback with a project-owned scheduler
status: accepted
date: 2026-07-07
research: RES-015
---

# ADR-011 — smplr-backed sampled guitar playback with a project-owned scheduler

## Context

EPIC-014 adds play-along audio to existing exercises: the player hears the
exercise notes in time, looped, with a metronome click, at an adjustable tempo
remembered per exercise. Owner constraints from NOTE-009 make real sampled
timbre non-negotiable; guitar is preferred, piano is acceptable only if guitar
loses badly on quality-per-megabyte. The existing app is local-first (ADR-002),
the practice UI is a client-only island under `/app/*` (ADR-006), and rhythm for
current exercises is derived as straight eighths (ADR-010).

RES-015 compared sample sources, playback libraries, scheduling patterns, asset
loading/offline strategy, and reuse with EPIC-010's recording count-in.

## Decision

**Use `smplr` for sampled instrument playback, FluidR3_GM electric/jazz guitar
samples as the default source, and a project-owned Web Audio lookahead scheduler
for the exercise/click timeline.**

Load-bearing choices:

1. **`smplr` is the sampler seam.** It is MIT-licensed, TypeScript-friendly, has
   a recent 1.0.0 npm release (2026-06-13), and already wraps Web Audio sample
   playback, scheduling individual note starts, load progress, shared
   loaders/schedulers, Soundfont sources, custom sampler buffers, and
   CacheStorage. Pages and runner components should import only project-owned
   audio modules; `smplr` types stay behind that seam.
2. **Jazz Master owns scheduling.** A pure `ExerciseTimeline`/scheduler layer
   converts resolved exercise positions plus derived rhythm into note events,
   metronome clicks, count-in, loop boundaries, and tempo-change behavior. It
   uses the Web Audio lookahead pattern from RES-015 rather than direct JS
   timers: schedule near-future events against `AudioContext.currentTime`, with
   an initial 100 ms lookahead / 25 ms scheduler tick to tune during TASK-046.
3. **Default timbre is guitar.** Start with FluidR3_GM `electric_guitar_jazz`
   because it matches the product domain better than piano and carries easier
   CC-BY-3.0 obligations than MusyngKite's CC-BY-SA-3.0. If dogfood says that
   sound is worse than clear piano, switch the instrument through the sampler
   seam to `SplendidGrandPiano`; do not redesign the scheduler.
4. **Samples are lazy and explicitly cached.** Non-playing views load no audio
   library and no samples. The runner controls dynamic-import the audio engine.
   Chosen sample assets are mirrored under app static assets once the exact
   range/source is proven, with attribution, and fetched through CacheStorage
   where secure contexts support it. Local HTTP dev falls back to ordinary fetch
   without claiming offline sample availability.
5. **Metronome/count-in is shared infrastructure.** The click and scheduler are
   built as reusable audio infrastructure for EPIC-010's future recording
   count-in. Recording/scoring code should depend on the count-in/timeline
   module, not on guitar sample playback.

## Consequences

- New runtime dependency expected in `apps/web`: `smplr`. `packages/theory`
  remains pure and never imports Web Audio, React, or sampler libraries.
- A small static audio asset set enters the repo or app public assets. It must
  include a clear attribution file for FluidR3_GM (CC-BY-3.0) and stay lazy so
  `/app` initial load does not regress.
- The playback implementation has two testable seams: pure scheduling/timeline
  tests in Vitest, and runner integration tests for controls/tempo persistence.
  Real browser manual verification remains necessary because Web Audio and
  CacheStorage behavior cannot be fully proven in jsdom.
- Offline-after-first-use for samples depends on CacheStorage in HTTPS contexts;
  broader full-app offline behavior remains out of scope until a service worker
  or PWA task exists.
- Tempo changes are not time-stretching fixed audio. They affect future
  scheduled note/click events after the lookahead window.

## Considered and rejected

- **Tone.js Sampler/Transport** — credible, MIT, and actively maintained, but a
  broad DAW-style abstraction for one monophonic line plus click. It would still
  need a project seam and would introduce a global transport model the app does
  not otherwise need.
- **`soundfont-player`** — supports FluidR3_GM/MusyngKite and range-limited
  note loading, but `smplr` is the maintainer's newer sampler surface with cache
  and TypeScript-friendly APIs. Keep it as a fallback only if TASK-046 proves a
  blocking `smplr` range-loading issue.
- **Direct SoundFont2 `.sf2` loading** — `smplr` can read SF2 files, but the
  credible free source banks are whole-bank downloads and far heavier than the
  two-octave guitar range v1 needs. Use pre-rendered per-note assets instead.
- **Fully hand-rolled sampler** — the Web Audio primitive is simple, but owning
  fetch/decode caching, voice lifecycle, note mapping, progress, and browser
  unlock behavior is unnecessary while `smplr` covers the sampler layer.
- **Piano-first playback** — technically safe, but it violates the owner's
  guitar-timbre preference. Piano stays a fallback seam, not v1 default.
- **Fixed audio loops / time-stretching** — incompatible with adjustable tempo
  and exercise-generated notes. The app schedules note events at the selected
  BPM.

## Open questions (deferred grill)

Written without the owner present; per `processes/grilling.md`, surface these at
the next owner-confirmation point.

1. **Is FluidR3_GM electric jazz guitar good enough for three months of dogfood?**
   If not, the fallback is either clearer piano or a heavier/harder-licensed
   guitar sample set. The implementation should make this switch cheap.
2. **How visible should sample attribution be in-product?** CC-BY can be
   satisfied in a credits/about surface or nearby docs; choose how prominent it
   needs to feel for this product.
3. **Should loop playback include a count-in every loop or only before the first
   pass?** The technical scheduler can do either; pedagogy should decide.

## Provenance

RES-015 (TASK-045, 2026-07-07). Related: ADR-002 (local-first), ADR-006
(client-only practice island), ADR-010 (derived straight-eighth rhythm), RES-014
(recording count-in reuse).
