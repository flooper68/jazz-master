import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { AppProviders } from './providers'
import { createAppRouter } from './router'
import { installDevModelContext } from '../webmcp/devModelContext'

// Island entry: src/pages/app/[...path].astro mounts this with
// client:only="react", so the router only ever runs in the browser.
const router = createAppRouter()

// A development browser without WebMCP gets a stand-in, before anything mounts and registers tools.
// The condition is spelled out here so a production build drops the stand-in altogether.
if (import.meta.env.DEV) installDevModelContext()

export function AppShell() {
  return (
    <StrictMode>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </StrictMode>
  )
}
