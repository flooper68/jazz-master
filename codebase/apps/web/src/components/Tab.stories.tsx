import type { Meta, StoryObj } from '@storybook/react-vite'
import { LESSONS } from '../content'
import { Tab } from './Tab'
const meta = { title: 'Components/Tab', component: Tab,
  args: { notes: LESSONS[0].exercises[0].notes, 'aria-label': 'C major scale, open position' },
  parameters: { docs: { description: { component: 'Tablature laid out in time: each note sits at its beat offset, so an eighth takes half the room of a quarter. The current note gets a filled marker.' } } },
} satisfies Meta<typeof Tab>
export default meta
type Story = StoryObj<typeof meta>
export const Scale: Story = {}
export const CurrentNote: Story = { args: { currentIndex: 4 } }
export const MixedLengths: Story = { args: { notes: [
  { string: 5, fret: 3, beats: 1 }, { string: 4, fret: 2, beats: 0.5 }, { string: 4, fret: 3, beats: 0.5 },
  { string: 3, fret: 0, beats: 1 }, { string: 3, fret: 2, beats: 2 },
], currentIndex: 3 } }
