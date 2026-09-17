/**
 * The slice of Clerk's browser API the custom auth screens use, written
 * structurally so the forms can be driven by a fake in tests and Storybook.
 * Names and shapes follow clerk-js (`window.Clerk`).
 */

export interface ClerkApiError {
  code: string
  message: string
  longMessage?: string
  meta?: { paramName?: string }
}

export interface AuthFactor {
  strategy: string
  emailAddressId?: string
  phoneNumberId?: string
  safeIdentifier?: string
}

export type SignInStatus = 'needs_identifier' | 'needs_first_factor' | 'needs_second_factor' | 'needs_new_password' | 'complete' | null

export interface RedirectParams {
  strategy: string
  redirectUrl: string
  redirectUrlComplete: string
}

export interface SignInResource {
  status: SignInStatus
  supportedFirstFactors?: AuthFactor[] | null
  supportedSecondFactors?: AuthFactor[] | null
  createdSessionId: string | null
  create(params: Record<string, unknown>): Promise<SignInResource>
  prepareFirstFactor(params: Record<string, unknown>): Promise<SignInResource>
  attemptFirstFactor(params: Record<string, unknown>): Promise<SignInResource>
  prepareSecondFactor(params: Record<string, unknown>): Promise<SignInResource>
  attemptSecondFactor(params: Record<string, unknown>): Promise<SignInResource>
  resetPassword(params: { password: string; signOutOfOtherSessions?: boolean }): Promise<SignInResource>
  authenticateWithRedirect(params: RedirectParams): Promise<void>
}

export interface SignUpResource {
  status: 'missing_requirements' | 'complete' | 'abandoned' | null
  missingFields: string[]
  unverifiedFields: string[]
  createdSessionId: string | null
  create(params: Record<string, unknown>): Promise<SignUpResource>
  prepareEmailAddressVerification(params: { strategy: 'email_code' }): Promise<SignUpResource>
  attemptEmailAddressVerification(params: { code: string }): Promise<SignUpResource>
  authenticateWithRedirect(params: RedirectParams): Promise<void>
}

export interface ClerkSessionActivity {
  browserName?: string
  deviceType?: string
  city?: string
  country?: string
  isMobile?: boolean
}

/** One signed-in device, as the account page lists it. */
export interface ClerkDeviceSession {
  id: string
  status?: string
  lastActiveAt?: Date | string
  latestActivity?: ClerkSessionActivity | null
  revoke(): Promise<unknown>
}

export interface ClerkUser {
  fullName?: string | null
  firstName?: string | null
  lastName?: string | null
  username?: string | null
  imageUrl?: string
  hasImage?: boolean
  passwordEnabled?: boolean
  primaryEmailAddress?: { emailAddress: string } | null
  update?(params: { firstName?: string; lastName?: string }): Promise<unknown>
  updatePassword?(params: { currentPassword?: string; newPassword: string; signOutOfOtherSessions?: boolean }): Promise<unknown>
  getSessions?(): Promise<ClerkDeviceSession[]>
  delete?(): Promise<unknown>
}

interface AttributeSetting {
  enabled?: boolean
  required?: boolean
}

export interface ClerkEnvironment {
  userSettings?: {
    attributes?: Record<string, AttributeSetting | undefined>
    social?: Record<string, { enabled?: boolean; strategy?: string; name?: string } | undefined>
    signUp?: { mode?: string }
  }
}

export interface ClerkLike {
  loaded?: boolean
  user?: ClerkUser | null
  session?: { id: string } | null
  client?: { signIn: SignInResource; signUp: SignUpResource }
  setActive(params: { session: string | null }): Promise<void>
  signOut(options?: { redirectUrl?: string }): Promise<void>
  handleRedirectCallback(params: Record<string, unknown>): Promise<unknown>
  openUserProfile?(): void
  addListener?(listener: (resources: { user?: ClerkUser | null }) => void): () => void
  __unstable__environment?: ClerkEnvironment
}
