import { createMemoryHistory, RouterProvider } from '@tanstack/react-router'
import { render, screen, waitFor } from '@testing-library/react'
import { expect } from 'vitest'
import { AppProviders } from '../app/providers'
import { createAppRouter } from '../app/router'
import { trpcTestFetch } from './trpcTestFetch'

/**
 * Render the production route tree at an app-relative path (e.g. '/practice').
 * The router keeps its real /app basepath, so href assertions see the URLs
 * users see (e.g. /app/practice). Wrapped in the production providers, with
 * tRPC served in-process (the root route renders the health footer).
 */
export async function renderRoute(path: string) {
  const router = createAppRouter(
    createMemoryHistory({
      initialEntries: [`/app${path === '/' ? '' : path}`],
    }),
  )
  await router.load()
  const result = render(
    <AppProviders fetch={trpcTestFetch}>
      <RouterProvider router={router} />
    </AppProviders>,
  )
  await waitFor(() => {
    expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument()
  })
  return result
}
