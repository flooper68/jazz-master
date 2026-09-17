import type { Meta, StoryObj } from '@storybook/react-vite'
import AccountPage from '../auth/AccountPage'
import { createFakeClerk } from '../auth/fakeClerk'
const meta = { title: 'Pages/Account', component: AccountPage,
  tags: ['!autodocs'],
  parameters: { docs: { description: { component: 'Account settings, our own page over Clerk: name, password, signed-in devices, deleting the account. Runs against an in-memory stand-in (the current password is "correct horse"); nothing is sent anywhere.' } } },
  args: { deleteAppData: async () => {} },
  decorators: [(Story) => { window.Clerk = createFakeClerk({ signedIn: true }); return <Story /> }],
} satisfies Meta<typeof AccountPage>
export default meta
export const Default: StoryObj<typeof meta> = {}
