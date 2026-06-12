import { Suspense, lazy } from 'react'
import { createBrowserRouter, Outlet } from 'react-router-dom'
import { Loading } from './common/components/loading.tsx'
import { Topbar } from './common/components/top-bar.tsx'

const Challenge = lazy(() => import('./challenge/views/challenge.view.tsx'))
const Finale = lazy(() => import('./finale/views/finale.view.tsx'))
const History = lazy(() => import('./history/views/history.view.tsx'))

function Layout() {
  return (
    <div className="flex flex-col gap-2 p-4 align-self-center">
      <Topbar />
      <Outlet />
    </div>
  )
}
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
