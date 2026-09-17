import type { ExerciseRun } from './run'

/** Runs of one calendar day, newest first, under the label the history shows. */
export interface HistoryDay {
  /** Local calendar day, `YYYY-MM-DD` — stable as a key. */
  day: string
  label: string
  runs: ExerciseRun[]
}

function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${String(date.getDate()).padStart(2, '0')}`
}

/** "Today", "Yesterday", otherwise the date — with the year once it is not this one. */
export function dayLabel(date: Date, now: Date): string {
  const key = dayKey(date)
  if (key === dayKey(now)) return 'Today'
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (key === dayKey(yesterday)) return 'Yesterday'
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  })
}

/** Group runs by the local day they started on; days and runs both newest first. */
export function groupRunsByDay(runs: readonly ExerciseRun[], now = new Date()): HistoryDay[] {
  const sorted = [...runs].sort(
    (a, b) => new Date(b.startedAt).valueOf() - new Date(a.startedAt).valueOf(),
  )
  const days: HistoryDay[] = []
  for (const run of sorted) {
    const started = new Date(run.startedAt)
    const day = dayKey(started)
    const last = days.at(-1)
    if (last?.day === day) last.runs.push(run)
    else days.push({ day, label: dayLabel(started, now), runs: [run] })
  }
  return days
}
