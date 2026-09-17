import { useRef, useState, type FormEvent } from 'react'
import { AuthCard, AuthFooter, CodeField, ErrorNote, Field, formValues, SocialButtons, Submit, TextButton, useAuthSession, type AuthFlowProps } from './authUi'
import { authErrorMessage, type SocialProvider } from './clerkBrowser'
import type { AuthFactor, SignInResource } from './clerkTypes'
import { SsoCallback } from './SsoCallback'

/**
 * Sign in, in our own screens over Clerk's API. It asks for the email first
 * and lets Clerk say what that account can do next — a password, a code by
 * email, a second factor — so it follows whatever the instance has enabled.
 */

type Step =
  | { kind: 'identifier' }
  | { kind: 'password'; emailCode: AuthFactor | null }
  | { kind: 'email-code'; to: string }
  | { kind: 'reset'; to: string }
  | { kind: 'second-factor'; factor: AuthFactor }

const SECOND_FACTOR_ORDER = ['totp', 'phone_code', 'email_code', 'backup_code']
const SECOND_FACTOR_LABEL: Record<string, string> = {
  totp: 'Enter the code from your authenticator app.',
  phone_code: 'Enter the code we sent to your phone.',
  email_code: 'Enter the code we sent to your email.',
  backup_code: 'Enter one of your backup codes.',
}

export function SignInFlow(props: AuthFlowProps) {
  const session = useAuthSession(props)
  const { clerk, settings, redirect, navigate } = session
  const [step, setStep] = useState<Step>({ kind: 'identifier' })
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(session.loadError)
  const signIn = useRef<SignInResource | null>(null)

  if (typeof window !== 'undefined' && window.location.pathname.endsWith('/sso-callback')) {
    return <SsoCallback session={session} />
  }

  /** Run one call to Clerk: busy while it runs, its error in plain words if it fails. */
  const run = async (work: () => Promise<void>) => {
    if (!clerk?.client) return setError(session.loadError ?? 'Still loading. Try again in a moment.')
    setBusy(true)
    setError(null)
    try {
      await work()
    } catch (caught) {
      setError(authErrorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  /** Whatever Clerk says comes next, after any successful attempt. */
  const advance = async (resource: SignInResource, newPassword?: string) => {
    signIn.current = resource
    if (resource.status === 'complete') {
      await clerk?.setActive({ session: resource.createdSessionId })
      return navigate(redirect)
    }
    if (resource.status === 'needs_new_password' && newPassword) {
      return advance(await resource.resetPassword({ password: newPassword }))
    }
    if (resource.status === 'needs_second_factor') {
      const factors = resource.supportedSecondFactors ?? []
      const factor = SECOND_FACTOR_ORDER.map((strategy) => factors.find((candidate) => candidate.strategy === strategy)).find(Boolean)
      if (!factor) throw new Error('This account needs a second step this form cannot do yet. Use the standard form below.')
      if (factor.strategy === 'phone_code' || factor.strategy === 'email_code') {
        await resource.prepareSecondFactor({ strategy: factor.strategy, phoneNumberId: factor.phoneNumberId, emailAddressId: factor.emailAddressId })
      }
      return setStep({ kind: 'second-factor', factor })
    }
    throw new Error('This account signs in a way this form cannot do yet. Use the standard form below.')
  }

  const sendEmailCode = async (resource: SignInResource, factor: AuthFactor) => {
    await resource.prepareFirstFactor({ strategy: 'email_code', emailAddressId: factor.emailAddressId })
    setStep({ kind: 'email-code', to: factor.safeIdentifier ?? email })
  }

  const submitIdentifier = (event: FormEvent<HTMLFormElement>) => {
    const { identifier } = formValues(event)
    setEmail(identifier)
    void run(async () => {
      const resource = await clerk!.client!.signIn.create({ identifier })
      signIn.current = resource
      if (resource.status === 'complete') return advance(resource)
      const factors = resource.supportedFirstFactors ?? []
      const emailCode = factors.find((factor) => factor.strategy === 'email_code') ?? null
      if (factors.some((factor) => factor.strategy === 'password')) return setStep({ kind: 'password', emailCode })
      if (emailCode) return sendEmailCode(resource, emailCode)
      const social = factors.find((factor) => factor.strategy.startsWith('oauth_'))
      throw new Error(social ? 'This account signs in with a social account. Use the button above.' : 'This account signs in a way this form cannot do yet. Use the standard form below.')
    })
  }

  const submitPassword = (event: FormEvent<HTMLFormElement>) => {
    const { password } = formValues(event)
    void run(async () => advance(await signIn.current!.attemptFirstFactor({ strategy: 'password', password })))
  }

  const submitEmailCode = (event: FormEvent<HTMLFormElement>) => {
    const { code } = formValues(event)
    void run(async () => advance(await signIn.current!.attemptFirstFactor({ strategy: 'email_code', code })))
  }

  const startReset = () =>
    void run(async () => {
      signIn.current = await clerk!.client!.signIn.create({ strategy: 'reset_password_email_code', identifier: email })
      setStep({ kind: 'reset', to: email })
    })

  const submitReset = (event: FormEvent<HTMLFormElement>) => {
    const { code, newPassword } = formValues(event)
    void run(async () => advance(await signIn.current!.attemptFirstFactor({ strategy: 'reset_password_email_code', code, password: newPassword }), newPassword))
  }

  const submitSecondFactor = (factor: AuthFactor) => (event: FormEvent<HTMLFormElement>) => {
    const { code } = formValues(event)
    void run(async () => advance(await signIn.current!.attemptSecondFactor({ strategy: factor.strategy, code })))
  }

  const social = (provider: SocialProvider) =>
    void run(() => clerk!.client!.signIn.authenticateWithRedirect({ strategy: provider.strategy, redirectUrl: '/sign-in/sso-callback', redirectUrlComplete: redirect }))

  const startOver = () => {
    setError(null)
    setStep({ kind: 'identifier' })
  }

  const footer = <AuthFooter question="New here?" action="Join the beta" href="/#beta" classicHref="/sign-in-classic" />

  if (step.kind === 'password') {
    return (
      <AuthCard title="Enter your password" lede={email}>
        <form onSubmit={submitPassword} className="flex flex-col gap-4" aria-busy={busy}>
          <input type="hidden" name="username" autoComplete="username" value={email} readOnly />
          <Field label="Password" name="password" type="password" autoComplete="current-password" required autoFocus />
          <ErrorNote message={error} />
          <Submit busy={busy}>Sign in</Submit>
        </form>
        <div className="flex flex-col gap-2">
          <TextButton onClick={startReset} disabled={busy}>
            Forgot your password?
          </TextButton>
          {step.emailCode && (
            <TextButton onClick={() => void run(() => sendEmailCode(signIn.current!, step.emailCode!))} disabled={busy}>
              Email me a code instead
            </TextButton>
          )}
          <TextButton onClick={startOver}>Use a different email</TextButton>
        </div>
      </AuthCard>
    )
  }

  if (step.kind === 'email-code') {
    return (
      <AuthCard title="Check your email" lede={`We sent a code to ${step.to}.`}>
        <form onSubmit={submitEmailCode} className="flex flex-col gap-4" aria-busy={busy}>
          <CodeField />
          <ErrorNote message={error} />
          <Submit busy={busy}>Sign in</Submit>
        </form>
        <TextButton onClick={startOver}>Use a different email</TextButton>
      </AuthCard>
    )
  }

  if (step.kind === 'reset') {
    return (
      <AuthCard title="Reset your password" lede={`We sent a code to ${step.to}. Enter it with your new password.`}>
        <form onSubmit={submitReset} className="flex flex-col gap-4" aria-busy={busy}>
          <CodeField />
          <Field label="New password" name="newPassword" type="password" autoComplete="new-password" required minLength={8} />
          <ErrorNote message={error} />
          <Submit busy={busy}>Set password and sign in</Submit>
        </form>
        <TextButton onClick={startOver}>Back to sign in</TextButton>
      </AuthCard>
    )
  }

  if (step.kind === 'second-factor') {
    return (
      <AuthCard title="One more step" lede={SECOND_FACTOR_LABEL[step.factor.strategy] ?? 'Enter your verification code.'}>
        <form onSubmit={submitSecondFactor(step.factor)} className="flex flex-col gap-4" aria-busy={busy}>
          <CodeField />
          <ErrorNote message={error} />
          <Submit busy={busy}>Verify</Submit>
        </form>
        <TextButton onClick={startOver}>Start over</TextButton>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Sign in to Count-in">
      <SocialButtons providers={settings.social} verb="Continue" onChoose={social} disabled={busy} />
      <form onSubmit={submitIdentifier} className="flex flex-col gap-4" aria-busy={busy}>
        <Field label="Email" name="identifier" type="email" autoComplete="username" required defaultValue={email} />
        <ErrorNote message={error ?? session.loadError} />
        <Submit busy={busy}>Continue</Submit>
      </form>
      {footer}
    </AuthCard>
  )
}
