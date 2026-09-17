import { useEffect, useState } from 'react'
import type { ClerkLike, ClerkUser } from './clerkTypes'

export interface ClerkAccount {
  /** Null until Clerk has loaded in this page. */
  clerk: ClerkLike | null
  user: ClerkUser | null
  /** Bumps whenever Clerk reports a change, so a component re-reads the (mutable) user. */
  revision: number
}

/** The signed-in user, from `window.Clerk`, kept current as Clerk reports changes. */
export function useClerkUser(): ClerkAccount {
  const [account, setAccount] = useState<ClerkAccount>({ clerk: null, user: null, revision: 0 })

  useEffect(() => {
    let stop: (() => void) | undefined
    let timer: number | undefined
    const attach = () => {
      const clerk = window.Clerk
      if (!clerk?.loaded) {
        timer = window.setTimeout(attach, 120)
        return
      }
      setAccount((was) => ({ clerk, user: clerk.user ?? null, revision: was.revision + 1 }))
      stop = clerk.addListener?.(({ user }) => setAccount((was) => ({ clerk, user: user ?? null, revision: was.revision + 1 })))
    }
    attach()
    return () => {
      window.clearTimeout(timer)
      stop?.()
    }
  }, [])

  return account
}
