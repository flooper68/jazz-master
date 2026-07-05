# Process: code review

Every work item is reviewed before it ships — including agent-implemented ones. Review happens on the full diff of the work item, before the commit is pushed.

## How

1. Stage the diff (`git add -A; git diff --cached` view) so the review sees the complete change.
2. Run an independent review pass — in Claude Code, launch the `code-reviewer` agent on the changes; for UI-heavy diffs additionally the `ui-code-reviewer` agent. The implementer re-reading their own diff is not a review.
3. Walk the checklist below.
4. Every finding is either **fixed now** or **filed** as `work/issues/ISSUE-###` with a one-line justification for deferring. Findings are never silently dropped.

## Checklist

**Contract**
- [ ] Acceptance criteria ticked in the task file are actually met by this diff
- [ ] Scope respected — nothing unrelated snuck in; discoveries filed as insights/issues instead

**Correctness**
- [ ] Logic errors, edge cases (theory code: enharmonics, all twelve keys, boundary frets)
- [ ] New logic has meaningful tests; tests assert behavior, not implementation details

**Architecture**
- [ ] `src/theory/` stays pure — no React/DOM imports
- [ ] Reuses existing utilities/components instead of duplicating them
- [ ] Architectural decisions in this diff have an ADR

**Conventions** (see CLAUDE.md)
- [ ] Naming, exports, chord-quality notation, TypeScript strictness (`any` only with a reason)
- [ ] Comments only where the code can't speak for itself

**Housekeeping**
- [ ] Task file status/Log updated in the same change
- [ ] No leftover debug code, dead files, or commented-out blocks

## Severity guidance

- **Must fix before ship:** correctness bugs, contract violations, theory-core impurity.
- **Fix or file:** convention drift, missing edge-case tests, naming.
- **File as insight:** "this could be designed better" ideas.
