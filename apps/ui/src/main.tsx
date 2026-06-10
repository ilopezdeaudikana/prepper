import './globals.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ErrorBoundary from './common/components/error-boundary'
import { ToastProvider } from '@repo/toast'
import { ConfigProvider, Flex, theme, Typography, App } from 'antd'
import { InfoPanel } from './common/components/info-panel'
import { Identification } from './common/components/identification'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App>
          <ConfigProvider
            theme={{
              algorithm: theme.defaultAlgorithm,
              token: {
                colorBgBase: '#e5e7eb',
              },
              components: {
                Input: {
                  colorBgContainer: '#fdfdfdff',
                },
                Select: {
                  colorBgContainer: '#fdfdfdff',
                },
                Checkbox: {
                  colorBgContainer: '#fdfdfdff',
                },
              },
            }}
          >
            <ToastProvider>
              <RouterProvider router={router} />
            </ToastProvider>
            <InfoPanel title="Frontend interview prepper agent">
              <Flex vertical gap="18">
                <Typography.Paragraph>
                  Stack: Mastra, Supabase, React, TypeScript, Monaco and Antd
                </Typography.Paragraph>
                <Typography.Link
                  href="https://github.com/ilopezdeaudikana/prepper"
                  target="_blank"
                >
                  See on Github
                </Typography.Link>
              </Flex>
            </InfoPanel>
            <Identification />
          </ConfigProvider>
        </App>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)
