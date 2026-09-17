import { createFileRoute } from '@tanstack/react-router'
import SessionPage from '../pages/SessionPage'

export const Route = createFileRoute('/session')({
  // `x` names the session's exercises, comma-separated and in playing order,
  // so a reload keeps the same draw; `r` names the routine they came from, if any.
  validateSearch: (search: Record<string, unknown>): { x: string; r?: string } => ({
    x: typeof search.x === 'string' ? search.x : '',
    ...(typeof search.r === 'string' && search.r.length > 0 ? { r: search.r } : {}),
  }),
  component: SessionPage,
})
