# Process: testing strategy

The repo's default answer to "what tests does this change need?" Distilled from
RES-012, RES-010, and the existing architecture.

## Gate

`bun run check` from `codebase/` is the automated gate. From the repository root,
run `bun run --cwd codebase check`.

The gate must stay green before a task is marked done or pushed. Use
`bun run --cwd codebase test` for faster iteration, but do not replace the final
gate with a narrower command.

## Test layers

| Layer | Use for | Files | Default tool |
|---|---|---|---|
| Unit | Pure functions, parsers, music theory, reducers, validation | colocated `*.test.ts` | Vitest in node |
| Component | Reusable UI behavior, rendering contracts, accessible names, edge states | colocated `*.test.tsx` | Vitest + Testing Library in jsdom |
| Page/integration | Routes, composed page behavior, storage-facing workflows with controlled stores | colocated page/app `*.test.tsx` | Vitest + Testing Library in jsdom |
| E2E | Cross-page browser flows, persistence across refresh, responsive/keyboard behavior that jsdom cannot prove | `apps/web/e2e/*.spec.ts` | Playwright via `bun run --cwd codebase check:e2e` (TASK-035) |
| Manual QA | Product judgment, visual layout, console/network/a11y sweep, exploratory risks | `work/reviews/REV-*` | `processes/qa-product-review.md` |

Prefer the cheapest layer that catches the defect. A higher-level test should
cover a user workflow, not duplicate every branch already covered below it.

## Coverage expectations

- `packages/theory`: tests go through public exports only. Spelling, intervals,
  scales, arpeggios, fretboard math, and enharmonics need exhaustive musically
  relevant cases, usually all twelve keys or all affected fret boundaries.
- Reusable components: test visible behavior, accessible names/roles, important
  input props, empty/error states, keyboard interaction when interactive, and any
  SVG/diagram semantics users rely on.
- Pages: test route-level composition, navigation, meaningful user workflows,
  storage behavior through stores, and failure/empty states that affect the user.
- Storage: test corrupt/missing data, version envelopes, migrations, reset, and
  that reads fail closed to defaults without throwing.
- Bug fixes: add a regression test at the lowest layer that would have failed
  before the fix, unless the issue is only observable in manual QA. In that case,
  record the manual verification step in the work item.

## Testing Library style

- Use `screen` and semantic queries first: `getByRole` with `name`, then labels,
  text, display value, alt text/title, and test IDs only as a last resort.
- Use `queryBy*` for absence assertions and `findBy*` for async appearance.
- Use `userEvent.setup()` in the test for user interactions. Use `fireEvent`
  only when `user-event` cannot model the browser behavior needed.
- Assert public behavior: visible text, accessible names, enabled/disabled
  states, navigation, emitted callbacks, store results, or serialized domain
  output. Avoid private state, internal helper calls, DOM structure, CSS class
  names, and broad snapshots unless they are the actual stable contract.
- Test names should be short behavior statements, not generated prose.

## AI-generated tests

Treat AI-written tests as drafts. Before committing them:

- Run them.
- Check that each test has a meaningful assertion that would fail for a real
  behavior regression.
- Look for over-mocking, fake APIs, Jest APIs in Vitest tests, missing edge
  cases, leaked spies/mocks, and assertions on implementation details.
- Keep useful generated table tests, but verify the expected data independently
  when the data is the behavior.

## E2E smoke suite

Adopted in TASK-035 (owner decision NOTE-005): a minimal Playwright smoke suite
over the guided-practice slice lives in `apps/web/e2e/` and runs via
`bun run --cwd codebase check:e2e` — deliberately **not** part of `bun run check`,
which stays fast. One-time setup on a fresh machine: `bunx playwright install
chromium` (browser binaries are not part of `bun install`). Every spec also asserts no console errors and no failed
requests on the paths it covers. Keep it a smoke pass (~5 specs), not a browser
port of the unit tests. Run it at these trigger points:

- before/during a QA product review (`processes/qa-product-review.md`)
- before pushing a change that touches the practice flow, routing, or storage —
  a push to `main` is a dev deploy (ADR-009)
- when a work item's Verification section calls for real-browser proof

## Not adopted yet

- Automated axe checks wait to join the e2e harness. Manual accessibility QA
  starts now through `processes/qa-product-review.md`.
- Visual regression waits for stable visual contracts such as notation/tabs,
  complex responsive diagrams, or generated visual artifacts.
- Coverage thresholds wait until the suite is larger and CI exists. Meaningful
  behavior tests outrank numeric coverage for now.

## Manual regression pack

`processes/regression-testing.md` owns the compiled manual/browser regression
pack in `work/REGRESSION.md`. The pack is built from shipped task Acceptance
criteria and Verification sections, then run with browser tooling when heartbeat
schedules it or the owner asks for it. It does not replace `bun run --cwd
codebase check` or `check:e2e`; it gives agents repeatable manual steps for
previously implemented user workflows.
