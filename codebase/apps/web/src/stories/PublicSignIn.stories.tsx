import type { Meta, StoryObj } from '@storybook/react-vite'
import { createFakeClerk, FAKE_CODE } from '../auth/fakeClerk'
import { SignInFlow } from '../auth/SignInFlow'
const meta = { title: 'Pages/SignIn', component: SignInFlow,
  tags: ['!autodocs'],
  parameters: { layout: 'centered', docs: { description: { component: `Our own sign-in screens over Clerk's API, here against a stand-in: sign in as player@example.com with the password "correct horse"; every code is ${FAKE_CODE}. Nothing is sent anywhere.` } } },
  args: { loadClerk: async () => createFakeClerk(), navigate: () => {} },
  decorators: [(Story) => <div className="w-[26rem] max-w-full rounded-xl border border-line bg-panel py-6"><Story /></div>],
} satisfies Meta<typeof SignInFlow>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const WithGoogle: Story = { args: { loadClerk: async () => createFakeClerk({ social: ['oauth_google'] }) } }
export const SecondFactor: Story = { args: { loadClerk: async () => createFakeClerk({ account: { email: 'player@example.com', password: 'correct horse', secondFactor: true } }) } }
