import { createMemoryHistory, RouterProvider } from '@tanstack/react-router'
import { render } from '@testing-library/react'
import { Fragment, StrictMode } from 'react'
import { AppProviders } from '../app/providers'
import { createAppRouter } from '../app/router'
import { trpcTestFetch } from './trpcTestFetch'

/**
 * Render the production route tree at an app-relative path (e.g. '/exercises/x').
 * The router keeps its real /app basepath, so href assertions see the URLs
 * users see. Wrapped in the production providers, with tRPC served in-process
 * (the root route renders the health footer). `strict` mounts it the way the
 * island entry does, effects run twice, for what depends on a clean re-mount.
 */
export async function renderRoute(path: string, { strict = false }: { strict?: boolean } = {}) {
  const Mode = strict ? StrictMode : Fragment
  const router = createAppRouter(
    createMemoryHistory({
      initialEntries: [`/app${path === '/' ? '' : path}`],
    }),
  )
  await router.load()
  const view = render(
    <Mode>
      <AppProviders fetch={trpcTestFetch}>
        <RouterProvider router={router} />
      </AppProviders>
    </Mode>,
  )
  // The router too, for tests that read where a press has taken the URL.
  return { ...view, router }
}
