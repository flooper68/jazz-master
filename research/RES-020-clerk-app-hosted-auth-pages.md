---
id: RES-020
title: App-hosted Clerk sign-in and sign-up pages for Astro
status: complete
task: TASK-074
created: 2026-07-09
stale_when: "Clerk materially changes @clerk/astro prebuilt auth components, Account Portal behavior, redirect environment variables, or MFA/session-task handling."
---

# RES-020 - App-hosted Clerk sign-in and sign-up pages for Astro

## Research questions

1. What happens when Clerk Account Portal is disabled?
2. What should an Astro app render for app-hosted sign-in and sign-up pages?
3. How should Clerk redirects be configured so signed-out app users land on
   app-hosted pages instead of Account Portal?
4. How should the app cover password reset/recovery and MFA/2FA without
   rebuilding Clerk auth flows from scratch?
5. What should Jazz Master verify before considering hosted auth pages done?

## Findings

### 1. Disabling Account Portal makes Jazz Master responsible for auth flows

Clerk documents Account Portal as hosted Clerk pages for sign-up, sign-in, and
profile management [1]. Clerk also warns that disabling Account Portal before
setting up an app auth flow causes Account Portal pages to 404, and says that
after disabling it the app is responsible for its own flows such as sign-up and
sign-in [2].

For Jazz Master, this matches the observed failure: `/app/*` redirects through
Clerk sign-in, but the project has no local `/sign-in` route and the owner's
Clerk Account Portal is disabled.

### 2. Astro should own `/sign-in` and `/sign-up` routes with Clerk prebuilt components

The Astro SDK quickstart installs `@clerk/astro`, configures server output, and
adds `clerkMiddleware()`; it also shows Clerk auth components being used from
Astro pages/layouts [3]. Clerk's Astro `<SignIn />` component renders the
sign-in UI, and the docs show the basic implementation as an Astro page that
imports `SignIn` from `@clerk/astro/components` and renders `<SignIn />` [4].
The equivalent `<SignUp />` page imports and renders `SignUp` [5].

This also fits ADR-006: Astro owns public/server routes outside `/app/*`, while
the React practice app owns only `/app/*`.

### 3. Redirects need explicit app-hosted sign-in/sign-up URLs

Clerk's environment variable reference recommends environment variables for
redirect behavior when possible, and specifically defines `CLERK_SIGN_IN_URL`
and `CLERK_SIGN_UP_URL` as the full URL or path to the app's sign-in/sign-up
pages [6]. It also recommends defining both sign-in and sign-up redirect
variables because users can switch between the two flows [6].

The Astro `<SignIn />` component also accepts a `signUpUrl` prop for the
"Don't have an account? Sign up" link and recommends using the environment
variable instead [4]. `<SignUp />` has the symmetric `signInUrl` prop and the
same recommendation [5].

### 4. Prebuilt components are the right scope for password recovery and MFA

Clerk says custom flows are advanced, require more effort, and are not
recommended for most cases; prebuilt components are the recommended path unless
the app needs specific control over auth logic [7].

The prebuilt Astro `<SignIn />` and `<SignUp />` components are controlled by
the instance settings in the Clerk Dashboard, such as sign-in/sign-up options
and social connections [4][5]. `<SignIn />` also displays required session
tasks after sign-in, and `<SignUp />` displays required session tasks after
sign-up [4][5]. That matters for MFA because Clerk can require a `setup-mfa`
session task when MFA is required for all users [8].

For fully custom auth UIs, Clerk documents the extra MFA work required: if MFA
is enabled, custom sign-in must handle `needs_second_factor`, support the
configured second-factor strategies, and verify phone codes, authenticator app
codes, or backup codes explicitly [9]. Jazz Master should avoid this custom
surface now and rely on Clerk's prebuilt components, then verify that the
Clerk-configured recovery and MFA screens are reachable inside `/sign-in`.

### 5. Test mode can make verification agent-runnable

Clerk test mode supports reserved email addresses and phone numbers. For email
verification codes and fictional phone numbers, the test code is `424242` [10].
That gives the future task an agent-runnable verification path for sign-up,
password/recovery flows that send email codes, and SMS-code paths where the
Clerk development instance is configured to allow them.

## Recommendations

1. Add `TASK-074` under EPIC-013 as a blocker before the remaining
   Clerk/Postgres migration chain. The app's protected area currently cannot be
   entered reliably when Account Portal is disabled.
2. Implement real Astro routes at `codebase/apps/web/src/pages/sign-in.astro`
   and `codebase/apps/web/src/pages/sign-up.astro` using Clerk prebuilt
   `<SignIn />` and `<SignUp />`.
3. Configure/document Clerk redirect variables for app-hosted auth:
   `CLERK_SIGN_IN_URL=/sign-in`, `CLERK_SIGN_UP_URL=/sign-up`, and fallback
   redirects to `/app`. Keep the existing required key variables.
4. Use environment variables for route wiring where the Astro SDK supports
   them, and pass explicit `path`, `routing`, `signUpUrl`, `signInUrl`, and
   fallback redirect props only if needed to make the behavior deterministic in
   Astro/Workers.
5. Do not build custom password reset or MFA flows now. Use Clerk prebuilt
   components and verify the Clerk-configured "forgot password"/recovery and
   MFA/second-factor screens inside the app-hosted page. File a follow-up only
   if a required Clerk Dashboard configuration cannot be verified by an agent.
6. Add focused route/auth tests where practical, and keep the live Clerk smoke
   in the task verification because component behavior depends on Clerk's
   runtime and Dashboard configuration.

## Sources

[1] Clerk Account Portal overview - https://clerk.com/docs/guides/account-portal/overview
(updated 2026-07-08, accessed 2026-07-09)

[2] Clerk Disabling the Account Portal - https://clerk.com/docs/guides/account-portal/disable-account-portal
(updated 2026-07-08, accessed 2026-07-09)

[3] Clerk Astro Quickstart - https://clerk.com/docs/astro/getting-started/quickstart
(updated 2026-05-18, accessed 2026-07-09)

[4] Clerk Astro `<SignIn />` component - https://clerk.com/docs/astro/reference/components/authentication/sign-in
(updated 2026-07-08, accessed 2026-07-09)

[5] Clerk Astro `<SignUp />` component - https://clerk.com/docs/astro/reference/components/authentication/sign-up
(updated 2026-07-08, accessed 2026-07-09)

[6] Clerk environment variables - https://clerk.com/docs/guides/development/clerk-environment-variables
(updated 2026-07-08, accessed 2026-07-09)

[7] Clerk Build your own UI custom flows overview - https://clerk.com/docs/guides/development/custom-flows/overview
(updated 2026-07-07, accessed 2026-07-09)

[8] Clerk sign-up and sign-in options - https://clerk.com/docs/guides/configure/auth-strategies/sign-up-sign-in-options
(updated 2026-06-30, accessed 2026-07-09)

[9] Clerk custom MFA sign-in flow - https://clerk.com/docs/guides/development/custom-flows/authentication/multi-factor-authentication
(accessed 2026-07-09)

[10] Clerk test emails and phones - https://clerk.com/docs/guides/development/testing/test-emails-and-phones
(updated 2026-07-08, accessed 2026-07-09)
