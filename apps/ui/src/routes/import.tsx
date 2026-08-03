import ImportView from '@/import/views/import.view'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/import')({
  component: ImportView,
})

