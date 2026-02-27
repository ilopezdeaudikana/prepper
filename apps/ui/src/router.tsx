import { Suspense, lazy } from 'react'
import { createBrowserRouter } from 'react-router-dom'

const Challenge = lazy(() => import('./challenge/views/challenge.view.tsx'))
const Configuration = lazy(() => import('./configuration/views/configuration.view.tsx'))
const Finale = lazy(() => import('./finale/views/finale.view.tsx'))

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <Configuration />
      </Suspense>
    ),
  },
  {
    path: '/challenge',
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <Challenge />
      </Suspense>
    ),
  },
  {
    path: '/finale',
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <Finale />
      </Suspense>
    ),
  }
])