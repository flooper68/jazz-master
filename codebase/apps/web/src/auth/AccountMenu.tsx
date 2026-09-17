import { useEffect, useId, useRef, useState } from 'react'
import type { Theme } from '../components/theme'
import type { ClerkLike, ClerkUser } from './clerkTypes'

/**
 * The account control of the app shell: who is signed in, the theme, the way
 * to the account settings, and the way out. Ours rather than Clerk's
 * UserButton; Clerk is only asked for the user and to sign out.
 */

function useClerkUser(): { clerk: ClerkLike | null; user: ClerkUser | null } {
  const [state, setState] = useState<{ clerk: ClerkLike | null; user: ClerkUser | null }>({ clerk: null, user: null })

  useEffect(() => {
    let stop: (() => void) | undefined
    let timer: number | undefined
    const attach = () => {
      const clerk = window.Clerk
      if (!clerk?.loaded) {
        timer = window.setTimeout(attach, 120)
        return
      }
      setState({ clerk, user: clerk.user ?? null })
      stop = clerk.addListener?.(({ user }) => setState({ clerk, user: user ?? null }))
    }
    attach()
    return () => {
      window.clearTimeout(timer)
      stop?.()
    }
  }, [])

  return state
}

function displayName(user: ClerkUser | null): string {
  return user?.fullName || user?.firstName || user?.username || user?.primaryEmailAddress?.emailAddress || 'Account'
}

const ITEM = 'flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-sm font-medium hover:bg-panel-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent'

export function AccountMenu({ theme, onToggleTheme, showName }: { theme: Theme; onToggleTheme: () => void; showName: boolean }) {
  const { clerk, user } = useClerkUser()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement | null>(null)
  const menuId = useId()
  const name = displayName(user)
  const email = user?.primaryEmailAddress?.emailAddress

  useEffect(() => {
    if (!open) return
    const close = (event: PointerEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === 'Escape' : !root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  return (
    <div ref={root} className="relative min-w-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Account: ${name}`}
        onClick={() => setOpen((was) => !was)}
        className="flex max-w-full items-center gap-2.5 rounded-md p-1 text-left hover:bg-panel-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {user?.hasImage && user.imageUrl ? (
          <img src={user.imageUrl} alt="" className="size-7 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-panel-2 text-xs font-semibold text-fg-2" aria-hidden="true">
            {name.charAt(0).toUpperCase()}
          </span>
        )}
        {showName && <span className="hidden min-w-0 truncate text-sm font-medium md:block">{name}</span>}
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Account"
          className="absolute right-0 bottom-auto z-40 mt-2 w-60 rounded-xl border border-line bg-panel p-1.5 shadow-lg shadow-shade md:top-auto md:right-auto md:bottom-full md:left-0 md:mt-0 md:mb-2"
        >
          <div className="border-b border-line px-3 pt-2 pb-3">
            <p className="truncate text-sm font-semibold">{name}</p>
            {email && email !== name && <p className="truncate text-xs text-muted">{email}</p>}
          </div>
          <div className="flex flex-col pt-1.5">
            <button type="button" role="menuitem" className={ITEM} onClick={onToggleTheme}>
              {theme === 'dark' ? 'Light theme' : 'Dark theme'}
            </button>
            {clerk?.openUserProfile && (
              <button
                type="button"
                role="menuitem"
                className={ITEM}
                onClick={() => {
                  setOpen(false)
                  clerk.openUserProfile?.()
                }}
              >
                Account settings
              </button>
            )}
            <button type="button" role="menuitem" className={ITEM} disabled={!clerk} onClick={() => void clerk?.signOut({ redirectUrl: '/' })}>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
