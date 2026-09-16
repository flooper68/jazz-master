import type { Meta, StoryObj } from '@storybook/react-vite'
import { Radio } from './Primitives'
const meta = { title: 'Primitives/Radio', component: Radio, args: { 'aria-label': 'Beginner', name: 'level' } } satisfies Meta<typeof Radio>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const Checked: Story = { args: { defaultChecked: true } }
export const Disabled: Story = { args: { disabled: true } }
