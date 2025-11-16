import { useAuth } from '../contexts/AuthContext'
import { LogOut } from 'lucide-react'

export function ClientePortal() {
  const { logout } = useAuth()
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white shadow-lg rounded-2xl p-8 text-center space-y-3">
        <h1 className="text-2xl font-bold text-gray-900">Área em desenvolvimento</h1>
        <p className="text-gray-600">Esta área será implementada na FASE 3 de desenvolvimento.</p>
        <button
          onClick={logout}
          className="inline-flex items-center justify-center px-4 py-2 mt-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </button>
      </div>
    </div>
  )
}
