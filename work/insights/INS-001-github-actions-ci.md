---
id: INS-001
title: GitHub Actions CI running bun run check
status: new
created: 2026-07-05
---

We push straight to main with only the local `bun run check` gate. A GitHub Actions workflow (oven-sh/setup-bun + `bun run check` on every push) would catch "forgot to run check" and machine-specific passes, and is a prerequisite for ever moving to PR-based flow. Came up while designing the git workflow; deferred to keep the bootstrap scope tight.
