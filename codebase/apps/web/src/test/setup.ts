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
