---
id: INS-021
title: /trpc production posture — error stack traces, CORS, abuse
status: new
created: 2026-07-06
source: TASK-023 verification + review
---

Observed while verifying TASK-023: tRPC error responses (405 wrong-method, 404
unknown procedure, 400 Zod reject) include full stack traces with local file
paths. That is tRPC's default error shape whenever `NODE_ENV !== 'production'` —
fine in dev, an information leak if it ships. The app runs in workerd (Workers,
`nodejs_compat`), where `NODE_ENV` is not obviously set at all, so the production
build may keep dev-shaped errors.

For TASK-024 (Workers deploy) to own:

- Verify a deployed `/trpc` error response has no `data.stack`. If workerd
  doesn't set `NODE_ENV=production`, add an `errorFormatter` in
  `src/server/trpc/init.ts` that strips it explicitly rather than trusting the
  env heuristic.
- Decide the CORS/abuse posture for the publicly reachable `ALL /trpc/*`
  endpoint (review finding, same surface). Health-only today, so nothing
  sensitive — but the posture should exist before real procedures land.
