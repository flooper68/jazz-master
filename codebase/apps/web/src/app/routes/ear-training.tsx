import { createFileRoute } from '@tanstack/react-router'
import EarTrainingPage from '../pages/EarTrainingPage'

export const Route = createFileRoute('/ear-training')({
  component: EarTrainingPage,
})
