import { useEffect, useRef, type JSX, type ReactNode } from 'react'
import { useToast } from './toast.context'

interface ToastProps {
  id: string
  position?: ToastPositionKey
  children: ReactNode
}

export const ToastPosition = {
  TopLeft: 'top-left',
  BottomLeft: 'bottom-left',
  TopRight: 'top-right',
  BottomRight: 'bottom-right',
} as const

export type ToastPositionKey = typeof ToastPosition[keyof typeof ToastPosition]

export const Toast = ({
  id,
  position = ToastPosition.BottomLeft,
  children
}: ToastProps): JSX.Element => {

  const { closeToast } = useToast()

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const positionMap: Record<ToastPositionKey, string> = {
    [ToastPosition.TopLeft]: 'top-10 left-10',
    [ToastPosition.BottomLeft]: 'bottom-10 left-10',
    [ToastPosition.TopRight]: 'top-10 right-10',
    [ToastPosition.BottomRight]: 'bottom-10 right-10',
  }
  const positionCss = positionMap[position]

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      closeToast(id)
    }, 5000)
    return () => {
      if (timeoutRef.current) clearInterval(timeoutRef.current)
    }
  },[id])
  
  return (
    <div className={`fixed z-[9999] rounded-md bg-zinc-700 px-3 py-2 text-white shadow-lg ${positionCss}`}>
      {children}
    </div>
  )
}
