import type { Meta, StoryObj } from '@storybook/react-vite'
import { PagePreview } from './PagePreview'

const meta = {
  title: 'Pages/Exercises', component: PagePreview,
  parameters: { layout: 'fullscreen' },
  args: { path: '/exercises', scenario: 'ready' },
  render: (args) => <PagePreview key={`${args.path}-${args.scenario}`} {...args} />,
} satisfies Meta<typeof PagePreview>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
