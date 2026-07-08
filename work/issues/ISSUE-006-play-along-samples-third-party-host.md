---
id: ISSUE-006
title: Play-along samples load from a third-party GitHub Pages host
status: confirmed
severity: minor
created: 2026-07-08
source: TASK-054
---

# ISSUE-006 - Play-along samples load from a third-party GitHub Pages host

## Steps to reproduce

1. Open the practice runner for a lesson with play-along controls.
2. Start play-along for an exercise whose samples are not already cached.
3. Inspect the network requests.

## Expected

Chosen sample assets are served from Jazz Master's own static assets, matching
ADR-011's decision to mirror proven sample files under app static assets and use
`CacheStorage` where available.

## Actual

`apps/web/src/audio/guitarSampler.ts` sets the sample base URL to
`https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/electric_guitar_jazz-mp3`.
First play therefore depends on GitHub Pages availability and sends the user's
sample requests to a third-party host. CacheStorage improves later loads when
available, but it does not remove the first-play dependency.

## Notes

Found during TASK-054 security/privacy review. TASK-046 intentionally shipped
HTTPS sample access with caching, but ADR-011 and RES-015 describe mirroring
the exact chosen range/source once proven. This remains minor because network
access is user-triggered, audio-only, and uses a public sample host, but it is
still unintended third-party product-path dependency for a local-first app.
