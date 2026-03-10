import { type ReactNode } from 'react'

interface CardProps {
  className?: string
  children: ReactNode
}

export const Card = ({
  children,
  className
}: CardProps) => {

  return <div className={`flex flex-col flex-1 bg-muted p-4 rounded-lg ${className}`}>{children}</div>
}

