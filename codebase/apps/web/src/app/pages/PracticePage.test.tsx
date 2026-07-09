import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { defaultProfile } from '../../appData/profile'
import type { PracticeSession } from '../../appData/session'
import { LESSONS } from '../../content'
import { renderRoute } from '../../test/renderRoute'
import {
  getTrpcTestSessions,
  resetTrpcTestData,
  seedTrpcTestProfile,
  seedTrpcTestSessions,
  setTrpcTestSessionsRepositoryAvailable,
} from '../../test/trpcTestFetch'

type User = ReturnType<typeof userEvent.setup>

beforeEach(() => {
  localStorage.clear()
  resetTrpcTestData()
  seedTrpcTestProfile(defaultProfile('2026-07-06T10:00:00.000Z'))
})

// The page uses router hooks (dashboard Start handoff), so it renders through
// the real /practice route.
function renderPage() {
  return renderRoute('/practice')
}

async function finishCurrentExercise(user: User): Promise<void> {
  await user.click(screen.getByRole('button', { name: /^Begin / }))
  await user.click(
    screen.getByRole('button', { name: /^End playthrough and grade / }),
  )
  const gradeDialog = screen.getByRole('dialog', { name: /^Grade / })
  await user.click(within(gradeDialog).getByRole('button', { name: 'Got it' }))
}

function session(overrides: Partial<PracticeSession>): PracticeSession {
  return {
    id: crypto.randomUUID(),
    lessonId: LESSONS[0].id,
    startedAt: new Date().toISOString(),
    durationSeconds: 300,
    completed: true,
    results: [{ exerciseId: LESSONS[0].exercises[0].id, grade: 'got-it' }],
    ...overrides,
  }
}

describe('PracticePage', () => {
  it('lists every lesson in the pack', async () => {
    await renderPage()
    expect(
      screen.getByRole('heading', { name: 'Practice' }),
    ).toBeInTheDocument()
    for (const lesson of LESSONS) {
      expect(screen.getAllByText(lesson.title).length).toBeGreaterThan(0)
    }
  })

  it('groups lessons under their area headings', async () => {
    await renderPage()
    expect(screen.getByRole('heading', { name: 'Scales' })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Arpeggios' }),
    ).toBeInTheDocument()
  })

  it('shows level, duration, exercise count, and prerequisites per lesson', async () => {
    await renderPage()
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
    await renderPage()
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

  it('moves focus to the incoming heading on each view swap of a full session', async () => {
    const user = userEvent.setup()
    await renderPage()
    const first = LESSONS[0]

    // List → runner: the lesson heading receives focus.
    await user.click(
      screen.getByRole('button', { name: `Start ${first.title}` }),
    )
    expect(
      screen.getByRole('heading', { level: 2, name: first.title }),
    ).toHaveFocus()

    // Runner → summary: the completion heading receives focus.
    for (const _exercise of first.exercises) {
      await finishCurrentExercise(user)
    }
    expect(
      screen.getByRole('heading', { name: `Lesson complete — ${first.title}` }),
    ).toHaveFocus()

    // Summary → list: the page heading receives focus.
    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(
      screen.getByRole('heading', { level: 1, name: 'Practice' }),
    ).toHaveFocus()
  })

  it('moves focus back to the page heading when a lesson is ended early', async () => {
    const user = userEvent.setup()
    await renderPage()
    const first = LESSONS[0]

    await user.click(
      screen.getByRole('button', { name: `Start ${first.title}` }),
    )
    await user.click(screen.getByRole('button', { name: 'End lesson' }))
    expect(
      screen.getByRole('heading', { level: 1, name: 'Practice' }),
    ).toHaveFocus()
  })

  it("renders today's server-computed plan with reasons without writing local plan storage", async () => {
    await renderPage()

    expect(screen.getByRole('heading', { name: "Today's plan" })).toBeInTheDocument()
    expect(await screen.findAllByText(/Starts your/)).not.toHaveLength(0)
    expect(localStorage.getItem('jazz-master:daily-plans')).toBeNull()
  })

  it('shows a planner error instead of the empty-plan prompt when sessions are unavailable', async () => {
    setTrpcTestSessionsRepositoryAvailable(false)

    await renderPage()

    expect(
      await screen.findByText('Planner database is not configured.'),
    ).toBeInTheDocument()
    expect(screen.queryByText(/No matching lessons yet/)).not.toBeInTheDocument()
  })

  it('ignores saved local daily plans and uses server session history', async () => {
    localStorage.setItem(
      'jazz-master:daily-plans',
      JSON.stringify({
        version: 1,
        data: {
          legacy: {
            date: 'legacy',
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
          },
        },
      }),
    )
    seedTrpcTestSessions([
      session({
        lessonId: 'scales-major-open',
        completed: true,
        results: [{ exerciseId: 'scales-major-open-c', grade: 'missed' }],
      }),
    ])

    await renderPage()

    expect(screen.queryByText('Already saved for today.')).not.toBeInTheDocument()
    expect(await screen.findByText(/was missed on/)).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'Start planned lesson Major scale I — open position',
      }),
    ).toBeInTheDocument()
  })

  it('starts a planned lesson and records completion in server history', async () => {
    const user = userEvent.setup()
    await renderPage()

    await user.click(
      (await screen.findAllByRole('button', {
        name: /^Start planned lesson/,
      }))[0],
    )
    const activeLesson = LESSONS.find((lesson) =>
      screen.queryByRole('heading', { level: 2, name: lesson.title }),
    )
    expect(activeLesson).toBeDefined()

    for (const _exercise of activeLesson!.exercises) {
      await finishCurrentExercise(user)
    }
    expect(
      screen.getByRole('heading', {
        name: `Lesson complete — ${activeLesson!.title}`,
      }),
    ).toBeInTheDocument()
    await waitFor(() => {
      expect(
        getTrpcTestSessions().some(
          (session) => session.lessonId === activeLesson!.id && session.completed,
        ),
      ).toBe(true)
    })

    await user.click(screen.getByRole('button', { name: 'Done' }))

    await waitFor(() => {
      expect(
        screen.getAllByRole('button', { name: /^Start planned lesson/ }).length,
      ).toBeGreaterThan(0)
    })
    expect(localStorage.getItem('jazz-master:daily-plans')).toBeNull()
  })
})
