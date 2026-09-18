import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { SessionNoteInput } from './SessionNoteInput'

/** The field holding its own text, as the session summary holds it. */
function Playground({ value: initial, failed }: { value: string; failed?: boolean }) {
  const [value, setValue] = useState(initial)
  return (
    <div className="max-w-xl rounded-2xl border border-line bg-panel p-3.5">
      <SessionNoteInput value={value} onChange={setValue} onCommit={() => {}} failed={failed} />
    </div>
  )
}

const meta = {
  title: 'Components/SessionNoteInput',
  component: Playground,
  args: { value: '' },
  parameters: {
    docs: {
      description: {
        component:
          'A sentence about the whole sitting, at the end of it — the one place in the app the user writes rather than taps. Nothing reads it but them: no AI, no scheduler. It is kept because what someone writes at the end of a session is worth more later than anything the numbers could be made to say. Optional, saved when the box is left, and clearing it removes it.',
      },
    },
  },
} satisfies Meta<typeof Playground>
export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}
export const Written: Story = {
  args: { value: 'The ii–V finally sat in the pocket at 90. Left hand still late on the Bb shape — start there next time.' },
}
/** The note could not be saved; the text stands and leaving the box tries again. */
export const CouldNotSave: Story = { args: { value: 'Worth keeping.', failed: true } }
