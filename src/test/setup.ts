import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// vitest runs without globals, so Testing Library's auto-cleanup never registers
afterEach(() => {
  cleanup()
})
