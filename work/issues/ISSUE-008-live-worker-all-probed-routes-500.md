---
id: ISSUE-008
title: Live Cloudflare Worker returns HTTP 500 for all probed routes
status: fixed
severity: blocker
created: 2026-07-09
source: TASK-073 post-push verification
---

# ISSUE-008 — Live Cloudflare Worker returns HTTP 500 for all probed routes

## Steps to reproduce

Run these against the deployed dev Worker:

```sh
curl -sS -o /dev/null -w '%{http_code} %{url_effective}\n' https://jazz-master.premysl-ciompa.workers.dev/
curl -sS -o /dev/null -w '%{http_code} %{url_effective}\n' https://jazz-master.premysl-ciompa.workers.dev/trpc/health
curl -sS -o /dev/null -w '%{http_code} %{url_effective}\n' https://jazz-master.premysl-ciompa.workers.dev/trpc/dbSmoke
curl -sS -o /dev/null -w '%{http_code} %{url_effective}\n' https://jazz-master.premysl-ciompa.workers.dev/trpc/users.ensure
```

Observed from Prague on 2026-07-09 after TASK-073 was pushed to `main`, with
one retry after a short Cloudflare Builds catch-up window.

## Expected

- `/` returns the public landing page.
- `/trpc/health` returns the public health response.
- `/trpc/dbSmoke` returns `ok`, `unconfigured`, or the sanitized DB smoke error
  response.
- `/trpc/users.ensure` returns an unauthenticated tRPC error response when
  called without Clerk session cookies.

## Actual

All four routes returned HTTP 500 with an empty response body:

```text
500 https://jazz-master.premysl-ciompa.workers.dev/
500 https://jazz-master.premysl-ciompa.workers.dev/trpc/health
500 https://jazz-master.premysl-ciompa.workers.dev/trpc/dbSmoke
500 https://jazz-master.premysl-ciompa.workers.dev/trpc/users.ensure
```

## Notes

TASK-073 enables Workers Logs and safe structured server logs, so the immediate
debugging path is for the owner to inspect Cloudflare dashboard logs for the
failed requests. Likely candidates include missing Worker runtime secrets/env,
middleware startup failure, or another deployed-runtime-only exception, but this
issue does not assume a cause without log evidence.

## Log

### 2026-07-09 — claimed (agent)
Plan: reproduce the all-routes failure path locally by inspecting the Worker
middleware startup path; keep public `/`, `/trpc/health`, `/trpc/dbSmoke`, and
unauthenticated `/trpc/users.ensure` from requiring Clerk runtime keys; preserve
Clerk middleware for configured environments and protected `/app/*`; add focused
auth-boundary tests; verify with `bun run --cwd codebase check` plus live route
probes where agent network access allows. Security/privacy review applies
because this touches auth/runtime configuration; no secrets or Clerk identifiers
will be logged or committed.

### 2026-07-09 — fixed (agent)

Fixed the likely all-routes Worker crash path by making Clerk runtime config
route-aware: configured environments still run Clerk middleware, public routes
can respond without Clerk keys, and unconfigured `/app/*` returns a controlled
503 instead of throwing during middleware startup. Added regression tests for
missing-Clerk public tRPC probes and updated the web README.

Verification: targeted auth/tRPC tests passed; `bun run --cwd codebase check`
passed. Local production preview with Clerk env unset and Hyperdrive emulated
returned `/` 200, `/trpc/health` 200, `/trpc/dbSmoke` 200 with handled DB error
body, and `/trpc/users.ensure` 401 with the production-safe unauthenticated tRPC
shape. `bun run --cwd codebase check:e2e` could not pass in this environment:
the first sandboxed run could not bind the local dev inspector port, the
escalated run needed the local Hyperdrive emulation variable, and with that set
the existing browser smoke harness still drives `/app/*` without real Clerk
credentials or Clerk-aware fixtures, producing the same known 503/auth gap
recorded in TASK-066. Security/privacy checklist: no concerns; no secrets,
tokens, raw Clerk identifiers, or database URLs were committed.

Review: independent subagent review was not available because the callable
subagent tool forbids spawning unless the user explicitly requests delegation;
completed the documented degraded self-review instead.
