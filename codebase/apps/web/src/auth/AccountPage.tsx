import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { PAGE_READING } from '../components/pageFrame'
import { Button, Card, Input } from '../components/ui/Primitives'
import { ErrorNote, formValues } from './authUi'
import { authErrorMessage } from './clerkBrowser'
import type { ClerkDeviceSession } from './clerkTypes'
import { useClerkUser } from './useClerkUser'

/**
 * Account settings, in the app's own words and shapes instead of Clerk's
 * profile screen: your name, your password, the devices you are signed in
 * on, and deleting the account. Clerk still does the work behind each form.
 */

const CONFIRM_DELETE = 'DELETE'

function Section({ title, about, children }: { title: string; about: string; children: ReactNode }) {
  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-lg font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-fg-2">{about}</p>
      </div>
      {children}
    </Card>
  )
}

function Labelled({ label, children }: { label: string; children: ReactNode }) {
  return <label className="flex flex-col gap-1.5 text-[13px] font-semibold">{label}{children}</label>
}

/** One form's state: busy while it saves, then either what went wrong or that it is saved. */
function useSaving() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const run = async (work: () => Promise<unknown>, done: string) => {
    setBusy(true)
    setError(null)
    setSaved(null)
    try {
      await work()
      setSaved(done)
    } catch (caught) {
      setError(authErrorMessage(caught))
    } finally {
      setBusy(false)
    }
  }
  return { busy, error, saved, run }
}

function Saved({ message }: { message: string | null }) {
  return message ? (
    <p role="status" className="text-sm font-medium text-success-text">
      {message}
    </p>
  ) : null
}

function describeDevice(device: ClerkDeviceSession): string {
  const activity = device.latestActivity
  const what = [activity?.browserName, activity?.deviceType].filter(Boolean).join(' on ') || 'A browser'
  const where = [activity?.city, activity?.country].filter(Boolean).join(', ')
  return where ? `${what} · ${where}` : what
}

function lastActive(device: ClerkDeviceSession): string {
  if (!device.lastActiveAt) return ''
  return new Date(device.lastActiveAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

/** `deleteAppData` removes what the app saved under this user; it runs, and must succeed, before Clerk deletes the user. */
export default function AccountPage({ deleteAppData }: { deleteAppData: () => Promise<void> }) {
  const { clerk, user, revision } = useClerkUser()
  const profile = useSaving()
  const password = useSaving()
  const devicesState = useSaving()
  const removal = useSaving()
  const [devices, setDevices] = useState<ClerkDeviceSession[] | null>(null)

  useEffect(() => {
    let live = true
    user
      ?.getSessions?.()
      .then((found) => live && setDevices(found.filter((device) => !device.status || device.status === 'active')))
      .catch(() => live && setDevices([]))
    return () => {
      live = false
    }
  }, [user, revision])

  if (!clerk) {
    return (
      <div className={PAGE_READING}>
        <h1 className="font-display text-2xl font-bold tracking-tight">Account</h1>
        <p className="mt-6 text-sm text-muted" role="status">
          Loading your account…
        </p>
      </div>
    )
  }
  if (!user) {
    return (
      <div className={PAGE_READING}>
        <h1 className="font-display text-2xl font-bold tracking-tight">Account</h1>
        <p className="mt-6 text-sm text-fg-2">Account settings are available once you are signed in.</p>
      </div>
    )
  }

  const email = user.primaryEmailAddress?.emailAddress ?? ''

  const saveProfile = (event: FormEvent<HTMLFormElement>) => {
    const { firstName, lastName } = formValues(event)
    void profile.run(async () => user.update?.({ firstName, lastName }), 'Saved.')
  }

  const savePassword = (event: FormEvent<HTMLFormElement>) => {
    const form = event.currentTarget
    const { currentPassword, newPassword } = formValues(event)
    void password.run(async () => {
      await user.updatePassword?.({ ...(user.passwordEnabled ? { currentPassword } : {}), newPassword, signOutOfOtherSessions: true })
      form.reset()
    }, 'Password changed. Your other devices were signed out.')
  }

  const signOutDevice = (device: ClerkDeviceSession) =>
    void devicesState.run(async () => {
      await device.revoke()
      setDevices((was) => was?.filter((other) => other.id !== device.id) ?? null)
    }, 'Signed out of that device.')

  const deleteAccount = (event: FormEvent<HTMLFormElement>) => {
    const { confirm } = formValues(event)
    if (confirm !== CONFIRM_DELETE) return
    void removal.run(async () => {
      await deleteAppData()
      await user.delete?.()
      window.location.assign('/')
    }, 'Your account is deleted.')
  }

  return (
    <div className={PAGE_READING}>
      <h1 className="font-display text-2xl font-bold tracking-tight">Account</h1>
      <p className="mt-1 text-sm text-fg-2">{email}</p>

      <div className="mt-6 flex flex-col gap-4">
        <Section title="Your name" about="How the app greets you. Nobody else sees it.">
          <form onSubmit={saveProfile} className="flex flex-col gap-4" aria-busy={profile.busy}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Labelled label="First name">
                <Input name="firstName" autoComplete="given-name" defaultValue={user.firstName ?? ''} />
              </Labelled>
              <Labelled label="Last name">
                <Input name="lastName" autoComplete="family-name" defaultValue={user.lastName ?? ''} />
              </Labelled>
            </div>
            <ErrorNote message={profile.error} />
            <div className="flex items-center gap-4">
              <Button type="submit" disabled={profile.busy}>
                Save name
              </Button>
              <Saved message={profile.saved} />
            </div>
          </form>
        </Section>

        <Section
          title={user.passwordEnabled ? 'Change your password' : 'Set a password'}
          about={user.passwordEnabled ? 'Changing it signs you out everywhere else.' : 'You sign in without a password today. Set one to sign in with it too.'}
        >
          <form onSubmit={savePassword} className="flex flex-col gap-4" aria-busy={password.busy}>
            <input type="hidden" name="username" autoComplete="username" value={email} readOnly />
            <div className="grid gap-4 sm:grid-cols-2">
              {user.passwordEnabled && (
                <Labelled label="Current password">
                  <Input name="currentPassword" type="password" autoComplete="current-password" required />
                </Labelled>
              )}
              <Labelled label="New password">
                <Input name="newPassword" type="password" autoComplete="new-password" required minLength={8} />
              </Labelled>
            </div>
            <ErrorNote message={password.error} />
            <div className="flex items-center gap-4">
              <Button type="submit" disabled={password.busy}>
                {user.passwordEnabled ? 'Change password' : 'Set password'}
              </Button>
              <Saved message={password.saved} />
            </div>
          </form>
        </Section>

        <Section title="Where you are signed in" about="Sign out of a device you no longer use.">
          {devices === null ? (
            <p className="text-sm text-muted" role="status">
              Looking…
            </p>
          ) : (
            <ul className="divide-y divide-line rounded-xl border border-line">
              {devices.map((device) => {
                const here = device.id === clerk.session?.id
                return (
                  <li key={device.id} className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {describeDevice(device)}
                        {here && <span className="ml-2 rounded-full bg-warning-soft px-2 py-0.5 text-[11px] font-medium text-accent-text">This device</span>}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">Last active {lastActive(device)}</p>
                    </div>
                    {!here && (
                      <Button variant="secondary" disabled={devicesState.busy} onClick={() => signOutDevice(device)}>
                        Sign out
                      </Button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
          <ErrorNote message={devicesState.error} />
          <Saved message={devicesState.saved} />
        </Section>

        <Section title="Delete your account" about="Removes your account and everything you saved: your exercises, goals and history. This cannot be undone.">
          <form onSubmit={deleteAccount} className="flex flex-col gap-4" aria-busy={removal.busy}>
            <Labelled label={`Type ${CONFIRM_DELETE} to confirm`}>
              <Input name="confirm" autoComplete="off" required pattern={CONFIRM_DELETE} className="sm:max-w-xs" />
            </Labelled>
            <ErrorNote message={removal.error} />
            <div>
              <Button type="submit" variant="secondary" disabled={removal.busy} className="border-danger/50 text-danger-text hover:border-danger">
                Delete my account
              </Button>
            </div>
          </form>
        </Section>
      </div>
    </div>
  )
}
