import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { AppProviders } from './providers'
import { createAppRouter } from './router'

// Island entry: src/pages/app/[...path].astro mounts this with
// client:only="react", so the router only ever runs in the browser.
const router = createAppRouter()

export function AppShell() {
  return (
    <StrictMode>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </StrictMode>
  )
}
