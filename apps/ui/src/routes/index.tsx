import ChallengeView from '@/challenge/views/challenge.view'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: ChallengeView,
})

