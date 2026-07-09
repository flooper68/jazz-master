import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { defaultProfile } from '../../appData/profile'
import { renderRoute } from '../../test/renderRoute'
import {
  getTrpcTestProfile,
  resetTrpcTestData,
  seedTrpcTestProfile,
} from '../../test/trpcTestFetch'

beforeEach(() => {
  localStorage.clear()
  resetTrpcTestData()
})

describe('ProfilePage', () => {
  it('shows the stored profile', async () => {
    seedTrpcTestProfile({
      ...defaultProfile('2026-07-06T10:00:00.000Z'),
      levels: { scales: 2, arpeggios: 1, chords: 1, standards: 1, ears: 1 },
      minutesPerDay: 45,
    })
    await renderRoute('/profile')

    const scales = await screen.findByRole('group', { name: 'Scales' })
    expect(
      within(scales).getByRole('radio', { name: 'Intermediate' }),
    ).toBeChecked()
    expect(screen.getByRole('radio', { name: '45 min' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /Scales/ })).toBeChecked()
  })

  it('persists edits on save and confirms', async () => {
    const user = userEvent.setup()
    seedTrpcTestProfile(defaultProfile('2026-07-06T10:00:00.000Z'))
    await renderRoute('/profile')

    const standards = await screen.findByRole('group', { name: 'Standards' })
    await user.click(
      within(standards).getByRole('radio', { name: 'Advanced' }),
    )
    await user.click(screen.getByRole('checkbox', { name: /Ear training/ }))
    await user.click(screen.getByRole('radio', { name: '30 min' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Saved.')).toBeInTheDocument()
    const stored = getTrpcTestProfile()
    expect(stored?.levels.standards).toBe(3)
    expect(stored?.goalAreas).toEqual(['scales', 'arpeggios', 'ears'])
    expect(stored?.minutesPerDay).toBe(30)
    // The onboarding timestamp survives edits.
    expect(stored?.createdAt).toBe('2026-07-06T10:00:00.000Z')
  })

  it('blocks saving an empty goal list', async () => {
    const user = userEvent.setup()
    seedTrpcTestProfile(defaultProfile('2026-07-06T10:00:00.000Z'))
    await renderRoute('/profile')

    await user.click(await screen.findByRole('checkbox', { name: /Scales/ }))
    await user.click(screen.getByRole('checkbox', { name: /Arpeggios/ }))

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    expect(screen.getByText('Pick at least one goal area.')).toBeInTheDocument()
    expect(getTrpcTestProfile()?.goalAreas).toEqual(['scales', 'arpeggios'])
  })

  it('explains account sync without offering obsolete local backup actions', async () => {
    seedTrpcTestProfile(defaultProfile('2026-07-07T10:00:00.000Z'))
    await renderRoute('/profile')

    expect(await screen.findByRole('heading', { name: 'Data sync' })).toBeInTheDocument()
    expect(screen.getByText(/sync to your signed-in account/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Export backup' })).toBeNull()
    expect(screen.queryByLabelText('Import backup')).toBeNull()
  })
})
