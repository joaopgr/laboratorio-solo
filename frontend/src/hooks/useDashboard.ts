import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import { useModule } from '../contexts/ModuleContext'

export interface DashboardData {
  totais: {
    clientes: number
    lotes: number
    amostras: number
    resultados: number
  }
  status: {
    pendentes: number
    emAnalise: number
    concluidas: number
  }
}

export function useDashboard() {
  const { modulo } = useModule()
  
  return useQuery<DashboardData>({
    queryKey: ['dashboard', modulo],
    queryFn: async () => {
      const response = await api.get('/relatorios/dashboard', {
        params: { modulo }
      })
      return response.data
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos
    staleTime: 10000, // Considerar dados "frescos" por 10 segundos
  })
}

