import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import { Resultado, CreateResultadoData, CreateResultadosLoteData, ResultadoFilters } from '../../../shared/types'
import { useModule } from '../contexts/ModuleContext'
import toast from 'react-hot-toast'

export function useResultados(filters: ResultadoFilters = {}) {
  const { modulo } = useModule()
  
  return useQuery({
    queryKey: ['resultados', filters, modulo],
    queryFn: async () => {
      // Filtrar tipos não aplicáveis ao foliar antes de serializar
      const tiposAnaliseFiltrados = { ...(filters.tiposAnalise || {}) }
      
      if (modulo === 'foliar') {
        // Remover tipos não aplicáveis ao foliar
        delete tiposAnaliseFiltrados.organica
        delete tiposAnaliseFiltrados.prem
        delete tiposAnaliseFiltrados.granulometria
      }
      
      // Serializar tiposAnalise como string JSON
      const params = {
        ...filters,
        tiposAnalise: JSON.stringify(tiposAnaliseFiltrados),
        categoria: modulo
      }
      
      const response = await api.get<{ resultados: Resultado[], pagination: any }>('/resultados', {
        params
      })
      
      return {
        resultados: response.data.resultados,
        pagination: response.data.pagination
      }
    },
    refetchOnWindowFocus: false,
  })
}

export function useResultado(id: string) {
  return useQuery({
    queryKey: ['resultado', id],
    queryFn: async () => {
      const response = await api.get<Resultado>(`/resultados/${id}`)
      return response.data
    },
    enabled: !!id,
  })
}

export function useResultadosByAmostra(amostraId: string) {
  return useQuery({
    queryKey: ['resultados', 'amostra', amostraId],
    queryFn: async () => {
      const response = await api.get<{ resultados: Resultado[], pagination: any }>(`/resultados?amostraId=${amostraId}`)
      return response.data.resultados
    },
    enabled: !!amostraId,
  })
}

export function useAmostraStatus(amostraId: string) {
  return useQuery({
    queryKey: ['resultados', 'amostra', amostraId, 'status'],
    queryFn: async () => {
      const response = await api.get<{ amostraId: string, completa: boolean }>(`/resultados/amostra/${amostraId}/status`)
      return response.data
    },
    enabled: !!amostraId,
  })
}

export function useCreateResultado() {
  const queryClient = useQueryClient()
  const { modulo } = useModule()

  return useMutation({
    mutationFn: async (data: CreateResultadoData) => {
      const response = await api.post<Resultado>('/resultados', {
        ...data,
        categoria: modulo
      })
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['resultados'] })
      queryClient.invalidateQueries({ queryKey: ['resultado', data.id] })
      queryClient.invalidateQueries({ queryKey: ['amostra', data.amostraId] })
      queryClient.invalidateQueries({ queryKey: ['resultados', 'amostra', data.amostraId] })
    },
    onError: (error: any) => {
      // Mostrar detalhes dos erros de validação
      if (error.response?.data?.details) {
        const errosDetalhados = error.response.data.details.map((e: any) => 
          `${e.path || 'campo'}: ${e.message}`
        ).join(', ')
        toast.error(`Erro de validação: ${errosDetalhados}`)
      } else {
        const message = error.response?.data?.error || 'Erro ao criar resultado'
        toast.error(message)
      }
    },
  })
}

export function useUpdateResultado() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateResultadoData> }) => {
      const response = await api.put<Resultado>(`/resultados/${id}`, data)
      return response.data
    },
    onSuccess: (data) => {
      // Invalidar todas as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['resultados'] })
      queryClient.invalidateQueries({ queryKey: ['resultado', data.id] })
      queryClient.invalidateQueries({ queryKey: ['amostra', data.amostraId] })
      queryClient.invalidateQueries({ queryKey: ['amostras'] })
      
      // Invalidar especificamente a consulta por amostra
      queryClient.invalidateQueries({ queryKey: ['resultados', 'amostra', data.amostraId] })
      
      // Forçar refetch da consulta específica
      queryClient.refetchQueries({ queryKey: ['resultados', 'amostra', data.amostraId] })
      
      toast.success('Resultado atualizado com sucesso!')
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Erro ao atualizar resultado'
      toast.error(message)
    },
  })
}

export function useDeleteResultado() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/resultados/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resultados'] })
      toast.success('Resultado deletado com sucesso!')
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Erro ao deletar resultado'
      toast.error(message)
    },
  })
}

export function useCreateResultadosLote() {
  const queryClient = useQueryClient()
  const { modulo } = useModule()

  return useMutation({
    mutationFn: async (data: CreateResultadosLoteData) => {
      // Adicionar categoria a cada resultado individual
      const resultadosComCategoria = data.resultados.map(resultado => ({
        ...resultado,
        categoria: modulo
      }))
      
      const response = await api.post<Resultado[]>('/resultados/lote', {
        resultados: resultadosComCategoria
      })
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['resultados'] })
      queryClient.invalidateQueries({ queryKey: ['amostras'] })
      // Suporta diferentes formatos de resposta: array direto ou objeto { resultados }
      let count = 0
      if (Array.isArray(data)) {
        count = data.length
      } else if (data && typeof data === 'object' && 'resultados' in data) {
        const anyData: any = data as any
        if (Array.isArray(anyData.resultados)) {
          count = anyData.resultados.length
        }
      }
      toast.success(`${count} resultado(s) criado(s) com sucesso!`)
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Erro ao criar resultados em lote'
      toast.error(message)
    },
  })
}



