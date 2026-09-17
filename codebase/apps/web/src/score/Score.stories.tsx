import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { EXERCISES } from '../content'
import { Score } from './Score'
const [, , fMajor, arpeggios, line] = EXERCISES
const meta = { title: 'Components/Score', component: Score,
  args: { notes: line.notes, beatsPerBar: 4, keyName: line.key, view: 'both', currentIndex: 5, loop: null, cursorVisible: false, onSeek: fn(), onLoopChange: fn(), 'aria-label': line.title },
  argTypes: { view: { control: 'inline-radio', options: ['tab', 'notation', 'both'] } },
  parameters: { docs: { description: { component: 'Tab and standard notation on one time axis, with the playback cursor, the loop region and a rail of bar numbers. Press a staff to seek; press or drag the rail to loop.' } } },
} satisfies Meta<typeof Score>
export default meta
type Story = StoryObj<typeof meta>
export const BebopLine: Story = {}
export const TabOnly: Story = { args: { view: 'tab' } }
export const NotationOnly: Story = { args: { view: 'notation' } }
export const Looping: Story = { args: { loop: { startBeat: 4, endBeat: 8 }, currentIndex: 9 } }
export const MajorScale: Story = { args: { notes: fMajor.notes, keyName: 'F', 'aria-label': 'F major, open position', currentIndex: 3 } }
export const Arpeggios: Story = { args: { notes: arpeggios.notes, 'aria-label': arpeggios.title, currentIndex: null } }
