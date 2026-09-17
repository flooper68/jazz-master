import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { APP_HOME, authErrorMessage, readAuthSettings, safeRedirectPath, whenClerkReady, type AuthSettings, type SocialProvider } from './clerkBrowser'
import type { ClerkLike } from './clerkTypes'

/** How a screen gets Clerk and leaves when it is done; both replaceable in tests and Storybook. */
export interface AuthFlowProps {
  loadClerk?: () => Promise<ClerkLike>
  navigate?: (path: string) => void
}

export interface AuthSession {
  clerk: ClerkLike | null
  settings: AuthSettings
  /** Where to go once signed in. */
  redirect: string
  /** Clerk never arrived (offline, blocked script). */
  loadError: string | null
  navigate: (path: string) => void
}

const FALLBACK_SETTINGS = readAuthSettings(undefined)

/** Load Clerk once, read what it allows, and leave at once if someone is already signed in. */
export function useAuthSession({ loadClerk = whenClerkReady, navigate = (path) => window.location.assign(path) }: AuthFlowProps): AuthSession {
  const [clerk, setClerk] = useState<ClerkLike | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [redirect, setRedirect] = useState(APP_HOME)

  useEffect(() => {
    let live = true
    const target = safeRedirectPath(window.location.search, window.location.origin)
    setRedirect(target)
    loadClerk().then(
      (loaded) => {
        if (!live) return
        const onCallback = window.location.pathname.endsWith('/sso-callback')
        if (loaded.user && !onCallback) navigate(target)
        else setClerk(loaded)
      },
      (error: unknown) => live && setLoadError(authErrorMessage(error)),
    )
    return () => {
      live = false
    }
    // Once per mount: the loader and the navigator are fixed for a screen's life.
  }, [])

  return { clerk, settings: clerk ? readAuthSettings(clerk.__unstable__environment) : FALLBACK_SETTINGS, redirect, loadError, navigate }
}

export function AuthCard({ title, lede, children }: { title: string; lede?: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 px-6 py-4">
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-2xl font-semibold tracking-[-0.02em]">{title}</h2>
        {lede && <p className="text-[15px] leading-relaxed text-fg-2">{lede}</p>}
      </div>
      {children}
    </div>
  )
}

const INPUT =
  'w-full rounded-md border border-line-strong bg-field px-3.5 py-3 text-base text-fg placeholder:text-muted focus-visible:border-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60'

interface FieldProps {
  label: string
  name: string
  type?: string
  autoComplete?: string
  required?: boolean
  defaultValue?: string
  minLength?: number
  hint?: string
  autoFocus?: boolean
}

export function Field({ label, hint, ...input }: FieldProps) {
  return (
    <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
      {label}
      <input {...input} className={INPUT} />
      {hint && <span className="text-xs font-normal text-muted">{hint}</span>}
    </label>
  )
}

/** The code from an email or an authenticator app. */
export function CodeField({ label = 'Code' }: { label?: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
      {label}
      <input name="code" inputMode="numeric" autoComplete="one-time-code" required autoFocus maxLength={12} className={`${INPUT} font-mono text-xl tracking-[0.3em]`} />
    </label>
  )
}

export function Submit({ busy, children }: { busy: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-accent px-5 py-3.5 text-[15px] leading-none font-semibold text-on-accent transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
    >
      <span className="size-2 rounded-full bg-current" aria-hidden="true" />
      {busy ? 'One moment' : children}
    </button>
  )
}

export function TextButton({ onClick, children, disabled }: { onClick: () => void; children: ReactNode; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="text-left text-[13px] font-medium text-fg-2 underline decoration-line-strong underline-offset-4 hover:text-fg disabled:opacity-60">
      {children}
    </button>
  )
}

export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className="rounded-md border border-danger/40 bg-danger-soft px-3.5 py-3 text-[14px] leading-snug text-danger-text">
      {message}
    </p>
  )
}

export function SocialButtons({ providers, verb, onChoose, disabled }: { providers: SocialProvider[]; verb: string; onChoose: (provider: SocialProvider) => void; disabled: boolean }) {
  if (providers.length === 0) return null
  return (
    <div className="flex flex-col gap-3">
      {providers.map((provider) => (
        <button
          key={provider.strategy}
          type="button"
          disabled={disabled}
          onClick={() => onChoose(provider)}
          className="inline-flex w-full items-center justify-center rounded-md border border-line-strong px-5 py-3.5 text-[15px] leading-none font-semibold hover:bg-panel-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
        >
          {verb} with {provider.name}
        </button>
      ))}
      <p className="flex items-center gap-3 font-mono text-xs tracking-[0.1em] text-muted uppercase before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">or</p>
    </div>
  )
}

/** Links under a form: the other screen, and Clerk's own form as a way out if ours cannot serve an account. */
export function AuthFooter({ question, action, href, classicHref }: { question: string; action: string; href: string; classicHref: string }) {
  return (
    <div className="flex flex-col gap-2 border-t border-line pt-4 text-[13px] text-muted">
      <p>
        {question}{' '}
        <a href={href} className="font-semibold text-fg underline underline-offset-4">
          {action}
        </a>
      </p>
      <p>
        Something not working?{' '}
        <a href={classicHref} className="underline underline-offset-4 hover:text-fg">
          Use the standard form
        </a>
      </p>
    </div>
  )
}

/** Read a form's fields as strings, trimmed — except passwords, where a space is a character like any other. */
export function formValues(event: FormEvent<HTMLFormElement>): Record<string, string> {
  event.preventDefault()
  const values: Record<string, string> = {}
  new FormData(event.currentTarget).forEach((value, key) => {
    const text = typeof value === 'string' ? value : ''
    values[key] = key.toLowerCase().includes('password') ? text : text.trim()
  })
  return values
}
