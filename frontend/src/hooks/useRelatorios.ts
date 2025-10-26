import { useQuery, useMutation, useQueryClient } from 'react-query'
import { api } from '../services/api'
import { useModule } from '../contexts/ModuleContext'

export interface RelatorioFilters {
  dataInicio?: string
  dataFim?: string
  localidade?: string
  cultura?: string
  clienteId?: string
  status?: 'pendente' | 'em_analise' | 'concluido' | 'pago'
}

// Hook para relatório geral
export function useRelatorioGeral(filters: RelatorioFilters = {}, enabled: boolean = false) {
  const { modulo } = useModule()
  
  return useQuery(
    ['relatorios', 'geral', filters, modulo],
    async () => {
      const response = await api.get('/relatorios/geral', {
        params: {
          ...filters,
          modulo
        }
      })
      return response.data
    },
    {
      enabled: enabled,
      keepPreviousData: true,
    }
  )
}

// Hook para relatório por cliente
export function useRelatorioCliente(filters: RelatorioFilters = {}, enabled: boolean = false) {
  const { modulo } = useModule()
  
  return useQuery(
    ['relatorios', 'cliente', filters, modulo],
    async () => {
      const response = await api.get('/relatorios/clientes', {
        params: {
          ...filters,
          modulo
        }
      })
      return response.data
    },
    {
      enabled: enabled,
      keepPreviousData: true,
    }
  )
}

// Hook para relatório por cultura
export function useRelatorioCultura(filters: RelatorioFilters = {}, enabled: boolean = false) {
  const { modulo } = useModule()
  
  return useQuery(
    ['relatorios', 'cultura', filters, modulo],
    async () => {
      const response = await api.get('/relatorios/analises', {
        params: {
          ...filters,
          modulo
        }
      })
      return response.data
    },
    {
      enabled: enabled,
      keepPreviousData: true,
    }
  )
}

// Hook para relatório financeiro
export function useRelatorioFinanceiro(filters: RelatorioFilters = {}, enabled: boolean = false) {
  const { modulo } = useModule()
  
  return useQuery(
    ['relatorios', 'financeiro', filters, modulo],
    async () => {
      const response = await api.get('/relatorios/financeiro', {
        params: {
          ...filters,
          modulo
        }
      })
      return response.data
    },
    {
      enabled: enabled,
      keepPreviousData: true,
    }
  )
}

// Hook para relatório de estatísticas
export function useRelatorioEstatisticas(filters: RelatorioFilters = {}, enabled: boolean = false) {
  const { modulo } = useModule()
  
  return useQuery(
    ['relatorios', 'estatisticas', filters, modulo],
    async () => {
      const response = await api.get('/relatorios/dashboard', {
        params: {
          ...filters,
          modulo
        }
      })
      return response.data
    },
    {
      enabled: enabled,
      keepPreviousData: true,
    }
  )
}

// Hook para salvar relatório
export function useSalvarRelatorio() {
  const queryClient = useQueryClient()
  
  return useMutation(
    async (data: { tipo: string; nome: string; filtros?: any; dados: any }) => {
      const response = await api.post('/relatorios/salvar', data)
      return response.data
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['relatorios', 'historico'])
      }
    }
  )
}

// Hook para histórico de relatórios
export function useHistoricoRelatorios(page = 1, limit = 10) {
  return useQuery(
    ['relatorios', 'historico', page, limit],
    async () => {
      const response = await api.get('/relatorios/gerados', {
        params: { page, limit }
      })
      return response.data
    },
    {
      keepPreviousData: true,
    }
  )
}
