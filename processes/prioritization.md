# Process: prioritization

Chooses the next work that best moves the product forward. Use it during triage, when the dev loop finds multiple candidates, after a QA review, or whenever the backlog feels stale.

## Inputs

- Current goals in `strategy/goals.md`
- In-progress epics and their **Done when** sections
- Confirmed issues and accepted insights
- Recent QA/product reviews
- Research recommendations that have not fed forward

## Ranking rules

Hard overrides:

1. `blocker` issues outrank everything.
2. The owner's explicit instruction outranks the default order.
3. Dependencies must be respected; do not start blocked work.

Then prefer work that scores well on these questions:

| Question | Strong signal |
|---|---|
| Practice loop | Does this make a guitarist practice, get feedback, or return tomorrow? |
| Current goal | Does this advance the active strategy/epic rather than a side area? |
| Evidence | Is it backed by QA findings, user feedback, or completed research? |
| Risk reduction | Does it test an assumption, unblock later work, or remove fragility? |
| Size | Can it ship in one focused session? |
| Leverage | Does it enable several later tasks or simplify repeated work? |
| Measurable aim | Does it state a baseline and target (or observable before/after state), not just an output? (RES-008) |

Between equally sized candidates, prefer the one with a measurable aim — a stated baseline → target — over one with only an output description.

## Steps

1. List actionable candidates:
   - `work/tasks/*.md` with `status: backlog` and dependencies done.
   - `work/issues/*.md` with `status: confirmed` and no linked task.
2. Remove duplicates and blocked items.
3. Group by epic or source so related work is visible.
4. Apply the ranking rules.
5. If top work is too large, split it into a shippable task and file follow-ups.
6. Record any meaningful priority change in the relevant task, issue, insight, epic, review, or triage summary.

## Output

- A recommended next 1-3 work items, in order.
- Any required task splits, dependency updates, or deferrals.
- A short rationale that a future agent can audit without reconstructing the whole discussion.
