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
      id, exerciseId, startedAt, durationSeconds: 60, tempoBpm: 60, passes: 3, completed: true, difficulty: null, feel: null, sessionId: null,
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

    /** Pick an option in one of the filter's selects. */
    async function pick(user: ReturnType<typeof userEvent.setup>, category: string, option: RegExp) {
      const find = within(screen.getByRole('search', { name: 'Find exercises' }))
      await user.click(find.getByRole('combobox', { name: category }))
      await user.click(screen.getByRole('option', { name: option }))
    }

    it('narrows to a style, brings the fundamentals along, and leaves them out when asked', async () => {
      const user = userEvent.setup()
      await renderRoute('/exercises')
      const find = within(screen.getByRole('search', { name: 'Find exercises' }))
      await pick(user, 'Style', /^Blues ·/)
      expect(find.getByRole('combobox', { name: 'Style' })).toHaveTextContent(/^Blues · \d+$/)

      expect(shown()).toContain('A blues scale — box 1')
      expect(shown()).not.toContain('Ode to Joy')
      // No style of its own, so it belongs to every style.
      expect(shown()).toContain('C major — open position')

      await user.click(find.getByRole('checkbox', { name: /Fundamentals too/ }))
      expect(shown()).not.toContain('C major — open position')
      expect(shown()).toContain('A blues scale — box 1')
    })

    it('offers a family and its children in one list, the child named with its family', async () => {
      const user = userEvent.setup()
      await renderRoute('/exercises')
      const find = within(screen.getByRole('search', { name: 'Find exercises' }))
      await pick(user, 'Style', /^Jazz › Bebop/)
      await user.click(find.getByRole('checkbox', { name: /Fundamentals too/ }))
      expect(shown()).toContain('Gm7 – C7 – Fmaj7 — a bebop line')
      expect(shown()).not.toContain('A bossa study')
      // The family is all of its children.
      await pick(user, 'Style', /^Jazz ·/)
      expect(shown()).toContain('A bossa study')
      expect(shown()).toContain('Gm7 – C7 – Fmaj7 — a bebop line')
    })

    it('says how many exercises each option would show, and leaves out an option that would show none', async () => {
      const user = userEvent.setup()
      await renderRoute('/exercises?area=chords')
      const find = within(screen.getByRole('search', { name: 'Find exercises' }))
      // Voicing describes chord shapes, so it joins the row once the area is chords.
      await user.click(find.getByRole('combobox', { name: 'Voicing' }))
      const offered = screen.getAllByRole('option').map((option) => option.textContent)
      expect(offered[0]).toBe('Any voicing')
      expect(offered).toContain(`Open chords · ${EXERCISES.filter((exercise) => exercise.voicings?.includes('open')).length}`)
    })

    it('keeps the row short: voicing only under chords, and the rest of the vocabulary typed for', async () => {
      const user = userEvent.setup()
      await renderRoute('/exercises')
      const find = within(screen.getByRole('search', { name: 'Find exercises' }))
      for (const category of ['Style', 'Area', 'Level']) {
        expect(find.getByRole('combobox', { name: category })).toBeInTheDocument()
      }
      for (const category of ['Voicing', 'Harmony', 'Technique', 'Feel', 'On the neck']) {
        expect(find.queryByRole('combobox', { name: category })).toBeNull()
      }
      await pick(user, 'Area', /^Chords ·/)
      expect(find.getByRole('combobox', { name: 'Voicing' })).toBeInTheDocument()
    })

    it('offers the categories what is typed matches, and choosing one makes it a chip', async () => {
      const user = userEvent.setup()
      await renderRoute('/exercises')
      const find = within(screen.getByRole('search', { name: 'Find exercises' }))
      const search = find.getByRole('combobox', { name: 'Search exercises' })
      await user.type(search, 'strum')
      const suggestion = await screen.findByRole('option', { name: /Technique.*Strumming/ })
      await user.click(suggestion)

      // The label is a chip now, and the text it was typed into has done its work.
      expect(search).toHaveValue('')
      expect(shown()).toContain('Open chords — picked string by string, then strummed')
      expect(shown()).not.toContain('Ode to Joy')
      await user.click(find.getByRole('button', { name: 'Remove Technique: Strumming' }))
      expect(shown()).toContain('Ode to Joy')
    })

    it('does not offer a category already chosen, nor one with a select of its own', async () => {
      const user = userEvent.setup()
      await renderRoute('/exercises?area=chords&voicing=open')
      const search = within(screen.getByRole('search', { name: 'Find exercises' })).getByRole('combobox', { name: 'Search exercises' })
      // Voicing has a select under chords, so typing a voicing's name offers no category.
      await user.type(search, 'open chords')
      expect(screen.queryByRole('listbox', { name: /Categories/ })).toBeNull()
    })

    it('reads the filter from the URL, and writes it back', async () => {
      const user = userEvent.setup()
      const { router } = await renderRoute('/exercises?ctx=rhythm-changes&level=4')
      expect(shown()).toEqual(['Rhythm changes in B♭ — the A section'])
      const find = within(screen.getByRole('search', { name: 'Find exercises' }))
      expect(find.getByRole('combobox', { name: 'Level' })).toHaveTextContent(/^Level 4/)
      // Harmony has no select: what the URL chose shows as a chip, so it can still be taken off.
      await user.click(find.getByRole('button', { name: 'Remove Harmony: Rhythm changes' }))
      // Written back as text; the router parsed the arriving URL's `4` as a number, and both are read the same way.
      expect(router.state.location.search).toEqual({ level: '4' })
      await user.click(find.getByRole('button', { name: 'Clear filters' }))
      expect(router.state.location.search).toEqual({})
    })

    it('searches, says when nothing matches, and clears', async () => {
      const user = userEvent.setup()
      await renderRoute('/exercises')
      const search = screen.getByRole('combobox', { name: 'Search exercises' })
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
