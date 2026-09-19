import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EXERCISES } from '../../content'
import { renderRoute } from '../../test/renderRoute'
import { resetTrpcTestData } from '../../test/trpcTestFetch'

const exercise = EXERCISES[0]

beforeEach(() => {
  resetTrpcTestData()
  // jsdom has no Web Audio; the player reports the click as unavailable and
  // carries on, which is the behavior under test here.
  vi.stubGlobal('AudioContext', undefined)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ExercisePage', () => {
  it('reads as the exercise before it is played: what it is, how it is written, and one Play', async () => {
    await renderRoute(`/exercises/${exercise.id}`)

    expect(screen.getByRole('heading', { level: 1, name: exercise.title })).toBeInTheDocument()
    expect(screen.getByText(`${exercise.tempoBpm} BPM`)).toBeInTheDocument()
    expect(screen.getByText(`Level ${exercise.level}`)).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: `${exercise.title} score, ${exercise.notes.length} notes` }),
    ).toBeInTheDocument()
    // Reading, not playing: the transport belongs to the session.
    expect(screen.queryByRole('button', { name: `Finish ${exercise.title}` })).toBeNull()
  })

  it('leads with the way in, and keeps the rest for after the music', async () => {
    const wordy = EXERCISES.find((item) => (item.about?.length ?? 0) > 1)!
    const [lead, ...rest] = wordy.about!
    await renderRoute(`/exercises/${wordy.id}`)

    // The first paragraph is the way in, so it comes before the score.
    const leadText = screen.getByText(lead)
    const score = screen.getByRole('img', { name: new RegExp(`^${wordy.title} score`) })
    expect(leadText.compareDocumentPosition(score) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

    // The rest is what to know with the music in front of you.
    const about = screen.getByRole('heading', { level: 2, name: 'About this exercise' })
    expect(about.compareDocumentPosition(score) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy()
    for (const paragraph of rest) expect(screen.getByText(paragraph)).toBeInTheDocument()
  })

  it('says nothing more where there is nothing more to say', async () => {
    const terse = EXERCISES.find((item) => item.about?.length === 1)
    if (!terse) return
    await renderRoute(`/exercises/${terse.id}`)
    expect(screen.getByText(terse.about![0])).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 2, name: 'About this exercise' })).toBeNull()
  })

  it('plays the exercise as a session of one — nothing plays outside a session', async () => {
    const user = userEvent.setup()
    await renderRoute(`/exercises/${exercise.id}`)

    // Preview hears it; Start session practises it.
    expect(screen.getByRole('button', { name: 'Preview' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Start session' }))

    // The session stage, with this exercise as its only step.
    expect(await screen.findByText('Next session · 1 of 1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: `Play ${exercise.title}` })).toBeInTheDocument()
  })

  it('shows each facet once, even where a style and a context read the same', async () => {
    // 'jazz/blues' as a style and 'jazz-blues' as a context both render "Jazz blues".
    const doubled = EXERCISES.find(
      (item) => item.styles?.includes('jazz/blues') && item.contexts?.includes('jazz-blues'),
    )!
    await renderRoute(`/exercises/${doubled.id}`)
    const facets = within(screen.getByRole('list', { name: 'What this exercise trains' })).getAllByRole('listitem')
    expect(facets.filter((facet) => facet.textContent === 'Jazz blues')).toHaveLength(1)
  })

  it('renders not found for an unknown exercise', async () => {
    await renderRoute('/exercises/nope')
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument()
  })
})
