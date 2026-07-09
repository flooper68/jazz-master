# Process: development practices

Project-specific engineering standards distilled from RES-010 and RES-005. Use this when planning or implementing any code task; use `processes/dev-loop.md` for the end-to-end workflow.

## Module boundaries

- Keep `codebase/` as the only executable monorepo root. Run Bun commands there or through `bun run --cwd codebase ...` from the repository root. Source: RES-010 recommendations 1, 5.
- Preserve the dependency direction: `apps/web` pages compose components and stores; components may use `@jazz-master/theory`; `packages/theory` imports no React, DOM, app code, or runtime dependencies. Source: RES-010 recommendations 1, 2.
- Add a package only for a real second consumer or a boundary that materially improves build/type isolation. Prefer plain functions, custom Hooks, and reusable components inside the existing app until that trigger exists. Source: RES-010 recommendations 1, 2.
- Treat public package exports, typed stores, and component props as contracts. Make them small and boring; hide implementation detail behind them. Source: RES-005 recommendations 5, 6; RES-010 recommendation 2.

## React

- Components and Hooks must be render-pure: no side effects during render, no mutation of props/state/Hook arguments, no reads that make output non-idempotent such as `Date.now()` or `Math.random()` in render. Source: RES-010 recommendation 3.
- Use event handlers for event-specific work. Use `useEffect` only to synchronize with an external system such as browser APIs, timers, subscriptions, or imperative libraries. Derived data belongs in render; reusable React-specific behavior belongs in a custom Hook. Source: RES-010 recommendation 3.
- Keep components thin. Move music/domain logic to `@jazz-master/theory`; keep client-safe app-data contracts in `apps/web/src/appData/` and durable persistence behind server tRPC/database boundaries; move reusable state transitions to pure functions or reducers when component state becomes hard to inspect. Source: RES-010 recommendations 1, 3, 6.
- Use React 19 client APIs only when they simplify the local UI. Do not introduce Server Components, Server Actions, or React Compiler without a dedicated work item and architecture update. Source: RES-010 recommendation 4.
- For TypeScript React code, type component props at the boundary, prefer discriminated unions for finite UI states, type extracted event handlers, and use context consumer Hooks to narrow nullable context values. Source: RES-010 recommendations 4, 6.

## TypeScript and Vite

- Assume Vite transpiles fast but does not typecheck. `bun run --cwd codebase check` is the root-level gate because it runs `tsc -b`, lint, tests, and production build. Source: RES-010 recommendation 5.
- Prefer inference inside functions and explicit types at public boundaries: exported functions, package APIs, props, store values, reducers, parsers, and test fixtures whose shape matters. Source: RES-010 recommendation 6.
- No `any` without an adjacent reason. Prefer `unknown` plus narrowing for untrusted or parsed values. Source: RES-010 recommendation 6.
- Use `import type` / `export type` for type-only imports and exports when practical. Source: RES-010 recommendation 6.
- Do not change compiler strictness opportunistically in feature tasks. File a tooling task for `strict`, `isolatedModules`, `noUncheckedIndexedAccess`, or `exactOptionalPropertyTypes` changes so failures are handled intentionally. Source: RES-010 recommendation 7.

## Tailwind v4

- Keep Tailwind setup CSS-first: import Tailwind and define project design tokens in `apps/web/src/index.css` with `@theme`. Use `:root` only for CSS variables that should not create utilities. Source: RES-010 recommendation 8.
- Keep utility class names complete and literal so Tailwind can detect them. For variants, map props/state to full class strings rather than constructing fragments dynamically. Source: RES-010 recommendation 8.
- Extract repeated UI into components or small class maps when the same stateful styling appears in multiple places. Do not create abstractions for one-off class lists. Source: RES-010 recommendation 8.

## Tests

- Theory package logic is tested through public exports and covers all musically relevant keys/edge cases. Enharmonic spelling is behavior, not formatting trivia. Source: RES-010 recommendation 9.
- React tests should resemble user behavior: render components/pages, query by role/label/text first, use `user-event` for interactions, and use test IDs only when no semantic query can express the contract. Source: RES-010 recommendation 9.
- Tests should fail for meaningful behavior regressions and stay readable. Avoid testing implementation details just because they are easy for an agent to generate. Source: RES-005 recommendation 5; RES-010 recommendations 9, 10.
- Use `bun run test` or `bun run --cwd codebase test`; do not use `bun test` for this repo because Vitest owns the suite. Source: RES-010 recommendation 5.

## Agent workflow

- For ambiguous work, clarify the behavior before coding and record the decision in the task Log. Keep the output as a task update, not only chat memory. Source: RES-005 recommendations 2, 3.
- Implement tracer-bullet slices: one small user-visible or API-visible path, tested, then expand. Avoid broad horizontal rewrites. Source: RES-005 recommendation 4.
- Review on two axes before shipping:
  - Spec: acceptance criteria, scope, user behavior, verification, tracker updates.
  - Standards: module boundaries, React purity, TypeScript contracts, Tailwind detectability, tests, security/storage/dependency risks.
  Source: RES-005 recommendation 8; RES-010 recommendation 10.
- One work item ships as one reviewed, checked, pushed commit to `main` while the repo is solo/pre-CI. Never report done with uncommitted or unpushed work. Source: RES-010 recommendation 11.
