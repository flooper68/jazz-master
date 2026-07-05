---
id: INS-002
title: App shell polish deferred from TASK-001 review
status: new
created: 2026-07-05
---

Review findings from TASK-001 (code-reviewer + ui-code-reviewer agents) filed rather than fixed because the pages are throwaway stubs and the shell carries minimal nav so far:

1. **PageHeading dedup** — the `h1` class string `font-display text-2xl font-bold tracking-tight` is repeated in all seven page stubs. When the first real page is built, extract a `PageHeading` component so typography can't drift.
2. **Skip-to-content link** — with a persistent sidebar, keyboard users tab through all nav items on every page. Add a visually-hidden skip link targeting `<main>` once the shell carries more nav.
3. **No colocated `Layout.test.tsx`** — Layout is covered transitively by `App.test.tsx` (persistence, active state, click navigation). Fine for now; revisit if Layout grows behavior of its own.
