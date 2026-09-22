import { Outlet } from 'react-router-dom'
import { Titlebar } from './Titlebar'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  return (
    <>
      <Titlebar />
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </>
  )
}
