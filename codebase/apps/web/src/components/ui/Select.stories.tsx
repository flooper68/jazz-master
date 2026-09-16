import type { Meta, StoryObj } from '@storybook/react-vite'
import { Select } from './Primitives'
const meta = { title: 'Primitives/Select', component: Select, args: { 'aria-label': 'Period', children: <><option>All time</option><option>Last 7 days</option><option>Last 30 days</option></> } } satisfies Meta<typeof Select>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const Disabled: Story = { args: { disabled: true } }
