---
id: TASK-054
title: Run security review of storage, audio permissions, and server surfaces
status: backlog
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
- tRPC health/server error posture after TASK-023/TASK-024
- play-along sample loading/cache behavior and external requests
- recording/microphone permission flow from TASK-041 if it has shipped by
  pickup time

## Acceptance criteria

- [ ] Security/privacy checklist results are recorded in this task log
- [ ] Any findings are fixed in the task or filed as `ISSUE-*` with severity
- [ ] No secrets, tokens, private URLs, or unnecessary personal/audio data are
      committed or persisted
- [ ] `bun run --cwd codebase check` passes

## Verification

- `bun run --cwd codebase check`
- Manual browser pass for relevant permission/network/storage surfaces as
  dictated by `processes/security-review.md`
