import { router } from './init'
import { auth } from './routers/auth'
import { exercises } from './routers/exercises'
import { goals } from './routers/goals'
import { notes } from './routers/notes'
import { player } from './routers/player'
import { runs } from './routers/runs'
import { clerkKeys, dbSmoke, health } from './routers/system'
import { users } from './routers/users'
import { waitlist } from './routers/waitlist'

// `health` mounts at the root (not under a `system.` prefix) so the endpoint
// is literally GET /trpc/health, per TASK-023's acceptance criteria.
export const appRouter = router({
  health,
  dbSmoke,
  clerkKeys,
  auth,
  exercises,
  goals,
  notes,
  player,
  runs,
  users,
  waitlist,
})

export type AppRouter = typeof appRouter
