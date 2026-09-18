import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import type { Feel } from '../appData/run'
import { FeelInput } from './FeelInput'

/** The control holding its own answer, as the summary holds it. */
function Playground({ value: initial, subject }: { value: Feel | null; subject?: string }) {
  const [value, setValue] = useState<Feel | null>(initial)
  return (
    <div className="max-w-md rounded-2xl border border-line bg-panel p-3.5">
      <FeelInput value={value} onChange={setValue} subject={subject} />
    </div>
  )
}

const meta = {
  title: 'Components/FeelInput',
  component: Playground,
  args: { value: null },
  parameters: {
    docs: {
      description: {
        component:
          'How it felt, beside how it went — a different question, used differently. “How did it go” moves the schedule; this never does. It decides what a session opens on, what it ends on, how much of a slog the app will ask for in one sitting, and whether a bad week gets a gentler session. Optional, nothing chosen for you, and pressing the chosen one again clears it; saying nothing reads as fine.',
      },
    },
  },
} satisfies Meta<typeof Playground>
export default meta
type Story = StoryObj<typeof meta>

export const Unanswered: Story = {}
/** Loved items end sessions and lead a recovery week. */
export const Loved: Story = { args: { value: 'loved' } }
/** A slog is rationed: at most one a session, and it is called stuck a day sooner. */
export const Dragged: Story = { args: { value: 'dragged' } }
export const Fine: Story = { args: { value: 'fine' } }
/** On a session summary several of these share a screen, so each says what it is about. */
export const WithSubject: Story = { args: { value: 'loved', subject: 'C major — open position' } }
