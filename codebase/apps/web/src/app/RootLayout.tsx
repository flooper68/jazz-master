import { Layout } from '../components/Layout'
import { useExerciseCatalog } from './useExerciseCatalog'
import { useRoutines } from './useRoutines'

/** The app shell as every router mounts it: the layout, fed the catalog and the routines its quick run plays from. */
export function RootLayout() {
  const { exercises } = useExerciseCatalog()
  const { routines } = useRoutines()
  return <Layout exercises={exercises} routines={routines} />
}
