---
id: TASK-075
title: Polish public landing and auth pages
epic: EPIC-013
status: backlog
depends_on: [TASK-074]
research: RES-021
created: 2026-07-09
---

# TASK-075 - Polish public landing and auth pages

## Goal

Give signed-out visitors a credible Jazz Master entry experience that explains
the practice loop, routes cleanly into sign-up/sign-in/reset-password flows, and
matches the app-hosted auth foundation from TASK-074.

## Problem brief

Current condition: Jazz Master's public page is intentionally barebones and the
auth pages render working Clerk widgets on plain full-height dark screens. The
auth foundation works, but the signed-out experience does not yet explain why a
jazz guitarist should create an account or make sign-in/sign-up/reset-password
feel like part of the same product.

Desired condition: `/` presents a polished first mock landing page with a clear
jazz-practice message, visible app-like practice surfaces, and direct calls to
sign up or sign in. `/sign-in`, `/sign-up`, and the reset-password path share
the same public visual system and stay app-hosted.

Affected user/workflow: A new or returning signed-out guitarist deciding whether
to enter the app, create an account, sign in, or recover a password.

Evidence: Owner requested research from Vertical Casting Hub's landing,
sign-in, sign-up, and reset-password pages and asked for a full mock landing
page plan. RES-021 found a reusable VCH pattern: Astro-owned public pages,
section-based landing composition, centered auth surfaces, explicit auth
cross-links, and app-hosted reset flow.

Baseline: `/` has one brand line and one `/app` link; `/sign-in` and `/sign-up`
are visually detached from the landing page; reset-password is available only
through Clerk's prebuilt sign-in flow from TASK-074.

Target: Signed-out public pages feel like one coherent product surface: landing
page, sign-in, sign-up, and reset-password entry all use shared presentation,
copy, links, and app-hosted Clerk behavior.

How we will know it improved: A signed-out browser can scan the landing page,
understand the core practice loop, choose sign-up or sign-in, start password
reset without leaving app-hosted auth, and return to `/app` after successful
auth.

## Context

Research: `research/RES-021-vertical-casting-hub-public-auth-and-landing-patterns.md`.

Use the VCH pattern as structure, not as copied business content:

- Astro public routes own `/`, `/sign-in`, `/sign-up`, and any reset-password
  entry point.
- Page files should compose small section/layout components rather than carry a
  large monolithic page.
- Auth pages should use noindex metadata, a shared public shell, brand return
  link, and centered auth panels.
- Keep Clerk prebuilt Astro components from TASK-074. Do not replace them with
  VCH-style custom Clerk JS forms in this task.

Landing mock direction from RES-021:

- Primary message: "Build jazz guitar habits that survive the gig."
- Supporting copy: "Turn standards, ii-V-I movement, chord voicings, ear
  training, and recorded takes into focused daily reps."
- Sections: public header, hero with product-like practice-board mock, why it
  exists, practice modules, daily loop, final CTA, footer.
- Visuals: use UI-like practice surfaces such as fretboard lanes, chord chips,
  score badges, progress bars, and notation/practice cards. Keep the first
  implementation static Astro/Tailwind.

Likely code paths:

- `codebase/apps/web/src/layouts/BaseLayout.astro`
- `codebase/apps/web/src/pages/index.astro`
- `codebase/apps/web/src/pages/sign-in.astro`
- `codebase/apps/web/src/pages/sign-up.astro`
- new public components under `codebase/apps/web/src/components/public/`
- optional `codebase/apps/web/src/pages/forgot-password.astro` only if Clerk
  prebuilt routing supports it without custom auth flow risk

## Acceptance criteria

- [ ] `/` uses a shared public layout with a signed-out header, footer, and a
      full mock landing page based on the RES-021 section plan
- [ ] The landing page primary message is jazz-practice specific and includes
      calls to `/sign-up` and `/sign-in`
- [ ] The first viewport includes a product-relevant visual surface, such as a
      practice-board, fretboard, chord, notation, score, or daily-plan mock
- [ ] Landing sections cover why the product exists, core practice modules, a
      daily practice loop, and a final CTA
- [ ] `/sign-in` and `/sign-up` use the same public visual system as the
      landing page while preserving Clerk prebuilt Astro components and TASK-074
      redirects
- [ ] The password reset path is visibly reachable from the signed-out auth
      experience and remains app-hosted; do not implement a custom Clerk reset
      flow in this task
- [ ] Auth pages keep noindex behavior
- [ ] No direct `localStorage` usage is introduced
- [ ] Tests or focused verification cover the public routes rendering and the
      existing auth redirect helper behavior remains intact
- [ ] `bun run --cwd codebase check` passes

## Verification

- Run `bun run --cwd codebase check`
- Start the app with `bun run --cwd codebase dev`
- In a signed-out browser, visit `/` at desktop and mobile widths and verify:
  header links are visible/usable, text does not overlap, the first viewport has
  a Jazz Master product signal, and CTA links target `/sign-up` and `/sign-in`
- Visit `/sign-in` and `/sign-up` and verify Clerk widgets render inside the new
  public visual system without Account Portal redirects
- Start the Clerk password reset path from the signed-out auth UI and verify it
  stays app-hosted; if a separate `/forgot-password` page is added, verify it
  does not bypass Clerk prebuilt MFA/session-task handling
- In a signed-out browser, visit `/app/practice` and verify the TASK-074 return
  redirect still lands on app-hosted `/sign-in`
