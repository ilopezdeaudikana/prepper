import { Suspense, lazy } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { Loading } from './common/components/loading.tsx'
import Layout from './layout.tsx'

const Challenge = lazy(() => import('./challenge/views/challenge.view.tsx'))
const Dashboard = lazy(() => import('./dashboard/views/dashboard.view.tsx'))
const Finale = lazy(() => import('./finale/views/finale.view.tsx'))
const History = lazy(() => import('./history/views/history.view.tsx'))
const Import = lazy(() => import('./import/views/import.view.tsx'))

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: '/',
        element: (
          <Suspense fallback={<Loading />}>
            <Challenge />
          </Suspense>
        ),
      },
      {
        path: '/history',
        element: (
          <Suspense fallback={<Loading />}>
            <History />
          </Suspense>
        ),
      },
      {
        path: '/dashboard',
        element: (
          <Suspense fallback={<Loading />}>
            <Dashboard />
          </Suspense>
        ),
      },
      {
        path: '/import',
        element: (
          <Suspense fallback={<Loading />}>
            <Import />
          </Suspense>
        ),
      },
      {
        path: '/finale',
        element: (
          <Suspense fallback={<Loading />}>
            <Finale />
          </Suspense>
        ),
      },
    ],
  },
])
