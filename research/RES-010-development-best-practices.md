---
id: RES-010
title: React 19 + TypeScript + Vite/Bun development best practices
status: complete
task: TASK-005
created: 2026-07-06
stale_when: >
  React 20, TypeScript 7, Vite 9, Tailwind v5, Vitest 5, Bun workspace behavior,
  or Jazz Master's architecture changes materially; or the project adopts React
  Compiler, a backend, CI, or a branch/PR workflow.
---

# RES-010 - React 19 + TypeScript + Vite/Bun development best practices

## Research questions

1. What module structure best fits a React + TypeScript local-first app with a pure domain package?
2. Which React 19 idioms should Jazz Master adopt or avoid in a client SPA?
3. Which TypeScript/compiler/lint practices pay off most for AI-generated code?
4. How should Tailwind v4 be organized so utility classes stay maintainable?
5. What test and review practices catch defects in AI-written React/TypeScript changes?
6. What commit and trunk workflow should a solo owner plus agents use before CI exists?

## Findings

### 1. Structure should preserve deep modules and explicit package boundaries

TypeScript project references are designed to split a program into smaller projects, improve build times, enforce logical separation, and support a solution `tsconfig.json` that references leaf projects [1]. Bun workspaces support the same monorepo shape at the package-manager layer: independent packages listed by workspace globs, linked with `workspace:*`, installed through a single root install, and runnable with workspace filters [2].

Vite explicitly supports monorepo setups and can resolve dependencies outside the app root [3]. Vite also treats `index.html` as the app entry and project-root source, so the app package should remain the Vite root rather than hiding entry assets in repo-level glue [3].

RES-005 adds the agentic-codebase angle: agent-friendly projects use deep, grey-box modules with simple interfaces, where humans own boundaries and tests while agents can safely work inside implementations [16]. This matches Jazz Master's current package split: `packages/theory` is a pure domain core, `apps/web` composes it, and storage is an explicit browser seam.

Our pick: keep the current `codebase/apps/*` and `codebase/packages/*` structure. Add packages only when they have a real second consumer or enforce a meaningful boundary; otherwise prefer plain functions/hooks inside the existing app.

### 2. React 19 favors pure rendering, minimized effects, and selective new APIs

React's rules now state the core contract plainly: components and Hooks must be idempotent, must not perform side effects during render, and must not mutate non-local values, props, state, or Hook arguments/returns [4]. React's "You Might Not Need an Effect" guidance says effects are for synchronization with external systems; derived data and event-specific logic should usually live in render or event handlers instead [5]. Custom Hooks are still the right extraction when logic is reused and genuinely React-specific [6].

React 19 stable adds useful client features, but not every feature fits a local-only SPA. Actions, `useActionState`, `useOptimistic`, form actions, `use`, ref-as-prop, and `<Context>` provider shorthand are available [7]. Server Components and Server Actions require framework/bundler/server support, and React's own post warns that the underlying APIs for bundlers/frameworks can change across React 19 minors [7]. The React Compiler can reduce manual `useMemo`, `useCallback`, and `React.memo`, but the docs frame it as an opt-in installation with incremental adoption and troubleshooting [8].

React's TypeScript docs recommend `.tsx` for files with JSX, explicit prop types when useful, union-shaped state for finite states, typed reducers, and context consumer hooks that narrow `null` at runtime when no meaningful default exists [9].

Our pick: keep components pure and thin, default to event handlers/derived render data over `useEffect`, use new React 19 client APIs only when they simplify real local interactions, and do not introduce Server Components or React Compiler until a task explicitly chooses them.

### 3. Vite's speed model makes `tsc -b` and strict TypeScript non-negotiable

Vite transpiles TypeScript but does not typecheck. Its docs recommend separating static analysis from the transform pipeline, running `tsc --noEmit` for production, and using a separate watcher if IDE hints are not enough [10]. Vite also recommends `isolatedModules: true` because transform-only compilers lack cross-file type information [10].

TypeScript's `strict` flag enables a family of stronger checks and may add stricter behavior in future versions [11]. TypeScript warns that `any` disables further type checking for that value and recommends `noImplicitAny` to prevent implicit `any` [12]. `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` are useful hardening options, but they are intentionally sharper: the former adds `undefined` to unchecked indexed reads, and the latter distinguishes absent optional properties from explicit `undefined` [13][14].

Project references support the current build graph and `tsc -b` mode, and composite referenced projects emit declarations for dependents [1]. Vite's docs also recommend type-only imports/exports to avoid type-only imports being bundled incorrectly [10].

Our pick: keep `bun run check` as the real gate because it runs `tsc -b` outside Vite, lint, tests, and build. Maintain strict-ish TS defaults and avoid `any`; consider `strict`, `isolatedModules`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes` as future tooling tasks, not as scope creep in unrelated feature work.

### 4. Tailwind v4 is CSS-first; use theme variables for tokens and literal utilities for detection

Tailwind v4's Vite integration is an official plugin path and is the recommended seamless integration for Vite-based frameworks [15]. Tailwind generates utilities by scanning source files for class names [15]. Theme variables are defined with `@theme`; unlike plain `:root` variables, they instruct Tailwind which utility classes and variants should exist [17].

Tailwind's class detection docs warn against dynamically constructing class names because the scanner needs complete class names in source. The recommended pattern is to map props or states to complete class strings that are statically detectable [18]. Its utility-class guidance expects composition in markup, with component abstractions used when repeated patterns become meaningful [19].

Our pick: keep design tokens in `apps/web/src/index.css` under `@theme`, keep class names literal and discoverable, and extract reusable React components or small class maps only when repeated UI states make inline utilities harder to read.

### 5. Tests and reviews should check public behavior, not implementation trivia

Testing Library's guiding principle is that tests should resemble how software is used; its utilities deal with DOM nodes, not component instances [20]. Its query priority favors accessible queries such as `getByRole` with name and labels, while test IDs are a last resort when semantic queries cannot express the contract [21]. Vitest runs `.test.`/`.spec.` files, integrates with Vite config, supports projects for multi-workspace repos, and explicitly says Bun users should run `bun run test` so Vitest, not Bun's separate runner, executes the suite [22][23].

Google's code review guide says reviews should cover design, functionality, complexity, tests, naming, comments, style, consistency, documentation, and every human-written line; tests should be useful and fail when behavior breaks [24]. Its standard of review prefers changes that improve overall code health without blocking on perfection, with technical facts and style guides outranking personal preference [25].

RES-005 adds that reviews for agent-written work should split two axes: Spec, meaning the diff implements the requested task, and Standards, meaning it follows documented engineering standards [16].

Our pick: keep theory tests exhaustive through public package APIs; UI tests should use Testing Library semantics and user workflows. Code review should explicitly separate "does this meet the work item?" from "does this meet standards?" and should inspect tests as production-quality code.

### 6. Solo trunk-based development is appropriate only with a green local gate

Trunk-based development centers work on a single trunk/main branch, avoids long-lived branches, and requires developers not to break the build [26]. The same source says very small teams may commit directly to trunk, while short-lived branches support code review and build checks as teams scale [26]. DORA's delivery metrics frame throughput and instability together, warning that the goal is improvement over time, not gaming a single metric [27].

Our pick: Jazz Master's current direct-to-main workflow is appropriate while it is single-owner and pre-CI, but the local gate is the substitute for CI. One work item should remain one reviewed, checked, pushed commit; if collaboration or CI arrives, upgrade to short-lived task branches and PR checks.

## Recommendations

1. Keep the current monorepo boundary: `codebase/apps/web` for the SPA, `codebase/packages/theory` for pure domain logic, and no root `package.json`. Add packages only for a second consumer or a boundary that materially improves the graph [1][2][3][16].
2. Treat module interfaces and tests as the human-owned contract. Agents may work inside modules, but public APIs, package direction, and tests define the safety boundary [16][24][25].
3. React components and Hooks must be render-pure and idempotent. Use event handlers for event-specific work, Effects only for synchronization with external systems, and custom Hooks for reusable React-specific logic [4][5][6].
4. Adopt React 19 client APIs case-by-case. Use ref-as-prop, `<Context>` provider shorthand, `useActionState`, or `useOptimistic` only when they simplify a local UI. Skip Server Components/Server Actions and React Compiler until a dedicated task changes the app architecture/tooling [7][8][9].
5. Keep `bun run check` as the mandatory gate because Vite does not typecheck and Bun's native test runner is not this repo's test runner [10][22].
6. Strengthen TypeScript through explicit types at boundaries, discriminated unions for finite UI/domain states, type-only imports/exports where applicable, and no `any` unless the reason is documented at the use site [9][10][11][12].
7. File future tooling tasks, rather than opportunistically changing unrelated work, for enabling `strict`, `isolatedModules`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes` if the owner wants a stricter compiler profile [10][11][13][14].
8. Keep Tailwind v4 CSS-first: put project tokens in `@theme`, use complete literal class names, and extract components or class maps when utility strings become repeated behavior rather than one-off styling [15][17][18][19].
9. Test public seams: exhaustive theory package tests for music logic, component/page tests that query by role/label/text and simulate user behavior, and no tests coupled to implementation details unless there is no user-observable contract [20][21][22][23].
10. Upgrade code review to two explicit passes: Spec (acceptance criteria, scope, behavior, verification) and Standards (design, complexity, TS/React/Tailwind conventions, tests, security/storage/dependency risks) [16][24][25].
11. Continue direct-to-main trunk development while solo and pre-CI, but only after review and green `bun run check`; push every completed work item so local state and `origin/main` do not drift [26][27].

## Considered and rejected

- Adopt React Server Components now: rejected. The app is a local-first Vite SPA with no server architecture, and React's own docs tie RSC support to framework/bundler integration [7].
- Enable React Compiler immediately: rejected. It is promising, but it adds build tooling and migration/debugging work that should be its own task [8].
- Split `packages/ui` now: rejected. RES-005 supports deep modules, but this repo does not yet have a second app or enough duplicated UI to justify the package boundary [16].
- Replace utility classes with CSS modules: rejected. Tailwind v4's CSS-first token model already fits the project; the maintainability issue is solved by literal classes, tokens, and component extraction [15][17][18].
- Use Bun's built-in test runner because the package manager is Bun: rejected. The repo is configured for Vitest projects and Vitest explicitly tells Bun users to run package scripts so Vitest executes [22][23].
- Require PR branches immediately: rejected. Trunk-based guidance allows direct trunk commits for very small teams if the build is protected locally; this repo has no CI yet [26].

## Sources

[1] TypeScript Handbook, "Project References" - https://www.typescriptlang.org/docs/handbook/project-references.html (last updated 2026-07-01, accessed 2026-07-06)

[2] Bun Docs, "Workspaces" - https://bun.sh/docs/pm/workspaces (accessed 2026-07-06)

[3] Vite Docs, "Getting Started" - https://vite.dev/guide/ (Vite v8.1.2 docs, accessed 2026-07-06)

[4] React Docs, "Components and Hooks must be pure" - https://react.dev/reference/rules/components-and-hooks-must-be-pure (React 19.2 docs, accessed 2026-07-06)

[5] React Docs, "You Might Not Need an Effect" - https://react.dev/learn/you-might-not-need-an-effect (React 19.2 docs, accessed 2026-07-06)

[6] React Docs, "Reusing Logic with Custom Hooks" - https://react.dev/learn/reusing-logic-with-custom-hooks (React 19.2 docs, accessed 2026-07-06)

[7] React Blog, "React v19" - https://react.dev/blog/2024/12/05/react-19 (published 2024-12-05, accessed 2026-07-06)

[8] React Docs, "React Compiler" - https://react.dev/learn/react-compiler (React 19.2 docs, accessed 2026-07-06)

[9] React Docs, "Using TypeScript" - https://react.dev/learn/typescript (React 19.2 docs, accessed 2026-07-06)

[10] Vite Docs, "Features: TypeScript" - https://vite.dev/guide/features.html#typescript (Vite v8.1.2 docs, accessed 2026-07-06)

[11] TypeScript TSConfig, "`strict`" - https://www.typescriptlang.org/tsconfig/strict.html (accessed 2026-07-06)

[12] TypeScript Handbook, "Everyday Types: any / noImplicitAny" - https://www.typescriptlang.org/docs/handbook/2/everyday-types.html (accessed 2026-07-06)

[13] TypeScript TSConfig, "`noUncheckedIndexedAccess`" - https://www.typescriptlang.org/tsconfig/noUncheckedIndexedAccess.html (accessed 2026-07-06)

[14] TypeScript TSConfig, "`exactOptionalPropertyTypes`" - https://www.typescriptlang.org/tsconfig/exactOptionalPropertyTypes.html (accessed 2026-07-06)

[15] Tailwind CSS Docs, "Installing Tailwind CSS with Vite" - https://tailwindcss.com/docs/installation/using-vite (Tailwind v4.3 docs, accessed 2026-07-06)

[16] RES-005, "Matt Pocock's recent agentic coding workflow patterns" - research/RES-005-matt-pocock-agentic-coding-workflow.md (created 2026-07-05)

[17] Tailwind CSS Docs, "Theme variables" - https://tailwindcss.com/docs/theme (Tailwind v4.3 docs, accessed 2026-07-06)

[18] Tailwind CSS Docs, "Detecting classes in source files" - https://tailwindcss.com/docs/detecting-classes-in-source-files (Tailwind v4.3 docs, accessed 2026-07-06)

[19] Tailwind CSS Docs, "Styling with utility classes" - https://tailwindcss.com/docs/styling-with-utility-classes (Tailwind v4.3 docs, accessed 2026-07-06)

[20] Testing Library Docs, "Guiding Principles" - https://testing-library.com/docs/guiding-principles/ (last updated 2020-11-04, accessed 2026-07-06)

[21] Testing Library Docs, "About Queries" - https://testing-library.com/docs/queries/about/ (last updated 2024-03-19, accessed 2026-07-06)

[22] Vitest Docs, "Getting Started" - https://vitest.dev/guide/ (Vitest v4.1.9 docs, accessed 2026-07-06)

[23] Vitest Docs, "Test Projects" - https://vitest.dev/guide/projects (Vitest v4.1.9 docs, accessed 2026-07-06)

[24] Google Engineering Practices, "What to look for in a code review" - https://google.github.io/eng-practices/review/reviewer/looking-for.html (accessed 2026-07-06)

[25] Google Engineering Practices, "The Standard of Code Review" - https://google.github.io/eng-practices/review/reviewer/standard.html (accessed 2026-07-06)

[26] Trunk Based Development, "Introduction" - https://trunkbaseddevelopment.com/ (site copyright 2017-2020, accessed 2026-07-06)

[27] DORA, "DORA's software delivery performance metrics" - https://dora.dev/guides/dora-metrics/ (accessed 2026-07-06)
