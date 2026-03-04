import { Suspense, lazy } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { Loading } from './components/ui/loading.tsx'

const Challenge = lazy(() => import('./challenge/views/challenge.view.tsx'))
const Configuration = lazy(() => import('./configuration/views/configuration.view.tsx'))
const Finale = lazy(() => import('./finale/views/finale.view.tsx'))

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<Loading />}>
        <Configuration />
      </Suspense>
    ),
  },
  {
    path: '/challenge',
    element: (
      <Suspense fallback={<Loading />}>
        <Challenge />
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