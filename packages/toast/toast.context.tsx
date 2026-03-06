import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react'
import { Toast, type ToastPositionKey, TOAST_DEFAULT_HEIGHT } from './toast'

interface ToastItem {
  id: string
  content: ToastContent
  position?: ToastPositionKey
  height?: number
}

export interface ToastRenderContext {
  id: string
  close: () => void
}

export type ToastContent = ReactNode | ((context: ToastRenderContext) => ReactNode)

export interface OpenToastOptions {
  content?: ToastContent
  message?: string
  position?: ToastPositionKey
  height?: number
}

interface ToastContextProps {
  openToast: (options: OpenToastOptions) => string
  closeToast: (id?: string) => void
}

const ToastContext = createContext<ToastContextProps | null>(null)

export const useToast = (): ToastContextProps => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }

  return context
}

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const openToast = useCallback((options: OpenToastOptions): string => {
    const id = crypto.randomUUID()
    const content = options.content ?? options.message
    if (content == null) {
      throw new Error('openToast requires either `content` or `message`')
    }

    const toast: ToastItem = {
      id,
      content,
      position: options.position,
      height: options.height
    }

    setToasts((currentToasts) => [
      ...currentToasts.filter((currentToast) => currentToast.id !== id),
      toast,
    ])

    return id
  }, [])

  const closeToast = useCallback((id?: string) => {
    if (!id) {
      setToasts([])
      return
    }

    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id))
  }, [])

  const calculateStackOffset = (index: number, height?: number): number => {
    return TOAST_DEFAULT_HEIGHT + (index * (height ?? TOAST_DEFAULT_HEIGHT))
  }
  const contextValue = useMemo(() => ({ openToast, closeToast }), [openToast, closeToast])

  return (
    <ToastContext value={contextValue}>
      {children}
      {toasts.map((toast, index) => (
        <Toast key={toast.id} id={toast.id} position={toast.position} stackOffset={calculateStackOffset(index, toast.height)}>
          {typeof toast.content === 'function'
            ? toast.content({ id: toast.id, close: () => closeToast(toast.id) })
            : (
              <div className='flex items-center gap-2'>
                <div>{toast.content}</div>
                <button
                  className='cursor-pointer border-0 bg-transparent p-0 leading-none text-inherit transition-colors hover:text-black'
                  onClick={() => closeToast(toast.id)}
                >
                  &#10005;
                </button>
              </div>
            )}
        </Toast>
      ))}
    </ToastContext>
  )
}
