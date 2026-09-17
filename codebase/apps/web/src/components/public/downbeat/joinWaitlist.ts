import { createTRPCClient, httpLink } from '@trpc/client'
import type { AppRouter } from '../../../server/trpc/router'

export interface WaitlistEntry {
  email: string
  goal?: string
}

export type JoinWaitlist = (entry: WaitlistEntry) => Promise<boolean>

/** Join the beta waitlist over tRPC. True when the address is on the list. */
export const joinWaitlist: JoinWaitlist = async (entry) => {
  const client = createTRPCClient<AppRouter>({ links: [httpLink({ url: '/trpc' })] })
  const result = await client.waitlist.join.mutate(entry)
  return result.status === 'ok'
}
