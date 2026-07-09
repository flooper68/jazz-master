# Process: grilling

The owner's primary working interface. When the owner is present, the default mode is a **grill**: the agent asks the owner questions — one at a time — about the live artifact or decision, writes the answers back into the knowledge system, and hands the resulting work to the other processes. The loop: grill → agents do the work → owner gives feedback → grilled on the feedback.

Decision record: `architecture/decisions/ADR-008-grill-loop-primary-owner-interface.md`. Origin: `notes/NOTE-001` (design session); `research/RES-004` researched the critique-skill variant this partially supersedes.

## Why it exists

The motivating problem is owner distance, not undetected defects: without deep insight into the domain, the technical state, and progress, owner review degrades into rubber-stamping. Grilling is a comprehension-and-ownership mechanism — questions force real answers, and the answers become durable decisions. It also kills weak assumptions along the way, but comprehension is the point.

## Triggers

| Tier | Fires when | Behavior |
|---|---|---|
| Explicit | Owner says "grill me", "challenge this", "poke holes in", "stress-test" | Always enter grill mode |
| Implicit | Owner gives feedback on shipped or proposed work; makes a decision-shaped statement (product definition, architecture preference, "let's build X"); answers a previous grill's open question | Enter grill mode uninvited |
| Creation hooks | A process is about to create a judgment-carrying artifact (table below) | Grill inline if the owner is present, else defer the questions to the confirmation batch |
| Cadence | Heartbeat flags "exam grill due" (~monthly) | Owner sits for the exam grill (below) |

**Never** trigger on: trivial mechanical requests; autonomous runs ("do next task" — the owner isn't there, and an agent answering its own grill questions is theater); questions where the owner is asking the agent for information.

**Stand-down:** the owner saying "no grilling" / "just do it" disables grill mode for the session, no questions asked.

## Session shape

1. **Agenda.** The agent proposes it from the trigger context and the state of `work/`: "here are the things that most need your judgment, in priority order — agree?" The owner can override. Because the agent setting agendas is a soft handover of direction, the agenda itself is always challengeable — and errors of omission are the exam grill's job to catch.
2. **Questions, one at a time.** Each question builds on the previous answer. Never a batch — a batch gets skimmed; a single question forces a real answer.
3. **Routing.** When the owner can't answer, the agent proposes a route (table below); the owner confirms.
4. **Close-out.** Write-backs applied and their diffs shown, transcript filed as a note, everything committed per `processes/git-workflow.md` before the session ends.

## Question rules

- Anchor to the live artifact's actual details: domain questions for drills and product definitions, technical questions for ADRs, progress questions at heartbeat. No generic critical-thinking prompts.
- Call out dodges, contradictions with earlier answers, and unfalsifiable claims.
- Force trade-offs with consequences, not preferences ("which failure hurts more in three months?"), and do the arithmetic on quantitative claims.
- The grill challenges; the owner decides. A verdict ("proceed / revise first / block") is advice, never a veto.

## Routing unanswerable questions

| Route | When | Output |
|---|---|---|
| Blocker | The decision can't be safely made without the answer | The artifact stays undecided; the open question is recorded in it |
| Answer now | The gap is context the agent can supply | Agent teaches in place, then the owner decides |
| Research | The answer needs evidence nobody has | Task with a research phase (or `RES-*` via `processes/deep-research.md`), linked from the session note |
| Record | Interesting but not load-bearing now | `INS-###` or a line in the session note |

## Write-backs

- Decision-type answers are applied **directly to the artifact under discussion, in-session**, and the diff is shown to the owner before commit. This is a deliberate exception to "notes are never implemented directly" (ADR-008): the owner is present and reviews the change, so the retelling loss of note → triage → task is pure cost.
- `strategy/` is never edited (hard rule 2). Vision-level answers become a drafted proposal handed to the owner verbatim.
- The full session lands in `notes/NOTE-###` with `source_type: grill-session`: the arc, decisions, routed questions, and extracted work, linked both ways.
- Commits follow `processes/git-workflow.md` — `work:` prefix, or inside the affected work item's commit when the write-back is the item's tracker update.

## Creation hooks

Any process about to create a judgment-carrying artifact routes through a grill. "If needed" is this table, not in-the-moment agent judgment:

| Artifact being created | Grill? |
|---|---|
| Epic | Always — the owner's ask is the entry point; grill before drafting |
| Product-facing task (carries a Problem brief) | Always — inline or deferred |
| ADR | Always — inline or deferred |
| Strategy proposal | Always — inline (owner-only territory) |
| Insight promoted to task/epic at triage | Always — inline or deferred |
| Hygiene task scheduled by heartbeat cadence | Never (mechanical) |
| Trivial issue → task conversion | Never |

An agent may propose skipping an "always" grill; the skip is logged with a reason, same pattern as heartbeat cadence skips.

**Deferred grill:** when the owner is absent (heartbeat inline triage, autonomous dev-loop paths — e.g. an ADR written at Record, or a product-facing task filed at Reflect), the run drafts the artifact anyway and records the 2–3 load-bearing questions it rests on **inside the artifact itself**, under an `## Open questions (deferred grill)` heading. The questions surface at the next owner-confirmation point: the triage confirmation batch, or the heartbeat report's **Owner decisions needed** (the heartbeat collects outstanding deferred-grill headings from artifacts created since the last beat). The owner's next session opens with those questions instead of a yes/no rubber-stamp; answered questions are resolved into the artifact and the heading removed. Nothing blocks the autonomous run.

## The exam grill (~monthly)

The success metric and the kill criterion in one. The heartbeat flags it due; it needs the owner live. Exam sessions are marked `exam: true` in the session note's frontmatter — that flag is what the heartbeat cadence check looks for.

1. The owner describes the whole system unaided: domain model, architecture, what's shipped, what's next.
2. The agent probes for gaps and hand-waving — same one-question-at-a-time rules.
3. Gaps found are recorded in the session note and become the next period's grill agenda.
4. **Kill criterion:** if gaps stop shrinking exam over exam, the loop is theater — record that in the exam note and raise redesign or retirement with the owner. A primary-way-of-working with no kill criterion doesn't get killed, it gets silently abandoned.

## Guardrails

- One question at a time — the rule the whole interaction stands on.
- Non-mutating outside the artifact under discussion; discoveries beyond it go through `processes/feedback-intake.md` as usual (no invented work).
- Never edit `strategy/`.
- Grill answers are decisions with provenance; contradicting an earlier recorded answer is a finding to surface, not silently overwrite.
- Accepted risks (ADR-008): the owner's stated appetite ("hundreds of exchanges a week") is untested, and agent agenda-setting concentrates framing power — owner review of all outputs plus the exam grill are the counterweights.

## Gotchas

Accumulate real misses here (RES-004 rec. 5): questions that were noise, triggers that fired wrong or too eagerly, write-backs that mangled a decision.

- A detailed agenda can feel like a batch of questions before the owner has
  context. Keep the agenda concise or internal, then ask exactly one contextual
  question at a time (NOTE-015).
