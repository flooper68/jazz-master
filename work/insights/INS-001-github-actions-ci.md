---
id: INS-001
title: GitHub Actions CI running bun run check
status: deferred
revisit_when: before the first external collaboration or PR flow, or earlier if bun run check passes locally but fails elsewhere
created: 2026-07-05
---

We push straight to main with only the local `bun run check` gate. A GitHub Actions workflow (oven-sh/setup-bun + `bun run check` on every push) would catch "forgot to run check" and machine-specific passes, and is a prerequisite for ever moving to PR-based flow. Came up while designing the git workflow; deferred to keep the bootstrap scope tight.

## Triage note

2026-07-05 — Deferred. This is credible infrastructure work, but the current repo still has a small solo-owner local gate and no evidence of missed checks. Revisit before the first external collaboration/PR flow, or earlier if `bun run check` passes locally but fails elsewhere.
