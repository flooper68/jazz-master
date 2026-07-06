---
title: How the quality loops work — and why they are closed
updated: 2026-07-06
sources:
  - architecture/decisions/ADR-004-closed-loop-product-process.md
  - research/RES-006-knowledge-pruning-and-triage.md
  - research/RES-011-product-best-practices.md
  - processes/feedback-intake.md
  - processes/triage.md
  - processes/qa-product-review.md
  - processes/heartbeat.md
  - processes/knowledge-maintenance.md
  - processes/dev-loop.md
---

# How the quality loops work — and why they are closed

[lifecycle-of-a-change.md](lifecycle-of-a-change.md) walks the *mechanics* of the loop; this page explains why it is shaped the way it is. The loop itself (ADR-004): feedback/notes → insight/issue → triage/prioritization → dev loop → ship → QA review → knowledge maintenance → back to feedback. "Closed" means nothing falls off the edge: every input ends in a decision, every decision leaves a written reason, and every output feeds the next cycle's input.

## Two complementary halves

The dev loop only **verifies what a task claimed** — its review and checks catch defects in the change at hand. Finding problems nobody claimed anything about is a different job: the QA/product review inspects the *running product* on a cadence, walking every module (regressions hide in untouched screens) and asking product questions — is this still a practice loop, would a guitarist use it four times a week? One half ships increments; the other generates the raw material for the next round. Neither substitutes for the other (processes/qa-product-review.md).

## Capture is cheap; commitment is not

Anyone can file a note, insight, or issue at any moment — but "raw feedback is not work until triaged" (processes/feedback-intake.md). The separation is deliberate (RES-006, partly via Shape Up): raw ideas arrive too vague or over-specified, single feedback fragments shouldn't drive action without validation, and a meeting note is raw material that may yield zero or several insights — not an insight itself. Intake routes fragments to the right artifact without deciding priority; triage decides, later and deliberately.

## The queue stays small; the archive stays complete

Files are never deleted — terminal statuses and cross-links are the archive — but the *actionable* queue is deliberately kept short (RES-006, drawing on Shape Up's warning against treating a giant backlog as standing obligation). Deferrals carry kill criteria: an insight still unframed after two triage passes or ~60 days is rejected rather than carried as backlog debt. Accepting an idea doesn't automatically create a task today; tasks exist only when they're useful next work.

## Every decision leaves its reason

The repo is the tracker — there is no external system preserving discussion — so rationale must live in the files (RES-006). Rejections record why (the reason is the value: it prevents re-litigating the idea), `wontfix` requires a written reason, deferrals state what would change the decision, and the heartbeat ledger records even the rules it *skipped* and why. The audit trail is the mechanism that lets agents work autonomously without silently losing judgment calls.

## The human sits exactly at the product boundary

Agents run everything end to end, but insight acceptance/rejection is a **proposal** until the owner confirms — while issue confirmation and severity need no approval, because reproducing a bug is factual, not a judgment call (processes/triage.md). That line comes from RES-011: keep human judgment at the product boundary, let agents own the mechanical and evidential parts. Same logic marks owner dogfooding honestly as n=1 evidence rather than treating it as user research.

## Cadence is derived, never counted

Processes say "every ~5 shipped tasks" (QA) and "~10" (knowledge sweep), but no counter is maintained — the heartbeat derives everything from git log and file statuses at beat time, schedules due hygiene as ordinary tasks, and never executes heavy work itself. Thresholds are ceilings, not quotas: a borderline "due" with nothing meaningful to inspect is a recorded skip (processes/heartbeat.md).

## Why it compounds

Each pass feeds forward instead of evaporating: QA reviews end in triage-ready filed items, research must land in explicit outcomes (implemented, filed, rejected, or deferred — audited by the maintenance sweep), stale knowledge becomes decisions rather than rot, and the wiki lint keeps this synthesis layer honest against its sources. The loop's output is not just shipped code — it's a repo whose recorded judgment gets denser every cycle.
