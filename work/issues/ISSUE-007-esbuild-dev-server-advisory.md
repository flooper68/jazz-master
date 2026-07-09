---
id: ISSUE-007
title: Bun audit reports vulnerable transitive esbuild through dev tooling
status: confirmed
severity: minor
created: 2026-07-09
source: TASK-055
---

# ISSUE-007 - Bun audit reports vulnerable transitive esbuild through dev tooling

## Steps to reproduce

1. Run `bun audit` from `codebase/`.

## Expected

The dependency audit reports no known advisories, or only advisories that have a
documented accepted-risk decision.

## Actual

`bun audit` reports GHSA-67mh-4wv8-2f99 for `esbuild <=0.24.2`, described as a
moderate dev-server advisory. After TASK-055, the vulnerable path includes
`drizzle-kit -> @esbuild-kit/esm-loader -> @esbuild-kit/core-utils -> esbuild
0.18.20`. `bun pm why esbuild` also shows the main app tooling on newer
`esbuild` versions, so the remaining vulnerable copy appears scoped to dev
migration tooling.

## Notes

Severity is minor because this is a local development server/tooling advisory,
not a shipped browser runtime path, and Jazz Master does not expose dev servers
as product infrastructure. Fix should prefer an upstream Drizzle Kit/tooling
update or a proven package-manager override in a dedicated dependency-hygiene
task, not an unreviewed transitive override inside TASK-055.
