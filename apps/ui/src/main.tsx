import './globals.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import ErrorBoundary from './common/components/error-boundary'
import { ToastProvider } from '@repo/toast'
import { ConfigProvider, theme } from 'antd'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider
          theme={{
            algorithm: theme.defaultAlgorithm,
            token: {
              colorBgBase: '#e5e7eb',
            },
          }}
        >
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </ConfigProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
)
