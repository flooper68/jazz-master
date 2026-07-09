import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { defaultProfile } from '../../appData/profile'
import type { PracticeSession } from '../../appData/session'
import { LESSONS } from '../../content'
import { renderRoute } from '../../test/renderRoute'
import {
  resetTrpcTestData,
  seedTrpcTestProfile,
  seedTrpcTestSessions,
  setTrpcTestSessionsRepositoryAvailable,
} from '../../test/trpcTestFetch'

beforeEach(() => {
  resetTrpcTestData()
  seedTrpcTestProfile(defaultProfile('2026-07-06T10:00:00.000Z'))
})

// The dashboard's Start handoff navigates to the real /practice route, so the
// page renders through the app route tree instead of in isolation.
function renderDashboard() {
  return renderRoute('/')
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
  it('shows the starter plan with reasons and zeroed stats before any session', async () => {
    await renderDashboard()

    expect(
      screen.getByRole('heading', { name: "Today's plan" }),
    ).toBeInTheDocument()
    expect((await screen.findAllByText(/Starts your/)).length).toBeGreaterThan(0)
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

  it('shows a planner error instead of the empty-plan prompt when sessions are unavailable', async () => {
    setTrpcTestSessionsRepositoryAvailable(false)

    await renderDashboard()

    expect(
      await screen.findByText('Planner database is not configured.'),
    ).toBeInTheDocument()
    expect(screen.queryByText(/No matching lessons yet/)).not.toBeInTheDocument()
  })

  it('computes streak and minutes this week from session history', async () => {
    seedTrpcTestSessions([
      session({ startedAt: daysAgoIso(0), durationSeconds: 600 }),
      session({ startedAt: daysAgoIso(1), durationSeconds: 300 }),
    ])
    await renderDashboard()

    await waitFor(() => {
      expect(screen.getByText('2 days')).toBeInTheDocument()
    })
    const stats = screen.getByRole('region', { name: 'Practice stats' })
    expect(within(stats).getByText('15')).toBeInTheDocument()
  })

  it('calls out lessons whose latest session needs attention', async () => {
    const arpeggioLesson = LESSONS.find(
      (lesson) => lesson.area === 'arpeggios',
    )!
    seedTrpcTestSessions([
      session({
        lessonId: arpeggioLesson.id,
        results: [
          { exerciseId: arpeggioLesson.exercises[0].id, grade: 'shaky' },
        ],
        completed: false,
      }),
    ])
    await renderDashboard()

    await waitFor(() => {
      expect(
        screen.getByText(`Needs attention: ${arpeggioLesson.title}`),
      ).toBeInTheDocument()
    })
  })

  it('shows completed lesson counts per area', async () => {
    seedTrpcTestSessions([session({ lessonId: LESSONS[0].id })])
    await renderDashboard()

    const scalesArea = screen
      .getByRole('heading', { name: 'Scales' })
      .closest('li')
    await waitFor(() => {
      expect(
        within(scalesArea as HTMLElement).getByText('1 of 5 lessons completed'),
      ).toBeInTheDocument()
    })
  })

  it('marks done plan items and offers Practice again once the plan is complete', async () => {
    seedTrpcTestSessions(
      [
        'scales-major-open',
        'scales-major-middle',
        'arpeggios-maj7',
        'arpeggios-m7',
      ].map((lessonId) => session({ lessonId })),
    )
    await renderDashboard()

    await waitFor(() => {
      expect(screen.getAllByText('Done today').length).toBeGreaterThan(0)
    })
    expect(screen.getByText('Plan complete — nice work.')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Practice again' }),
    ).toBeInTheDocument()
  })

  it('starts the next planned lesson in the runner via the primary action', async () => {
    const user = userEvent.setup()
    await renderDashboard()
    const nextUp = await screen.findByText(/^Next up: /)
    const lessonTitle = nextUp.textContent?.replace('Next up: ', '')
    const lesson = LESSONS.find((candidate) => candidate.title === lessonTitle)
    expect(lesson).toBeDefined()

    await user.click(screen.getByRole('button', { name: 'Start practicing' }))

    expect(
      screen.getByText(`Exercise 1 of ${lesson!.exercises.length}`),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: lesson!.title }),
    ).toBeInTheDocument()
  })
})
