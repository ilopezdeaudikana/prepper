import { type ReactNode } from 'react'
import { Navigate } from '@tanstack/react-router'

interface RedirectorProps {
  condition: () => boolean
  to?: string
  children: ReactNode
}

function Redirector({
  condition,
  to = '/',
  children,
}: RedirectorProps) {

  if (condition()) {
    return <Navigate to={to} />
  } else {
    return <>{children}</>
  }
}

export { Redirector }
