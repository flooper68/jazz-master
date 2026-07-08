---
id: INS-035
title: Toggle between staff / TAB / both in the practice runner
status: accepted
outcome: [TASK-048]
created: 2026-07-07
source: NOTE-009
---

Owner testing feedback (NOTE-009, captured without grilling — small and
clear): the runner should let the player toggle what the notation shows —
staff only, TAB only, or both — to reclaim space when one system isn't
needed. Today `<Notation>` always renders the aligned staff + tablature pair
(TASK-037).

Why it matters to the practice loop: a player reading only TAB (or only
staff) pays the full vertical cost of both systems; with the score already
too small ([[INS-034]]), the unused system is the cheapest space to win back.
The toggle is also a natural preference to persist per player via the typed
stores (ADR-002).

Batch with the notation-sizing pass in [[INS-034]] — the toggle changes how
much vertical room the grown default rendering has to work with.

## Triage note

2026-07-08 heartbeat - Accepted into TASK-048 with INS-034. NOTE-011 confirmed
the toggle is part of the urgent notation readability fix.
