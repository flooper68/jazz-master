import { useNavigate } from '@tanstack/react-router'
import { sessionSearch } from '../appData/quickRun'
import { AgentConfirmPrompt } from '../components/AgentConfirmPrompt'
import { Layout } from '../components/Layout'
import { exerciseSeconds } from '../content'
import { useAgentTools } from '../webmcp/useAgentTools'
import { useNextSession } from './useNextSession'
import { usePlayerPrefsSync } from './usePlayerPrefsSync'

/**
 * The app shell as every router mounts it: the layout, fed the catalog, the
 * routines and the session the scheduler has ready — and, for an AI assistant
 * in the user's browser, the app's tools and the prompt that keeps the user in
 * charge of them.
 */
export function RootLayout() {
  const navigate = useNavigate()
  const { plan } = useNextSession()
  useAgentTools()
  // The player's settings follow the account, not this browser.
  usePlayerPrefsSync()
  const next = {
    label: plan.routine?.name ?? 'Next session',
    count: plan.slots.length,
    seconds: plan.slots.reduce((sum, slot) => sum + exerciseSeconds(slot.exercise), 0),
    routineId: plan.routine?.id ?? null,
  }
  return (
    <>
      <Layout
        next={next}
        onStartNext={() => void navigate({ to: '/session', search: sessionSearch(plan) })}
      />
      <AgentConfirmPrompt />
    </>
  )
}
