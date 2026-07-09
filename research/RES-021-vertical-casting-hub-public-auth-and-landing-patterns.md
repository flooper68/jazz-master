---
id: RES-021
title: Vertical Casting Hub public auth and landing patterns for Jazz Master
status: complete
task: TASK-075
created: 2026-07-09
stale_when: Vertical Casting Hub changes its public/auth page architecture, or Jazz Master replaces Clerk prebuilt auth with custom Clerk JS flows.
---

# RES-021 - Vertical Casting Hub public auth and landing patterns for Jazz Master

## Research questions

1. How does Vertical Casting Hub structure its signed-out landing page and auth pages?
2. What sign-in, sign-up, and reset-password interaction patterns should Jazz Master copy?
3. Which parts should Jazz Master avoid copying because its auth foundation uses Clerk prebuilt Astro components from TASK-074?
4. What should a first full mock landing page for Jazz Master say and contain?
5. What concrete implementation slice should consume this research?

## Findings

### 1. Public pages are Astro-owned and composed from small sections

Vertical Casting Hub keeps signed-out public routes as Astro pages, not SPA
routes. Its `/` page redirects already signed-in users to the role-appropriate
dashboard, then renders a section stack: hero, why section, audience sections,
featured content, community/beta CTA, and footer. The page imports those
sections directly from `apps/web/src/components/public/landing/*` and wraps them
in a shared `Layout` that owns metadata and the public nav. [1][2]

The landing page pattern is high-level and modular: `index.astro` is only page
composition, while components such as `HeroSection.astro`,
`WhyVchSection.astro`, `BetaAccessSection.astro`, and `Footer.astro` hold the
section content. [2][3][4][5][6]

### 2. The layout provides a persistent signed-out nav and auth entry points

Vertical Casting Hub's shared `Layout.astro` imports the global CSS, metadata,
Astro transitions, background decoration, public header nav, and skeleton
templates for page transitions. The header is a React island that switches
between signed-out public links and authenticated app navigation. Signed-out
users see links to Home, How It Works, Our Story, Blog, Sign in, and Join Free
Beta; mobile nav repeats the sign-in action. [7][8]

The useful pattern for Jazz Master is not the exact VCH nav content, but the
route ownership: a shared Astro layout can provide consistent public chrome,
while landing/auth pages remain outside `/app/*`.

### 3. Auth pages are separate Astro routes mounting centered React card islands

Vertical Casting Hub has three separate routes:

- `/sign-in` renders `SignInForm`
- `/sign-up` renders `SignUpForm`
- `/forgot-password` renders `ForgotPasswordForm`

Each route redirects already signed-in users to the appropriate dashboard and
uses the shared layout with `noindex`. Each page centers a single auth card in a
full-height main region with responsive padding. [9][10][11]

The form components share a recognizable pattern: card header/title/description,
field labels, email/password autocomplete attributes, field-level errors,
general error text, disabled submit buttons with tooltip reasons, loading text,
footer cross-links, and skeleton card states while Clerk is loading. [12][13][14]

### 4. VCH uses custom Clerk JS flows, but Jazz Master should keep prebuilt Clerk auth

Vertical Casting Hub's auth forms call Clerk client APIs directly:
`client.signIn.create`, `client.signUp.create`,
`prepareEmailAddressVerification`, `attemptEmailAddressVerification`, and
`attemptFirstFactor` for reset-password email codes. [12][13][14]

Jazz Master should not copy that implementation directly. TASK-074 and RES-020
intentionally chose Clerk prebuilt Astro components so password recovery,
second factor, and required session-task states stay inside Clerk-supported UI.
Custom Clerk JS flows would need additional MFA/session-task handling and would
increase auth risk for a presentation task. [15][16]

The copyable pattern is therefore page composition and presentation: public
layout, centered auth surfaces, brand return link, noindex auth pages, visible
cross-links, and a password-reset path that stays app-hosted. The non-copyable
part is hand-rolled Clerk sign-in/sign-up/reset logic.

### 5. Jazz Master's current public surface is intentionally minimal

Jazz Master currently has a bare `/` page with brand name, one sentence, and a
single `/app` link. `/sign-in` and `/sign-up` are also minimal full-height pages
that render Clerk prebuilt Astro components with a small brand link above the
widget. There is no shared public header/footer yet, no full landing-page
section stack, and no separate `/forgot-password` page. [17][18][19]

This makes the next slice a presentation and information-architecture upgrade:
keep the TASK-074 auth foundation, but surround it with a more deliberate
signed-out experience.

## Landing page mock plan

### Message

Jazz Master should position itself as a focused practice room for jazz
guitarists, not as a generic lesson library.

Primary message: "Build jazz guitar habits that survive the gig."

Supporting copy: "Turn standards, ii-V-I movement, chord voicings, ear
training, and recorded takes into focused daily reps."

Primary CTA: "Start practicing"

Secondary CTA: "Sign in"

### Page structure

1. Public header

   Brand link, compact section links, "Sign in", and primary "Start practicing"
   CTA. On mobile, keep the header simple: brand plus auth CTA links is enough
   for the first mock.

2. Hero

   Left side: headline, supporting copy, CTA pair, and three quick proof points:
   "Voicings", "ii-V-I drills", "Standards".

   Right side: a product-like practice-board mock, not a generic illustration.
   Suggested content: "Today's chorus", a mini fretboard/chord card row, a
   progress strip, and an ear-training prompt. This mirrors VCH's live-board
   visual while making the subject immediately Jazz Master.

3. Why it exists

   Short problem framing: jazz practice gets scattered across fake books,
   backing tracks, voicing notes, and unreviewed recordings. Jazz Master turns
   that into one repeatable loop.

4. Practice modules

   Four cards: Chord voicings, ii-V-I movement, Repertoire tracker, Ear
   training/recorded takes. Each card should name an outcome, not just a
   feature.

5. Daily loop section

   Three-step workflow: choose a focus, play a short rep, review score/history.
   This should connect to the existing app direction: practice, feedback, and
   return use.

6. Final CTA

   A contained CTA band with the same primary message and links to `/sign-up`
   and `/sign-in`.

7. Footer

   Brand sentence and minimal links. Avoid adding legal/social complexity unless
   those pages exist.

### Visual direction

Use a restrained music-practice palette rather than copying VCH's brand colors:
near-black ink, warm off-white, brass/gold accents, muted teal or blue-gray, and
small red/orange accents for recording or scoring. Do not make the page a
single-color brown/cream or blue theme.

Use real UI-like surfaces: fretboard lanes, chord chips, progress bars, score
badges, and a small notation/practice card. Avoid decorative-only graphics. The
first implementation can be pure Astro/Tailwind with no runtime interactivity.

## Recommendations

1. Create a shared public layout/header/footer for signed-out pages before
   expanding the landing page. This copies VCH's structure while keeping Jazz
   Master page composition simple. Trace: findings 1-2.

2. Replace the bare landing page with the mock section stack above, implemented
   as Astro sections under a public landing component folder. Keep sections
   static in the first slice. Trace: findings 1 and 5.

3. Restyle `/sign-in` and `/sign-up` around Clerk prebuilt components so they
   visually match the landing page: shared public layout, brand return link,
   centered auth panel, side or top product message, and noindex metadata.
   Trace: findings 2-5.

4. Preserve Clerk prebuilt auth behavior from TASK-074. Do not port VCH's
   custom Clerk JS forms unless a later security-reviewed task explicitly
   chooses custom auth. Trace: finding 4.

5. Add an app-hosted reset-password entry point only if it can be implemented
   with Clerk prebuilt UI without losing MFA/session-task support. Otherwise,
   acceptance should verify that password reset is visible and app-hosted inside
   the `/sign-in` Clerk flow. Trace: findings 3-4.

6. Keep the task small enough to ship in one session: public layout, landing
   mock, auth page presentation, and reset-path verification. Defer animation,
   screenshots, blog/about/legal pages, custom Clerk flows, and production copy
   perfection. Trace: findings 1-5.

## Sources

[1] Vertical Casting Hub `apps/web/src/pages/index.astro` - local repo path
`../vertical-casting-hub/apps/web/src/pages/index.astro` (accessed 2026-07-09)

[2] Vertical Casting Hub landing component directory - local repo path
`../vertical-casting-hub/apps/web/src/components/public/landing/` (accessed
2026-07-09)

[3] Vertical Casting Hub `HeroSection.astro` - local repo path
`../vertical-casting-hub/apps/web/src/components/public/landing/HeroSection.astro`
(accessed 2026-07-09)

[4] Vertical Casting Hub `WhyVchSection.astro` - local repo path
`../vertical-casting-hub/apps/web/src/components/public/landing/WhyVchSection.astro`
(accessed 2026-07-09)

[5] Vertical Casting Hub `BetaAccessSection.astro` - local repo path
`../vertical-casting-hub/apps/web/src/components/public/landing/BetaAccessSection.astro`
(accessed 2026-07-09)

[6] Vertical Casting Hub `Footer.astro` - local repo path
`../vertical-casting-hub/apps/web/src/components/public/landing/Footer.astro`
(accessed 2026-07-09)

[7] Vertical Casting Hub `Layout.astro` - local repo path
`../vertical-casting-hub/apps/web/src/layouts/Layout.astro` (accessed
2026-07-09)

[8] Vertical Casting Hub `HeaderNav.tsx` - local repo path
`../vertical-casting-hub/apps/web/src/components/public/auth/HeaderNav.tsx`
(accessed 2026-07-09)

[9] Vertical Casting Hub `sign-in.astro` - local repo path
`../vertical-casting-hub/apps/web/src/pages/sign-in.astro` (accessed
2026-07-09)

[10] Vertical Casting Hub `sign-up.astro` - local repo path
`../vertical-casting-hub/apps/web/src/pages/sign-up.astro` (accessed
2026-07-09)

[11] Vertical Casting Hub `forgot-password.astro` - local repo path
`../vertical-casting-hub/apps/web/src/pages/forgot-password.astro` (accessed
2026-07-09)

[12] Vertical Casting Hub `SignInForm.tsx` - local repo path
`../vertical-casting-hub/apps/web/src/components/public/auth/SignInForm.tsx`
(accessed 2026-07-09)

[13] Vertical Casting Hub `SignUpForm.tsx` - local repo path
`../vertical-casting-hub/apps/web/src/components/public/auth/SignUpForm.tsx`
(accessed 2026-07-09)

[14] Vertical Casting Hub `ForgotPasswordForm.tsx` - local repo path
`../vertical-casting-hub/apps/web/src/components/public/auth/ForgotPasswordForm.tsx`
(accessed 2026-07-09)

[15] Jazz Master `TASK-074` - local repo path
`work/tasks/TASK-074-app-hosted-clerk-auth-pages.md` (accessed 2026-07-09)

[16] Jazz Master `RES-020` - local repo path
`research/RES-020-clerk-app-hosted-auth-pages.md` (accessed 2026-07-09)

[17] Jazz Master `index.astro` - local repo path
`codebase/apps/web/src/pages/index.astro` (accessed 2026-07-09)

[18] Jazz Master `sign-in.astro` - local repo path
`codebase/apps/web/src/pages/sign-in.astro` (accessed 2026-07-09)

[19] Jazz Master `sign-up.astro` - local repo path
`codebase/apps/web/src/pages/sign-up.astro` (accessed 2026-07-09)
