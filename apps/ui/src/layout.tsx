
import { Outlet } from 'react-router-dom'
import { Topbar } from './common/components/top-bar.tsx'


export default function Layout() {
  return (
    <div className="flex flex-col gap-2 p-4 align-self-center">
      <Topbar />
      <Outlet />
    </div>
  )
}

