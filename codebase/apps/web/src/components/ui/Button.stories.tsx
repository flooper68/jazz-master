import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Primitives'
const meta = { title: 'Primitives/Button', component: Button, args: { children: 'Start practicing' } } satisfies Meta<typeof Button>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const Secondary: Story = { args: { variant: 'secondary' } }
export const Quiet: Story = { args: { variant: 'quiet' } }
export const Disabled: Story = { args: { disabled: true } }
