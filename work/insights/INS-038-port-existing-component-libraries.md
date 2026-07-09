---
id: INS-038
title: Port existing component libraries from prior projects
status: new
created: 2026-07-09
source: NOTE-014
---

The project may benefit from porting existing component libraries from the
owner's previous projects instead of rebuilding every reusable UI primitive from
scratch.

Why it might matter: prior components could accelerate Jazz Master's UI system
and preserve design decisions that already worked elsewhere. Triage needs to
evaluate whether those components fit this stack, product tone, accessibility
bar, Tailwind v4 setup, and long-term maintenance model.

## Product framing

Current condition: Jazz Master has local reusable components, but no explicit
plan for importing prior-project component libraries.

Desired condition: useful prior components are assessed, adapted where they fit,
and either incorporated into the Jazz Master UI system or intentionally rejected.

Affected user/workflow: agents building UI; indirectly, guitarists using any
workflow built from shared components.

Evidence: owner identified prior component libraries as a desired future source
for UI work.

Validation need: research/spike
