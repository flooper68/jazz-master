import { createFileRoute } from '@tanstack/react-router'
import AccountRoutePage from '../pages/AccountRoutePage'

export const Route = createFileRoute('/account')({
  component: AccountRoutePage,
})
