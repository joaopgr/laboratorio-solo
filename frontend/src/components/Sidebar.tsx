import { NavLink } from 'react-router-dom'
import { 
  Home, 
  Users, 
  TestTube, 
  Package,
  BarChart3, 
  FileText, 
  ChevronLeft,
  ChevronRight,
  Zap,
  Calculator,
  CheckSquare,
  Activity
} from 'lucide-react'
import { useState } from 'react'
import { useAtividades } from '../hooks/useAtividades'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Amostras', href: '/amostras', icon: TestTube },
  { name: 'Lotes', href: '/lotes', icon: Package },
  { name: 'Resultados', href: '/resultados', icon: BarChart3 },
  { name: 'Resultados Calculados', href: '/resultados-calculados', icon: Calculator },
  { name: 'Lançamento em Lote', href: '/lancamento-resultados', icon: Zap },
  { name: 'Relatórios', href: '/relatorios', icon: FileText },
  { name: 'Atividades', href: '/atividades', icon: CheckSquare },
  { name: 'Registro de Atividades', href: '/logs', icon: Activity },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  
  // Buscar atividades pendentes
  const { data: atividadesData } = useAtividades({ status: 'pendente', limit: 1000 })
  const atividadesPendentes = atividadesData?.data?.filter((a: any) => a.status === 'pendente') || []
  const countPendentes = atividadesPendentes.length

  return (
    <div className={`bg-white/90 backdrop-blur-md shadow-xl border-r border-slate-200/60 transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="flex flex-col h-full">
        {/* Toggle button */}
        <div className="p-4 border-b border-slate-200/60">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-3 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-xl transition-all duration-200"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-3">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center justify-between px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`
                }
              >
                <div className="flex items-center">
                  <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${
                    collapsed ? '' : 'group-hover:scale-110'
                  }`} />
                  {!collapsed && (
                    <span className="ml-3 font-medium">{item.name}</span>
                  )}
                </div>
                {!collapsed && item.name === 'Atividades' && countPendentes > 0 && (
                  <span className="bg-orange-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                    {countPendentes}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="p-4 border-t border-slate-200/60">
            <div className="text-xs text-slate-500 text-center font-medium">
              © 2024 CCAE - Laboratório de Análises
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


