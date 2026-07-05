---
id: RES-004
title: Grill-me skill and recent developments in agentic coding
status: complete
task: none              # requested directly by owner
created: 2026-07-05
stale_when: >
  Codex or Claude changes its skill format/loading model; Agent Skills standard
  changes materially; new large empirical studies contradict the 2025-2026
  findings on agent-authored pull requests, skill utility, or agent safety.
---

# RES-004 - Grill-me skill and recent developments in agentic coding

## Research questions

1. How do agent skills usually work in Codex, Claude Code, and the Agent Skills standard?
2. What should a "grill-me" skill do, and when should it trigger?
3. What makes skills reliable rather than just another long prompt?
4. What recent developments matter most in agentic coding workflows?
5. What should Jazz Master adopt, adapt, or avoid?

## Findings

### 1. Agent skills are lightweight, progressively loaded workflow packages

Agent Skills are now a recognizable cross-tool pattern: a directory with a `SKILL.md` file containing metadata plus instructions, optionally backed by scripts, references, and assets [1][2][3]. The Agent Skills standard describes a three-stage loading model: discovery loads only skill name and description; activation loads the full `SKILL.md`; execution follows the instructions and may load supporting resources or run bundled code [1].

Codex uses the same broad model. Its docs say skills package instructions, resources, and optional scripts, build on the open Agent Skills standard, and use progressive disclosure: Codex initially sees each skill's name, description, and path, then reads the full `SKILL.md` only when it selects the skill [2]. Codex can activate skills explicitly through a prompt mention or selector, or implicitly when the task matches the `description` [2].

Claude Code's implementation is similar but has additional controls. Skills can be invoked directly with slash commands or automatically when relevant; full skill content loads only when the skill is used, while descriptions remain available for matching [3]. Claude Code adds frontmatter controls such as `disable-model-invocation`, `user-invocable`, `allowed-tools`, model/effort overrides, subagent execution, and shell-based dynamic context injection [3].

Implication: a "grill-me" skill should be a small, focused procedure that teaches an agent how to challenge a plan, diff, architecture choice, or shipped behavior. It should not be a huge essay on critical thinking. The description is the trigger surface, so it must say exactly when to use it.

### 2. A useful grill-me skill is an adversarial review workflow, not a general code-review clone

"Grill me" is not a public standard term in the sources I found; I interpret it as a skill that stress-tests a proposal or implementation by asking hard questions, finding weak assumptions, and forcing sharper evidence before execution. That overlaps with code review, but it is not identical.

Code review asks "is this diff acceptable?" A grill-me skill asks "what would make this plan, design, task, or reasoning fail?" It should work before code is written as well as after a patch exists. Good targets:

- Ambiguous product requirements.
- Architecture or library choices.
- Multi-step implementation plans.
- Risky migrations or data changes.
- "I think this is done" moments before review.
- AI-agent outputs that look plausible but have not been validated.

Codex best practices support this pattern indirectly. OpenAI recommends giving Codex a goal, context, constraints, and "done when" criteria; asking it to plan first for complex tasks; encoding repeated guidance into `AGENTS.md`; and asking Codex to test, check, and review work before accepting it [4]. A grill-me skill can operationalize those habits as a reusable challenge pass.

The skill should avoid automatically making code changes. The best default is analysis-only: return findings, questions, missing evidence, and suggested verification. If a later task should fix issues, that should be a separate user decision. In Claude Code terms, a side-effecting or timing-sensitive skill would often use `disable-model-invocation: true`; for Codex, the equivalent practical choice is to keep the trigger explicit and the instructions non-mutating [3][4].

### 3. Reliable skills are grounded, scoped, concise, and evaluated

Agent Skills best-practice guidance is consistent across the open standard and product docs:

- Start from real expertise and artifacts, not generic LLM-generated "best practices" [5].
- Keep a skill focused on one coherent job [2][5].
- Add what the agent would otherwise get wrong, and omit generic background [5].
- Prefer clear defaults over menus of equally weighted options [5].
- Favor procedures, checklists, templates, gotchas, and validation loops [5].
- Split large references into supporting files and tell the agent when to load them [1][5].
- Test trigger behavior with realistic prompts; the description is the primary mechanism for implicit loading [6].
- Run evals with and without the skill to prove it improves output quality, not just that it triggered [7].

This matters because recent research is skeptical of generic skill value. SWE-Skills-Bench found that most evaluated software-engineering skills did not improve pass rate; the average gain was small, and version-mismatched guidance sometimes degraded performance [8]. SkillJuror found that progressive disclosure changes runtime behavior and can improve verifier-passing results, but gains are task-dependent and strongest when supporting resources are actually actionable [9].

Implication: a grill-me skill should be tested on a few realistic prompts from this repo. For example:

- "Grill this implementation plan for TASK-017 before coding."
- "Grill this diff for hidden product or architecture risks."
- "I think this research recommendation is ready; challenge it."
- Negative control: "Fix this typo in README." The skill should not trigger.

### 4. Agentic coding has moved from chat assistance to delegated work, but human review remains central

OpenAI's Codex launch framed Codex as a cloud-based software engineering agent that can work on multiple tasks in parallel, writing features, answering codebase questions, fixing bugs, and proposing pull requests from isolated sandbox environments [10]. Codex docs now position it as one agent across coding surfaces, able to write, explain, review, debug, and automate development tasks [11].

Empirical evidence shows adoption and workflow sophistication increasing. A June 2026 paper using Codex usage data reports more than fivefold active-user growth in the first half of 2026, more users running multiple concurrent Codex agents, 26.6% of users using skills, and a sharp increase in requests estimated to exceed eight hours of experienced-human work [12].

Public GitHub data also shows agent-authored code is no longer tiny. AIDev aggregates 932,791 agent-authored pull requests across OpenAI Codex, Devin, GitHub Copilot, Cursor, and Claude Code, spanning 116,211 repositories and 72,189 developers [13]. A smaller 2025 Claude Code PR study found 83.8% of studied agent PRs were eventually merged, but 45.1% of merged PRs required further human changes, especially for bug fixes, documentation, and project standards [14].

The practical reading is not "agents replace review." It is "agents can produce reviewable work at scale, and process quality determines whether that work is useful." Jazz Master's existing hard rules - work items, verification, review, `bun run check`, and architecture logs - line up well with this.

### 5. New agentic-coding capabilities increase both throughput and risk

Three developments are especially relevant:

1. Parallel/subagent work. Codex docs describe subagents as specialized agents spawned in parallel for exploration, testing, or analysis; they reduce context pollution and can speed independent read-heavy work, but are riskier for parallel write-heavy changes because of conflicts and coordination overhead [15].

2. Auto-review and sandbox-boundary review. Codex auto-review routes escalation requests to a separate reviewer agent while keeping the main agent inside the same sandbox and approval limits. It is explicitly "a reviewer swap, not a permission grant," and does not replace good sandbox design [16].

3. Skills plus automation. Codex best practices say skills define repeatable methods and automations define schedules; stable workflows can run in the background, but workflows that still require steering should become skills first [4].

Security risks are real. Anthropic's skills announcement warns that skills can execute code and should come from trusted sources [17]. A 2026 paper on dynamic malicious skills shows that natural-language skill instructions can become an attack surface, including inducing agents to modify benign skills into malicious ones at runtime; the proposed defense is to make skills read-only during execution [18]. Codex's auto-review docs similarly emphasize sandboxing and narrow approval boundaries [16].

## Recommendations

1. Adopt a project-local grill-me skill as an analysis-only skill.
   Put it under `.agents/skills/grill-me/SKILL.md` if/when the owner wants to implement it. Keep the first version local, focused on critique of plans, diffs, research recommendations, and "done" claims. This follows Codex's supported repository skill location and avoids broader distribution before evaluation [2][4].

2. Make the trigger description explicit and bounded.
   Suggested description:

   ```yaml
   description: Use when the user asks to "grill", challenge, stress-test, poke holes in, or adversarially review a plan, diff, architecture choice, research recommendation, or done claim. Return risks, weak assumptions, missing evidence, verification gaps, and hard questions. Do not edit files unless the user separately asks for fixes.
   ```

   This follows description guidance: user intent first, concise scope, trigger phrases, and clear boundaries [2][6].

3. Structure the skill around a repeatable critique checklist.
   Recommended sections:

   - Scope check: restate what is being grilled and what is out of scope.
   - Assumption audit: list assumptions, confidence, and how to verify each.
   - Failure modes: product, architecture, test, migration, security, UX, and process risks as applicable.
   - Evidence gaps: missing files, tests, source citations, reproduction steps, screenshots, or benchmark data.
   - Counterproposal: only if materially better; otherwise sharpen the current path.
   - Verdict: proceed, revise first, or block, with reasons.

4. Keep it non-mutating by default.
   The skill should not edit code, run destructive commands, change strategy, or push commits. It may recommend verification commands. This keeps the skill safe to invoke before decisions and avoids conflating critique with implementation.

5. Evaluate the grill-me skill before trusting it.
   Create 2-3 initial eval prompts from real Jazz Master work items, run each with and without the skill in fresh sessions, and compare whether the skill found meaningful issues without producing generic noise. Expand only after the first pass [7]. Track false positives and repeated misses in a "Gotchas" section [5].

6. Use subagents for read-heavy grill passes, not simultaneous edits.
   For larger reviews, use one subagent each for product risk, architecture risk, and test/verification gaps, then synthesize. Avoid multiple agents editing the same code unless the task is explicitly partitioned [15].

7. Continue treating human/process review as mandatory.
   The evidence supports agents as useful producers of reviewable work, not as a replacement for review. Keep Jazz Master's current gates: work item scope, review, item verification, and `bun run check` before push [10][14].

8. Be conservative with third-party skills.
   Install skills only from trusted sources, read `SKILL.md` and bundled scripts before trusting them, and prefer read-only skill directories where possible. Avoid broad preapproved tool permissions in skills [16][18].

## Considered and rejected

- A generic "critical thinking" prompt in `AGENTS.md`: rejected. It would always consume context and would blur with normal agent behavior. A skill is better because it loads when needed.
- A code-review-only skill: rejected. Jazz Master already has a code-review process. "Grill me" should also challenge plans, research, and assumptions before code exists.
- Auto-triggering on every implementation request: rejected. That would add friction and generic warnings. Trigger explicitly or when the user asks for challenge/stress-testing.
- A script-heavy first version: rejected. The value is judgment and structured critique. Scripts can be added later for deterministic checks if evals show a need.
- Treating skills as guaranteed performance improvements: rejected. Recent empirical work shows many skills do little or can hurt when mismatched to project context [8].

## Sources

[1] Agent Skills Overview - https://agentskills.io/ (accessed 2026-07-05)

[2] Agent Skills - Codex - https://developers.openai.com/codex/skills (accessed 2026-07-05)

[3] Extend Claude with skills - Claude Code Docs - https://code.claude.com/docs/en/skills (accessed 2026-07-05)

[4] Best practices - Codex - https://developers.openai.com/codex/learn/best-practices (accessed 2026-07-05)

[5] Best practices for skill creators - Agent Skills - https://agentskills.io/skill-creation/best-practices (accessed 2026-07-05)

[6] Optimizing skill descriptions - Agent Skills - https://agentskills.io/skill-creation/optimizing-descriptions (accessed 2026-07-05)

[7] Evaluating skill output quality - Agent Skills - https://agentskills.io/skill-creation/evaluating-skills (accessed 2026-07-05)

[8] SWE-Skills-Bench: Do Agent Skills Actually Help in Real-World Software Engineering? - https://arxiv.org/abs/2603.15401 (published 2026-03-16, accessed 2026-07-05)

[9] SkillJuror: Measuring How Agent Skill Organization Changes Runtime Behavior - https://arxiv.org/abs/2606.11543 (published 2026-06-10, accessed 2026-07-05)

[10] Introducing Codex - OpenAI - https://openai.com/index/introducing-codex/ (published 2025-05-16, accessed 2026-07-05)

[11] Codex - OpenAI Developers - https://developers.openai.com/codex/ (accessed 2026-07-05)

[12] The Shift to Agentic AI: Evidence from Codex - https://arxiv.org/abs/2606.26959 (published 2026-06-25, accessed 2026-07-05)

[13] AIDev: Studying AI Coding Agents on GitHub - https://arxiv.org/abs/2602.09185 (published 2026-02-09, accessed 2026-07-05)

[14] On the Use of Agentic Coding: An Empirical Study of Pull Requests on GitHub - https://arxiv.org/abs/2509.14745 (published 2025-09-18, accessed 2026-07-05)

[15] Subagents - Codex - https://developers.openai.com/codex/concepts/subagents (accessed 2026-07-05)

[16] Auto-review - Codex - https://developers.openai.com/codex/concepts/sandboxing/auto-review (accessed 2026-07-05)

[17] Introducing Agent Skills - Anthropic - https://claude.com/blog/skills (published 2025-10-16, updated 2025-12-18, accessed 2026-07-05)

[18] Dynamic Malicious Skills in Agentic AI - https://arxiv.org/abs/2606.16287 (published 2026-06-15, accessed 2026-07-05)
