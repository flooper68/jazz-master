import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { PracticeProfile } from '../storage'
import { OnboardingWizard } from './OnboardingWizard'

function renderWizard() {
  const onComplete = vi.fn<(profile: PracticeProfile) => void>()
  render(<OnboardingWizard onComplete={onComplete} />)
  return { onComplete }
}

describe('OnboardingWizard', () => {
  it('walks three steps and completes with the chosen answers', async () => {
    const user = userEvent.setup()
    const { onComplete } = renderWizard()

    // Step 1 — levels.
    expect(
      screen.getByRole('heading', { name: 'How comfortable are you?' }),
    ).toBeInTheDocument()
    const scales = screen.getByRole('group', { name: 'Scales' })
    await user.click(within(scales).getByRole('radio', { name: 'Intermediate' }))
    await user.click(screen.getByRole('button', { name: 'Next' }))

    // Step 2 — goals, selection order is priority order.
    expect(
      screen.getByRole('heading', { name: 'What do you want to get better at?' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: /Chords/ }))
    await user.click(screen.getByRole('button', { name: 'Next' }))

    // Step 3 — time budget, then finish.
    expect(
      screen.getByRole('heading', { name: 'How much time do you have?' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: '30 min' }))
    await user.click(screen.getByRole('button', { name: 'Start practicing' }))

    expect(onComplete).toHaveBeenCalledTimes(1)
    const profile = onComplete.mock.calls[0][0]
    expect(profile.levels.scales).toBe(2)
    expect(profile.goalAreas).toEqual(['scales', 'arpeggios', 'chords'])
    expect(profile.minutesPerDay).toBe(30)
    expect(profile.createdAt).not.toBe('')
  })

  it('skips straight to the documented default profile', async () => {
    const user = userEvent.setup()
    const { onComplete } = renderWizard()

    await user.click(screen.getByRole('button', { name: 'Skip for now' }))

    expect(onComplete).toHaveBeenCalledTimes(1)
    const profile = onComplete.mock.calls[0][0]
    expect(profile.levels).toEqual({
      scales: 1,
      arpeggios: 1,
      chords: 1,
      standards: 1,
      ears: 1,
    })
    expect(profile.goalAreas).toEqual(['scales', 'arpeggios'])
    expect(profile.minutesPerDay).toBe(20)
  })

  it('keeps already-given answers when skipping mid-wizard', async () => {
    const user = userEvent.setup()
    const { onComplete } = renderWizard()

    const ears = screen.getByRole('group', { name: 'Ear training' })
    await user.click(within(ears).getByRole('radio', { name: 'Advanced' }))
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: 'Skip for now' }))

    const profile = onComplete.mock.calls[0][0]
    expect(profile.levels.ears).toBe(3)
    expect(profile.minutesPerDay).toBe(20)
  })

  it('will not advance past goals when none are selected, but skip still works', async () => {
    const user = userEvent.setup()
    const { onComplete } = renderWizard()

    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('checkbox', { name: /Scales/ }))
    await user.click(screen.getByRole('checkbox', { name: /Arpeggios/ }))
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
    expect(
      screen.getByText(/Pick at least one area to continue/),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Skip for now' }))
    expect(onComplete.mock.calls[0][0].goalAreas).toEqual([
      'scales',
      'arpeggios',
    ])
  })

  it('moves focus to the step heading when the step changes', async () => {
    const user = userEvent.setup()
    renderWizard()

    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(
      screen.getByRole('heading', { name: 'What do you want to get better at?' }),
    ).toHaveFocus()
  })

  it('goes back without losing answers', async () => {
    const user = userEvent.setup()
    renderWizard()

    const chords = screen.getByRole('group', { name: 'Chords' })
    await user.click(within(chords).getByRole('radio', { name: 'Intermediate' }))
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: 'Back' }))

    expect(
      within(screen.getByRole('group', { name: 'Chords' })).getByRole('radio', {
        name: 'Intermediate',
      }),
    ).toBeChecked()
  })
})
