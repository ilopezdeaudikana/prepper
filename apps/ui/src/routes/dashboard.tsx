import DashboardView from '@/dashboard/views/dashboard.view'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard')({
  component: DashboardView,
})

