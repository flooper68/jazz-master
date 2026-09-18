import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { resetQuickRunSettings } from '../../appData/quickRun'
import { renderRoute } from '../../test/renderRoute'
import { resetTrpcTestData, seedTrpcTestGoal } from '../../test/trpcTestFetch'

beforeEach(() => {
  resetTrpcTestData()
  localStorage.clear()
  resetQuickRunSettings()
})

const path = {
  title: 'Play a blues in F',
  status: 'active' as const,
  weight: 1,
  stages: [
    {
      title: 'The shapes',
      items: [
        { exerciseId: 'scales-major-open-c', targetTempoBpm: 60 },
        { exerciseId: 'scales-major-open-g', targetTempoBpm: 70 },
      ],
    },
    { title: 'The line', items: [{ exerciseId: 'lines-ii-v-i-f-line', targetTempoBpm: 90 }] },
  ],
}

describe('the goals page', () => {
  it('shows each goal with how far along its stages are, and which are open', async () => {
    await seedTrpcTestGoal(path)
    await renderRoute('/goals')

    expect(await screen.findByText('Play a blues in F')).toBeInTheDocument()
    // Nothing played, so the first stage is open at nothing and the second waits.
    expect(await screen.findByText('The shapes · 0%')).toBeInTheDocument()
    expect(screen.getByText('The line · locked')).toBeInTheDocument()
  })

  it('says so, and points at the assistant, when there are no goals', async () => {
    await renderRoute('/goals')
    const empty = await screen.findByText('No goals yet')
    expect(empty).toBeInTheDocument()
    // The way out of the empty state is the assistant, since paths are written and not filled in.
    expect(empty.nextElementSibling).toHaveTextContent(/assistant/)
  })
})

describe('one goal’s path', () => {
  it('reorders an exercise within its stage', async () => {
    const user = userEvent.setup()
    const goal = await seedTrpcTestGoal(path)
    await renderRoute(`/goals/${goal.id}`)

    const [shapes] = await screen.findAllByRole('listitem')
    const before = within(shapes)
      .getAllByRole('listitem')
      .map((item) => item.textContent)
    expect(before[0]).toContain('C major — open position')

    await user.click(screen.getByRole('button', { name: 'Move G major — open position up' }))
    const after = within(screen.getAllByRole('listitem')[0])
      .getAllByRole('listitem')
      .map((item) => item.textContent)
    expect(after[0]).toContain('G major — open position')
  })

  it('removes an exercise from the path', async () => {
    const user = userEvent.setup()
    const goal = await seedTrpcTestGoal(path)
    await renderRoute(`/goals/${goal.id}`)

    await user.click(await screen.findByRole('button', { name: 'Remove G major — open position from this path' }))
    expect(screen.queryByText('G major — open position')).toBeNull()
    expect(screen.getByText('C major — open position')).toBeInTheDocument()
  })

  it('changes the tempo an exercise is wanted at, and saves it when the field is left', async () => {
    const user = userEvent.setup()
    const goal = await seedTrpcTestGoal(path)
    await renderRoute(`/goals/${goal.id}`)

    const target = await screen.findByLabelText('Target tempo for C major — open position')
    await user.clear(target)
    await user.type(target, '140')
    await user.tab()
    expect(target).toHaveValue(140)
  })

  it('pauses a goal, so it stops asking anything of the practice', async () => {
    const user = userEvent.setup()
    const goal = await seedTrpcTestGoal(path)
    await renderRoute(`/goals/${goal.id}`)

    await user.click(await screen.findByRole('button', { name: 'Pause this goal' }))
    await waitFor(() => expect(screen.getByText(/asks nothing of your practice/)).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Resume this goal' })).toBeInTheDocument()
  })

  it('is a not-found page for a goal that is not this user’s', async () => {
    await renderRoute('/goals/00000000-0000-4000-8000-000000009999')
    expect(await screen.findByText(/not found/i)).toBeInTheDocument()
  })
})
