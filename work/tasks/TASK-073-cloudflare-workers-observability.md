---
id: TASK-073
title: Enable Cloudflare Workers logs and observability
epic: EPIC-013
status: backlog
priority: blocker
depends_on: [TASK-024, TASK-064]
source: owner request 2026-07-09
created: 2026-07-09
---

# TASK-073 — Enable Cloudflare Workers logs and observability

## Goal

Make deployed Worker behavior debuggable from Cloudflare without giving agents
Cloudflare credentials: request outcomes, server errors, and Hyperdrive/tRPC
failures should produce structured, searchable logs with useful source-mapped
stack traces when available.

## Problem brief

Current condition: The app is deployed to Cloudflare Workers and uses
Hyperdrive/Postgres, but the repo has no explicit Workers Logs configuration,
source map upload, or app-owned structured server logging convention.

Desired condition: The deployed Worker emits Cloudflare invocation logs plus
safe custom JSON logs for server-side app events, and the project documents how
to inspect them through the owner-controlled Cloudflare dashboard.

Affected user/workflow: Owner/agent production debugging for deploys, tRPC
errors, auth/server persistence failures, and Hyperdrive connectivity issues.

Evidence: Owner requested a blocker task on 2026-07-09 after the Worker,
Hyperdrive, and Clerk/Postgres foundation became active. Cloudflare docs checked
the same day: Workers Logs are configured via `observability` in
`wrangler.jsonc`; real-time logs are viewable in the dashboard; source maps are
enabled with `upload_source_maps`.

Baseline: `codebase/apps/web/wrangler.jsonc` declares the Worker and Hyperdrive
binding only; production debugging relies on endpoint behavior and build status,
not durable logs.

Target: `wrangler.jsonc` enables Workers Logs with an intentional sampling rate,
source maps are uploaded on deploy, and server code has a tested structured log
path for request/error events without PII or secrets.

How we will know it improved: A deployed `/`, `/trpc/health`, `/trpc/dbSmoke`,
and representative server-error path can be correlated in Workers Logs by event
name, outcome, route/procedure, status, duration, and Cloudflare request
metadata without exposing Clerk profile data, database URLs, tokens, or raw
request bodies.

## Context

Owner said "cloudfront workers"; this repo runs on Cloudflare Workers, so use
Cloudflare Workers observability.

Use current Cloudflare docs as the implementation basis:

- Workers Logs: https://developers.cloudflare.com/workers/observability/logs/workers-logs/
- Real-time logs: https://developers.cloudflare.com/workers/observability/logs/real-time-logs/
- Source maps: https://developers.cloudflare.com/workers/observability/source-maps/

Keep ADR-009 intact: do not run `wrangler login`, do not add Cloudflare API
tokens, and do not require local agent access to the Cloudflare dashboard. The
owner can inspect logs in the dashboard after deploy; agents should still be
able to verify the repo-side configuration and logging behavior locally.

Boundaries:

- Do not add Sentry, Logpush, Tail Workers, Analytics Engine, OpenTelemetry
  export, or another third-party sink in this task.
- Do not log raw Clerk user IDs, email/name/profile values, database connection
  strings, SQL text with values, tokens, cookies, request bodies, or response
  bodies.
- Do not make dashboard access a hard completion gate for agents without
  Cloudflare credentials; provide an owner-runnable post-deploy check instead.

## Acceptance criteria

- [ ] `apps/web/wrangler.jsonc` enables Workers Logs with
      `observability.enabled: true`
- [ ] The Workers Logs `head_sampling_rate` is set deliberately and documented
      in the task log; default to `1` unless cost/noise evidence says otherwise
- [ ] `apps/web/wrangler.jsonc` enables `upload_source_maps: true`
- [ ] Server-side code uses a small structured logging helper or equivalent
      convention for Worker/tRPC events rather than ad hoc strings
- [ ] Logs are JSON-serializable and include stable event names, outcome,
      route/procedure when known, status/error code when known, duration in ms
      when known, and safe Cloudflare request metadata such as `cf-ray` or a
      generated request id
- [ ] tRPC request/error paths emit safe structured logs for failed procedures,
      including protected-procedure unauthenticated failures
- [ ] DB/Hyperdrive smoke failures emit a safe structured log that distinguishes
      unconfigured runtime from query/connectivity failure
- [ ] Logging tests prove sensitive fields are redacted or absent, including
      Clerk identifiers, cookies, authorization headers, database URLs, and raw
      request bodies
- [ ] Existing production tRPC error sanitization remains intact: clients do
      not receive stack traces just because server logs/source maps exist
- [ ] Architecture docs record the Workers Logs/source-map setup, the owner
      dashboard path for log inspection, and the ADR-009 credential boundary
- [ ] Verification includes an owner-runnable post-deploy log check for `/`,
      `/trpc/health`, `/trpc/dbSmoke`, and one representative server error
- [ ] `bun run --cwd codebase check` passes

## Verification

- Run `bun run --cwd codebase check`
- Run the narrow tests added for structured logging/redaction
- Run `bun run --cwd codebase build` and inspect the resolved deploy
  configuration or build output enough to prove `observability` and
  `upload_source_maps` are present for the Worker deploy
- After push and Cloudflare Workers Builds deploy, call:

```sh
curl https://jazz-master.premysl-ciompa.workers.dev/
curl https://jazz-master.premysl-ciompa.workers.dev/trpc/health
curl https://jazz-master.premysl-ciompa.workers.dev/trpc/dbSmoke
```

- Owner-runnable dashboard check: Cloudflare dashboard -> Workers & Pages ->
  `jazz-master-web` -> Logs -> filter for the generated event names and confirm
  the requests above appear with no PII/secrets
