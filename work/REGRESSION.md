# Regression Pack

Living manual/browser regression checklist for Jazz Master. Maintained by
`processes/regression-testing.md`.

## Status

Pending first compile/run. The next heartbeat should schedule a normal task to
compile this pack from completed product tasks and run the P0 browser scenarios.

## Global Setup

To be filled by the first regression-testing task.

Expected baseline commands:

```sh
bun run --cwd codebase check
bun run --cwd codebase check:e2e
bun run --cwd codebase dev
```

## Scenario Table

| ID | Priority | Area | Source tasks | Preconditions | Steps | Expected result | Failure evidence |
|---|---|---|---|---|---|---|---|
| PENDING | P0 | Core practice loop | Completed product tasks | First compile pending | Compile from task Verification sections | Repeatable browser steps exist | File setup gap if blocked |

## Run Matrix

To be filled by the first regression-testing task.

## Latest Run

No completed regression run yet.
