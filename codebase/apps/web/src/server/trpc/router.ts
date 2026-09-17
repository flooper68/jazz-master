import { router } from './init'
import { auth } from './routers/auth'
import { exercises } from './routers/exercises'
import { routines } from './routers/routines'
import { runs } from './routers/runs'
import { clerkKeys, dbSmoke, health } from './routers/system'
import { users } from './routers/users'

// `health` mounts at the root (not under a `system.` prefix) so the endpoint
// is literally GET /trpc/health, per TASK-023's acceptance criteria.
export const appRouter = router({
  health,
  dbSmoke,
  clerkKeys,
  auth,
  exercises,
  routines,
  runs,
  users,
})

export type AppRouter = typeof appRouter
