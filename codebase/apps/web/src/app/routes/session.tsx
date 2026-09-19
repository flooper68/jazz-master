import { createFileRoute } from '@tanstack/react-router'
import { LONGEST_SESSION_MINUTES } from '../../appData/quickRun'
import SessionPage from '../pages/SessionPage'

export const Route = createFileRoute('/session')({
  // `x` names the session's exercises, comma-separated and in playing order,
  // so a reload keeps the same draw; `m` is how long the plan was expected to
  // take, which the run clock counts against. Anybody can write this URL, so a
  // length that is not a sane number of minutes is read as no length at all.
  validateSearch: (search: Record<string, unknown>): { x: string; m?: number } => {
    const minutes = Number(search.m)
    return {
      x: typeof search.x === 'string' ? search.x : '',
      ...(Number.isInteger(minutes) && minutes >= 1 && minutes <= LONGEST_SESSION_MINUTES ? { m: minutes } : {}),
    }
  },
  component: SessionPage,
})
