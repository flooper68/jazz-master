import type { Meta, StoryObj } from '@storybook/react-vite'
import { LandingDownbeat } from '../components/public/downbeat/LandingDownbeat'
import type { JoinWaitlist } from '../components/public/downbeat/joinWaitlist'
const joins: JoinWaitlist = async () => true
const fails: JoinWaitlist = async () => false
const meta = { title: 'Pages/Landing', component: LandingDownbeat,
  tags: ['!autodocs'],
  parameters: { layout: 'fullscreen', docs: { description: { component: 'The public landing page ("Downbeat"). The amber dot of the mark is the button: four clicks, then it opens to fill the screen and becomes the stage. Below it: simple, easy, effective, and the beta waitlist on the amber closing screen. The waitlist is stubbed here; nothing is sent.' } } },
  args: { onJoin: joins },
} satisfies Meta<typeof LandingDownbeat>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const WaitlistFails: Story = { args: { onJoin: fails } }
