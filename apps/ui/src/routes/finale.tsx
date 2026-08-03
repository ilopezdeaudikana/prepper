import FinaleView from '@/finale/views/finale.view'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/finale')({
  component: FinaleView,
})

