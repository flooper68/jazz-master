import { StrictMode } from 'react'
import { BrowserRouter } from 'react-router'
import App from './App'

// Island entry: src/pages/app/[...path].astro mounts this with
// client:only="react", so the router only ever runs in the browser.
// The basename keeps every SPA route under /app without touching App's routes.
export function AppShell() {
  return (
    <StrictMode>
      <BrowserRouter basename="/app">
        <App />
      </BrowserRouter>
    </StrictMode>
  )
}
