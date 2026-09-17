import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EXERCISES } from '../../content'
import { renderRoute } from '../../test/renderRoute'
import { resetTrpcTestData, seedTrpcTestRuns } from '../../test/trpcTestFetch'

beforeEach(() => {
  resetTrpcTestData()
  localStorage.clear()
  // No audio here: a preview runs its course silently, on the wall clock.
  vi.stubGlobal('AudioContext', undefined)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function card(title: string) {
  return within(screen.getByRole('heading', { level: 3, name: title }).closest('li') as HTMLElement)
}

describe('ExercisesPage', () => {
  it('lists every exercise under its area with a link into the player', async () => {
    await renderRoute('/exercises')
    for (const area of ['Technique', 'Scales', 'Patterns', 'Arpeggios', 'Chords', 'Lines', 'Études']) {
      expect(screen.getByRole('heading', { level: 2, name: area })).toBeInTheDocument()
    }
    // One query for the lot: asking the page for each of a hundred and sixty links by name is a minute of test.
    const links = new Map(screen.getAllByRole('link', { name: /^Start / }).map((link) => [link.getAttribute('aria-label'), link.getAttribute('href')]))
    for (const exercise of EXERCISES) {
      expect(links.get(`Start ${exercise.title}`)).toBe(`/app/exercises/${exercise.id}`)
    }
    // Titles name exercises on the page, so no two may share one.
    expect(new Set(EXERCISES.map((exercise) => exercise.title)).size).toBe(EXERCISES.length)
  })

  it('shows level, length and tempo per exercise, the length read from the exercise itself', async () => {
    await renderRoute('/exercises')
    const clocked = card('C major — open position')
    expect(clocked.getByRole('img', { name: 'Level 1' })).toBeInTheDocument()
    expect(clocked.getByText('~2 min')).toBeInTheDocument()
    expect(clocked.getByText('60 BPM')).toBeInTheDocument()
    expect(clocked.getByText('C major')).toBeInTheDocument()
    // Four passes of 28 beats at 80 BPM is 84 seconds.
    const passes = card('Gm7 – C7 – Fmaj7 — arpeggios up and down')
    expect(passes.getByRole('img', { name: 'Level 2' })).toBeInTheDocument()
    expect(passes.getByText('~1 min')).toBeInTheDocument()
  })

  it('says how often and how recently each exercise was played', async () => {
    const at = (daysAgo: number) => new Date(Date.now() - daysAgo * 86_400_000).toISOString()
    const run = (id: string, exerciseId: string, startedAt: string) => ({
      id, exerciseId, startedAt, durationSeconds: 60, tempoBpm: 60, passes: 3, completed: true, rating: null, sessionId: null,
    })
    seedTrpcTestRuns([
      run('11111111-1111-4111-8111-111111111111', 'scales-major-open-c', at(0)),
      run('22222222-2222-4222-8222-222222222222', 'scales-major-open-c', at(3)),
    ])
    await renderRoute('/exercises')
    expect(await card('C major — open position').findByText('Played 2× · last today')).toBeInTheDocument()
    expect(card('G major — open position').getByText('Not played yet')).toBeInTheDocument()
  })

  it('switches between cards and a plain list, and remembers the choice', async () => {
    const user = userEvent.setup()
    const { unmount } = await renderRoute('/exercises')
    const view = screen.getByRole('radiogroup', { name: 'View' })
    expect(within(view).getByRole('radio', { name: 'Cards' })).toBeChecked()

    await user.click(within(view).getByRole('radio', { name: 'List' }))
    expect(within(view).getByRole('radio', { name: 'List' })).toBeChecked()
    // Same exercises, same links — just no pictures.
    expect(screen.getAllByRole('link', { name: /^Start / })).toHaveLength(EXERCISES.length)
    expect(card('C major — open position').getByText(/~2 min · 60 BPM/)).toBeInTheDocument()

    unmount()
    await renderRoute('/exercises')
    expect(screen.getByRole('radio', { name: 'List' })).toBeChecked()
  })

  it('previews an exercise from the list, one at a time, without opening it', async () => {
    const user = userEvent.setup()
    await renderRoute('/exercises')
    const first = card('C major — open position').getByRole('button', { name: 'Preview C major — open position' })
    const second = card('G major — open position').getByRole('button', { name: 'Preview G major — open position' })
    expect(first).toHaveAttribute('aria-pressed', 'false')

    await user.click(first)
    expect(first).toHaveAttribute('aria-pressed', 'true')
    await user.click(second)
    expect(first).toHaveAttribute('aria-pressed', 'false')
    expect(second).toHaveAttribute('aria-pressed', 'true')
    await user.click(second)
    expect(second).toHaveAttribute('aria-pressed', 'false')
    // Still the list: the button is its own control, not part of the card's link.
    expect(screen.getByRole('heading', { level: 1, name: 'Exercises' })).toBeInTheDocument()
  })

  describe('finding exercises', () => {
    const shown = () => screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)

    it('narrows to a style, brings the fundamentals along, and leaves them out when asked', async () => {
      const user = userEvent.setup()
      await renderRoute('/exercises')
      const find = within(screen.getByRole('search', { name: 'Find exercises' }))
      await user.click(find.getByRole('button', { name: /^Blues/ }))

      expect(shown()).toContain('A blues scale — box 1')
      expect(shown()).not.toContain('Ode to Joy')
      // No style of its own, so it belongs to every style.
      expect(shown()).toContain('C major — open position')

      await user.click(find.getByRole('checkbox', { name: /Fundamentals too/ }))
      expect(shown()).not.toContain('C major — open position')
      expect(shown()).toContain('A blues scale — box 1')
    })

    it('offers the children of a family once the family is chosen', async () => {
      const user = userEvent.setup()
      await renderRoute('/exercises')
      const find = within(screen.getByRole('search', { name: 'Find exercises' }))
      expect(find.queryByRole('button', { name: /^Bebop/ })).toBeNull()
      await user.click(find.getByRole('button', { name: /^Jazz/ }))
      await user.click(find.getByRole('button', { name: /^Bebop/ }))
      await user.click(find.getByRole('checkbox', { name: /Fundamentals too/ }))
      // Jazz or bebop is still all of jazz: choices in one facet widen.
      expect(shown()).toContain('A bossa study')
    })

    it('reads the filter from the URL, and writes it back', async () => {
      const user = userEvent.setup()
      const { router } = await renderRoute('/exercises?ctx=rhythm-changes&level=4')
      expect(shown()).toEqual(['Rhythm changes in B♭ — the A section'])
      // Arriving with something chosen behind the button opens the panel.
      const find = within(screen.getByRole('search', { name: 'Find exercises' }))
      expect(find.getByRole('button', { name: /^Filters/ })).toHaveAttribute('aria-expanded', 'true')
      expect(find.getByRole('button', { name: /^Rhythm changes/ })).toHaveAttribute('aria-pressed', 'true')

      await user.click(find.getByRole('button', { name: 'Remove Level 4' }))
      expect(router.state.location.search).toEqual({ ctx: 'rhythm-changes' })
    })

    it('searches, says when nothing matches, and clears', async () => {
      const user = userEvent.setup()
      await renderRoute('/exercises')
      const search = screen.getByRole('searchbox', { name: 'Search exercises' })
      await user.type(search, 'dorian')
      // The list follows once the typing settles.
      await waitFor(() => expect(shown()).not.toContain('Ode to Joy'))
      expect(shown()).toContain('D Dorian — fifth position')

      await user.type(search, ' bagpipes')
      await user.click(await screen.findByRole('button', { name: 'Show everything' }))
      expect(shown()).toContain('Ode to Joy')
      expect(search).toHaveValue('')
    })
  })
})
