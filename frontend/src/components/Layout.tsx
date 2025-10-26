import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { ModuleSelector } from './ModuleSelector'

export function Layout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-green-50">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <ModuleSelector />
          <main className="flex-1 p-8 animate-fade-in" style={{ overflowX: 'hidden', width: '100%' }}>
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}


