import type { Meta, StoryObj } from '@storybook/react-vite'
import { EXERCISES } from '../content'
import { PagePreview } from './PagePreview'

const meta = {
  title: 'Pages/Exercise', component: PagePreview,
  parameters: { layout: 'fullscreen', docs: { description: { component: 'The player page for one exercise. The click plays through the browser\'s Web Audio when Play is pressed; Finish leads to the summary, where the run is saved to an in-memory fixture and can be rated.' } } },
  args: { path: `/exercises/${EXERCISES[0].id}`, scenario: 'ready' },
  render: (args) => <PagePreview key={`${args.path}-${args.scenario}`} {...args} />,
} satisfies Meta<typeof PagePreview>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const SaveError: Story = { args: { scenario: 'error' } }
export const BebopLine: Story = { args: { path: `/exercises/${EXERCISES[4].id}` } }
