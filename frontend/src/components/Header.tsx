import { useAuth } from '../contexts/AuthContext'
import { LogOut, User } from 'lucide-react'

export function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-slate-200/60 sticky top-0 z-50">
      <div className="px-8 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-green-700 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">CCAE</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Laboratório de Análises
                </h1>
                <p className="text-sm text-slate-500 font-medium">Sistema de Gestão de Amostras</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3 px-4 py-2 bg-slate-50/80 rounded-xl border border-slate-200/60">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="text-sm">
                <p className="font-semibold text-slate-900">{user?.nome}</p>
                <p className="text-slate-500 capitalize">{user?.role}</p>
              </div>
            </div>
            
            <button
              onClick={logout}
              className="btn btn-outline btn-sm flex items-center space-x-2 px-4 py-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}


