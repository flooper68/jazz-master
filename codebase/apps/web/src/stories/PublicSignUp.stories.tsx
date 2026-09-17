import type { Meta, StoryObj } from '@storybook/react-vite'
import { createFakeClerk, FAKE_CODE } from '../auth/fakeClerk'
import { SignUpFlow } from '../auth/SignUpFlow'
const meta = { title: 'Pages/SignUp', component: SignUpFlow,
  tags: ['!autodocs'],
  parameters: { layout: 'centered', docs: { description: { component: `Our own sign-up screens over Clerk's API, here against a stand-in: any new email works, and the verification code is ${FAKE_CODE}. Nothing is sent anywhere.` } } },
  args: { loadClerk: async () => createFakeClerk(), navigate: () => {} },
  decorators: [(Story) => <div className="w-[26rem] max-w-full rounded-xl border border-line bg-panel py-6"><Story /></div>],
} satisfies Meta<typeof SignUpFlow>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const InvitationOnly: Story = { args: { loadClerk: async () => createFakeClerk({ signUpMode: 'restricted' }) } }
