---
id: ADR-001
title: Bun + Vite + React 19 + TypeScript + Tailwind v4
status: accepted
date: 2026-07-05
---

# ADR-001 — Stack: Bun + Vite + React 19 + TypeScript + Tailwind v4

## Context

Greenfield web app, single developer plus AI agents. The stack must be fast to iterate on, well-known to AI models, and verifiable with one command.

## Decision

- **Bun** as runtime and package manager (never npm/yarn/pnpm)
- **Vite 8** for dev server and build; **React 19** with **TypeScript**
- **Tailwind CSS v4** via the Vite plugin, themed in CSS (`@theme` in `src/index.css`), no tailwind.config
- **Vitest + Testing Library** (jsdom) for tests; **oxlint** for linting (shipped with the Vite template)
- One aggregate gate: `bun run check` = typecheck + lint + test + build

## Consequences

- Extremely fast installs/tests; agents get sub-second feedback.
- Vitest (not `bun test`) because it shares Vite's config/transform pipeline — one behavior in dev, test, and build.
- oxlint is younger than ESLint; if rule coverage proves insufficient, revisit in a new ADR rather than bolting on ESLint ad hoc.
