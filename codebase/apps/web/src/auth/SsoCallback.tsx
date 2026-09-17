import { useEffect, useState } from 'react'
import { AuthCard, ErrorNote, type AuthSession } from './authUi'
import { authErrorMessage } from './clerkBrowser'

/** Where a social sign-in comes back to: hand the result to Clerk, which finishes it and moves on. */
export function SsoCallback({ session }: { session: AuthSession }) {
  const { clerk, redirect, loadError } = session
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!clerk) return
    clerk
      .handleRedirectCallback({
        signInUrl: '/sign-in',
        signUpUrl: '/sign-up',
        signInFallbackRedirectUrl: redirect,
        signUpFallbackRedirectUrl: redirect,
      })
      .catch((caught: unknown) => setError(authErrorMessage(caught)))
  }, [clerk, redirect])

  return (
    <AuthCard title="Signing you in" lede={error || loadError ? undefined : 'One moment.'}>
      <ErrorNote message={error ?? loadError} />
      {(error || loadError) && (
        <a href="/sign-in" className="text-[15px] font-semibold underline underline-offset-4">
          Back to sign in
        </a>
      )}
      {/* Clerk's bot check draws here when a social sign-up needs it. */}
      <div id="clerk-captcha" />
    </AuthCard>
  )
}
