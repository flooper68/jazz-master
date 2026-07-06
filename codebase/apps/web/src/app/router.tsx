import { createRouter, type RouterHistory } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

// The SPA lives under /app (ADR-006): basepath replaces the old BrowserRouter
// basename, so route files keep app-relative paths. Tests inject a memory
// history; the island entry (AppShell) uses the default browser history.
export function createAppRouter(history?: RouterHistory) {
  return createRouter({ routeTree, basepath: '/app', history })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
}
