import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { ExerciseRunner } from './ExerciseRunner'
import { EXERCISES } from '../content'
const meta = { title: 'Components/ExerciseRunner', component: ExerciseRunner,
  render: (args) => <div className="flex h-[640px] flex-col"><ExerciseRunner key={args.exercise.id} {...args} /></div>,
  args: { exercise: EXERCISES[0], onRunChange: fn(), onExit: fn() },
  parameters: { docs: { description: { component: 'One exercise, start to finish: the exercise as a tab, click at tempo with a cursor on the current note, timer or pass counter, then the summary where the run is answered Again, Hard, Good or Easy. Saving the run and leaving are local Storybook actions; the click plays through Web Audio once Play is pressed.' } } },
} satisfies Meta<typeof ExerciseRunner>
export default meta
type Story = StoryObj<typeof meta>
export const ClockedScale: Story = {}
export const CountedLine: Story = { args: { exercise: EXERCISES[4] } }
export const SessionStep: Story = {
  args: { session: { id: 'story-session', label: 'Next session', endLabel: 'End session', step: 2, total: 4, onContinue: fn() } },
  parameters: { docs: { description: { story: 'One exercise inside a practice session: the header says where it stands, and finishing sums the exercise up and asks how it went and how it felt. In the app Next exercise hands over to the following one; here it is a Storybook action, so the summary steps aside and comes back.' } } },
}
