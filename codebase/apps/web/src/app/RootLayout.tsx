import { AgentConfirmPrompt } from '../components/AgentConfirmPrompt'
import { Layout } from '../components/Layout'
import { useAgentTools } from '../webmcp/useAgentTools'
import { useExerciseCatalog } from './useExerciseCatalog'
import { useRoutines } from './useRoutines'

/**
 * The app shell as every router mounts it: the layout, fed the catalog and the
 * routines its quick run plays from — and, for an AI assistant in the user's
 * browser, the app's tools and the prompt that keeps the user in charge of them.
 */
export function RootLayout() {
  const { exercises } = useExerciseCatalog()
  const { routines } = useRoutines()
  useAgentTools()
  return (
    <>
      <Layout exercises={exercises} routines={routines} />
      <AgentConfirmPrompt />
    </>
  )
}
