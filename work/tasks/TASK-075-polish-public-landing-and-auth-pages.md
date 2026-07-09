---
id: TASK-075
title: Polish public landing and auth pages
epic: EPIC-013
status: done
priority: blocker
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

- [x] `/` uses a shared public layout with a signed-out header, footer, and a
      full mock landing page based on the RES-021 section plan
- [x] The landing page primary message is jazz-practice specific and includes
      calls to `/sign-up` and `/sign-in`
- [x] The first viewport includes a product-relevant visual surface, such as a
      practice-board, fretboard, chord, notation, score, or daily-plan mock
- [x] Landing sections cover why the product exists, core practice modules, a
      daily practice loop, and a final CTA
- [x] `/sign-in` and `/sign-up` use the same public visual system as the
      landing page while preserving Clerk prebuilt Astro components and TASK-074
      redirects
- [x] The password reset path is visibly reachable from the signed-out auth
      experience and remains app-hosted; do not implement a custom Clerk reset
      flow in this task
- [x] Auth pages keep noindex behavior
- [x] No direct `localStorage` usage is introduced
- [x] Tests or focused verification cover the public routes rendering and the
      existing auth redirect helper behavior remains intact
- [x] `bun run --cwd codebase check` passes

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

## Log

### 2026-07-09 - claimed (agent)

Plan: build a shared Astro public shell/header/footer plus static landing
sections under `src/components/public/`; replace the bare `/` page with the
RES-021 landing mock and product-relevant practice-board visual; wrap existing
Clerk prebuilt `/sign-in` and `/sign-up` pages in the same public visual system
while preserving TASK-074 route props and noindex metadata; verify route
rendering with browser checks, keep `appRouteAuth` tests green, and run
`bun run --cwd codebase check`. Security/privacy checklist applies because this
touches auth entry pages; no custom auth flow, new dependency, storage change,
or direct `localStorage` use is planned.

### 2026-07-09 - done

Replaced the bare public `/` page with a shared Astro public shell, signed-out
header/footer, static landing sections, and a compact responsive practice-board
mock. `/sign-in` and `/sign-up` now share the same visual system, preserve the
TASK-074 Clerk prebuilt component props, emit `noindex, nofollow`, and keep
local auth cross-links. Added a sign-in reset note that points users into
Clerk's own app-hosted reset flow on `/sign-in` without adding a custom reset
route.

Review: completed the degraded self-review checklist because no callable
subagent tool was available in this session. Findings fixed before ship: the
initial desktop/mobile hero did not leave enough next-section context, and the
Clerk card overflowed mobile width by 14px; both were corrected and rechecked.
Security/privacy checklist: no secrets, storage, dependencies, custom auth
logic, user-input rendering, or direct `localStorage` usage introduced.
Residual configuration note: the development Clerk widget title currently uses
the configured Clerk application name (`Configurator-copilot`); no safe local
prebuilt-component app-name override was found, so correcting that belongs in
Clerk dashboard configuration rather than code.

Verification: `bun run --cwd codebase test --
apps/web/src/server/auth/appRouteAuth.test.ts` passed (18 tests). Browser
preview checks used the built app with
`CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE=postgresql://jazz_master:jazz_master@127.0.0.1:5432/jazz_master
bun run preview`: `/` at 1280x720 and 390x844 showed usable header links,
correct `/sign-up` and `/sign-in` CTAs, product-relevant first-viewport practice
mock, visible next-section context, and no horizontal overflow; `/sign-in` and
`/sign-up` rendered Clerk widgets in the public shell with local cross-links and
noindex; `/sign-in` mobile had no overflow after the auth-shell constraint;
signed-out `/app/practice` redirected to
`/sign-in?redirect_url=%2Fapp%2Fpractice`. `rg -n "localStorage"` over the
touched public files found no matches. Final `bun run --cwd codebase check`
passed (49 test files, 670 tests, build green). Existing jsdom canvas
not-implemented messages and Wrangler log-file EPERM warnings were non-fatal.
