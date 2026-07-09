import { router } from './init'
import { auth } from './routers/auth'
import { mockPractice } from './routers/mockPractice'
import { dbSmoke, health } from './routers/system'

// `health` mounts at the root (not under a `system.` prefix) so the endpoint
// is literally GET /trpc/health, per TASK-023's acceptance criteria.
export const appRouter = router({
  health,
  dbSmoke,
  auth,
  mockPractice,
})

export type AppRouter = typeof appRouter
