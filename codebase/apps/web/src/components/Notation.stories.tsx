import type { Meta, StoryObj } from '@storybook/react-vite'
import { deriveRhythm, resolveExercise, LESSONS } from '../content'
import { Notation } from './Notation'
const meta = { title: 'Components/Notation', component: Notation,
  args: { measures: deriveRhythm(resolveExercise(LESSONS[0].exercises[0]).positions), displayMode: 'both' },
} satisfies Meta<typeof Notation>
export default meta
type Story = StoryObj<typeof meta>
export const StaffAndTab: Story = {}
export const Staff: Story = { args: { displayMode: 'staff' } }
export const Tab: Story = { args: { displayMode: 'tab' } }
export const FocusSize: Story = { args: { size: 'focus' } }
