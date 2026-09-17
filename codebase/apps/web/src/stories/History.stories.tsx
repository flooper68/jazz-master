import type { Meta, StoryObj } from '@storybook/react-vite'
import { PagePreview } from './PagePreview'

const meta = {
  title: 'Pages/History', component: PagePreview,
  parameters: { layout: 'fullscreen', docs: { description: { component: 'Saved runs, a day at a time, from an in-memory fixture.' } } },
  args: { path: '/history', scenario: 'ready' },
  render: (args) => <PagePreview key={`${args.path}-${args.scenario}`} {...args} />,
} satisfies Meta<typeof PagePreview>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const Empty: Story = { args: { scenario: 'empty' } }
export const LoadError: Story = { args: { scenario: 'error' } }
