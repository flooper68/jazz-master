---
id: TASK-054
title: Run security review of storage, audio permissions, and server surfaces
status: done
proposed_by: HEARTBEAT 2026-07-08
depends_on: []
created: 2026-07-08
---

# TASK-054 - Run security review of storage, audio permissions, and server surfaces

## Goal

Security/privacy-sensitive surfaces added since the last heartbeat have an
explicit review record before more practice data and microphone work builds on
them.

## Context

Scheduled by heartbeat 2026-07-08. Cadence rule fired: shipped work since the
last beat touched typed storage, tRPC/server routes, dependencies/audio sample
loading, and microphone recording work is in progress. Run
`processes/security-review.md` over the current surfaces; file issues for
findings rather than fixing inline unless the picked task explicitly owns them.

Surfaces to cover:

- `apps/web/src/storage/*` stores for profile, plans, sessions, and play-along
  tempos
- Safari/WebKit localStorage eviction risk from `INS-023` / ADR-002
- tRPC health/server error posture after TASK-023/TASK-024
- play-along sample loading/cache behavior and external requests
- recording/microphone permission flow from TASK-041 if it has shipped by
  pickup time

## Acceptance criteria

- [x] Security/privacy checklist results are recorded in this task log
- [x] Any findings are fixed in the task or filed as `ISSUE-*` with severity
- [x] No secrets, tokens, private URLs, or unnecessary personal/audio data are
      committed or persisted
- [x] `bun run --cwd codebase check` passes

## Verification

- `bun run --cwd codebase check`
- Manual browser pass for relevant permission/network/storage surfaces as
  dictated by `processes/security-review.md`

## Log

### 2026-07-08 - claimed (agent)

Plan: review storage stores and migrations, server/tRPC health posture, play-along
sample loading/cache behavior, and whether recording/microphone surfaces have
shipped. Record the security/privacy checklist here, file `ISSUE-*` findings
with severity if any are found, run `bun run --cwd codebase check`, and perform
a targeted browser pass for storage/network/permission surfaces.

### 2026-07-08 - done (agent)

Security/privacy checklist results:

- Data and privacy: typed stores use versioned `defineStore` envelopes and
  fail closed to defaults on corrupt/missing/unusable data; production code does
  not touch `localStorage` outside `apps/web/src/storage/`. Stored data remains
  profile/settings/plans/session grades and per-exercise tempo. Recording takes
  stay in memory as object URLs, tracks are stopped, and no audio is persisted
  or uploaded. No secrets, tokens, private URLs, or unnecessary personal/audio
  data were found in the reviewed code or committed files. Finding filed:
  `ISSUE-005` (major) for unmitigated Safari/WebKit storage eviction risk.
- Input and rendering: reviewed surfaces do not inject user-provided HTML.
  Storage readers guard malformed records at the wrapper or consumer boundary;
  no import/write path was introduced by this task.
- Dependencies and supply chain: no dependency changes in this task. Existing
  `smplr`, tRPC, Zod, Astro/Cloudflare, and Wrangler dependencies are locked in
  `bun.lock`. Finding filed: `ISSUE-006` (minor) because first play-along sample
  loads still depend on `gleitz.github.io` rather than mirrored app assets.
- Browser permissions and network: microphone access is tied to the Record
  button and nearby copy says audio stays on device and is discarded when the
  exercise is left. Browser pass confirmed the recording surface recovers in
  headless Chromium's unsupported/no-device state. `/trpc/health` is public
  health-only, Zod-validated, same-origin, and stack-strips errors outside dev;
  broader message masking remains documented for the first throwing procedure.
  Play-along sample network access is user-triggered and CacheStorage-backed
  where available, with the third-party first-load issue filed above.

Verification:

- `bun run --cwd codebase check` passed: typecheck, lint, 44 test files / 616
  tests, and build exited 0. Existing jsdom canvas warnings and the Wrangler
  log-file sandbox warning appeared but did not fail the gate.
- Manual browser pass used `ASTRO_DEV_BACKGROUND=1 bun run dev -- --host
  127.0.0.1 --port 4325`; the Cloudflare dev plugin needed sandbox escalation
  to bind its inspector port, and the app served on `http://127.0.0.1:4326/`
  because 4325 was occupied. Headless Chromium also needed sandbox escalation.
  Checked onboarding/storage (`jazz-master:profile` and
  `jazz-master:daily-plans`, both version 1), `/trpc/health` (HTTP 200 with
  `status: ok`), recording permission copy and recoverable unsupported state,
  play-along transition to Stop, and sample request origin
  `https://gleitz.github.io/.../E2.mp3`. No console errors or failed app-served
  requests were observed.
- Review: independent subagent review was not run because this session's
  multi-agent tool policy forbids spawning agents unless the user explicitly
  asks for delegation, despite the repo's standing authorization. Completed the
  degraded-mode self-review checklist over the full diff; no changes needed.
