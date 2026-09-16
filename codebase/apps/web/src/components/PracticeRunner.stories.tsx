import { useState, type ComponentProps } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { PracticeRunner } from './PracticeRunner'
import { defaultPracticePreferences } from '../appData/preferences'
import { LESSONS } from '../content'
function RunnerExample(args: ComponentProps<typeof PracticeRunner>) {
  const [preferences, setPreferences] = useState(args.preferences)
  return <PracticeRunner {...args} preferences={preferences}
    onNotationDisplayModeChange={(mode) => setPreferences((value) => ({ ...value, notationDisplayMode: mode }))}
    onScoringToleranceChange={(tolerance) => setPreferences((value) => ({ ...value, scoringTolerance: tolerance }))}
    onPlayAlongTempoChange={(id, tempo) => setPreferences((value) => ({ ...value, playAlongTempos: { ...value.playAlongTempos, [id]: tempo } }))} />
}
const meta = { title: 'Components/PracticeRunner', component: PracticeRunner,
  render: (args) => <RunnerExample key={args.lesson.id} {...args} />,
  args: { lesson: LESSONS[0], sessionId: 'storybook-run', startedAt: 1789376400000,
    preferences: defaultPracticePreferences(), onSessionChange: fn(), onExit: fn(),
    onNotationDisplayModeChange: fn(), onScoringToleranceChange: fn(), onPlayAlongTempoChange: fn(),
  },
  parameters: { docs: { description: { component: 'Interactive practice runner. Audio samples load only when Play is pressed; recording requests a microphone only when Record is pressed. All session callbacks are local Storybook actions.' } } },
} satisfies Meta<typeof PracticeRunner>
export default meta
type Story = StoryObj<typeof meta>
export const ScaleLesson: Story = {}
export const ArpeggioLesson: Story = { args: { lesson: LESSONS.find((lesson) => lesson.area === 'arpeggios')! } }
