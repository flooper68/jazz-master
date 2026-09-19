import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { ExerciseRunner } from './ExerciseRunner'
import { EXERCISES } from '../content'

/** A session of one, which is what starting an exercise from the library makes. */
const alone = { id: 'story-session', label: 'Next session', endLabel: 'End session', step: 1, total: 1, onContinue: fn() }

const meta = { title: 'Components/ExerciseRunner', component: ExerciseRunner,
  render: (args) => <div className="flex h-[640px] flex-col"><ExerciseRunner key={args.exercise.id} {...args} /></div>,
  args: { exercise: EXERCISES[0], onRunChange: fn(), onExit: fn(), session: alone },
  parameters: { docs: { description: { component: 'One exercise of a practice session, start to finish: the exercise as a tab, click at tempo with a cursor on the current note, timer or pass counter, then a summary over the stage where the run is answered — by tap or out loud. Nothing plays outside a session, so starting an exercise on its own makes a session of one. Saving the run and leaving are local Storybook actions; the click plays through Web Audio once Play is pressed.' } } },
} satisfies Meta<typeof ExerciseRunner>
export default meta
type Story = StoryObj<typeof meta>
export const ClockedScale: Story = {}
export const CountedLine: Story = { args: { exercise: EXERCISES[4] } }
export const MidSession: Story = {
  args: { session: { ...alone, step: 2, total: 4 } },
  parameters: { docs: { description: { story: 'The second of four: the header says where it stands, and finishing sums the exercise up and asks how it went and how it felt. In the app Next exercise hands over to the following one; here it is a Storybook action, so the summary steps aside and comes back.' } } },
}
