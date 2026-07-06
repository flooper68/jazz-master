import { createFileRoute } from '@tanstack/react-router'
import VoicingsPage from '../pages/VoicingsPage'

export const Route = createFileRoute('/voicings')({
  component: VoicingsPage,
})
