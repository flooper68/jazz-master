import type { Meta, StoryObj } from '@storybook/react-vite'
import { Fretboard } from './Fretboard'
const meta = { title: 'Components/Fretboard', component: Fretboard, args: { 'aria-label': 'Guitar fretboard' } } satisfies Meta<typeof Fretboard>
export default meta
type Story = StoryObj<typeof meta>
export const Empty: Story = {}
export const HighlightedNotes: Story = { args: { fretRange: { min: 0, max: 5 }, highlights: [
  { string: 5, fret: 3, label: 'C', role: 'root' },
  { string: 4, fret: 2, label: 'E' }, { string: 3, fret: 0, label: 'G' },
  { string: 3, fret: 3, label: 'Bb' },
] } }
export const UpperPosition: Story = { args: { fretRange: { min: 10, max: 14 }, highlights: [{ string: 6, fret: 12, label: 'E', role: 'root' }] } }
