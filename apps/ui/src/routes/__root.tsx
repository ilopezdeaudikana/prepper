import { Outlet, createRootRoute } from '@tanstack/react-router'

import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { Topbar } from '@/common/components/top-bar'

import React, { Suspense } from 'react'

const TanStackDevtools = import.meta.env.DEV
  ? React.lazy(() =>
      import('@tanstack/react-devtools').then((res) => ({
        default: res.TanStackDevtools,
      })),
    )
  : () => null


export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <>
      <div className="flex flex-col gap-2 p-4 align-self-center">
        <Topbar />

        <Outlet />
        <Suspense>
          <TanStackDevtools
            config={{
              position: 'bottom-right',
            }}
            plugins={[
              {
                name: 'TanStack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
        </Suspense>
      </div>
    </>
  )
}
