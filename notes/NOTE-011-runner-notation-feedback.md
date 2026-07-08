---
id: NOTE-011
title: Runner, notation, and navigation feedback
created: 2026-07-08
source_type: owner-note
participants: [owner, agent]
processed: true
---

# NOTE-011 - Runner, notation, and navigation feedback

## Context

Owner feedback during a heartbeat/grooming request after play-along controls
landed and recording capture work was already in progress.

## Discussion

- The lesson timer should start only after the user presses Play in a lesson.
  Entering the lesson should not begin counting down.
- Some exercise durations are too long; four minutes is too much for some of
  the current exercises.
- The self-grade choices ("Got it", "Shaky", etc.) should appear automatically
  in a dialog after playback finishes, or when the user hits Next.
- Playback needs volume controls, separately for metronome/click and guitar.
- The play-along tempo ceiling is currently too low for authored 60 BPM
  exercises. It should go to 200 BPM by default.
- The notation fullscreen problem and the staff/TAB/notes toggle problem are a
  "really big problem" and should be solved ASAP.
- Empty or placeholder pages are confusing and should be removed or hidden for
  now.

## Decisions

- Treat notation fullscreen plus staff/TAB display modes as the top product
  priority coming out of this heartbeat.
- Treat the other points as product tasks, not vague insights: they are direct
  owner feedback about the active practice workflow.

## Action items

- Promote INS-034 and INS-035 into a high-priority notation task.
- Create runner-flow, audio-control, and placeholder-page cleanup tasks.
- Run the normal heartbeat cadence check and reprioritize against the current
  queue.

## Extracted work

- TASK-048
- TASK-049
- TASK-050
- TASK-051
- TASK-052
- TASK-053
- TASK-054
