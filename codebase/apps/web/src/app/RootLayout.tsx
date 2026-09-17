import { Layout } from '../components/Layout'
import { useExerciseCatalog } from './useExerciseCatalog'

/** The app shell as every router mounts it: the layout, fed the catalog its quick run draws from. */
export function RootLayout() {
  const { exercises } = useExerciseCatalog()
  return <Layout exercises={exercises} />
}
