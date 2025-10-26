import { useNavigate } from 'react-router-dom'
import { useDashboard } from '../hooks/useDashboard'
import { useModule } from '../contexts/ModuleContext'
import { Users, TestTube, BarChart3, FileText, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import { StatCard, ModernCard } from '../components/ModernCard'
import { LoadingPage } from '../components/LoadingSpinner'

export function Dashboard() {
  const navigate = useNavigate()
  const { data: dashboardData, isLoading } = useDashboard()
  const { modulo, getModuleInfo } = useModule()
  const currentModule = getModuleInfo(modulo)

  if (isLoading) {
    return <LoadingPage text="Carregando dashboard..." />
  }

  const statsCards = [
    {
      title: 'Total de Clientes',
      value: dashboardData?.totais.clientes || 0,
      icon: Users,
      onClick: () => navigate('/clientes'),
    },
    {
      title: `Amostras ${currentModule.nome}`,
      value: dashboardData?.totais.amostras || 0,
      icon: TestTube,
      onClick: () => navigate('/amostras'),
    },
    {
      title: `Lotes ${currentModule.nome}`,
      value: dashboardData?.totais.lotes || 0,
      icon: BarChart3,
      onClick: () => navigate('/lotes'),
    },
    {
      title: `Resultados ${currentModule.nome}`,
      value: dashboardData?.totais.resultados || 0,
      icon: FileText,
      onClick: () => navigate('/resultados'),
    },
  ]

  const statusCards = [
    {
      title: `Pendentes ${currentModule.nome}`,
      value: dashboardData?.status.pendentes || 0,
      icon: Clock,
      onClick: () => navigate('/amostras?status=pendente'),
    },
    {
      title: `Em Análise ${currentModule.nome}`,
      value: dashboardData?.status.emAnalise || 0,
      icon: TrendingUp,
      onClick: () => navigate('/amostras?status=em_analise'),
    },
    {
      title: `Concluídas ${currentModule.nome}`,
      value: dashboardData?.status.concluidas || 0,
      icon: CheckCircle,
      onClick: () => navigate('/amostras?status=concluida'),
    },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-lg text-slate-600 font-medium">
          Sistema de análises laboratoriais - {currentModule.nome}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            onClick={stat.onClick}
            className="cursor-pointer"
          />
        ))}
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statusCards.map((status, index) => (
          <StatCard
            key={index}
            title={status.title}
            value={status.value}
            icon={status.icon}
            onClick={status.onClick}
            className="cursor-pointer"
          />
        ))}
      </div>

      {/* Quick Actions */}
      <ModernCard 
        title="Ações Rápidas" 
        subtitle="Acesso rápido às principais funcionalidades do sistema"
        icon={BarChart3}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button 
              className="btn btn-outline btn-md flex items-center justify-center hover:bg-emerald-50"
              onClick={() => navigate('/clientes')}
            >
            <Users className="w-4 h-4 mr-2" />
            Gerenciar Clientes
          </button>
          <button 
            className="btn btn-outline btn-md flex items-center justify-center hover:bg-green-50"
            onClick={() => navigate('/amostras')}
          >
            <TestTube className="w-4 h-4 mr-2" />
            Gerenciar Amostras
          </button>
          <button 
            className="btn btn-outline btn-md flex items-center justify-center hover:bg-purple-50"
            onClick={() => navigate('/lancamento-resultados')}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Lançar Resultados
          </button>
          <button 
            className="btn btn-outline btn-md flex items-center justify-center hover:bg-orange-50"
            onClick={() => navigate('/relatorios')}
          >
            <FileText className="w-4 h-4 mr-2" />
            Gerar Relatórios
          </button>
        </div>
      </ModernCard>
    </div>
  )
}