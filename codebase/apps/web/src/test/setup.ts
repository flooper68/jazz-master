import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterEach } from 'vitest'

// The exercises page draws the whole pack — a hundred and sixty cards — and with every test file running at
// once that can take longer than Testing Library's one second of patience.
configure({ asyncUtilTimeout: 5000 })

// vitest runs without globals, so Testing Library's auto-cleanup never registers
afterEach(() => {
  cleanup()
})

// TanStack Router scrolls on navigation; jsdom has no scrollTo implementation
// and logs "Not implemented" for every call without this stub.
window.scrollTo = () => {}

// Unit and component tests never reach the network. The player warms its
// guitar recordings from a CDN as soon as the play-along is switched on
// (player/transport.ts), which mounting a player in jsdom would otherwise
// turn into a real download per pitch. Anything that genuinely needs fetch
// passes its own in — `trpcTestFetch` goes to the provider as a prop — so
// nothing legitimate is served by the global.
globalThis.fetch = ((input: RequestInfo | URL) =>
  Promise.reject(
    new Error(`No network in tests: ${String(input)}. Pass a fetch in rather than relying on the global.`),
  )) as typeof globalThis.fetch
