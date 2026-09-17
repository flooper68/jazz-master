import { createRootRoute } from '@tanstack/react-router'
import ErrorPage from '../pages/ErrorPage'
import NotFoundPage from '../pages/NotFoundPage'
import { RootLayout } from '../RootLayout'

// oxlint-disable-next-line react/only-export-components -- TanStack root route files colocate the component with the Route export
function RootComponent() {
  return <RootLayout />
}

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundPage,
  errorComponent: ErrorPage,
})
