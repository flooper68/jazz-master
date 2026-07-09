import { router } from './init'
import { mockPractice } from './routers/mockPractice'
import { dbSmoke, health } from './routers/system'

// `health` mounts at the root (not under a `system.` prefix) so the endpoint
// is literally GET /trpc/health, per TASK-023's acceptance criteria.
export const appRouter = router({
  health,
  dbSmoke,
  mockPractice,
})

export type AppRouter = typeof appRouter
