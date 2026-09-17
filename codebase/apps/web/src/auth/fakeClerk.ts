import type { ClerkApiError, ClerkLike, ClerkUser, SignInResource, SignUpResource } from './clerkTypes'

/**
 * A stand-in for Clerk's browser API, for tests and Storybook: one known
 * account, passwords and codes checked in memory, nothing sent anywhere.
 */

export const FAKE_CODE = '424242'

export interface FakeClerkOptions {
  account?: { email: string; password: string; secondFactor?: boolean }
  signUpMode?: string
  social?: string[]
  signedIn?: boolean
}

export interface FakeClerk extends ClerkLike {
  /** The session handed to setActive, once someone has signed in. */
  activeSession: string | null
  calls: string[]
}

function fail(code: string, message: string): never {
  const errors: ClerkApiError[] = [{ code, message }]
  throw { errors }
}

export function createFakeClerk({ account = { email: 'player@example.com', password: 'correct horse' }, signUpMode = 'public', social = [], signedIn = false }: FakeClerkOptions = {}): FakeClerk {
  const calls: string[] = []
  const user: ClerkUser = { fullName: 'Demo Player', primaryEmailAddress: { emailAddress: account.email } }

  const afterFirstFactor = (): Partial<SignInResource> =>
    account.secondFactor ? { status: 'needs_second_factor', supportedSecondFactors: [{ strategy: 'totp' }] } : { status: 'complete', createdSessionId: 'sess_fake' }

  const signIn: SignInResource = {
    status: 'needs_identifier',
    supportedFirstFactors: null,
    supportedSecondFactors: null,
    createdSessionId: null,
    async create(params) {
      calls.push(`signIn.create:${String(params.strategy ?? 'identifier')}`)
      if (params.identifier !== account.email) fail('form_identifier_not_found', "Couldn't find your account.")
      return Object.assign(signIn, {
        status: 'needs_first_factor',
        supportedFirstFactors: [{ strategy: 'password' }, { strategy: 'email_code', emailAddressId: 'idn_fake', safeIdentifier: account.email }],
      })
    },
    async prepareFirstFactor(params) {
      calls.push(`signIn.prepareFirstFactor:${String(params.strategy)}`)
      return signIn
    },
    async attemptFirstFactor(params) {
      calls.push(`signIn.attemptFirstFactor:${String(params.strategy)}`)
      if (params.strategy === 'password') {
        if (params.password !== account.password) fail('form_password_incorrect', 'Password is incorrect.')
      } else if (params.code !== FAKE_CODE) {
        fail('form_code_incorrect', 'Incorrect code.')
      }
      if (params.strategy === 'reset_password_email_code' && typeof params.password === 'string') account.password = params.password
      return Object.assign(signIn, afterFirstFactor())
    },
    async prepareSecondFactor() {
      return signIn
    },
    async attemptSecondFactor(params) {
      calls.push(`signIn.attemptSecondFactor:${String(params.strategy)}`)
      if (params.code !== FAKE_CODE) fail('form_code_incorrect', 'Incorrect code.')
      return Object.assign(signIn, { status: 'complete', createdSessionId: 'sess_fake' })
    },
    async resetPassword({ password }) {
      account.password = password
      return Object.assign(signIn, { status: 'complete', createdSessionId: 'sess_fake' })
    },
    async authenticateWithRedirect({ strategy }) {
      calls.push(`signIn.redirect:${strategy}`)
    },
  }

  const signUp: SignUpResource = {
    status: null,
    missingFields: [],
    unverifiedFields: [],
    createdSessionId: null,
    async create(params) {
      calls.push('signUp.create')
      if (params.emailAddress === account.email) fail('form_identifier_exists', 'That email address is taken.')
      return Object.assign(signUp, { status: 'missing_requirements', unverifiedFields: ['email_address'] })
    },
    async prepareEmailAddressVerification() {
      calls.push('signUp.prepareEmailAddressVerification')
      return signUp
    },
    async attemptEmailAddressVerification({ code }) {
      calls.push('signUp.attemptEmailAddressVerification')
      if (code !== FAKE_CODE) fail('form_code_incorrect', 'Incorrect code.')
      return Object.assign(signUp, { status: 'complete', unverifiedFields: [], createdSessionId: 'sess_new' })
    },
    async authenticateWithRedirect({ strategy }) {
      calls.push(`signUp.redirect:${strategy}`)
    },
  }

  const clerk: FakeClerk = {
    loaded: true,
    user: signedIn ? user : null,
    client: { signIn, signUp },
    activeSession: null,
    calls,
    async setActive({ session }) {
      clerk.activeSession = session
      clerk.user = user
    },
    async signOut() {
      calls.push('signOut')
      clerk.user = null
    },
    async handleRedirectCallback() {
      calls.push('handleRedirectCallback')
    },
    __unstable__environment: {
      userSettings: {
        attributes: { password: { enabled: true, required: true } },
        social: Object.fromEntries(social.map((strategy) => [strategy, { enabled: true, strategy }])),
        signUp: { mode: signUpMode },
      },
    },
  }
  return clerk
}
