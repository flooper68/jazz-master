import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { fn } from 'storybook/test'
import { Select } from './Select'
const periods = [
  { value: 'all', label: 'All time' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
]
const guitars = [
  { value: 'nylon', label: 'Nylon (synth)', group: 'Synthesized' },
  { value: 'steel', label: 'Steel string (synth)', group: 'Synthesized' },
  { value: 'jazz', label: 'Jazz box (synth)', group: 'Synthesized' },
  { value: 'nylon-sampled', label: 'Nylon (sampled)', group: 'Sampled' },
  { value: 'jazz-sampled', label: 'Jazz guitar (sampled)', group: 'Sampled' },
]
function Demo(props: React.ComponentProps<typeof Select<string>>) {
  const [value, setValue] = useState(props.value)
  return <div className="w-56"><Select {...props} value={value} onChange={(next) => { setValue(next); props.onChange(next) }} /></div>
}
const meta = { title: 'Primitives/Select', component: Select, render: (args) => <Demo {...args} />,
  args: { options: periods, value: 'all', onChange: fn(), 'aria-label': 'Period' },
  parameters: { docs: { description: { component: 'Our own select: a button with the current choice and a keyboard-driven listbox (arrows, Home/End, Enter, Escape, type-ahead). Options can be grouped.' } } },
} satisfies Meta<typeof Select>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const Grouped: Story = { args: { options: guitars, value: 'jazz-sampled', 'aria-label': 'Guitar' } }
export const Compact: Story = { args: { options: guitars, value: 'nylon', 'aria-label': 'Guitar', compact: true } }
export const OpensAbove: Story = { args: { options: periods, placement: 'above' }, decorators: [(Story) => <div className="pt-40"><Story /></div>] }
export const IconTrigger: Story = { args: { options: guitars, value: 'jazz-sampled', 'aria-label': 'Guitar', 'data-tip': 'Which guitar plays the line', icon: <span aria-hidden="true">♩</span> } }
export const Disabled: Story = { args: { disabled: true } }
