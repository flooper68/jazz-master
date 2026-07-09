import { router } from './init'
import { auth } from './routers/auth'
import { planner } from './routers/planner'
import { profile } from './routers/profile'
import { sessions } from './routers/sessions'
import { dbSmoke, health } from './routers/system'
import { users } from './routers/users'

// `health` mounts at the root (not under a `system.` prefix) so the endpoint
// is literally GET /trpc/health, per TASK-023's acceptance criteria.
export const appRouter = router({
  health,
  dbSmoke,
  auth,
  planner,
  profile,
  sessions,
  users,
})

export type AppRouter = typeof appRouter
