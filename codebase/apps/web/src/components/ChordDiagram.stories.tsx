import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChordDiagram } from './ChordDiagram'
const meta = { title: 'Components/ChordDiagram', component: ChordDiagram,
  decorators: [(Story) => <div style={{ width: 180 }}><Story /></div>],
  args: { label: 'Cmaj7', grip: { frets: ['x', 3, 2, 0, 0, 0] } },
} satisfies Meta<typeof ChordDiagram>
export default meta
type Story = StoryObj<typeof meta>
export const OpenPosition: Story = {}
export const MovableGrip: Story = { args: { label: 'Bb7', grip: { frets: ['x', 13, 12, 13, 11, 'x'], fingers: [0, 3, 2, 4, 1, 0] } } }
