import type { ClerkApiError, ClerkEnvironment, ClerkLike } from './clerkTypes'

/** Where a finished sign-in lands when nothing better was asked for. */
export const APP_HOME = '/app'
const REDIRECT_PARAM = 'redirect_url'

declare global {
  interface Window {
    Clerk?: ClerkLike
  }
}

/**
 * Clerk's browser instance, once it has loaded. The Astro integration puts it
 * on `window.Clerk`; this waits for it rather than importing Clerk, so the
 * screens stay free of it in tests and Storybook.
 */
export function whenClerkReady(timeoutMs = 20_000): Promise<ClerkLike> {
  return new Promise((resolve, reject) => {
    const started = Date.now()
    const look = () => {
      const clerk = window.Clerk
      if (clerk?.loaded && clerk.client) return resolve(clerk)
      if (Date.now() - started > timeoutMs) return reject(new Error('Sign-in is taking too long to load. Check your connection and reload the page.'))
      window.setTimeout(look, 60)
    }
    look()
  })
}

/**
 * The path to go to after signing in. Only a path on this site is honoured:
 * an absolute URL on our own origin is reduced to its path, anything else
 * (another origin, `//host`, `javascript:`) falls back to the app.
 */
export function safeRedirectPath(search: string, origin: string): string {
  const wanted = new URLSearchParams(search).get(REDIRECT_PARAM)
  if (!wanted) return APP_HOME
  try {
    const url = new URL(wanted, origin)
    if (url.origin !== origin) return APP_HOME
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return APP_HOME
  }
}

function isClerkError(value: unknown): value is { errors: ClerkApiError[] } {
  return typeof value === 'object' && value !== null && Array.isArray((value as { errors?: unknown }).errors)
}

const PLAIN_WORDS: Record<string, string> = {
  form_identifier_not_found: 'We could not find an account with that email.',
  form_password_incorrect: 'That password is not right. Try again, or reset it.',
  form_code_incorrect: 'That code is not right. Check the latest email and try again.',
  verification_expired: 'That code has expired. Ask for a new one.',
  form_identifier_exists: 'There is already an account with that email. Sign in instead.',
  form_password_pwned: 'That password has appeared in a data breach. Please choose a different one.',
  too_many_requests: 'Too many attempts. Wait a minute and try again.',
  session_exists: 'You are already signed in.',
}

/** What to tell the person, from whatever Clerk (or the network) threw. */
export function authErrorMessage(error: unknown): string {
  if (isClerkError(error) && error.errors.length > 0) {
    const [first] = error.errors
    return PLAIN_WORDS[first.code] ?? first.longMessage ?? first.message
  }
  if (error instanceof Error && error.message) return error.message
  return 'Something went wrong. Please try again.'
}

export function authErrorCode(error: unknown): string | null {
  return isClerkError(error) && error.errors.length > 0 ? error.errors[0].code : null
}

export interface SocialProvider {
  strategy: string
  name: string
}

/** Which ways of signing in and up this Clerk instance has switched on. */
export interface AuthSettings {
  passwordEnabled: boolean
  passwordRequired: boolean
  nameRequired: boolean
  usernameRequired: boolean
  social: SocialProvider[]
  /** `public`, or `restricted` / `waitlist` when sign-up is by invitation. */
  signUpMode: string
}

const KNOWN_NAMES: Record<string, string> = { github: 'GitHub', linkedin_oidc: 'LinkedIn', linkedin: 'LinkedIn', gitlab: 'GitLab', tiktok: 'TikTok', x: 'X' }

function providerName(strategy: string): string {
  const key = strategy.replace(/^oauth_/, '')
  return KNOWN_NAMES[key] ?? key.charAt(0).toUpperCase() + key.slice(1)
}

/** Read the instance's settings; with none to read, assume email and password, and nothing else. */
export function readAuthSettings(environment: ClerkEnvironment | undefined): AuthSettings {
  const attributes = environment?.userSettings?.attributes
  const password = attributes?.password
  const social = Object.entries(environment?.userSettings?.social ?? {})
    .filter(([, provider]) => provider?.enabled)
    .map(([key, provider]) => {
      const strategy = provider?.strategy ?? key
      return { strategy, name: provider?.name ?? providerName(strategy) }
    })
  return {
    passwordEnabled: password ? Boolean(password.enabled) : true,
    passwordRequired: password ? Boolean(password.required) : true,
    nameRequired: Boolean(attributes?.first_name?.required || attributes?.last_name?.required),
    usernameRequired: Boolean(attributes?.username?.required),
    social,
    signUpMode: environment?.userSettings?.signUp?.mode ?? 'public',
  }
}
