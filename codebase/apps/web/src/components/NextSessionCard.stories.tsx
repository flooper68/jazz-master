import type { Meta, StoryObj } from '@storybook/react-vite'
import { foldRuns } from '../appData/memory'
import { planNextSession, planSeed } from '../appData/nextSession'
import { routinePlan, type SessionPlan } from '../appData/quickRun'
import { EXERCISES } from '../content'
import { routines, runs } from '../stories/fixtures'
import { NextSessionCard } from './NextSessionCard'

/** The plan the scheduler makes of the fixture week — reasons and all. */
const fromHistory: SessionPlan = {
  ...planNextSession(foldRuns(runs, EXERCISES), EXERCISES, planSeed(runs)),
  routine: null,
}

/** A fresh account: nothing played, so every slot is new — and there is still a session. */
const firstVisit: SessionPlan = { ...planNextSession(foldRuns([], EXERCISES), EXERCISES, planSeed([])), routine: null }

const meta = {
  title: 'Components/NextSessionCard',
  component: NextSessionCard,
  args: { plan: fromHistory, onStart: () => {} },
  parameters: {
    docs: {
      description: {
        component:
          'The home page’s answer to “what should I practise?”: a session worked out from the run history, never empty, with the reason each exercise is there — overdue, due today, new, ahead of schedule — in the scheduler’s own words. One Play starts it at the planned tempos.',
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
export const FirstVisit: Story = { args: { plan: firstVisit } }
/** A routine named as next wins over the generated session. */
export const ARoutineInstead: Story = { args: { plan: routinePlan(routines[0], EXERCISES) } }
/** Nothing in the catalog at all: the card says so rather than offering an empty session. */
export const NothingToPractise: Story = { args: { plan: { slots: [], routine: null } } }
