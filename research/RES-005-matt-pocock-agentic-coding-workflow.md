---
id: RES-005
title: Matt Pocock's recent agentic coding workflow patterns
status: complete
task: none              # requested directly by owner
created: 2026-07-05
stale_when: >
  Matt Pocock materially changes his AI Hero skill system or publishes a new
  recommended workflow; Claude Code/Codex skill mechanics change materially; or
  Jazz Master adopts project-local agent skills that supersede these notes.
---

# RES-005 - Matt Pocock's recent agentic coding workflow patterns

## Research questions

1. What recent agentic-coding workflow does Matt Pocock appear to recommend?
2. What specific skills, prompts, or process artifacts does he use?
3. How does he control quality when agents write most or all code?
4. What parts are directly useful for Jazz Master, and what should be skipped?

## Findings

### 1. The core workflow is engineering discipline wrapped as agent skills

Matt Pocock's current AI Hero material frames the problem clearly: coding agents such as Claude Code and Codex can ship code very quickly, but without careful guidance they can make a codebase worse, and worse codebases make agents perform worse [1]. His answer is not "vibe coding"; it is a repeatable skill system that encodes engineering process for agents [1][2].

His public skills page describes the collection as "a practical skill system for engineers who want to use AI without giving up their standards" [3]. The current kit includes planning, PRD creation, issue breakdown, TDD, handoff, prototyping, architecture review, and triage skills [3].

For Jazz Master, the important idea is not the exact Claude Code implementation. It is the pattern: repeated agent workflows should live in explicit process artifacts, not only in chat history.

### 2. Start by grilling the idea, not by generating code

Pocock's `/grill-me` and `/grill-with-docs` pattern makes the agent interview the user until there is shared understanding [2][4]. The public `grill-me` writeup shows the skill is intentionally short: it asks the agent to interview relentlessly, walk the design tree, resolve dependent decisions, explore the codebase when the answer is discoverable there, and provide recommended answers [4].

The recent refinement is important: he added "provide your recommended answer" so the conversation can move faster when the agent can infer a sensible default [4]. He also warns that grilling is not passive. The user must steer the session, keep scope contained, and know when to stop planning and start building [5].

For larger scopes, he recommends splitting the work into smaller grillable chunks to avoid context-window degradation, and using prototypes for high-fidelity questions that cannot be resolved through conversation alone [5].

### 3. Convert clarified thinking into durable handoff artifacts

Pocock's workflow moves from conversation to PRD, then from PRD to implementation issues [2][3]. The `/to-prd` skill synthesizes the current conversation and codebase understanding into a product requirements document, including problem, solution, user stories, implementation decisions, testing decisions, out-of-scope items, and notes [6].

The skill also requires the agent to sketch test seams before writing the PRD and to check those seams with the user [6]. This is a useful detail: testing strategy is not an afterthought; it is part of the feature definition.

His `/to-issues` pattern then breaks a PRD into independently grabbable implementation issues and explicitly favors vertical slices that flush out unknowns early [2].

### 4. Build with tracer bullets and TDD, not broad horizontal layers

Pocock's "tracer bullets" article argues that agents naturally try to produce whole solutions at once: complete APIs, models, middleware, auth, logging, and so on before validating the critical path [7]. His countermeasure is to force small end-to-end slices: build one tiny path, test it immediately, get feedback, move to the next slice in a fresh context window, and repeat [7].

His TDD skill encodes the same discipline. Tests should verify behavior through public interfaces, not implementation details; seams should be agreed before tests are written; and the loop should be one seam, one test, one minimal implementation at a time [8].

This is especially relevant to Jazz Master because the app already has a pure `src/theory/` domain core and colocated tests. Agent work should prefer small behavior slices and public-seam tests over broad component churn.

### 5. Agent-friendly codebases use deep, grey-box modules

Pocock repeatedly emphasizes module shape. His "AI agents love" article says the codebase is a bigger influence on AI output than the prompt or `AGENTS.md` file [9]. He recommends "deep modules": larger chunks of implementation hidden behind simple, carefully designed interfaces [9].

He calls these "grey-box modules": the human owns the interface and tests; the AI can work inside the implementation as long as tests keep behavior honest [9][10]. In his "rewired my brain" post, he says deep grey-box modules with simple interfaces are key because they reduce cognitive load and make it easier to trust boundary tests [10].

This lines up with Jazz Master's existing architecture rule that domain logic belongs in `src/theory/`, components stay thin, and dependencies flow `pages -> components -> theory`.

### 6. Use prototypes for UI and high-fidelity unknowns

Pocock is explicit that AI lacks taste for UI, especially existing brownfield UI [10]. His recommendation is to prototype aggressively before committing to a PRD: ask for multiple options, put them on throwaway routes, inspect and iterate, then implement the selected direction in real code [10].

His `/prototype` changelog expands this beyond UI. For complex business logic, he suggests throwaway terminal or state-machine prototypes to expose edge cases that are hard to reason about on paper [11].

For Jazz Master, this is most relevant when building practice experiences, fretboard interactions, notation displays, and lesson flows. It is less relevant for pure theory utilities, where tests usually give faster feedback than prototypes.

### 7. Feedback loops are the agent's real context

Pocock says pre-commit hooks, CI, type checking, and strong tests are desirable friction because they give the agent concrete feedback about what works [10]. He also says integration testing boundaries become more important when agents are changing code automatically [10].

This supports Jazz Master's existing hard gate: never push a red `bun run check`. It also suggests that agent instructions should make `bun run test` or narrower tests part of the inner loop, with `bun run check` as the final gate.

### 8. Preserve context with handoffs instead of stuffing one session forever

The `/handoff` skill compacts a session into a temporary handoff document so another agent or fresh session can continue with context [11]. Pocock describes two patterns: "fire and forget" for a separate bugfix or spike, and "DIY sub-agent" for handing off during planning and then returning with what was learned [11].

This complements the grilling guidance: do not discard a context window full of design decisions. Either implement from it while context remains, or turn it into a PRD/handoff artifact before moving on [5].

### 9. Review needs separate axes: standards and spec

Pocock's current `/code-review` skill separates review into two independent axes: Standards, meaning whether the code follows documented standards and baseline code-smell heuristics; and Spec, meaning whether the diff faithfully implements the originating issue or PRD [12]. The skill runs both as separate reviews so one axis does not mask the other [12].

This maps well to Jazz Master's rule that every work item is independently reviewed and tested before push. It also suggests that future reviews should keep "does this match the task?" separate from "is this good code?"

### 10. Skill-system hygiene matters

In the June 18, 2026 v1 skills update, Pocock reorganized skills around user-invoked versus model-invoked use and used `disable-model-invocation: true` widely to reduce token cost by 63% for skill descriptions [13]. He also introduced routing/navigation helpers such as `/ask-matt` because too many skills create their own cognitive load [13].

The broader lesson: adding agent process artifacts has a cost. Skills and docs should be small, routed, and measured. A pile of long markdown instructions can make agent work worse, especially if outdated.

## Recommendations

1. Adopt the workflow shape, not the whole external skill system.
   Jazz Master already has `processes/`, `work/`, `research/`, `architecture/`, `AGENTS.md`, and a strict `bun run check` gate. The right move is to adapt Pocock's patterns into these existing documents rather than add a parallel agent framework.

2. Add a "grill before build" step for ambiguous work items.
   For tasks with unclear UX, architecture, or scope, the dev loop should include an explicit challenge/interview phase before implementation. The output should be concrete decisions or a task update, not more chat.

3. Treat PRDs and tasks as handoff artifacts.
   When a discussion resolves feature behavior, capture it in `work/tasks/` or a new work item. Include user stories, seams/tests, out-of-scope decisions, and verification steps. This follows Pocock's PRD pattern but fits Jazz Master's tracker.

4. Break agent work into tracer-bullet vertical slices.
   Prefer one small end-to-end user behavior at a time over broad layer-by-layer changes. This is especially important for new practice modules that cross theory, UI, persistence, and routing.

5. Make test seams explicit before implementation.
   For pure domain work, test through `src/theory/` public functions. For UI workflows, use component tests at meaningful user-facing seams. Avoid tests coupled to internals just because an agent can generate them quickly.

6. Preserve the deep-module direction already present in the architecture.
   Keep theory pure and concentrated, keep components thin, and avoid scattering domain concepts through pages. If an agent repeatedly needs to bounce through many files to understand one concept, file an insight or architecture cleanup task.

7. Use prototypes selectively.
   Use throwaway prototypes for UI interaction, information architecture, visual layout, and complex state flows. Do not prototype every pure function or low-risk utility; tests are cheaper there.

8. Keep review split into "Spec" and "Standards".
   During code review, check both whether the task was implemented and whether the code respects project conventions. Do not let a passing `bun run check` substitute for either judgment.

9. Do not stuff `AGENTS.md` with every tip.
   Pocock's token-reduction work is a warning. Add durable rules only when they are repeatedly useful. Put specialized workflows in `processes/` or local skills if they become common.

10. Be cautious about importing third-party skills directly.
    Matt Pocock's skills are useful source material, but Jazz Master should keep local process authority in this repo. If a third-party skill is copied in later, read and adapt it, then evaluate it against real Jazz Master tasks.

## Considered and rejected

- Install `mattpocock/skills` directly: rejected for now. The project already has strong local processes, and direct installation could add tool-specific assumptions before the owner decides to adopt local skills.
- Replace Jazz Master's work items with PRDs only: rejected. The existing work tracker is already the source of truth; PRD-like fields can be added where useful.
- Require grilling on every task: rejected. Small, well-specified tasks should not pay the extra planning cost.
- Run multiple write agents in parallel by default: rejected. Pocock's parallelism and handoff patterns are more useful for research, planning, review, and prototypes than for simultaneous edits in a small codebase.
- Treat AI-generated implementation as trustworthy if tests pass: rejected. Pocock's own framing keeps human taste at interfaces, architecture, and review.

## Sources

[1] AI Hero homepage - https://www.aihero.dev/ (accessed 2026-07-05)

[2] "5 Agent Skills I Use Every Day" - https://www.aihero.dev/5-agent-skills-i-use-every-day (accessed 2026-07-05)

[3] "AI Skills for Real Engineers" - https://www.aihero.dev/skills (accessed 2026-07-05)

[4] "My 'Grill Me' Skill Went Viral" - https://www.aihero.dev/my-grill-me-skill-has-gone-viral (accessed 2026-07-05)

[5] "9 Things People Get Wrong With /grill-me and /grill-with-docs" - https://www.aihero.dev/things-people-get-wrong-with-grill-me-and-grill-with-docs (accessed 2026-07-05)

[6] `to-prd` skill, mattpocock/skills - https://github.com/mattpocock/skills/blob/main/skills/engineering/to-prd/SKILL.md (accessed 2026-07-05)

[7] "Tracer Bullets: Keeping AI Slop Under Control" - https://www.aihero.dev/tracer-bullets (accessed 2026-07-05)

[8] `tdd` skill, mattpocock/skills - https://github.com/mattpocock/skills/blob/main/skills/engineering/tdd/SKILL.md (accessed 2026-07-05)

[9] "How To Make Codebases AI Agents Love" - https://www.aihero.dev/how-to-make-codebases-ai-agents-love (accessed 2026-07-05)

[10] "9 Ways AI Coding Has Rewired My Brain" - https://www.aihero.dev/ways-ai-coding-has-rewired-my-brain (accessed 2026-07-05)

[11] "Skills Changelog: /handoff, /prototype, /review and /writing" - https://www.aihero.dev/skills/skills-changelog-handoff-prototype-review-and-writing (published 2026-05-11, accessed 2026-07-05)

[12] `code-review` skill, mattpocock/skills - https://github.com/mattpocock/skills/blob/main/skills/engineering/code-review/SKILL.md (accessed 2026-07-05)

[13] "v1: 63% Token Reduction, /ask-matt, /writing-great-skills" - https://www.aihero.dev/skills/skills-changelog-v1-announcement (published 2026-06-18, accessed 2026-07-05)
