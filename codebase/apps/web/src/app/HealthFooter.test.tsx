import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { trpcTestFetch } from '../test/trpcTestFetch'
import { HealthFooter } from './HealthFooter'
import { AppProviders } from './providers'

describe('HealthFooter', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('renders nothing in production builds (INS-020)', () => {
    vi.stubEnv('DEV', false)

    render(
      <AppProviders fetch={trpcTestFetch}>
        <HealthFooter />
      </AppProviders>,
    )

    expect(
      screen.queryByRole('contentinfo', { name: 'API health' }),
    ).toBeNull()
  })

  it('renders the health status fetched over the tRPC wire path', async () => {
    render(
      <AppProviders fetch={trpcTestFetch}>
        <HealthFooter />
      </AppProviders>,
    )

    const footer = screen.getByRole('contentinfo', { name: 'API health' })
    expect(footer).toHaveTextContent('API: checking…')
    expect(await screen.findByText('API: ok', { exact: false })).toBeVisible()
  })
})
