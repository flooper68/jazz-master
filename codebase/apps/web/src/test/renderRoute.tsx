import { createMemoryHistory, RouterProvider } from '@tanstack/react-router'
import { render } from '@testing-library/react'
import { createAppRouter } from '../app/router'

/**
 * Render the production route tree at an app-relative path (e.g. '/practice').
 * The router keeps its real /app basepath, so href assertions see the URLs
 * users see (e.g. /app/practice).
 */
export async function renderRoute(path: string) {
  const router = createAppRouter(
    createMemoryHistory({
      initialEntries: [`/app${path === '/' ? '' : path}`],
    }),
  )
  await router.load()
  return render(<RouterProvider router={router} />)
}
