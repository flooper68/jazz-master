import { createFileRoute } from '@tanstack/react-router'
import RepertoirePage from '../pages/RepertoirePage'

export const Route = createFileRoute('/repertoire')({
  component: RepertoirePage,
})
