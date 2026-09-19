import { useEffect, useId, useRef, useState } from 'react'
import { PersonIcon, SignOutIcon, SlidersIcon, ThemeIcon } from '../components/icons'
import { PlayerSettingsPanel } from '../components/PlayerSettingsPanel'
import { setPlayerPrefs } from '../components/playerPrefs'
import type { Theme } from '../components/theme'
import { usePlayerPrefs } from '../components/usePlayerPrefs'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Primitives'
import type { ClerkUser } from './clerkTypes'
import { useClerkUser } from './useClerkUser'

/**
 * The account control of the app shell: who is signed in, the theme, the way
 * to the account page, and the way out. Ours rather than Clerk's UserButton;
 * Clerk is only asked for the user and to sign out.
 */

function displayName(user: ClerkUser | null): string {
  return user?.fullName || user?.firstName || user?.username || user?.primaryEmailAddress?.emailAddress || 'Account'
}

const ITEM = 'w-full gap-2.5 text-fg'

export function AccountMenu({
  theme,
  onToggleTheme,
  onOpenAccount,
  showName,
  stubName,
}: {
  theme: Theme
  onToggleTheme: () => void
  onOpenAccount: () => void
  showName: boolean
  /** Local dev and e2e sign in without Clerk: who the menu says you are. */
  stubName?: string
}) {
  const { clerk, user } = useClerkUser()
  const [open, setOpen] = useState(false)
  // The player's own sound and view choices, reachable when no player is open.
  const [settingsOpen, setSettingsOpen] = useState(false)
  const prefs = usePlayerPrefs()
  const root = useRef<HTMLDivElement | null>(null)
  // The menu item that opens the settings is gone by the time they close, so
  // focus goes back to the account button that opened the menu.
  const trigger = useRef<HTMLButtonElement | null>(null)
  const menuId = useId()
  const name = user ? displayName(user) : (stubName ?? displayName(user))
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
        ref={trigger}
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
            <Button
              variant="quiet"
              align="start"
              role="menuitem"
              className={ITEM}
              onClick={() => {
                setOpen(false)
                onOpenAccount()
              }}
            >
              <PersonIcon />
              Account
            </Button>
            <Button
              variant="quiet"
              align="start"
              role="menuitem"
              className={ITEM}
              onClick={() => {
                setOpen(false)
                setSettingsOpen(true)
              }}
            >
              <SlidersIcon />
              Player settings
            </Button>
            <Button variant="quiet" align="start" role="menuitem" className={ITEM} onClick={onToggleTheme}>
              <ThemeIcon dark={theme !== 'dark'} />
              {theme === 'dark' ? 'Light theme' : 'Dark theme'}
            </Button>
            <Button variant="quiet" align="start" role="menuitem" className={ITEM} disabled={!clerk} onClick={() => void clerk?.signOut({ redirectUrl: '/' })}>
              <SignOutIcon />
              Sign out
            </Button>
          </div>
        </div>
      )}

      {settingsOpen && (
        <Modal
          title="Player settings"
          description="What the player sounds like and what it shows. They hold for every exercise, and the player's own Advanced panel sets the same ones."
          onClose={() => setSettingsOpen(false)}
          returnFocusTo={trigger}
        >
          <PlayerSettingsPanel prefs={prefs} onPrefsChange={setPlayerPrefs} />
        </Modal>
      )}
    </div>
  )
}
