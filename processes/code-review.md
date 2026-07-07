# Process: code review

Every work item is reviewed before it ships — including agent-implemented ones. Review happens on the full diff of the work item, before the commit is pushed.

## How

1. View the complete change. In an exclusively-owned tree (own worktree), `git add -A; git diff --cached` is fine; in a shared tree, don't stage — review `git diff` + `git status --short` and follow the commit-isolation steps in `processes/git-workflow.md` when it's time to commit.
2. Run an independent review pass — in Claude Code, launch the `code-reviewer` agent on the changes; for UI-heavy diffs additionally the `ui-code-reviewer` agent. The implementer re-reading their own diff is not a review.
   - **Standing owner authorization** (2026-07-06, NOTE-005 / INS-015): agents are always authorized to spawn independent review subagents — no per-session delegation request is needed.
   - **Degraded mode** when the environment genuinely cannot spawn one despite the authorization: complete the checklist below as a self-review and record the limitation in the item's Log. Shipping is not blocked; the Log line is the required trace (no ad hoc caveats elsewhere).
3. If the diff touches storage, dependencies, user input, browser permissions, import/export, or data-loss risk, include `processes/security-review.md`.
4. Walk the checklist below in two passes:
   - **Spec:** did the diff implement the work item and verification honestly?
   - **Standards:** does the diff improve or preserve code health under `processes/development-practices.md`, `processes/testing-strategy.md`, and AGENTS.md?
5. Every finding is either **fixed now** or **filed** as `work/issues/ISSUE-###` with a one-line justification for deferring. Findings are never silently dropped.

## Checklist

**Contract**
- [ ] Acceptance criteria ticked in the task file are actually met by this diff
- [ ] Scope respected — nothing unrelated snuck in; discoveries filed as notes/insights/issues instead

**Correctness**
- [ ] Logic errors, edge cases (theory code: enharmonics, all twelve keys, boundary frets)
- [ ] New logic has meaningful tests at the layer required by `processes/testing-strategy.md`; tests assert public behavior, not implementation details
- [ ] React render logic is pure/idempotent; side effects are in event handlers or justified Effects

**Architecture**
- [ ] `codebase/packages/theory/` stays pure — no React/DOM imports, zero runtime deps in its `package.json`
- [ ] Reuses existing utilities/components instead of duplicating them
- [ ] Architectural decisions in this diff have an ADR
- [ ] Package/store/component boundaries follow `processes/development-practices.md`

**Security/privacy**
- [ ] No secrets, private data, or unintended network access introduced
- [ ] User input is rendered safely; imports/parsers handle malformed data
- [ ] Storage changes are typed, migration-safe, and tolerate corrupt/missing data
- [ ] Dependency changes are intentional and justified

**Conventions** (see AGENTS.md)
- [ ] Naming, exports, chord-quality notation, TypeScript strictness (`any` only with a reason)
- [ ] Type-only imports/exports used where appropriate; Vite-only transpilation is backed by `tsc -b` in `bun run --cwd codebase check`
- [ ] Tailwind classes are complete/literal enough for v4 detection; design tokens belong in `@theme`
- [ ] Comments only where the code can't speak for itself

**Housekeeping**
- [ ] Task file status/Log updated in the same change
- [ ] No leftover debug code, dead files, or commented-out blocks

## Severity guidance

- **Must fix before ship:** correctness bugs, contract violations, theory-core impurity.
- **Must fix before ship:** secret exposure, unsafe rendering of user input, data-loss risk.
- **Fix or file:** convention drift, missing edge-case tests, naming.
- **File as insight:** "this could be designed better" ideas.
