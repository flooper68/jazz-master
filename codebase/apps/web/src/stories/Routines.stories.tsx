import type { Meta, StoryObj } from '@storybook/react-vite'
import { PagePreview } from './PagePreview'

const meta = {
  title: 'Pages/Routines', component: PagePreview,
  parameters: { layout: 'fullscreen', docs: { description: { component: 'Practice routines: prepared sets of exercises, made, changed, started and deleted against an in-memory fixture.' } } },
  args: { path: '/routines', scenario: 'ready' },
  render: (args) => <PagePreview key={`${args.path}-${args.scenario}`} {...args} />,
} satisfies Meta<typeof PagePreview>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const Empty: Story = { args: { scenario: 'empty' } }
export const LoadError: Story = { args: { scenario: 'error' } }
