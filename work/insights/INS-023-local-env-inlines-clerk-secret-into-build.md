---
id: INS-023
title: A local .env bakes CLERK_SECRET_KEY into the built server bundle
status: new
created: 2026-08-02
source: TASK-085
---

When `codebase/apps/web/.env` exists, `astro build` inlines the literal
`CLERK_SECRET_KEY` value into `dist/server/virtual_astro_middleware.mjs` and
also emits `dist/server/.dev.vars` containing it. Confirmed by rebuilding from
`HEAD` without the TASK-085 diff, so it is pre-existing Astro/Clerk env
behaviour, not something that change introduced. Client assets under
`dist/_astro` are clean.

Blast radius today is small: `dist/` is gitignored so nothing reaches git, and
Cloudflare Workers Builds has no `.env`, so the deployed Worker gets the secret
from its Worker-secret binding as intended. The exposure is a plaintext secret
sitting in build output on any machine that has both a `.env` and a build — and
a local `bun run deploy` (which ADR-009 says should not happen, but the script
still exists) would upload a Worker with the secret hardcoded in its source
rather than injected as a secret.

Worth deciding: whether the build should read `.env` at all for server secrets,
whether `bun run deploy` should be removed now that ADR-009 makes it dead, and
whether `dist/` should be cleaned between a local build and any publish.

## Product framing
Current condition: building locally with real Clerk keys writes those keys, in
plaintext, into two files under `dist/`.
Desired condition: server secrets are never materialised into build output;
they reach the runtime only through Worker secret bindings.
Affected user/workflow: any agent or owner session that builds locally after
restoring `.env`; the risk lands on the Clerk instance, not on end users.
Evidence: `grep -rl` over a clean `HEAD` build during TASK-085 verification.
Validation need: direct task candidate.
