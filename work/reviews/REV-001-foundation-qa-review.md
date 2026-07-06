---
id: REV-001
date: 2026-07-06
scope: [TASK-001, TASK-002, TASK-003, TASK-004, TASK-008, TASK-009, TASK-010, EPIC-001]
filed: [ISSUE-001]
---

# REV-001 — QA/product review

## Inspected

Charters run:

- Practice-loop value: checked whether the current foundation surface moves a guitarist into playing or remains reference/demo material.
- Navigation/responsiveness: walked `/`, `/voicings`, `/progressions`, `/practice`, `/repertoire`, `/ear-training`, and an unknown route at 1280x800 and 375x800.
- Accessibility/keyboard structure: checked headings, link names, diagram accessible names, focusable controls, and existing skip-link follow-up.
- Persistence/data resilience: confirmed there is no live storage-consuming product surface yet; reviewed TASK-008 through the automated gate rather than inventing a running-app storage fixture.
- Foundation visuals: checked the dashboard fretboard preview and voicings chord-diagram preview.

Evidence captured in the running app:

- Desktop route sweep: all listed routes rendered one clear `h1`, no horizontal overflow, and no browser console warnings/errors.
- Mobile route sweep: all real module routes overflow horizontally at 375px; `/voicings` measured 752px document width against a 375px viewport.
- Resource sweep: only Vite local resources were observed (`/@vite/client`, `/src/main.tsx`, `/favicon.svg`); no unexpected external network surfaces.
- Diagram sweep: the dashboard fretboard exposed `aria-label="Cmaj7 chord tones on the fretboard, frets 0 to 5"`; the four voicing diagrams exposed named `role="img"` labels.
- Theory surface sweep: the running UI currently exercises chord spelling and fretboard positions through the dashboard Cmaj7 preview. Scale/arpeggio/position APIs from TASK-009/TASK-010 are not yet user-routable; the review records that as expected foundation state, with `bun run check` remaining the verification signal until TASK-012/TASK-013 surface them in lessons.
- Unknown route: `/missing-route` rendered a not-found page with a route back to the dashboard and no desktop/mobile overflow at 375px.

## Health

The foundation is broadly solid for its current purpose: routing works, the shell is navigable, theory-backed visual components render in-app, and the local-first code path remains contained in `apps/web/src/storage/`. The automated test/check gate is still the meaningful proof for the pure theory and storage layers because the running product has no form or persisted user workflow yet.

The product is still mostly scaffold and reference/demo material. That is expected for EPIC-001, but it means the next valuable increment is not more polish on static pages; it is the planned curriculum/practice path that turns these primitives into a guided playing loop.

The main fragility is mobile layout. The known overflow is real across the module pages and is severe enough on `/voicings` to reveal off-canvas white page area around light text in full-page capture. That should be fixed before any real practice page depends on the shell.

## Findings

- `ISSUE-001` — confirmed minor defect: app shell overflows horizontally on phone-width viewports. Evidence: at 375x800, `/` measured 419px document width, `/voicings` 752px, `/progressions` 442px, `/practice` 384px, `/repertoire` 416px, and `/ear-training` 390px. Baseline observation: fixed sidebar + main content width exceed the viewport. Candidate target: all module pages reflow within a 375px viewport without horizontal page scroll or off-canvas background gaps. Validation need: direct task candidate.
- `INS-002` — existing deferred app-shell polish remains relevant but not newly triggered except through the mobile issue. Baseline observation: keyboard users still pass through the full persistent nav before page content; no skip link yet. Candidate target: revisit skip-to-content and shared page-heading extraction when the first real practice page lands. Validation need: direct task candidate once that trigger fires.
- `INS-004` — existing deferred fretboard hardening remains acceptable under current callers. Baseline observation: dashboard uses a single Cmaj7 fretboard preview with a clear image label and no overlapping-highlight use case. Candidate target: revisit with alternate tunings or layered highlights. Validation need: direct task candidate only when those inputs exist.
- `INS-005` — existing deferred chord-diagram follow-ups remain acceptable under current sample grips. Baseline observation: four sample diagrams render and expose names; barre/fret-window/aria-accidental refinements still depend on real EPIC-002 grip data or an app-wide accessibility pass. Validation need: direct task candidate when EPIC-002 starts or earlier a11y work is scheduled.

## Recommended next

1. `ISSUE-001` — fix mobile shell overflow before real practice workflows inherit the layout.
2. `TASK-011` — build the exercise/lesson model so EPIC-008 can move the product from foundation demos toward a practice loop.
3. `TASK-012` / `TASK-013` — after the model, ship the first lesson pack and guided runner; these are the smallest path from current scaffold to “open the app, pick up the guitar, and play.”

Owner confirmation needed: none for the review findings. `TASK-031` still has the separate heartbeat note that its INS-008 acceptance was pending owner confirmation.
