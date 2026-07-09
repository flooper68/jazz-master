---
id: ISSUE-008
title: Live Cloudflare Worker returns HTTP 500 for all probed routes
status: confirmed
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
