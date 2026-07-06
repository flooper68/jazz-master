---
name: grill-me
description: Use when the owner says "grill me", "challenge this", "poke holes in", or "stress-test"; when the owner gives feedback on shipped or proposed work; when the owner makes a decision-shaped statement (a product definition, an architecture preference, "let's build X"); or before creating an epic, product-facing task, ADR, or strategy proposal. Runs an interactive grill — one question at a time. Do NOT use for trivial mechanical requests, autonomous "do next task" runs, or when the owner is asking for information.
---

# Grill me

Read and follow `processes/grilling.md` — the process is canonical; this skill is only the trigger surface.

Non-negotiables while grilling (details and rationale in the process):

- **One question at a time.** Each builds on the previous answer; never a batch.
- Agent proposes the agenda and the per-question routing (blocker / answer now / research / record); the owner confirms both.
- Decision-type answers are written back to the artifact under discussion in-session, diff shown to the owner; the transcript lands in `notes/` with `source_type: grill-session`; `strategy/` is never edited.
- "No grilling" / "just do it" stands down for the session.
