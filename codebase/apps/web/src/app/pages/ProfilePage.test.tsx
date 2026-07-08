import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { defaultProfile, profileStore, serializeStorageBackup } from '../../storage'
import ProfilePage from './ProfilePage'

beforeEach(() => {
  localStorage.clear()
})

describe('ProfilePage', () => {
  it('shows the stored profile', () => {
    profileStore.set({
      ...defaultProfile('2026-07-06T10:00:00.000Z'),
      levels: { scales: 2, arpeggios: 1, chords: 1, standards: 1, ears: 1 },
      minutesPerDay: 45,
    })
    render(<ProfilePage />)

    const scales = screen.getByRole('group', { name: 'Scales' })
    expect(
      within(scales).getByRole('radio', { name: 'Intermediate' }),
    ).toBeChecked()
    expect(screen.getByRole('radio', { name: '45 min' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /Scales/ })).toBeChecked()
  })

  it('persists edits on save and confirms', async () => {
    const user = userEvent.setup()
    profileStore.set(defaultProfile('2026-07-06T10:00:00.000Z'))
    render(<ProfilePage />)

    const standards = screen.getByRole('group', { name: 'Standards' })
    await user.click(
      within(standards).getByRole('radio', { name: 'Advanced' }),
    )
    await user.click(screen.getByRole('checkbox', { name: /Ear training/ }))
    await user.click(screen.getByRole('radio', { name: '30 min' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByText('Saved.')).toBeInTheDocument()
    const stored = profileStore.get()
    expect(stored?.levels.standards).toBe(3)
    expect(stored?.goalAreas).toEqual(['scales', 'arpeggios', 'ears'])
    expect(stored?.minutesPerDay).toBe(30)
    // The onboarding timestamp survives edits.
    expect(stored?.createdAt).toBe('2026-07-06T10:00:00.000Z')
  })

  it('blocks saving an empty goal list', async () => {
    const user = userEvent.setup()
    profileStore.set(defaultProfile('2026-07-06T10:00:00.000Z'))
    render(<ProfilePage />)

    await user.click(screen.getByRole('checkbox', { name: /Scales/ }))
    await user.click(screen.getByRole('checkbox', { name: /Arpeggios/ }))

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    expect(screen.getByText('Pick at least one goal area.')).toBeInTheDocument()
    expect(profileStore.get()?.goalAreas).toEqual(['scales', 'arpeggios'])
  })

  it('imports a backup and refreshes the visible profile', async () => {
    const user = userEvent.setup()
    profileStore.set({
      ...defaultProfile('2026-07-06T10:00:00.000Z'),
      minutesPerDay: 45,
    })
    const backup = serializeStorageBackup(new Date('2026-07-08T10:00:00.000Z'))

    profileStore.set({
      ...defaultProfile('2026-07-07T10:00:00.000Z'),
      goalAreas: ['standards'],
      minutesPerDay: 10,
    })
    render(<ProfilePage />)

    expect(screen.getByRole('radio', { name: '10 min' })).toBeChecked()
    await user.upload(
      screen.getByLabelText('Import backup'),
      new File([backup], 'jazz-master-backup.json', {
        type: 'application/json',
      }),
    )

    expect(await screen.findByText('Backup imported.')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '45 min' })).toBeChecked()
    expect(profileStore.get()?.minutesPerDay).toBe(45)
  })
})
