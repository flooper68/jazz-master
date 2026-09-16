import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { PracticeRunner } from './PracticeRunner'
import { LESSONS } from '../content'
const meta = { title: 'Components/PracticeRunner', component: PracticeRunner,
  render: (args) => <PracticeRunner key={args.lesson.id} {...args} />,
  args: { lesson: LESSONS[0], sessionId: 'storybook-run', startedAt: 1789376400000, onSessionChange: fn(), onExit: fn() },
  parameters: { docs: { description: { component: 'The lesson player: the exercise as a tab, click at tempo with a cursor on the current note, timer or pass counter, then the summary. Session callbacks are local Storybook actions; the click plays through Web Audio once Play is pressed.' } } },
} satisfies Meta<typeof PracticeRunner>
export default meta
type Story = StoryObj<typeof meta>
export const ScaleLesson: Story = {}
