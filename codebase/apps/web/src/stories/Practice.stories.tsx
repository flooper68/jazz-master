import type { Meta, StoryObj } from '@storybook/react-vite'
import { PagePreview } from './PagePreview'

const meta = {
  title: 'Pages/Practice', component: PagePreview,
  parameters: { layout: 'fullscreen' },
  args: { path: '/practice', scenario: 'ready' },
  render: (args) => <PagePreview key={`${args.path}-${args.scenario}`} {...args} />,
} satisfies Meta<typeof PagePreview>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const Empty: Story = { args: { scenario: 'empty' } }
export const Loading: Story = { args: { scenario: 'loading' } }
export const Error: Story = { args: { scenario: 'error' } }
