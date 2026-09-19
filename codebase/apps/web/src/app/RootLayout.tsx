import { useNavigate } from '@tanstack/react-router'
import { sessionSearch } from '../appData/quickRun'
import { AgentConfirmPrompt } from '../components/AgentConfirmPrompt'
import { Layout } from '../components/Layout'
import { useAgentTools } from '../webmcp/useAgentTools'
import { useNextSession } from './useNextSession'
import { usePlayerPrefsSync } from './usePlayerPrefsSync'

/**
 * The app shell as every router mounts it: the layout, fed the catalog and
 * the session the scheduler has ready — and, for an AI assistant in the
 * user's browser, the app's tools and the prompt that keeps the user in
 * charge of them.
 */
export function RootLayout() {
  const navigate = useNavigate()
  const { plan } = useNextSession()
  useAgentTools()
  // The player's settings follow the account, not this browser.
  usePlayerPrefsSync()
  const next = {
    label: 'Next session',
    count: plan.slots.length,
    // The plan's own estimate, which is what the card says and what the run
    // clock counts to — summing the written lengths here gave the sidebar a
    // third, shorter number for the same session.
    seconds: plan.plannedSeconds,
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
