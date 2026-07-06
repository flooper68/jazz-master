import { useQuery } from '@tanstack/react-query'
import { useTRPC } from './trpc'

// Proves the client↔server type contract end-to-end (TASK-023): the rendered
// fields come off the typed health procedure, so a server output change that
// isn't reflected here fails the typecheck. Lives in src/app/ (not
// components/) because it depends on the app-layer tRPC context.
export function HealthFooter() {
  const trpc = useTRPC()
  const health = useQuery(trpc.health.queryOptions())

  return (
    <footer
      aria-label="API health"
      className="fixed right-2 bottom-2 rounded bg-zinc-900/90 px-2 py-1 text-xs text-zinc-500"
    >
      {health.isPending && <span>API: checking…</span>}
      {health.isError && <span>API: unreachable</span>}
      {health.isSuccess && (
        <span>
          API: {health.data.status}{' '}
          <time dateTime={health.data.time}>
            {new Date(health.data.time).toLocaleTimeString()}
          </time>
        </span>
      )}
    </footer>
  )
}
