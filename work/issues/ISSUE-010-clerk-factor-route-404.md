---
id: ISSUE-010
title: Clerk password sign-in falls through to a nested-route 404
status: fixed
severity: blocker
created: 2026-07-10
source: TASK-072 real Clerk regression
---

# ISSUE-010 — Clerk password sign-in falls through to a nested-route 404

## Steps to reproduce

1. Configure the owner-provided Clerk development instance.
2. Visit `/app` signed out and continue to the app-hosted `/sign-in` page.
3. Enter a valid email identifier and continue to the password factor.
4. Enter the valid password and continue.

## Expected

Clerk can use nested path-routing states such as `/sign-in/factor-one`, finish
the password factor, and return the authenticated user to `/app`.

## Actual

The first password-factor view renders client-side, but the nested path is not
owned by an Astro route. The next navigation renders Jazz Master's
`404: Not found` page for `/sign-in/factor-one`, so password users cannot reach
the protected app.

## Log

### 2026-07-10 — claimed (Codex)

Plan: move the shared Clerk sign-in/sign-up presentation into reusable Astro
views; add rest-parameter pages under `/sign-in/*` and `/sign-up/*` while
preserving the exact entry routes; verify the real Clerk password flow through
protected tRPC/Postgres, run the full gate and e2e suite, independently review,
then ship this blocker separately before completing TASK-072. Security review:
auth credentials remain in the already-authorized test-only configuration; the
route fix adds no logging, redirect target, or new dependency.

### 2026-07-10 — fixed (Codex)

Extracted the shared Clerk auth views and added Astro rest-parameter routes for
all `/sign-in/*` and `/sign-up/*` states while keeping the exact entry pages.
The real Clerk browser flow now reloads `/sign-in/factor-one` inside Jazz Master
instead of rendering the application 404, and the expanded Playwright pack
guards both nested sign-in and sign-up routes. Seven Chromium tests pass against
local Postgres.

The owner-approved public test password is rejected by Clerk's compromised-
password protection, which is an account/configuration constraint rather than
this routing defect. Clerk's email-code alternative also remains app-hosted;
TASK-072 still needs a valid one-time code or a Clerk policy/account adjustment
to finish the authenticated identity-handoff check.
