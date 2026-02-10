import { Outlet } from 'react-router-dom'
import { Sidebar, AppHeader } from '@/components/organisms'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <Sidebar />
      <main className="ml-20 mt-16 p-6">
        <Outlet />
      </main>
    </div>
  )
}
