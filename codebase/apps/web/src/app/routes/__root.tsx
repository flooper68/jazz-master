import { createRootRoute } from '@tanstack/react-router'
import { Layout } from '../../components/Layout'
import ErrorPage from '../pages/ErrorPage'
import NotFoundPage from '../pages/NotFoundPage'

// oxlint-disable-next-line react/only-export-components -- TanStack root route files colocate the component with the Route export
function RootComponent() {
  return <Layout />
}

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundPage,
  errorComponent: ErrorPage,
})
