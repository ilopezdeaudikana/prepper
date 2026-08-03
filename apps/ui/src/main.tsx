import './globals.css'
import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ErrorBoundary from './common/components/error-boundary'
import { ToastProvider } from '@repo/toast'
import { ConfigProvider, Flex, theme, Typography, App } from 'antd'
import { InfoPanel } from './common/components/info-panel'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const queryClient = new QueryClient()

const rootElement = document.getElementById('root')!

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <RouterProvider router={router} />
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
                <InfoPanel title="Frontend interview prepper agent">
                  <Flex vertical gap="18">
                    <Typography.Paragraph>
                      Stack: Mastra, Supabase, React, TypeScript, Monaco,
                      Recharts, React Hook Form, Zustand, Zod and Antd
                    </Typography.Paragraph>
                    <Typography.Link
                      href="https://github.com/ilopezdeaudikana/prepper"
                      target="_blank"
                    >
                      See on Github
                    </Typography.Link>
                  </Flex>
                </InfoPanel>
              </ConfigProvider>
            </App>
          </ToastProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </StrictMode>,
  )
}
