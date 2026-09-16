import type { Meta, StoryObj } from '@storybook/react-vite'
import { LESSONS } from '../content'
import { PagePreview } from './PagePreview'

const meta = {
  title: 'Pages/Lesson', component: PagePreview,
  parameters: { layout: 'fullscreen', docs: { description: { component: 'The lesson player page. Grades are saved to an in-memory fixture; the click plays through the browser\'s Web Audio when Begin is pressed.' } } },
  args: { path: `/lessons/${LESSONS[0].id}`, scenario: 'ready' },
  render: (args) => <PagePreview key={`${args.path}-${args.scenario}`} {...args} />,
} satisfies Meta<typeof PagePreview>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const SaveError: Story = { args: { scenario: 'error' } }
