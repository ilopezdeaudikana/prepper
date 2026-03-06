import { createContext, type ReactNode, useCallback, useContext, useState } from 'react'
import { Toast, type ToastPositionKey } from './toast'

interface ToastItem {
  id: string
  content: ToastContent
  position?: ToastPositionKey
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
      position: options.position
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

  return (
    <ToastContext value={{ openToast, closeToast }}>
      {children}
      {toasts.map((toast) => (
        <Toast key={toast.id} position={toast.position}>
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
