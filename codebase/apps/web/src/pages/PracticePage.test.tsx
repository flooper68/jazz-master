import { render as rtlRender, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { LESSONS } from '../content'
import { toPlanDate } from '../planner'
import {
  defaultProfile,
  getDailyPlan,
  profileStore,
  saveDailyPlan,
  sessionsStore,
} from '../storage'
import PracticePage from './PracticePage'

beforeEach(() => {
  localStorage.clear()
  profileStore.set(defaultProfile('2026-07-06T10:00:00.000Z'))
})

// The page uses router hooks (dashboard Start handoff), so it needs a router.
function render(ui: React.ReactElement) {
  return rtlRender(
    <MemoryRouter initialEntries={['/practice']}>{ui}</MemoryRouter>,
  )
}

describe('PracticePage', () => {
  it('lists every lesson in the pack', () => {
    render(<PracticePage />)
    expect(
      screen.getByRole('heading', { name: 'Practice' }),
    ).toBeInTheDocument()
    for (const lesson of LESSONS) {
      expect(screen.getAllByText(lesson.title).length).toBeGreaterThan(0)
    }
  })

  it('groups lessons under their area headings', () => {
    render(<PracticePage />)
    expect(screen.getByRole('heading', { name: 'Scales' })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Arpeggios' }),
    ).toBeInTheDocument()
  })

  it('shows level, duration, exercise count, and prerequisites per lesson', () => {
    render(<PracticePage />)
    const dorianItem = screen
      .getByText('Dorian — the ii-chord scale')
      .closest('li')
    expect(dorianItem).not.toBeNull()
    const item = within(dorianItem as HTMLElement)
    expect(item.getByText('Level 2 · ~12 min')).toBeInTheDocument()
    expect(
      item.getByText(
        '4 exercises · after: Major scale I — open position, Major scale II — middle position, adding flat keys',
      ),
    ).toBeInTheDocument()
  })

  it('starts a guided session from a lesson and returns to the list on end', async () => {
    const user = userEvent.setup()
    render(<PracticePage />)
    const first = LESSONS[0]

    await user.click(
      screen.getByRole('button', { name: `Start ${first.title}` }),
    )
    expect(
      screen.getByText(`Exercise 1 of ${first.exercises.length}`),
    ).toBeInTheDocument()
    expect(screen.getByText(first.exercises[0].title)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'End lesson' }))
    expect(
      screen.getByRole('button', { name: `Start ${first.title}` }),
    ).toBeInTheDocument()
  })

  it("renders and persists today's plan with reasons", async () => {
    render(<PracticePage />)
    const date = toPlanDate(new Date())

    expect(screen.getByRole('heading', { name: "Today's plan" })).toBeInTheDocument()
    expect(screen.getByText(/Starts your/)).toBeInTheDocument()
    await waitFor(() => {
      expect(getDailyPlan(date)?.items.length).toBeGreaterThan(0)
    })
  })

  it('reuses the saved plan for the day instead of reshuffling after history changes', () => {
    const date = toPlanDate(new Date())
    saveDailyPlan({
      date,
      totalMinutes: 12,
      items: [
        {
          lessonId: 'arpeggios-maj7',
          lessonTitle: 'Maj7 arpeggios',
          area: 'arpeggios',
          estimatedMinutes: 12,
          reason: 'Already saved for today.',
        },
      ],
    })
    sessionsStore.set([
      {
        id: 'session-1',
        lessonId: 'scales-major-open',
        startedAt: `${date}T10:00:00.000Z`,
        durationSeconds: 60,
        completed: true,
        results: [{ exerciseId: 'scales-major-open-c', grade: 'missed' }],
      },
    ])

    render(<PracticePage />)

    expect(screen.getByText('Already saved for today.')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Start planned lesson Maj7 arpeggios' }),
    ).toBeInTheDocument()
  })

  it('starts a planned lesson and marks it done after completion', async () => {
    const user = userEvent.setup()
    render(<PracticePage />)

    await user.click(screen.getByRole('button', { name: /^Start planned lesson/ }))
    const activeLesson = LESSONS.find((lesson) =>
      screen.queryByRole('heading', { level: 2, name: lesson.title }),
    )
    expect(activeLesson).toBeDefined()

    for (const _exercise of activeLesson!.exercises) {
      await user.click(screen.getByRole('button', { name: 'Got it' }))
    }
    expect(
      screen.getByRole('heading', {
        name: `Lesson complete — ${activeLesson!.title}`,
      }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Done' }))

    await waitFor(() => {
      expect(screen.getByText('Done today')).toBeInTheDocument()
    })
  })
})
