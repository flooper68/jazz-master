import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { LESSONS } from '../../content'
import { toPlanDate } from '../../planner'
import {
  defaultProfile,
  profileStore,
  saveDailyPlan,
  sessionsStore,
  type PracticeSession,
} from '../../storage'
import DashboardPage from './DashboardPage'
import PracticePage from './PracticePage'

beforeEach(() => {
  localStorage.clear()
  profileStore.set(defaultProfile('2026-07-06T10:00:00.000Z'))
})

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route index element={<DashboardPage />} />
        <Route path="practice" element={<PracticePage />} />
      </Routes>
    </MemoryRouter>,
  )
}

/** A local timestamp n days before now — keeps day-based stats deterministic. */
function daysAgoIso(days: number, hour = 10): string {
  const now = new Date()
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - days,
    hour,
  ).toISOString()
}

function session(overrides: Partial<PracticeSession>): PracticeSession {
  return {
    id: crypto.randomUUID(),
    lessonId: LESSONS[0].id,
    startedAt: daysAgoIso(0),
    durationSeconds: 300,
    completed: true,
    results: [{ exerciseId: LESSONS[0].exercises[0].id, grade: 'got-it' }],
    ...overrides,
  }
}

describe('DashboardPage', () => {
  it('shows the starter plan with reasons and zeroed stats before any session', () => {
    renderDashboard()

    expect(
      screen.getByRole('heading', { name: "Today's plan" }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Starts your/)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Start practicing' }),
    ).toBeInTheDocument()
    expect(screen.getByText('0 days')).toBeInTheDocument()
    expect(screen.getByText('Practice today to start one.')).toBeInTheDocument()
    // Default profile: 20 min/day → 140 min weekly budget.
    expect(screen.getByText('of 140 min')).toBeInTheDocument()
    expect(screen.getAllByText('Not practiced yet.')).toHaveLength(2)
    expect(
      screen.getByRole('link', { name: 'See full practice history →' }),
    ).toBeInTheDocument()
  })

  it('computes streak and minutes this week from session history', () => {
    sessionsStore.set([
      session({ startedAt: daysAgoIso(0), durationSeconds: 600 }),
      session({ startedAt: daysAgoIso(1), durationSeconds: 300 }),
    ])
    renderDashboard()

    expect(screen.getByText('2 days')).toBeInTheDocument()
    const stats = screen.getByRole('region', { name: 'Practice stats' })
    expect(within(stats).getByText('15')).toBeInTheDocument()
  })

  it('calls out lessons whose latest session needs attention', () => {
    const arpeggioLesson = LESSONS.find(
      (lesson) => lesson.area === 'arpeggios',
    )!
    sessionsStore.set([
      session({
        lessonId: arpeggioLesson.id,
        results: [
          { exerciseId: arpeggioLesson.exercises[0].id, grade: 'shaky' },
        ],
        completed: false,
      }),
    ])
    renderDashboard()

    expect(
      screen.getByText(`Needs attention: ${arpeggioLesson.title}`),
    ).toBeInTheDocument()
  })

  it('shows completed lesson counts per area', () => {
    sessionsStore.set([session({ lessonId: LESSONS[0].id })])
    renderDashboard()

    const scalesArea = screen
      .getByRole('heading', { name: 'Scales' })
      .closest('li')
    expect(
      within(scalesArea as HTMLElement).getByText('1 of 5 lessons completed'),
    ).toBeInTheDocument()
  })

  it('marks done plan items and offers Practice again once the plan is complete', () => {
    const lesson = LESSONS[0]
    const date = toPlanDate(new Date())
    saveDailyPlan({
      date,
      totalMinutes: lesson.estimatedMinutes,
      items: [
        {
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          area: lesson.area,
          estimatedMinutes: lesson.estimatedMinutes,
          reason: 'Saved for today.',
        },
      ],
    })
    sessionsStore.set([session({ lessonId: lesson.id })])
    renderDashboard()

    expect(screen.getByText('Done today')).toBeInTheDocument()
    expect(screen.getByText('Plan complete — nice work.')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Practice again' }),
    ).toBeInTheDocument()
  })

  it('starts the next planned lesson in the runner via the primary action', async () => {
    const lesson = LESSONS[0]
    saveDailyPlan({
      date: toPlanDate(new Date()),
      totalMinutes: lesson.estimatedMinutes,
      items: [
        {
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          area: lesson.area,
          estimatedMinutes: lesson.estimatedMinutes,
          reason: 'Saved for today.',
        },
      ],
    })
    const user = userEvent.setup()
    renderDashboard()

    expect(screen.getByText(`Next up: ${lesson.title}`)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Start practicing' }))

    expect(
      screen.getByText(`Exercise 1 of ${lesson.exercises.length}`),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: lesson.title }),
    ).toBeInTheDocument()
  })
})
