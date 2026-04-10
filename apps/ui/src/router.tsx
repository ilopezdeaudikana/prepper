import { Suspense, lazy } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { Loading } from './common/components/loading.tsx'

const Challenge = lazy(() => import('./challenge/views/challenge.view.tsx'))
const Finale = lazy(() => import('./finale/views/finale.view.tsx'))
const History = lazy(() => import('./history/views/history.view.tsx'))

export const router = createBrowserRouter([
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
    path: '/finale',
    element: (
      <Suspense fallback={<Loading />}>
        <Finale />
      </Suspense>
    ),
  }
])