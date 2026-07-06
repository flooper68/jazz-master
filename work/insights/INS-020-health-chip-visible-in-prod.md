---
id: INS-020
title: Health chip renders in production builds — gate to dev or promote before deploy
status: accepted
outcome: [TASK-024]
created: 2026-07-06
source: TASK-023 review
---

`HealthFooter` (TASK-023) is a fixed bottom-right "API: ok HH:MM:SS" chip rendered
from `__root.tsx` on every SPA view, including layered over the onboarding wizard.
That was in-spec ("a visible SPA element"), but nothing gates it to dev, so after
TASK-024 every end user sees permanent API-status scaffolding.

Before (or as part of) TASK-024: either gate the chip to dev builds
(`import.meta.env.DEV`) or deliberately promote it to a real, designed status
surface. Deleting it outright would orphan the "visible element renders the health
response" contract, so keep *some* dev-visible rendering of the typed response —
it is what pins the client↔server type contract in a place typecheck can see.
