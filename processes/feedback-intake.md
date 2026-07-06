# Process: feedback intake

Turns raw observations into the right durable artifact without deciding priority too early. Use this when the owner reports a bug, drops a note, shares user feedback, or asks an agent to capture product observations.

## Sources

- Owner notes, chats, calls, and meeting summaries
- User feedback, support comments, or external bug reports
- Agent observations while using or reviewing the app
- Security/privacy concerns noticed during implementation or QA
- Grill session transcripts and routed questions (`processes/grilling.md`)

## Route each fragment

| Source fragment | Output |
|---|---|
| Reproducible product defect | `work/issues/ISSUE-###` |
| Product idea, opportunity, friction, or unmet user need | `work/insights/INS-###` |
| One-session implementation unit already agreed by the owner | `work/tasks/TASK-###` |
| Pillar-sized product area | propose an epic; agents create epics only when asked |
| Security/privacy concern | `work/issues/ISSUE-###` if concrete, otherwise `work/insights/INS-###` |
| System-shaping technical decision | `architecture/decisions/ADR-###` or a task to write one |
| Raw context worth preserving | `notes/NOTE-###` |

## Steps

1. Capture the source faithfully enough that a future reader can understand the context.
2. Split mixed feedback into separate fragments; one note can yield several issues, insights, or tasks.
3. Search `work/`, `notes/`, `research/`, and `architecture/` for duplicates before creating new files.
4. Create the smallest correct artifact:
   - Issues include steps to reproduce, expected result, actual result, and environment if known.
   - Insights state why the observation might matter to the practice loop.
   - Notes preserve discussion, decisions, unresolved questions, and extracted work.
5. Link provenance both ways where useful: the new item references the source note, and the note lists extracted work.
6. Do not prioritize or implement during intake unless the owner explicitly asked for the work item itself.

## Output

- New or updated `NOTE-###`, `INS-###`, `ISSUE-###`, or `TASK-###` files.
- A short summary of what was captured and what still needs triage.

## Notes

Raw feedback is cheap to capture, but it is not work until triaged. Run `processes/triage.md` for fresh insights/issues and `processes/knowledge-maintenance.md` when notes, research, and architecture may need a wider sweep.

One exception (ADR-008): decisions the owner makes mid-grill are applied directly to the artifact under discussion, in-session, with the diff reviewed — they do not wait for triage. The transcript still lands here as a `NOTE-###` (`source_type: grill-session`); everything else a grill surfaces routes through this process as usual.
