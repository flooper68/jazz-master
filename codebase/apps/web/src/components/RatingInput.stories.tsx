import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import type { Difficulty } from '../appData/run'
import { RatingInput } from './RatingInput'

/** The control holding its own answer, as the summary holds it. */
function Playground({ value: initial, subject }: { value: Difficulty | null; subject?: string }) {
  const [value, setValue] = useState<Difficulty | null>(initial)
  return (
    <div className="max-w-md rounded-2xl border border-line bg-panel p-3.5">
      <RatingInput value={value} onChange={setValue} subject={subject} />
    </div>
  )
}

const meta = {
  title: 'Components/RatingInput',
  component: Playground,
  args: { value: null },
  parameters: {
    docs: {
      description: {
        component:
          'How it went, in one tap: Again · Hard · Good · Easy — Anki’s four, hardest first, with no safe middle and nothing chosen for you. The answer is what moves the exercise’s next review and the tempo it comes back at. Pressing the chosen answer again clears it.',
      },
    },
  },
} satisfies Meta<typeof Playground>
export default meta
type Story = StoryObj<typeof meta>

export const Unanswered: Story = {}
export const Answered: Story = { args: { value: 'good' } }
export const ItFellApart: Story = { args: { value: 'again' } }
/** On a session summary several of these share a screen, so each says what it is rating. */
export const WithSubject: Story = { args: { value: 'hard', subject: 'C major — open position' } }
