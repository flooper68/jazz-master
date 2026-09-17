import type { Meta, StoryObj } from '@storybook/react-vite'
import { PagePreview } from './PagePreview'

const meta = {
  title: 'Pages/Home', component: PagePreview,
  parameters: { layout: 'fullscreen', docs: { description: { component: 'The dashboard: the week, the streak, recent runs and what to pick up next, from an in-memory fixture.' } } },
  args: { path: '/', scenario: 'ready' },
  render: (args) => <PagePreview key={`${args.path}-${args.scenario}`} {...args} />,
} satisfies Meta<typeof PagePreview>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const FirstVisit: Story = { args: { scenario: 'empty' } }
export const LoadError: Story = { args: { scenario: 'error' } }
