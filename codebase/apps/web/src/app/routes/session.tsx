import { createFileRoute } from '@tanstack/react-router'
import SessionPage from '../pages/SessionPage'

export const Route = createFileRoute('/session')({
  // `x` names the session's exercises, comma-separated and in playing order,
  // so a reload keeps the same draw.
  validateSearch: (search: Record<string, unknown>): { x: string } => ({
    x: typeof search.x === 'string' ? search.x : '',
  }),
  component: SessionPage,
})
