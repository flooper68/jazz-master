import type { Meta, StoryObj } from '@storybook/react-vite'
import { Card } from './Primitives'
const meta = { title: 'Primitives/Card', component: Card, args: { children: 'A focused daily practice session.' } } satisfies Meta<typeof Card>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
