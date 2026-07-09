import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { defaultProfile } from '../../appData/profile'
import { LESSONS } from '../../content'
import { toPlanDate } from '../../planner'
import { getDailyPlan, saveDailyPlan } from '../../storage'
import { renderRoute } from '../../test/renderRoute'
import {
  resetTrpcTestData,
  seedTrpcTestProfile,
  seedTrpcTestSessions,
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

  it("renders and persists today's plan with reasons", async () => {
    await renderPage()
    const date = toPlanDate(new Date())

    expect(screen.getByRole('heading', { name: "Today's plan" })).toBeInTheDocument()
    expect(screen.getAllByText(/Starts your/).length).toBeGreaterThan(0)
    await waitFor(() => {
      expect(getDailyPlan(date)?.items.length).toBeGreaterThan(0)
    })
  })

  it('reuses the saved plan for the day instead of reshuffling after history changes', async () => {
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
    seedTrpcTestSessions([
      {
        id: crypto.randomUUID(),
        lessonId: 'scales-major-open',
        startedAt: `${date}T10:00:00.000Z`,
        durationSeconds: 60,
        completed: true,
        results: [{ exerciseId: 'scales-major-open-c', grade: 'missed' }],
      },
    ])

    await renderPage()

    expect(screen.getByText('Already saved for today.')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Start planned lesson Maj7 arpeggios' }),
    ).toBeInTheDocument()
  })

  it('starts a planned lesson and marks it done after completion', async () => {
    const user = userEvent.setup()
    await renderPage()

    await user.click(
      screen.getAllByRole('button', { name: /^Start planned lesson/ })[0],
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

    await user.click(screen.getByRole('button', { name: 'Done' }))

    await waitFor(() => {
      expect(screen.getByText('Done today')).toBeInTheDocument()
    })
  })
})
