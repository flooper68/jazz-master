---
id: NOTE-016
title: Extract APSS into a public repository
created: 2026-07-09
source_type: chat
participants: [owner, agent]
processed: true
---

# NOTE-016 — Extract APSS into a public repository

## Context

Immediately after TASK-076 shipped the portable framework under Jazz Master's
`framework/apss/`, the owner decided the framework should live independently so
it can be reused and evolved outside one product repository.

## Decisions

- Create the public GitHub repository
  `flooper68/adaptive-problem-solving-systems` using the authenticated GitHub
  CLI.
- Keep its local checkout as a sibling of Jazz Master at
  `/Users/premylsciompa/dev_personal/adaptive-problem-solving-systems`.
- Move the framework package to the root of that repository.
- Jazz Master links to the public repository rather than vendoring or using a
  git submodule.
- Preserve Jazz Master's historical TASK-076 record, while updating current
  architecture/wiki/index references and TASK-077 to use the external source.

## Extracted work

- TASK-078 — publish APSS separately and replace Jazz Master's local framework
  copy with external links.
