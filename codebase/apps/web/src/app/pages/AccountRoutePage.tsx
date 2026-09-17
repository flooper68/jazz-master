import { useMutation } from '@tanstack/react-query'
import AccountPage from '../../auth/AccountPage'
import { useTRPC } from '../trpc'

/** The account page, given the app's way of deleting what it saved for this user. */
export default function AccountRoutePage() {
  const trpc = useTRPC()
  const { mutateAsync } = useMutation(trpc.users.deleteData.mutationOptions())
  return (
    <AccountPage
      deleteAppData={async () => {
        const result = await mutateAsync()
        if (result.status !== 'ok') throw new Error('Your saved data could not be deleted, so the account was left as it is. Try again in a moment.')
      }}
    />
  )
}
