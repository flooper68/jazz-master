import { useEffect, useState } from 'react'
import { formatSeconds } from '../player/formatting'

/**
 * How long this practice run has been going, against how long it was meant to
 * take. It is wall-clock time from the first stage appearing — not the sum of
 * the exercises' playing time — because the question it answers is "how long
 * have I been at this?", and the budget the plan was cut to counts the reading
 * and the picking-up as well (PLAN_CONSTANTS.exerciseOverheadSeconds).
 *
 * It ticks in its own component so the second hand never re-renders the stage
 * or the player under it.
 */
export function RunClock({ startedAt, plannedSeconds, now = Date.now }: RunClockProps) {
  const [elapsed, setElapsed] = useState(() => secondsSince(startedAt, now()))
  useEffect(() => {
    setElapsed(secondsSince(startedAt, now()))
    const tick = setInterval(() => setElapsed(secondsSince(startedAt, now())), 1000)
    return () => clearInterval(tick)
  }, [startedAt, now])

  return (
    <span className="tabular-nums" aria-label={`Practice run: ${runClockLabel(elapsed, plannedSeconds)}`}>
      {runClockLabel(elapsed, plannedSeconds)}
    </span>
  )
}

interface RunClockProps {
  /** When the run began, in epoch milliseconds. */
  startedAt: number
  /** What the plan was expected to take; null when nothing planned this run — one exercise started on its own. */
  plannedSeconds: number | null
  /** Test seam: the wall clock. */
  now?: () => number
}

/** "7:20" on its own, or "7:20 of ~20 min" when the run was planned to a length. */
export function runClockLabel(elapsedSeconds: number, plannedSeconds: number | null): string {
  const elapsed = formatSeconds(elapsedSeconds)
  if (plannedSeconds === null) return elapsed
  return `${elapsed} of ~${Math.max(Math.round(plannedSeconds / 60), 1)} min`
}

function secondsSince(startedAt: number, now: number): number {
  // A clock that went backwards (a device resync mid-run) reads zero, never negative.
  return Math.max(Math.floor((now - startedAt) / 1000), 0)
}
