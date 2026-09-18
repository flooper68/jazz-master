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
