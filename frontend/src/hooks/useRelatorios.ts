import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  
  return useQuery({
    queryKey: ['relatorios', 'geral', filters, modulo],
    queryFn: async () => {
      const response = await api.get('/relatorios/geral', {
        params: {
          ...filters,
          modulo
        }
      })
      return response.data
    },
    enabled: enabled,
  })
}

// Hook para relatório por cliente
export function useRelatorioCliente(filters: RelatorioFilters = {}, enabled: boolean = false) {
  const { modulo } = useModule()
  
  return useQuery({
    queryKey: ['relatorios', 'cliente', filters, modulo],
    queryFn: async () => {
      const response = await api.get('/relatorios/clientes', {
        params: {
          ...filters,
          modulo
        }
      })
      return response.data
    },
    enabled: enabled,
  })
}

// Hook para relatório por cultura
export function useRelatorioCultura(filters: RelatorioFilters = {}, enabled: boolean = false) {
  const { modulo } = useModule()
  
  return useQuery({
    queryKey: ['relatorios', 'cultura', filters, modulo],
    queryFn: async () => {
      const response = await api.get('/relatorios/culturas', {
        params: {
          ...filters,
          modulo
        }
      })
      return response.data
    },
    enabled: enabled,
  })
}

// Hook para relatório financeiro
export function useRelatorioFinanceiro(filters: RelatorioFilters = {}, enabled: boolean = false) {
  const { modulo } = useModule()
  
  return useQuery({
    queryKey: ['relatorios', 'financeiro', filters, modulo],
    queryFn: async () => {
      const response = await api.get('/relatorios/financeiro', {
        params: {
          ...filters,
          modulo
        }
      })
      return response.data
    },
    enabled: enabled,
  })
}

// Hook para relatório de estatísticas
export function useRelatorioEstatisticas(filters: RelatorioFilters = {}, enabled: boolean = false) {
  const { modulo } = useModule()
  
  return useQuery({
    queryKey: ['relatorios', 'estatisticas', filters, modulo],
    queryFn: async () => {
      const response = await api.get('/relatorios/dashboard', {
        params: {
          ...filters,
          modulo
        }
      })
      return response.data
    },
    enabled: enabled,
  })
}

// Hook para salvar relatório
export function useSalvarRelatorio() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: { tipo: string; nome: string; filtros?: any; dados: any }) => {
      const response = await api.post('/relatorios/salvar', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relatorios', 'historico'] })
    },
  })
}

// Hook para histórico de relatórios
export function useHistoricoRelatorios(page = 1, limit = 10) {
  return useQuery({
    queryKey: ['relatorios', 'historico', page, limit],
    queryFn: async () => {
      const response = await api.get('/relatorios/gerados', {
        params: { page, limit }
      })
      return response.data
    },
  })
}

