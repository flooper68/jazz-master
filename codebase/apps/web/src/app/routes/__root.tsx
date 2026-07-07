import { createRootRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Layout } from '../../components/Layout'
import { OnboardingWizard } from '../../components/OnboardingWizard'
import { useViewFocus } from '../../components/useViewFocus'
import { profileStore } from '../../storage'
import { HealthFooter } from '../HealthFooter'
import NotFoundPage from '../pages/NotFoundPage'

// First-run gate (TASK-016): no stored profile means onboarding has never
// run, so every path shows the wizard until one is persisted.
// oxlint-disable-next-line react/only-export-components -- TanStack root route files colocate the component with the Route export
function RootComponent() {
  const [profile, setProfile] = useState(() => profileStore.get())
  // ISSUE-002: completing onboarding swaps the wizard for the app shell within
  // the same route; move focus into the app's main landmark so keyboard and
  // screen-reader users land on the page content, not document.body.
  const mainRef = useViewFocus<HTMLElement>(
    profile === null ? 'onboarding' : 'app',
  )

  if (profile === null) {
    return (
      <>
        <OnboardingWizard
          onComplete={(completed) => {
            profileStore.set(completed)
            setProfile(completed)
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
