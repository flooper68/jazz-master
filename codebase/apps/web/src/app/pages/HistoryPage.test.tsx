import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { LESSONS } from '../../content'
import { toPlanDate } from '../../planner'
import { sessionsStore, type PracticeSession } from '../../storage'
import HistoryPage from './HistoryPage'

const scalesLesson = LESSONS.find((lesson) => lesson.area === 'scales')!
const arpeggiosLesson = LESSONS.find((lesson) => lesson.area === 'arpeggios')!

function daysAgo(days: number, hour: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(hour, 0, 0, 0)
  return date
}

function session(
  id: string,
  startedAt: Date,
  overrides: Partial<PracticeSession> = {},
): PracticeSession {
  return {
    id,
    lessonId: scalesLesson.id,
    startedAt: startedAt.toISOString(),
    durationSeconds: 300,
    completed: true,
    results: [
      { exerciseId: scalesLesson.exercises[0].id, grade: 'got-it' },
      { exerciseId: scalesLesson.exercises[1].id, grade: 'shaky' },
    ],
    ...overrides,
  }
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/history']}>
      <HistoryPage />
    </MemoryRouter>,
  )
}

function sessionItem(accessibleTitle: string | RegExp): HTMLElement {
  const heading = screen.getByRole('heading', { level: 3, name: accessibleTitle })
  return heading.closest('li') as HTMLElement
}

beforeEach(() => {
  localStorage.clear()
})

describe('HistoryPage', () => {
  it('groups sessions by day, newest day first, with duration and grade tally', () => {
    sessionsStore.set([
      session('older', daysAgo(2, 9), { durationSeconds: 45 }),
      session('today', daysAgo(0, 8), { durationSeconds: 725 }),
    ])
    renderPage()

    const dayHeadings = screen.getAllByRole('heading', { level: 2 })
    expect(dayHeadings.map((heading) => heading.textContent)).toEqual([
      toPlanDate(daysAgo(0, 8)),
      toPlanDate(daysAgo(2, 9)),
    ])

    const todayGroup = dayHeadings[0].closest('section') as HTMLElement
    const item = within(todayGroup)
    expect(item.getByText(scalesLesson.title)).toBeInTheDocument()
    expect(item.getByText(/12 min/)).toBeInTheDocument()
    expect(item.getByText('1 got it, 1 shaky, 0 missed')).toBeInTheDocument()
  })

  it('expands a session to show per-exercise grades', async () => {
    const user = userEvent.setup()
    sessionsStore.set([session('one', daysAgo(0, 8))])
    renderPage()

    const details = screen.getByRole('button', { name: /^Details for/ })
    expect(details).toHaveAttribute('aria-expanded', 'false')
    await user.click(details)
    expect(details).toHaveAttribute('aria-expanded', 'true')

    expect(screen.getByText(scalesLesson.exercises[0].title)).toBeInTheDocument()
    expect(screen.getByText('Got it')).toBeInTheDocument()
    expect(screen.getByText(scalesLesson.exercises[1].title)).toBeInTheDocument()
    expect(screen.getByText('Shaky')).toBeInTheDocument()
  })

  it('marks incomplete sessions and states how far they got', async () => {
    const user = userEvent.setup()
    sessionsStore.set([
      session('partial', daysAgo(0, 8), {
        completed: false,
        results: [{ exerciseId: scalesLesson.exercises[0].id, grade: 'missed' }],
      }),
    ])
    renderPage()

    expect(screen.getByText('Incomplete')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^Details for/ }))
    expect(
      screen.getByText(
        `1 of ${scalesLesson.exercises.length} exercises graded before the session ended.`,
      ),
    ).toBeInTheDocument()
  })

  it('filters by area', async () => {
    const user = userEvent.setup()
    sessionsStore.set([
      session('scales-run', daysAgo(0, 8)),
      session('arps-run', daysAgo(0, 9), {
        lessonId: arpeggiosLesson.id,
        results: [
          { exerciseId: arpeggiosLesson.exercises[0].id, grade: 'got-it' },
        ],
      }),
    ])
    renderPage()

    expect(screen.getByText(scalesLesson.title)).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Area'), 'arpeggios')
    expect(screen.queryByText(scalesLesson.title)).not.toBeInTheDocument()
    expect(screen.getByText(arpeggiosLesson.title)).toBeInTheDocument()
  })

  it('filters by time range', async () => {
    const user = userEvent.setup()
    sessionsStore.set([
      session('recent', daysAgo(1, 8)),
      session('old', daysAgo(10, 8)),
    ])
    renderPage()

    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(2)
    await user.selectOptions(screen.getByLabelText('Period'), '7d')
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1)
    expect(
      screen.getByRole('heading', { level: 2, name: toPlanDate(daysAgo(1, 8)) }),
    ).toBeInTheDocument()
  })

  it('shows a distinct message when filters match nothing', async () => {
    const user = userEvent.setup()
    sessionsStore.set([session('scales-run', daysAgo(0, 8))])
    renderPage()

    await user.selectOptions(screen.getByLabelText('Area'), 'arpeggios')
    expect(
      screen.getByText('No sessions match these filters.'),
    ).toBeInTheDocument()
  })

  it('points a new user at practice when there is no history', () => {
    renderPage()
    expect(screen.getByText(/No practice sessions yet/)).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Practice page' }),
    ).toHaveAttribute('href', '/practice')
    expect(screen.queryByLabelText('Area')).not.toBeInTheDocument()
  })

  it('falls back to lesson and exercise ids when the content is gone', async () => {
    const user = userEvent.setup()
    sessionsStore.set([
      session('orphan', daysAgo(0, 8), {
        lessonId: 'removed-lesson',
        results: [{ exerciseId: 'removed-exercise', grade: 'got-it' }],
      }),
    ])
    renderPage()
    const item = sessionItem('removed-lesson')
    expect(item).toBeInTheDocument()
    await user.click(within(item).getByRole('button', { name: /^Details for/ }))
    expect(screen.getByText('removed-exercise')).toBeInTheDocument()
  })
})
