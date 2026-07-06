import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { trpcTestFetch } from '../test/trpcTestFetch'
import { HealthFooter } from './HealthFooter'
import { AppProviders } from './providers'

describe('HealthFooter', () => {
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
