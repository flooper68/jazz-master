import { createRootRoute } from '@tanstack/react-router'
import { Layout } from '../../components/Layout'
import { OnboardingWizard } from '../../components/OnboardingWizard'
import { useViewFocus } from '../../components/useViewFocus'
import { HealthFooter } from '../HealthFooter'
import NotFoundPage from '../pages/NotFoundPage'
import { useProfile } from '../ProfileProvider'

// First-run gate (TASK-016): no stored profile means onboarding has never
// run, so every path shows the wizard until one is persisted.
// oxlint-disable-next-line react/only-export-components -- TanStack root route files colocate the component with the Route export
function RootComponent() {
  const { profile, status, saveProfile, isSaving } = useProfile()
  // ISSUE-002: completing onboarding swaps the wizard for the app shell within
  // the same route; move focus into the app's main landmark so keyboard and
  // screen-reader users land on the page content, not document.body.
  const mainRef = useViewFocus<HTMLElement>(
    profile === null ? 'onboarding' : 'app',
  )

  if (status === 'pending') {
    return (
      <>
        <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-zinc-300">
          <p>Loading profile...</p>
        </main>
        <HealthFooter />
      </>
    )
  }

  if (status === 'error') {
    return (
      <>
        <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-zinc-300">
          <p>Profile could not be loaded.</p>
        </main>
        <HealthFooter />
      </>
    )
  }

  if (profile === null) {
    return (
      <>
        <OnboardingWizard
          isSaving={isSaving}
          onComplete={(completed) => {
            void saveProfile(completed)
          }}
        />
        <HealthFooter />
      </>
    )
  }

  return (
    <>
      <Layout mainRef={mainRef} />
      <HealthFooter />
    </>
  )
}

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundPage,
})
