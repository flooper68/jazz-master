import { z } from 'zod'
import { publicProcedure } from '../init'

// Zod on both boundaries establishes the validation pattern for future
// procedures (RES-002 rec 4). The output schema is the wire contract the
// SPA's typecheck hangs off — see the type-contract criterion in TASK-023.
export const healthOutput = z.object({
  status: z.literal('ok'),
  time: z.iso.datetime(),
})

export const health = publicProcedure
  .input(z.void())
  .output(healthOutput)
  .query(() => ({
    status: 'ok' as const,
    time: new Date().toISOString(),
  }))
