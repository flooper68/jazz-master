import { useRef, useState, type FormEvent } from 'react'
import { AuthCard, AuthFooter, CodeField, ErrorNote, Field, formValues, SocialButtons, Submit, TextButton, useAuthSession, type AuthFlowProps } from './authUi'
import { authErrorMessage, type SocialProvider } from './clerkBrowser'
import type { SignUpResource } from './clerkTypes'
import { SsoCallback } from './SsoCallback'

/**
 * Create an account, in our own screens over Clerk's API: the details the
 * instance asks for, then the code that proves the email address. While
 * sign-up is by invitation, it points to the beta waitlist instead.
 */

type Step = { kind: 'details' } | { kind: 'verify'; to: string }

export function SignUpFlow(props: AuthFlowProps) {
  const session = useAuthSession(props)
  const { clerk, settings, redirect, navigate } = session
  const [step, setStep] = useState<Step>({ kind: 'details' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const signUp = useRef<SignUpResource | null>(null)

  if (typeof window !== 'undefined' && window.location.pathname.endsWith('/sso-callback')) {
    return <SsoCallback session={session} />
  }

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

  const finish = async (resource: SignUpResource) => {
    signUp.current = resource
    if (resource.status === 'complete') {
      await clerk?.setActive({ session: resource.createdSessionId })
      return navigate(redirect)
    }
    if (resource.unverifiedFields.includes('email_address')) {
      await resource.prepareEmailAddressVerification({ strategy: 'email_code' })
      return
    }
    throw new Error(`Your account needs something this form cannot ask for yet (${resource.missingFields.join(', ') || 'unknown'}). Use the standard form below.`)
  }

  const submitDetails = (event: FormEvent<HTMLFormElement>) => {
    const values = formValues(event)
    void run(async () => {
      const resource = await clerk!.client!.signUp.create({
        emailAddress: values.emailAddress,
        ...(values.password ? { password: values.password } : {}),
        ...(values.firstName ? { firstName: values.firstName } : {}),
        ...(values.lastName ? { lastName: values.lastName } : {}),
        ...(values.username ? { username: values.username } : {}),
      })
      await finish(resource)
      if (resource.status !== 'complete') setStep({ kind: 'verify', to: values.emailAddress })
    })
  }

  const submitCode = (event: FormEvent<HTMLFormElement>) => {
    const { code } = formValues(event)
    void run(async () => {
      const resource = await signUp.current!.attemptEmailAddressVerification({ code })
      if (resource.status !== 'complete') throw new Error(`Your account needs something this form cannot ask for yet (${resource.missingFields.join(', ') || 'unknown'}). Use the standard form below.`)
      await finish(resource)
    })
  }

  const resend = () => void run(async () => void (await signUp.current!.prepareEmailAddressVerification({ strategy: 'email_code' })))

  const social = (provider: SocialProvider) =>
    void run(() => clerk!.client!.signUp.authenticateWithRedirect({ strategy: provider.strategy, redirectUrl: '/sign-up/sso-callback', redirectUrlComplete: redirect }))

  const footer = <AuthFooter question="Already have an account?" action="Sign in" href="/sign-in" classicHref="/sign-up-classic" />

  if (clerk && settings.signUpMode !== 'public') {
    return (
      <AuthCard title="Count-in is in beta" lede="New accounts are by invitation for now. Join the waitlist and we will count you in.">
        <a href="/#beta" className="inline-flex w-full items-center justify-center rounded-md bg-accent px-5 py-3.5 text-[15px] leading-none font-semibold text-on-accent hover:bg-accent-hover">
          Join the beta
        </a>
        {footer}
      </AuthCard>
    )
  }

  if (step.kind === 'verify') {
    return (
      <AuthCard title="Check your email" lede={`We sent a code to ${step.to}.`}>
        <form onSubmit={submitCode} className="flex flex-col gap-4" aria-busy={busy}>
          <CodeField />
          <ErrorNote message={error} />
          <Submit busy={busy}>Create my account</Submit>
        </form>
        <div className="flex flex-col gap-2">
          <TextButton onClick={resend} disabled={busy}>
            Send a new code
          </TextButton>
          <TextButton onClick={() => setStep({ kind: 'details' })}>Use a different email</TextButton>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Create your account">
      <SocialButtons providers={settings.social} verb="Sign up" onChoose={social} disabled={busy} />
      <form onSubmit={submitDetails} className="flex flex-col gap-4" aria-busy={busy}>
        {settings.nameRequired && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" name="firstName" autoComplete="given-name" required />
            <Field label="Last name" name="lastName" autoComplete="family-name" required />
          </div>
        )}
        {settings.usernameRequired && <Field label="Username" name="username" autoComplete="username" required />}
        <Field label="Email" name="emailAddress" type="email" autoComplete="email" required />
        {settings.passwordEnabled && (
          <Field label="Password" name="password" type="password" autoComplete="new-password" required={settings.passwordRequired} minLength={8} hint="At least 8 characters." />
        )}
        {/* Clerk's bot check draws here when the instance has it on. */}
        <div id="clerk-captcha" />
        <ErrorNote message={error ?? session.loadError} />
        <Submit busy={busy}>Create my account</Submit>
      </form>
      {footer}
    </AuthCard>
  )
}
