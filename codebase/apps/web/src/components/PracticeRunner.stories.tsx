import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { PracticeRunner } from './PracticeRunner'
import { LESSONS } from '../content'
const meta = { title: 'Components/PracticeRunner', component: PracticeRunner,
  render: (args) => <PracticeRunner key={args.lesson.id} {...args} />,
  args: { lesson: LESSONS[0], sessionId: 'storybook-run', startedAt: 1789376400000, onSessionChange: fn(), onExit: fn() },
  parameters: { docs: { description: { component: 'The lesson player: fretboard, click at tempo, timer or rep counter, self-grade, summary. Session callbacks are local Storybook actions; the click plays through Web Audio once Begin is pressed.' } } },
} satisfies Meta<typeof PracticeRunner>
export default meta
type Story = StoryObj<typeof meta>
export const ScaleLesson: Story = {}
export const ArpeggioLesson: Story = { args: { lesson: LESSONS.find((lesson) => lesson.area === 'arpeggios')! } }
