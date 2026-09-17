import type { Meta, StoryObj } from '@storybook/react-vite'
import { PagePreview } from './PagePreview'

const meta = {
  title: 'Pages/Routines', component: PagePreview,
  parameters: { layout: 'fullscreen', docs: { description: { component: 'Practice routines: prepared sets of exercises, as cards, with a page each for making and changing one, against an in-memory fixture.' } } },
  args: { path: '/routines', scenario: 'ready' },
  render: (args) => <PagePreview key={`${args.path}-${args.scenario}`} {...args} />,
} satisfies Meta<typeof PagePreview>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const NewRoutine: Story = { args: { path: '/routines/new' } }
export const EditRoutine: Story = { args: { path: '/routines/story-warm-up/edit' } }
export const Empty: Story = { args: { scenario: 'empty' } }
export const LoadError: Story = { args: { scenario: 'error' } }
