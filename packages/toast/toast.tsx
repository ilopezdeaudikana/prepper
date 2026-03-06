import { useEffect, type CSSProperties, type JSX, type ReactNode } from 'react'
import { useToast } from './toast.context'

interface ToastProps {
  id: string
  position?: ToastPositionKey
  stackOffset?: number
  children: ReactNode
}

export const TOAST_DEFAULT_HEIGHT = 50

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
  children,
  stackOffset
}: ToastProps): JSX.Element => {

  const { closeToast } = useToast()

  const positionMap: Record<ToastPositionKey, string> = {
    [ToastPosition.TopLeft]: 'left-10',
    [ToastPosition.BottomLeft]: 'left-10',
    [ToastPosition.TopRight]: 'right-10',
    [ToastPosition.BottomRight]: 'right-10',
  }
  const positionCss = positionMap[position]
  const offset = stackOffset ?? TOAST_DEFAULT_HEIGHT
  const offsetStyle: CSSProperties = (position === ToastPosition.TopLeft || position === ToastPosition.TopRight)
    ? { top: offset }
    : { bottom: offset }

  useEffect(() => {
    const timeout = setTimeout(() => {
      closeToast(id)
    }, 6000)

    return () => {
      clearTimeout(timeout)
    }
  }, [closeToast, id])

  return (
    <div
      className={`fixed z-[9999] rounded-md bg-zinc-700 px-3 py-2 text-white shadow-lg ${positionCss}`}
      style={offsetStyle}
    >
      {children}
    </div>
  )
}
