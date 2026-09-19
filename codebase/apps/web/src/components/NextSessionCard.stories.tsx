import type { Meta, StoryObj } from '@storybook/react-vite'
import { exerciseCosts } from '../appData/cost'
import { foldRuns } from '../appData/memory'
import { planNextSession, planSeed } from '../appData/nextSession'
import { SESSION_MINUTES, type SessionPlan } from '../appData/quickRun'
import { EXERCISES } from '../content'
import { runs } from '../stories/fixtures'
import { NextSessionCard } from './NextSessionCard'

function planned(history: typeof runs, minutes: number): SessionPlan {
  return planNextSession({
    state: foldRuns(history, EXERCISES),
    catalog: EXERCISES,
    seed: planSeed(history),
    budgetSeconds: minutes * 60,
    costs: exerciseCosts(history, EXERCISES),
    // The fixture week ends whenever it ends; a story should always show the
    // warm-up rather than the skipped one it would get at build time.
    lastRunEnded: null,
  })
}

/** The plan the scheduler makes of the fixture week — reasons and all. */
const fromHistory = planned(runs, 20)

/** A fresh account: nothing played, so every slot is new — and there is still a session. */
const firstVisit = planned([], 20)

/** The busy day the whole budget exists for: a warm-up, one piece of work, something to end on. */
const tenMinutes = planned(runs, 10)

/** An hour to spend, which is a long plan rather than a different kind of one. */
const anHour = planned(runs, 60)

const meta = {
  title: 'Components/NextSessionCard',
  component: NextSessionCard,
  args: { plan: fromHistory, onStart: () => {}, minutes: 20, onMinutesChange: () => {} },
  parameters: {
    docs: {
      description: {
        component:
          'The home page’s answer to “what should I practise?”: how long there is, how much the plan comes to, and one Play, so nothing has to be read before starting. The length picker is the one setting on the card — the session is assembled to fit it, opening on a warm-up and ending on something solid. “What’s in it” opens the plan — the exercises in playing order, each with the scheduler’s reason for being there (warm-up, overdue, due today, new, dessert) in its own words.',
      },
    },
  },
  render: (args) => (
    <div className="max-w-sm">
      <NextSessionCard {...args} />
    </div>
  ),
} satisfies Meta<typeof NextSessionCard>
export default meta
type Story = StoryObj<typeof meta>

export const FromHistory: Story = {}
/** Ten minutes on a busy day is a real session, not a skipped one. */
export const TenMinutes: Story = { args: { plan: tenMinutes, minutes: SESSION_MINUTES[0] } }
export const AnHour: Story = { args: { plan: anHour, minutes: 60 } }
export const FirstVisit: Story = { args: { plan: firstVisit } }
/** Nothing in the catalog at all: the card says so rather than offering an empty session. */
export const NothingToPractise: Story = { args: { plan: { slots: [], plannedSeconds: 0 } } }
