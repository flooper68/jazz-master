---
id: ISSUE-009
title: Playwright e2e smoke suite still expects pre-Clerk flows
status: open
severity: major
created: 2026-07-09
source: TASK-067 verification
---

# ISSUE-009 - Playwright e2e smoke suite still expects pre-Clerk flows

## Steps to reproduce

Run the browser smoke pack against the local app with Postgres and Hyperdrive
emulation configured:

```sh
CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE=postgresql://jazz_master:jazz_master@127.0.0.1:55432/jazz_master DATABASE_URL=postgresql://jazz_master:jazz_master@127.0.0.1:55432/jazz_master bun run --cwd codebase check:e2e
```

## Expected

The smoke suite uses a supported test-auth path or Clerk-aware fixtures, then
verifies the current public landing page and authenticated practice workflows.

## Actual

All six Playwright smoke tests fail before reaching the workflows under test:

- the landing smoke test waits for the old `Jazz Master` heading;
- authenticated app tests wait for the removed pre-Clerk `Skip for now`
  onboarding button.

## Notes

Found while verifying TASK-067. This is major because the git workflow asks
agents to run the e2e pack before pushes that touch practice, routing, or
storage, but the suite no longer represents the current Clerk-protected app
after the auth and landing changes.
