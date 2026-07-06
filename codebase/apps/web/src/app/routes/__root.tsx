import { createRootRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Layout } from '../../components/Layout'
import { OnboardingWizard } from '../../components/OnboardingWizard'
import { profileStore } from '../../storage'
import { HealthFooter } from '../HealthFooter'
import NotFoundPage from '../pages/NotFoundPage'

// First-run gate (TASK-016): no stored profile means onboarding has never
// run, so every path shows the wizard until one is persisted.
// oxlint-disable-next-line react/only-export-components -- TanStack root route files colocate the component with the Route export
function RootComponent() {
  const [profile, setProfile] = useState(() => profileStore.get())

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
      <Layout />
      <HealthFooter />
    </>
  )
}

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundPage,
})
